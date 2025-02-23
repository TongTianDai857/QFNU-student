const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// 数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'student',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 增强的JWT验证中间件
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token:', token);
    
    if (!token) {
      return res.status(401).json({ error: '未提供访问令牌' });
    }

    try {
      const decoded = jwt.verify(token, 'your_jwt_secret');
      
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ error: '权限不足' });
      }

      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      
      next();
    } catch (err) {
      console.error('Token验证失败:', err);
      return res.status(403).json({ error: '无效的访问令牌' });
    }
  };
};

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 通用的数据库查询函数
async function queryDatabase(query, res) {
  try {
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (err) {
    console.error('数据库查询失败:', err.stack);
    res.status(500).json({ error: '数据库查询失败' });
  }
}

// 获取所有作业
app.get('/api/task', (req, res) => {
  queryDatabase('SELECT * FROM task', res);
});

// 获取单个作业详情
app.get('/api/task/:id', async (req, res) => {
  const query = `SELECT * FROM task WHERE task_id = ?`;
  try {
    const [results] = await pool.execute(query, [req.params.id]);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (err) {
    console.error('Failed to fetch task detail:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 其他API
app.get('/api/student', (req, res) => {
  queryDatabase('SELECT * FROM student', res);
});

app.get('/api/notice', (req, res) => {
  queryDatabase('SELECT * FROM notice', res);
});

// 更新任务完成状态
app.put('/api/task/:id/complete', async (req, res) => {
  const query = `UPDATE task SET is_completed = 1 WHERE task_id = ${req.params.id}`;
  try {
    await pool.execute(query);
    res.json({ message: 'Task marked as completed' });
  } catch (err) {
    console.error('Failed to update task completion:', err.stack);
    res.status(500).json({ error: 'Failed to update task completion' });
  }
});

// 登录路由
app.post('/api/login', async (req, res) => {
  console.log('收到登录请求:', req.body);
  const { username, password } = req.body;
  
  try {
    // 先查找教师
    let [teachers] = await pool.execute(
      'SELECT TeacherID, Name, Password FROM teachers WHERE TeacherID = ?',
      [username]
    );
    
    let user = teachers[0];
    let role = 'teacher';
    
    // 如果不是教师，查找学生
    if (!user) {
      let [students] = await pool.execute(
        'SELECT StudentID, Name, password, role FROM students WHERE StudentID = ?',
        [username]
      );
      user = students[0];
      role = 'student';
    }

    console.log('查询到的用户:', user);

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 获取存储的密码（注意大小写）
    const hashedPassword = user.Password || user.password;
    
    // 使用 bcrypt 比较密码
    const validPassword = await bcrypt.compare(password, hashedPassword);
    console.log('密码验证结果:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 token
    const token = jwt.sign(
      {
        id: user.TeacherID || user.StudentID,
        role: role
      },
      'your_jwt_secret',
      { expiresIn: '24h' }
    );

    // 返回用户信息
    res.json({
      token,
      user: {
        id: user.TeacherID || user.StudentID,
        name: user.Name,
        role: role
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ 
      message: '登录失败', 
      error: error.message,
      stack: error.stack
    });
  }
});

// 注册路由
app.post('/api/register', async (req, res) => {
  const { name, username, password, role } = req.body;

  try {
    console.log('收到注册请求:', { name, username, role }); // 添加日志

    // 检查用户名长度
    if (username.length < 5) {
      return res.status(400).json({ error: '用户名至少需要5个字符' });
    }

    // 检查密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    // 检查角色是否有效
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: '无效的角色类型' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('密码加密完成'); // 添加日志

    if (role === 'teacher') {
      // 检查教师ID是否已存在
      const [existingTeacher] = await pool.execute(
        'SELECT TeacherID FROM teachers WHERE TeacherID = ?',
        [username]
      );

      if (existingTeacher.length > 0) {
        return res.status(400).json({ error: '该教师ID已存在' });
      }

      // 创建教师账号
      await pool.execute(
        'INSERT INTO teachers (TeacherID, Name, Password) VALUES (?, ?, ?)',
        [username, name, hashedPassword]
      );
      console.log('教师账号创建成功'); // 添加日志
    } else {
      // 检查学生ID是否已存在
      const [existingStudent] = await pool.execute(
        'SELECT StudentID FROM students WHERE StudentID = ?',
        [username]
      );

      if (existingStudent.length > 0) {
        return res.status(400).json({ error: '该学号已存在' });
      }

      // 创建学生账号
      await pool.execute(
        'INSERT INTO students (StudentID, Name, password, role) VALUES (?, ?, ?, ?)',
        [username, name, hashedPassword, role]
      );
      console.log('学生账号创建成功'); // 添加日志
    }

    res.status(201).json({ 
      message: '注册成功',
      data: {
        id: username,
        name,
        role
      }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ 
      error: '注册失败',
      details: err.message,
      stack: err.stack // 添加堆栈信息以便调试
    });
  }
});

// 获取学生列表
app.get('/api/students', async (req, res) => {
  const query = 'SELECT StudentID, Name FROM students';
  try {
    const [results] = await pool.execute(query);
    console.log('查询结果:', results);
    res.json(results);
  } catch (err) {
    console.error('Failed to fetch students:', err.stack);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 获取组员列表
app.get('/api/group_members', async (req, res) => {
  const teacherId = req.query.teacherId;
  const query = 'SELECT s.StudentID, s.Name FROM group_members gm JOIN students s ON gm.StudentID = s.StudentID WHERE gm.TeacherID = ?';
  try {
    const [results] = await pool.execute(query, [teacherId]);
    res.json(results);
  } catch (err) {
    console.error('Failed to fetch group members:', err.stack);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

// 添加组员
app.post('/api/group_members', async (req, res) => {
  const { teacherId, studentId } = req.body;
  const query = 'INSERT INTO group_members (TeacherID, StudentID) VALUES (?, ?)';
  try {
    await pool.execute(query, [teacherId, studentId]);
    res.json({ success: true, message: 'Student added to group' });
  } catch (err) {
    console.error('Failed to add student to group:', err.stack);
    res.status(500).json({ error: 'Failed to add student to group' });
  }
});

// 获取分组列表（包含成员信息）
app.get('/api/groups', roleMiddleware(['teacher', 'student']), async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'teacher') {
      query = `
        SELECT g.*, COUNT(gm.student_id) as member_count 
        FROM study_groups g 
        LEFT JOIN group_members gm ON g.group_id = gm.group_id 
        WHERE g.teacher_id = ? 
        GROUP BY g.group_id`;
      params = [req.user.id];
    } else {
      query = `
        SELECT g.*, COUNT(gm2.student_id) as member_count 
        FROM study_groups g
        INNER JOIN group_members gm ON g.group_id = gm.group_id
        LEFT JOIN group_members gm2 ON g.group_id = gm2.group_id
        WHERE gm.student_id = ?
        GROUP BY g.group_id`;
      params = [req.user.id];
    }

    const [groups] = await pool.execute(query, params);

    // 为每个分组获取成员详细信息
    const groupsWithMembers = await Promise.all(groups.map(async (group) => {
      const [members] = await pool.execute(`
        SELECT 
          s.StudentID as student_id,
          s.Name as student_name,
          s.Class as class_name
        FROM group_members gm
        JOIN students s ON gm.student_id = s.StudentID
        WHERE gm.group_id = ?
      `, [group.group_id]);

      return {
        ...group,
        members: members
      };
    }));

    res.json(groupsWithMembers);
  } catch (err) {
    console.error('获取分组失败:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
  }
});

// 获取单个分组的成员详情
app.get('/api/groups/:groupId/members', roleMiddleware(['teacher', 'student']), async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // 验证用户是否有权限访问该分组
    let accessQuery = '';
    let accessParams = [];
    
    if (req.user.role === 'teacher') {
      accessQuery = 'SELECT * FROM study_groups WHERE group_id = ? AND teacher_id = ?';
      accessParams = [groupId, req.user.id];
    } else {
      accessQuery = 'SELECT * FROM group_members WHERE group_id = ? AND student_id = ?';
      accessParams = [groupId, req.user.id];
    }
    
    const [access] = await pool.execute(accessQuery, accessParams);
    if (access.length === 0) {
      return res.status(403).json({ error: '无权访问该分组' });
    }

    // 获取成员详情
    const [members] = await pool.execute(`
      SELECT 
        s.StudentID as student_id,
        s.Name as student_name,
        s.Class as class_name,
        ? as group_id
      FROM group_members gm
      JOIN students s ON gm.student_id = s.StudentID
      WHERE gm.group_id = ?
    `, [groupId, groupId]);

    res.json(members);
  } catch (err) {
    console.error('获取组内成员失败:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
  }
});

// 移除组内成员
app.delete('/api/groups/:groupId/members/:studentId', roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { groupId, studentId } = req.params;
    
    // 验证教师是否有权限操作该分组
    const [group] = await pool.execute(
      'SELECT * FROM study_groups WHERE group_id = ? AND teacher_id = ?',
      [groupId, req.user.id]
    );
    
    if (group.length === 0) {
      return res.status(403).json({ error: '无权操作该分组' });
    }

    // 移除成员
    await pool.execute(
      'DELETE FROM group_members WHERE group_id = ? AND student_id = ?',
      [groupId, studentId]
    );

    res.json({ message: '成员移除成功' });
  } catch (err) {
    console.error('移除成员失败:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
  }
});

// 创建分组接口
app.post('/api/groups', roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { groupName, description } = req.body;
    
    if (!groupName) {
      return res.status(400).json({ error: '小组名称不能为空' });
    }

    const query = `
      INSERT INTO study_groups (
        group_name, 
        description,
        teacher_id,
        status
      ) VALUES (?, ?, ?, 'active')
    `;

    const [result] = await pool.execute(query, [
      groupName,
      description || null,
      req.user.id
    ]);

    res.status(201).json({
      message: '小组创建成功',
      groupId: result.insertId,
      groupName,
      description
    });

  } catch (err) {
    console.error('创建小组失败:', err);
    res.status(500).json({ 
      error: '创建小组失败',
      details: err.message 
    });
  }
});

// 获取小组列表
app.get('/api/groups', roleMiddleware(['teacher', 'student']), async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'teacher') {
      query = `
        SELECT g.*, 
               COUNT(DISTINCT gm.student_id) as member_count
        FROM study_groups g
        LEFT JOIN group_members gm ON g.group_id = gm.group_id
        WHERE g.teacher_id = ? AND g.status = 'active'
        GROUP BY g.group_id
        ORDER BY g.create_time DESC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT g.*, t.Name as teacher_name
        FROM study_groups g
        JOIN group_members gm ON g.group_id = gm.group_id
        JOIN teachers t ON g.teacher_id = t.TeacherID
        WHERE gm.student_id = ? AND g.status = 'active'
        ORDER BY g.create_time DESC
      `;
      params = [req.user.id];
    }

    const [groups] = await pool.execute(query, params);
    res.json(groups);
  } catch (err) {
    console.error('获取小组列表失败:', err);
    res.status(500).json({ error: '获取小组列表失败' });
  }
});

// 获取单个分组的成员详情
app.get('/api/groups/:groupId/members', roleMiddleware(['teacher', 'student']), async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // 验证用户是否有权限访问该分组
    let accessQuery = '';
    let accessParams = [];
    
    if (req.user.role === 'teacher') {
      accessQuery = 'SELECT * FROM study_groups WHERE group_id = ? AND teacher_id = ?';
      accessParams = [groupId, req.user.id];
    } else {
      accessQuery = 'SELECT * FROM group_members WHERE group_id = ? AND student_id = ?';
      accessParams = [groupId, req.user.id];
    }
    
    const [access] = await pool.execute(accessQuery, accessParams);
    if (access.length === 0) {
      return res.status(403).json({ error: '无权访问该分组' });
    }

    // 获取成员详情
    const [members] = await pool.execute(`
      SELECT 
        s.StudentID as student_id,
        s.Name as student_name,
        s.Class as class_name,
        ? as group_id
      FROM group_members gm
      JOIN students s ON gm.student_id = s.StudentID
      WHERE gm.group_id = ?
    `, [groupId, groupId]);

    res.json(members);
  } catch (err) {
    console.error('获取组内成员失败:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
  }
});

// 移除组内成员
app.delete('/api/groups/:groupId/members/:studentId', roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { groupId, studentId } = req.params;
    
    // 验证教师是否有权限操作该分组
    const [group] = await pool.execute(
      'SELECT * FROM study_groups WHERE group_id = ? AND teacher_id = ?',
      [groupId, req.user.id]
    );
    
    if (group.length === 0) {
      return res.status(403).json({ error: '无权操作该分组' });
    }

    // 移除成员
    await pool.execute(
      'DELETE FROM group_members WHERE group_id = ? AND student_id = ?',
      [groupId, studentId]
    );

    res.json({ message: '成员移除成功' });
  } catch (err) {
    console.error('移除成员失败:', err);
    res.status(500).json({ error: '服务器内部错误', details: err.message });
  }
});

// 创建任务
app.post('/api/tasks', roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { 
      task_name, 
      task_content, 
      group_id, 
      deadline 
    } = req.body;

    console.log('创建任务请求:', req.body);

    // 验证必填字段
    if (!task_name || !task_content || !group_id || !deadline) {
      return res.status(400).json({ error: '缺少必要的任务信息' });
    }

    // 验证教师是否有权限操作该分组
    const [group] = await pool.execute(
      'SELECT * FROM study_groups WHERE group_id = ? AND teacher_id = ?',
      [group_id, req.user.id]
    );

    if (group.length === 0) {
      return res.status(403).json({ error: '无权操作该分组' });
    }

    const query = `
      INSERT INTO tasks (
        task_name, 
        task_content, 
        group_id, 
        teacher_id, 
        deadline,
        status
      ) VALUES (?, ?, ?, ?, ?, 'active')
    `;

    const [result] = await pool.execute(query, [
      task_name,
      task_content,
      group_id,
      req.user.id,
      deadline
    ]);

    console.log('任务创建成功:', result);

    res.status(201).json({
      message: '任务创建成功',
      taskId: result.insertId,
      task: {
        task_id: result.insertId,
        task_name,
        task_content,
        group_id,
        teacher_id: req.user.id,
        deadline,
        status: 'active'
      }
    });

  } catch (err) {
    console.error('创建任务失败:', err);
    res.status(500).json({ 
      error: '创建任务失败',
      details: err.message 
    });
  }
});

