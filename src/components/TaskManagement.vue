<template>
  <div class="container mx-auto p-6">
    <a-card class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">任务管理</h1>
          <a-button 
            type="primary" 
            @click="showCreateModal = true"
            v-if="userRole === 'teacher'"
          >
            <template #icon><PlusOutlined /></template>
            发布新任务
          </a-button>
        </div>
      </template>

      <!-- 任务列表 -->
      <a-list
        :data-source="tasks"
        :loading="loading"
        item-layout="vertical"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-space>
                <a-button type="link" @click="viewSubmissions(item.task_id)">
                  查看提交情况
                </a-button>
                <a-button 
                  v-if="userRole === 'teacher'" 
                  type="link" 
                  danger 
                  @click="deleteTask(item.task_id)"
                >
                  删除任务
                </a-button>
              </a-space>
            </template>

            <a-list-item-meta>
              <template #title>
                <div class="flex items-center">
                  <FileOutlined class="mr-2" />
                  <span class="font-bold">{{ item.task_name }}</span>
                </div>
              </template>
              <template #description>
                <div class="text-gray-500">
                  <div>
                    <ClockCircleOutlined class="mr-2" />
                    截止时间: {{ new Date(item.deadline).toLocaleString() }}
                  </div>
                  <div>
                    <TeamOutlined class="mr-2" />
                    所属分组: {{ item.group_name }}
                  </div>
                </div>
              </template>
            </a-list-item-meta>

            <div class="task-content">
              {{ item.task_content }}
            </div>
          </a-list-item>
        </template>

        <template #empty>
          <a-empty description="暂无任务" />
        </template>
      </a-list>
    </a-card>

    <!-- 创建任务模态框 -->
    <task-create-modal
      v-model:open="showCreateModal"
      @created="handleTaskCreated"
    />

    <!-- 查看提交情况模态框 -->
    <TaskSubmissionsModal
      v-if="showSubmissionsModal"
      :taskId="currentTaskId"
      @close="showSubmissionsModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { 
  PlusOutlined, 
  FileOutlined,
  ClockCircleOutlined,
  TeamOutlined 
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TaskCreateModal from './TaskCreateModal.vue';
import TaskSubmissionsModal from './TaskSubmissionsModal.vue';

const tasks = ref([]);
const showCreateModal = ref(false);
const showSubmissionsModal = ref(false);
const loading = ref(false);
const currentTaskId = ref(null);
const userRole = localStorage.getItem('userRole');

const fetchTasks = async () => {
  loading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/tasks', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    tasks.value = response.data;
  } catch (error) {
    console.error('获取任务失败:', error);
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
};

const deleteTask = async (taskId) => {
  try {
    await message.confirm('确定要删除这个任务吗？');
    await axios.delete(`http://localhost:3000/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    message.success('删除成功');
    await fetchTasks();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      message.error('删除任务失败');
    }
  }
};

const viewSubmissions = (taskId) => {
  currentTaskId.value = taskId;
  showSubmissionsModal.value = true;
};

const handleTaskCreated = async () => {
  message.success('任务创建成功');
  await fetchTasks();
};

onMounted(fetchTasks);
</script>

<style scoped>
.task-content {
  margin-top: 16px;
  white-space: pre-wrap;
}

.container {
  max-width: 1200px;
}
</style> 