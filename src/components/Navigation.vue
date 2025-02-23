<template>
  <a-layout-sider v-model:collapsed="collapsed" collapsible>
    <div class="logo" />
    <a-menu 
      v-model:selectedKeys="selectedKeys" 
      theme="dark" 
      mode="inline"
    >
      <!-- 学生导航 -->
      <template v-if="userRole === 'student'">
        <a-menu-item key="student-home">
          <router-link to="/student/home">
            <home-outlined />
            <span>首页</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="target">
          <router-link to="/student/target">
            <aim-outlined />
            <span>目标</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="perception">
          <router-link to="/student/perception">
            <experiment-outlined />
            <span>感知</span>
          </router-link>
        </a-menu-item>
      </template>

      <!-- 教师导航 -->
      <template v-if="userRole === 'teacher'">
        <a-menu-item key="teacher-home">
          <router-link to="/teacher/home">
            <home-outlined />
            <span>首页</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="groups">
          <router-link to="/groups">
            <team-outlined />
            <span>分组管理</span>
          </router-link>
        </a-menu-item>
        <a-menu-item key="tasks">
          <router-link to="/tasks">
            <schedule-outlined />
            <span>任务管理</span>
          </router-link>
        </a-menu-item>
      </template>
    </a-menu>
  </a-layout-sider>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  HomeOutlined,
  TeamOutlined,
  ScheduleOutlined,
  AimOutlined,
  ExperimentOutlined
} from '@ant-design/icons-vue';

const route = useRoute();
const userRole = localStorage.getItem('userRole');
const collapsed = ref(false);

// 根据当前路由路径设置选中的菜单项
const selectedKeys = computed(() => {
  const path = route.path;
  if (path.includes('home')) return ['student-home'];
  if (path.includes('target')) return ['target'];
  if (path.includes('perception')) return ['perception'];
  if (path.includes('groups')) return ['groups'];
  if (path.includes('tasks')) return ['tasks'];
  return [];
});
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.ant-layout-sider {
  min-height: 100vh;
}

:deep(.ant-menu-item) {
  margin-top: 0 !important;
}

:deep(.ant-menu-item a) {
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
}

:deep(.ant-menu-item-selected a) {
  color: #fff;
}
</style> 