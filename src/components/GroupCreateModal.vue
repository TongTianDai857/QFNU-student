<template>
  <a-modal
    :open="open"
    title="创建新分组"
    @ok="createGroup"
    @cancel="handleCancel"
    :confirmLoading="creating"
  >
    <a-form layout="vertical">
      <a-form-item label="分组名称">
        <a-input v-model:value="groupName" placeholder="请输入分组名称" />
      </a-form-item>
      <a-form-item label="选择学生">
        <a-input-search
          v-model:value="searchText"
          placeholder="输入学号或姓名搜索"
          style="margin-bottom: 8px"
          @search="handleSearch"
          allowClear
          :disabled="loading"
        />
        <a-select
          v-model:value="selectedStudents"
          mode="multiple"
          style="width: 100%"
          placeholder="请选择学生"
          :filter-option="false"
          :options="filteredStudents"
          show-search
          @search="handleSearch"
          :loading="loading"
        >
          <template #option="{ data }">
            <div style="display: flex; justify-content: space-between;">
              <span>{{ data.Name }}</span>
              <span style="color: rgba(0, 0, 0, 0.45)">{{ data.StudentID }}</span>
            </div>
          </template>
        </a-select>
      </a-form-item>

      <!-- 已选学生列表 -->
      <div v-if="selectedStudents.length > 0" class="selected-students">
        <div class="selected-title">已选择的学生：</div>
        <a-table
          :columns="columns"
          :data-source="selectedStudentsList"
          size="small"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button 
                type="link" 
                danger 
                @click="removeStudent(record.StudentID)"
              >
                移除
              </a-button>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 添加加载中提示 -->
      <div v-if="loading" style="text-align: center; padding: 20px;">
        <a-spin />
        <div style="margin-top: 8px">加载学生数据中...</div>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { message } from 'ant-design-vue';

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['update:open', 'created']);

const students = ref([]);
const groupName = ref('');
const selectedStudents = ref([]);
const searchText = ref('');
const loading = ref(false);
const creating = ref(false);
const description = ref('');

// 表格列定义
const columns = [
  {
    title: '学号',
    dataIndex: 'StudentID',
    key: 'StudentID',
  },
  {
    title: '姓名',
    dataIndex: 'Name',
    key: 'Name',
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
  }
];

// 修改过滤后的学生列表逻辑
const filteredStudents = computed(() => {
  const searchValue = searchText.value.toLowerCase().trim();
  const filteredList = searchValue
    ? students.value.filter(student => 
        student.StudentID.toString().includes(searchValue) ||
        student.Name.toLowerCase().includes(searchValue)
      )
    : students.value;

  return filteredList.map(student => ({
    value: student.StudentID,
    label: `${student.Name} (${student.StudentID})`,
    data: student
  }));
});

// 已选择的学生列表
const selectedStudentsList = computed(() => {
  return students.value.filter(student => 
    selectedStudents.value.includes(student.StudentID)
  );
});

// 修改搜索处理函数
const handleSearch = (value) => {
  searchText.value = value;
};

// 移除学生
const removeStudent = (studentId) => {
  selectedStudents.value = selectedStudents.value.filter(id => id !== studentId);
};

const fetchStudents = async () => {
  loading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/students', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('服务器返回的学生数据格式不正确');
    }
    
    students.value = response.data;
  } catch (error) {
    console.error('获取学生列表失败:', error);
    if (error.response) {
      // 服务器响应的错误
      message.error(`获取学生列表失败: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      // 请求发出但没有收到响应
      message.error('无法连接到服务器，请检查网络连接');
    } else {
      // 其他错误
      message.error(`获取学生列表失败: ${error.message}`);
    }
  } finally {
    loading.value = false;
  }
};

const createGroup = async () => {
  if (!groupName.value.trim()) {
    message.warning('请输入有效的分组名称');
    return;
  }
  if (selectedStudents.value.length === 0) {
    message.warning('请选择至少一名学生');
    return;
  }
  if (groupName.value.length > 50) {
    message.warning('分组名称不能超过50个字符');
    return;
  }

  creating.value = true;
  try {
    const requestData = {
      group_name: groupName.value.trim(),
      description: description.value,
      student_ids: [...new Set(selectedStudents.value)]
    };

    const response = await axios.post('http://localhost:3000/api/groups', requestData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.data) {
      throw new Error('创建分组失败：服务器未返回数据');
    }
    
    message.success('创建分组成功');
    emit('created');
    handleCancel();
  } catch (error) {
    console.error('创建分组失败:', error);
    if (error.response) {
      message.error(`创建分组失败: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      message.error('无法连接到服务器，请检查网络连接');
    } else {
      message.error(`创建分组失败: ${error.message}`);
    }
  } finally {
    creating.value = false;
  }
};

const handleCancel = () => {
  groupName.value = '';
  selectedStudents.value = [];
  searchText.value = '';
  description.value = '';
  emit('update:open', false);
};

onMounted(fetchStudents);
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.students-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-students {
  margin-top: 16px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.selected-title {
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
}

:deep(.ant-select-selection-item) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.ant-select-selection-item-content) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 