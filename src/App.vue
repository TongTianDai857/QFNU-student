<template>
  <a-layout :class="{ 'dark-theme': isDarkMode }" :style="{ minHeight: '100vh' }">
    <a-layout-sider 
      v-if="!showLogin" 
      v-model:collapsed="collapsed" 
      collapsible
      :trigger="null"
      class="custom-sider"
    >
      <div class="logo">
        {{ collapsed ? 'S' : 'System' }}
      </div>
      
      <a-menu 
        v-model:selectedKeys="selectedKeys" 
        theme="dark" 
        mode="inline"
      >
        <template v-if="userRole === 'student'">
          <a-menu-item key="1" @click="loadComponent('HomePage',1)">
            <user-outlined />
            <span>主页</span>
          </a-menu-item>
          <a-menu-item key="2" @click="loadComponent('NoticePage',1)">
            <notification-outlined />
            <span>通知</span>
          </a-menu-item>
          <a-menu-item key="3" @click="loadComponent('TargetPage',1)">
            <aim-outlined />
            <span>目标</span>
          </a-menu-item>
          <a-menu-item key="4">
            <setting-outlined />
            <span>设置</span>
          </a-menu-item>
          <a-menu-item key="5" @click="loadComponent('PerceptionComponent')">
            <schedule-outlined />
            <span>任务</span>
          </a-menu-item>
        </template>
        <template v-else-if="userRole === 'teacher'">
          <a-menu-item key="1" @click="loadComponent('TeacherHomePage',1)">
            <home-outlined />
            <span>教师主页</span>
          </a-menu-item>
          <a-menu-item key="2" @click="loadComponent('TeacherNoticePage',1)">
            <notification-outlined />
            <span>教师通知</span>
          </a-menu-item>
          <a-menu-item key="3" @click="loadComponent('TeacherSettings',1)">
            <setting-outlined />
            <span>教师设置</span>
          </a-menu-item>
          <a-menu-item key="4" @click="loadComponent('StudentGroupManagement',1)">
            <team-outlined />
            <span>学生分组</span>
          </a-menu-item>
          <a-menu-item key="5" @click="loadComponent('TaskManagement',1)">
            <schedule-outlined />
            <span>任务管理</span>
          </a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header v-if="!showLogin">
        <menu-unfold-outlined
          v-if="collapsed"
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <menu-fold-outlined
          v-else
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <div class="header-right">
          <a-switch
            v-model:checked="isDarkMode"
            checked-children="🌙"
            un-checked-children="☀️"
            class="theme-switch"
            @change="toggleTheme"
          />
          <a-dropdown>
            <a class="ant-dropdown-link" @click.prevent>
              <user-outlined /> 
              {{ userName }} ({{ userRole === 'student' ? '学生' : '教师' }})
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="1">
                  <user-outlined />
                  个人信息
                </a-menu-item>
                <a-menu-item 
                  key="2" 
                  danger
                  @click="showLogoutConfirm"
                >
                  <logout-outlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div class="header-breadcrumb">
          <a-breadcrumb>
            <a-breadcrumb-item>{{ userRole === 'student' ? '学生端' : '教师端' }}</a-breadcrumb-item>
            <a-breadcrumb-item>{{ getCurrentPageName() }}</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
      </a-layout-header>

      <a-layout-content style="margin: 0 16px">
        <transition name="fade-transform" mode="out-in">
          <div class="content-wrapper">
            <component 
              :is="currentComponent" 
              @change-component="loadComponent" 
              @login-success="handleLoginSuccess"
            />
          </div>
        </transition>
      </a-layout-content>

      <a-layout-footer v-if="!showLogin">
        <div class="footer-content">
          <span>测试 ©2024 Created By Giant_GKL and G's father_ci</span>
          <div class="footer-links">
            <a href="#">关于我们</a>
            <a href="#">帮助中心</a>
            <a href="#">联系我们</a>
          </div>
        </div>
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script>
import HomePage from './components/HomePage.vue';
import TargetPage from './components/TargetPage.vue';
import NoticePage from './components/NoticePage.vue';
import PerceptionComponent from './components/Perception.vue';
import Login from './components/Login.vue';
import TeacherHomePage from './components/TeacherHomePage.vue';
import TeacherNoticePage from './components/TeacherNoticePage.vue';
import TeacherSettings from './components/TeacherSettings.vue';
import StudentGroupManagement from './components/StudentGroupManagement.vue';
import TaskManagement from './components/TaskManagement.vue';
import { markRaw } from 'vue';
import {
  UserOutlined,
  NotificationOutlined,
  AimOutlined,
  SettingOutlined,
  ScheduleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  TeamOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';

export default {
  name: 'ParentComponent',
  components: { HomePage, TargetPage, NoticePage, PerceptionComponent, Login, TeacherHomePage, TeacherNoticePage, TeacherSettings, StudentGroupManagement, TaskManagement, UserOutlined, NotificationOutlined, AimOutlined, SettingOutlined, ScheduleOutlined, MenuUnfoldOutlined, MenuFoldOutlined, HomeOutlined, TeamOutlined, LogoutOutlined },
  data() {
    return {
      currentComponent: markRaw(Login),
      selectedKeys: ['1'],
      collapsed: false,
      showLogin: true,
      userRole: null,
      isDarkMode: false,
      userName: '',
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    loadComponent(componentName) {
      if (componentName === 'HomePage') {
        this.currentComponent = HomePage;
        this.selectedKeys = ['1'];
      } else if (componentName === 'TargetPage') {
        this.currentComponent = TargetPage;
        this.selectedKeys = ['3'];
      } else if (componentName === 'NoticePage') {
        this.currentComponent = NoticePage;
        this.selectedKeys = ['2'];
      } else if (componentName === 'PerceptionComponent') {
        this.currentComponent = PerceptionComponent;
        this.selectedKeys = ['5'];
      } else if (componentName === 'TeacherHomePage') {
        this.currentComponent = TeacherHomePage;
        this.selectedKeys = ['1'];
      } else if (componentName === 'TeacherNoticePage') {
        this.currentComponent = TeacherNoticePage;
        this.selectedKeys = ['2'];
      } else if (componentName === 'TeacherSettings') {
        this.currentComponent = TeacherSettings;
        this.selectedKeys = ['3'];
      } else if (componentName === 'StudentGroupManagement') {
        this.currentComponent = StudentGroupManagement;
        this.selectedKeys = ['4'];
      } else if (componentName === 'TaskManagement') {
        this.currentComponent = TaskManagement;
        this.selectedKeys = ['5'];
      }
    },
    handleLoginSuccess() {
      this.showLogin = false;
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      this.userRole = userInfo.role;
      this.userName = userInfo.name;
      
      if (this.userRole === 'student') {
        this.loadComponent('HomePage');
      } else if (this.userRole === 'teacher') {
        this.loadComponent('TeacherHomePage');
      }
    },
    showLogoutConfirm() {
      Modal.confirm({
        title: '确认退出',
        content: '您确定要退出登录吗？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          this.handleLogout();
        }
      });
    },
    async handleLogout() {
      try {
        // 清除所有存储的信息
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userRole');
        
        // 重置状态
        this.userRole = null;
        this.userName = '';
        this.showLogin = true;
        this.currentComponent = markRaw(Login);
        this.selectedKeys = ['1'];
        
        // 显示成功消息
        message.success('已退出登录');
        
        // 重定向到登录页
        await this.router.push('/login');
      } catch (error) {
        console.error('退出登录时出错:', error);
        message.error('退出登录失败，请重试');
      }
    },
    handleSessionExpired() {
      message.warning('会话已过期，请重新登录');
      this.handleLogout();
    },
    checkAuth() {
      const token = localStorage.getItem('token');
      if (!token) {
        this.handleSessionExpired();
        return false;
      }
      return true;
    },
    getCurrentPageName() {
      const componentMap = {
        'HomePage': '主页',
        'NoticePage': '通知',
        'TargetPage': '目标',
        'PerceptionComponent': '任务',
        'TeacherHomePage': '教师主页',
        'TeacherNoticePage': '教师通知',
        'TeacherSettings': '教师设置',
        'StudentGroupManagement': '学生分组',
        'TaskManagement': '任务管理'
      };
      return componentMap[this.currentComponent.name] || '首页';
    },
    toggleTheme(checked) {
      this.isDarkMode = checked;
      localStorage.setItem('theme', checked ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-theme', checked);
    }
  },
  watch: {
    '$route'(to) {
      if (to.path !== '/login' && !this.checkAuth()) {
        this.router.push('/login');
      }
    }
  },
  mounted() {
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (token && userInfo.role) {
      this.userRole = userInfo.role;
      this.userName = userInfo.name;
      this.showLogin = false;
      
      if (this.userRole === 'student') {
        this.router.push('/student/home');
        this.loadComponent('HomePage');
      } else if (this.userRole === 'teacher') {
        this.router.push('/teacher/home');
        this.loadComponent('TeacherHomePage');
      }
    } else {
      this.router.push('/login');
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.classList.add('dark-theme');
    }
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        this.isDarkMode = e.matches;
        this.toggleTheme(e.matches);
      }
    });
    
    if (!localStorage.getItem('theme') && mediaQuery.matches) {
      this.isDarkMode = true;
      this.toggleTheme(true);
    }
  },
  beforeUnmount() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.removeEventListener('change');
  }
};
</script>

