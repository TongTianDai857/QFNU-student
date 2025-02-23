// 路由管理
import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/components/Login.vue';
import HomePage from '@/components/HomePage.vue';
import TargetPage from '@/components/TargetPage.vue';
import Perception from '@/components/Perception.vue';
import TeacherHomePage from '@/components/TeacherHomePage.vue';
import GroupManagement from '@/views/GroupManagement.vue';
import TaskManagement from '@/components/TaskManagement.vue';

// 路由配置（登录认证）
const routes = [
  { path: '/', redirect: '/login' }, /**根路径 */
  { path: '/login', component: Login },
  { path: '/student/home', component: HomePage, meta: { requiresAuth: true, role: 'student' } },
  { path: '/student/target', component: TargetPage, meta: { requiresAuth: true, role: 'student' } },
  { path: '/student/perception', component: Perception, meta: { requiresAuth: true, role: 'student' } },
  { path: '/teacher/home', component: TeacherHomePage, meta: { requiresAuth: true, role: 'teacher' } },
  { path: '/groups', component: GroupManagement, meta: { requiresAuth: true, role: 'teacher' } },
  { path: '/tasks', component: TaskManagement, meta: { requiresAuth: true, role: 'teacher' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 添加全局导航守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // 如果要访问的不是登录页，且没有token，重定向到登录页
  if (to.path !== '/login' && !token) {
    next('/login');
    return;
  }

  // 如果已登录还访问登录页，重定向到对应的首页
  if (to.path === '/login' && token) {
    if (userRole === 'student') {
      next('/student/home');
    } else if (userRole === 'teacher') {
      next('/teacher/home');
    }
    return;
  }

  // 检查路由的角色权限
  if (to.meta.role && to.meta.role !== userRole) {
    next('/login');
    return;
  }

  next();
});

export default router;