// 获取任务列表
app.get('/api/tasks', roleMiddleware(['teacher', 'student']), async (req, res) => {
  try {
    let query = '';
    let params = [];

    if (req.user.role === 'teacher') {
      // 教师看到自己创建的所有任务
      query = `
        SELECT t.*, g.group_name,
               COUNT(DISTINCT ts.student_id) as submission_count,
               COUNT(DISTINCT gm.student_id) as total_students
        FROM tasks t
        LEFT JOIN study_groups g ON t.group_id = g.group_id
        LEFT JOIN task_submissions ts ON t.task_id = ts.task_id
        LEFT JOIN group_members gm ON t.group_id = gm.group_id
        WHERE t.teacher_id = ?
        GROUP BY t.task_id
        ORDER BY t.create_time DESC
      `;
      params = [req.user.id];
    } else {
      // 学生只看到自己所在小组的任务
      query = `
        SELECT t.*, g.group_name,
               (SELECT COUNT(*) FROM task_submissions 
                WHERE task_id = t.task_id AND student_id = ?) as has_submitted
        FROM tasks t
        JOIN study_groups g ON t.group_id = g.group_id
        JOIN group_members gm ON g.group_id = gm.group_id
        WHERE gm.student_id = ?
        ORDER BY t.create_time DESC
      `;
      params = [req.user.id, req.user.id];
    }

    const [tasks] = await pool.execute(query, params);
    res.json(tasks);
  } catch (err) {
    console.error('获取任务列表失败:', err);
    res.status(500).json({ error: '获取任务列表失败' });
  }
});

// 获取单个任务详情
app.get('/api/tasks/:taskId', roleMiddleware(['teacher', 'student']), async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const query = `
      SELECT t.*, g.group_name
      FROM tasks t
      LEFT JOIN study_groups g ON t.group_id = g.group_id
      WHERE t.task_id = ?
    `;
    
    const [tasks] = await pool.execute(query, [taskId]);
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    res.json(tasks[0]);
  } catch (err) {
    console.error('获取任务详情失败:', err);
    res.status(500).json({ error: '获取任务详情失败' });
  }
});

// 更新任务状态
app.patch('/api/tasks/:taskId', roleMiddleware(['teacher']), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    const query = 'UPDATE tasks SET status = ? WHERE task_id = ? AND teacher_id = ?';
    
    const [result] = await pool.execute(query, [status, taskId, req.user.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '任务不存在或无权限修改' });
    }
    
    res.json({ message: '任务状态更新成功' });
  } catch (err) {
    console.error('更新任务状态失败:', err);
    res.status(500).json({ error: '更新任务状态失败' });
  }
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});