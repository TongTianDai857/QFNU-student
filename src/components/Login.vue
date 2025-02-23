/**
 * @author WangTianci
 * @version 1.0
 * @since 2024-11-20
 * @description 登录界面模块
 */
<template>
  <div class="login-container">
    <div class="square" style="width:100px;height:100px;top:-15px;right:-45px"></div>
    <div class="square" style="width:150px;height:150px;top:105px;left:-125px"></div>
    <div class="square" style="width:60px;height:60px;bottom:85px;right:-45px"></div>
    <div class="square" style="width:50px;height:50px;bottom:35px;left:-95px"></div>
    <div class="square" style="width:50px;height:50px;top:-15px;left:-25px"></div>
    <Transition name="fade">
      <div class="login-form" v-if="!showRegister">
        <h2>登录</h2>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <input 
              type="text" 
              id="username"
              v-model="username"
              placeholder=" "
              required
            >
            <label for="username">用户名</label>
          </div>
          <div class="form-group">
            <input 
              type="password" 
              id="password"
              v-model="password"
              placeholder=" "
              required
            >
            <label for="password">密码</label>
          </div>
          <button 
            type="submit" 
            :class="{ loading: isLoading }"
            :disabled="isLoading"
          >
            登录
          </button>
          <button type="button" class="forget-password" @click="forgetpassword">忘记密码</button>
          <button type="button" @click="showRegister = true">注册</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </Transition>

    <!-- 注册表单 -->
    <Transition name="fade">
      <div v-if="showRegister" class="register-modal">
        <div class="register-form">
          <button class="close-btn" @click="showRegister = false"></button>
          <h2>注册</h2>
          <div class="form-group">
            <input 
              type="text" 
              id="registerName"
              v-model="registerName"
              placeholder=" "
              required
            >
            <label for="registerName">名字</label>
          </div>
          <div class="form-group">
            <input 
              type="text" 
              id="registerUsername"
              v-model="registerUsername"
              placeholder=" "
              required
            >
            <label for="registerUsername">用户名</label>
          </div>
          <div class="form-group">
            <input 
              type="password" 
              id="registerPassword"
              v-model="registerPassword"
              placeholder=" "
              required
            >
            <label for="registerPassword">密码</label>
          </div>
          <div class="form-group">
            <label for="role">角色:</label>
            <select v-model="role" required>
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
          <button type="submit" @click.prevent="handleRegister" :class="{ loading: isLoading }">注册</button>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showTip" class="tip-modal">
        <div class="tip-content">
          <p>请联系管理员处理密码问题</p>
          <button class="tip-btn" @click="closeTip">确定</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { message } from 'ant-design-vue';

const emit = defineEmits(['login-success']);
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref(null);
const showTip = ref(false);
const showRegister = ref(false);
const registerName = ref('');
const registerUsername = ref('');
const registerPassword = ref('');
const role = ref('student');
const isLoading = ref(false);

const handleLogin = async () => {
  try {
    isLoading.value = true;
    console.log('尝试登录:', { username: username.value }); // 添加日志
    
    const response = await axios.post('http://localhost:3000/api/login', {
      username: username.value,
      password: password.value,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录响应:', response.data); // 添加日志
    
    const { token, user } = response.data;
    
    // 保存用户信息
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userInfo', JSON.stringify(user));

    message.success(`欢迎回来，${user.role === 'student' ? '同学' : '老师'}`);
    emit('login-success');
  } catch (err) {
    console.error('登录失败:', err);
    if (err.response) {
      // 服务器响应错误
      message.error(err.response.data.message || '登录失败，请检查用户名和密码');
    } else if (err.request) {
      // 请求发出但没有收到响应
      message.error('无法连接到服务器，请检查网络连接');
    } else {
      // 其他错误
      message.error('登录失败，请重试');
    }
  } finally {
    isLoading.value = false;
  }
};

const handleRegister = async () => {
  try {
    if (registerUsername.value.length < 5) {
      return message.warning('用户名至少需要5个字符');
    }
    if (registerPassword.value.length < 6) {
      return message.warning('密码至少需要6个字符');
    }

    isLoading.value = true;
    const response = await axios.post('http://localhost:3000/api/register', {
      name: registerName.value,
      username: registerUsername.value,
      password: registerPassword.value,
      role: role.value,
    });

    message.success('注册成功，请登录');
    showRegister.value = false;
    
    // 清空表单
    registerName.value = '';
    registerUsername.value = '';
    registerPassword.value = '';
    role.value = 'student';
  } catch (err) {
    console.error('注册失败:', err);
    message.error(err.response?.data?.error || '注册失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

const forgetpassword = () => {
  showTip.value = true;
};

const closeTip = () => {
  showTip.value = false;
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: gradient 10s ease infinite;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 添加动态背景方块 */
.square {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  animation: square 10s linear infinite;
}

@keyframes square {
  0%,100% { transform: translateY(-20px); }
  50% { transform: translateY(20px); }
}

.login-form, .register-form {
  position: relative;
  width: 320px;
  padding: 50px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-radius: 10px;
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-form::after, .register-form::after {
  content: '';
  position: absolute;
  top: 5px;
  right: 5px;
  bottom: 5px;
  left: 5px;
  border-radius: 5px;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.1) 2%
  );
}

h2 {
  color: #333;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
  font-weight: 600;
}

.form-group {
  position: relative;
  margin-bottom: 25px;
}

.form-group label {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 16px;
  transition: all 0.3s ease;
  background: transparent;
  padding: 0 5px;
  pointer-events: none;
}

.form-group input:focus ~ label,
.form-group input:not(:placeholder-shown) ~ label {
  top: 0;
  left: 15px;
  transform: translateY(-50%) scale(0.9);
  color: #4CAF50;
  background: white;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  color: #333;
  font-size: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: all 0.3s ease;
}

.form-group input:focus {
  border-color: #4CAF50;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
}

button {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: #fff;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: 0.5s;
  margin-top: 20px;
}

button:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.forget-password {
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  margin: 15px 0;
  cursor: pointer;
  opacity: 0.8;
  transition: 0.3s;
}

.forget-password:hover {
  opacity: 1;
  color: #4CAF50;
}

.error {
  color: #ff3860;
  background: rgba(255, 56, 96, 0.1);
  padding: 10px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
}

.register-modal, .tip-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.tip-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  min-width: 300px;
  color: #333;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2);
}

.tip-content p {
  margin-bottom: 20px;
  color: #333;
}

/* 修改select下拉框样式 */
.form-group select {
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  color: #333;
  font-size: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-group select:focus {
  border-color: #4CAF50;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
}

/* 添加过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 添加关闭按钮样式 */
.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 30px;
  height: 30px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.close-btn:hover {
  opacity: 1;
  background: none;
  transform: none;
  box-shadow: none;
}

.close-btn::before,
.close-btn::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 2px;
  background-color: #333;
  top: 50%;
  left: 50%;
}

.close-btn::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.close-btn::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

/* 修改注册模态框样式 */
.register-modal {
  animation: fadeIn 0.3s ease;
}

.register-form {
  position: relative;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 添加加载状态按钮样式 */
button.loading {
  position: relative;
  color: transparent !important;
  pointer-events: none;
}

button.loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-right-color: transparent;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* 优化表单验证样式 */
.form-group input:invalid:focus {
  border-color: #ff3860;
  box-shadow: 0 5px 15px rgba(255, 56, 96, 0.2);
}

.form-group input:valid:focus {
  border-color: #4CAF50;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
}
</style> 