<style>
/* 添加全局暗色主题样式 - 注意移除 scoped */
.dark-theme {
  /* 基础颜色 */
  --text-primary: rgba(255, 255, 255, 0.85);
  --text-secondary: rgba(255, 255, 255, 0.45);
  --bg-primary: #141414;
  --bg-secondary: #1f1f1f;
  --border-color: rgba(255, 255, 255, 0.12);
}

.dark-theme .ant-layout {
  background: var(--bg-primary);
}

.dark-theme .ant-layout-header {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.dark-theme .ant-layout-sider {
  background: linear-gradient(180deg, #141414 0%, #1f1f1f 100%);
}

.dark-theme .content-wrapper {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.dark-theme .ant-layout-footer {
  background: var(--bg-primary);
  color: var(--text-secondary);
}

.dark-theme .ant-menu.ant-menu-dark {
  background: transparent;
}

.dark-theme .logo {
  background: rgba(255, 255, 255, 0.1);
}

.dark-theme .ant-breadcrumb a,
.dark-theme .ant-dropdown-link,
.dark-theme .trigger {
  color: var(--text-secondary);
}

.dark-theme .ant-breadcrumb a:hover,
.dark-theme .ant-dropdown-link:hover,
.dark-theme .trigger:hover {
  color: #1890ff;
}

.dark-theme .footer-links a {
  color: var(--text-secondary);
}

.dark-theme .footer-links a:hover {
  color: #1890ff;
}

/* 暗色主题下的滚动条 */
.dark-theme ::-webkit-scrollbar-track {
  background: var(--bg-primary);
}

.dark-theme ::-webkit-scrollbar-thumb {
  background: #333;
}

.dark-theme ::-webkit-scrollbar-thumb:hover {
  background: #444;
}

/* 暗色主题下的加载状态 */
.dark-theme .content-wrapper.loading::after {
  background: rgba(0, 0, 0, 0.7);
}
</style>

<style scoped>
/* Logo样式优化 */
.logo {
  height: 64px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  color: #fff;
}

/* 侧边栏样式优化 */
.ant-layout-sider {
  background: linear-gradient(180deg, #001529 0%, #003366 100%);
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
}

/* 菜单项样式优化 */
:deep(.ant-menu-item) {
  margin: 8px 16px !important;
  border-radius: 6px;
  transition: all 0.3s ease !important;
}

:deep(.ant-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateX(5px);
}

:deep(.ant-menu-item-selected) {
  background: #1890ff !important;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.35);
}

/* 头部样式优化 */
.ant-layout-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
}

/* 内容区域样式优化 */
.content-wrapper {
  background: #fff;
  padding: 24px;
  min-height: 280px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-top: 24px;
  transition: all 0.3s ease;
}

.content-wrapper:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

/* 页脚样式优化 */
.ant-layout-footer {
  background: #f0f2f5;
  padding: 24px 50px;
  color: rgba(0,0,0,0.65);
  font-size: 14px;
}

/* 布局容器样式 */
.ant-layout {
  background: #f0f2f5;
  min-height: 100vh;
}

/* 响应式优化 */
@media screen and (max-width: 768px) {
  .content-wrapper {
    margin: 12px;
    padding: 16px;
  }
  
  .ant-layout-footer {
    padding: 16px;
  }
}

/* 触发器按钮样式 */
.trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

/* 头部右侧样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ant-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  transition: color 0.3s;
}

.ant-dropdown-link:hover {
  color: #1890ff;
}

/* 页脚内容样式 */
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: rgba(0,0,0,0.45);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #1890ff;
}

.header-breadcrumb {
  margin-left: 24px;
  flex: 1;
}

:deep(.ant-breadcrumb) {
  line-height: 64px;
}

:deep(.ant-breadcrumb a) {
  color: rgba(0, 0, 0, 0.45);
  transition: color 0.3s;
}

:deep(.ant-breadcrumb a:hover) {
  color: #1890ff;
}

.theme-switch {
  margin-right: 16px;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 添加加载状态过渡 */
.content-wrapper {
  position: relative;
}

.content-wrapper.loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 优化卡片悬浮效果 */
.content-wrapper {
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-wrapper:hover {
  transform: translateY(-2px);
}

/* 添加阴影层次感 */
.ant-layout-sider {
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  z-index: 10;
}

.ant-layout-header {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 9;
}

/* 优化响应式布局 */
@media screen and (max-width: 768px) {
  .footer-links {
    display: none;
  }
  
  .header-breadcrumb {
    display: none;
  }
  
  .ant-layout-header {
    padding: 0 12px;
  }
  
  .logo {
    margin: 8px;
    height: 48px;
  }
}

/* 暗色主题适配 */
:deep(.dark-theme .ant-dropdown-link) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.dark-theme .ant-dropdown-link:hover) {
  color: #1890ff;
}
</style>