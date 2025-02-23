<template>
  <a-modal
    :open="open"
    title="发布新任务"
    @ok="createTask"
    @cancel="handleCancel"
    width="700px"
    :confirmLoading="creating"
  >
    <a-form layout="vertical">
      <a-form-item label="任务名称" required>
        <a-input v-model:value="taskForm.task_name" placeholder="请输入任务名称" />
      </a-form-item>

      <a-form-item label="选择分组" required>
        <a-select
          v-model:value="taskForm.group_id"
          placeholder="请选择目标分组"
          :loading="groupsLoading"
        >
          <a-select-option 
            v-for="group in groups" 
            :key="group.group_id" 
            :value="group.group_id"
          >
            {{ group.group_name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="截止时间" required>
        <a-date-picker
          v-model:value="taskForm.deadline"
          :show-time="true"
          format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item label="任务内容" required>
        <a-textarea
          v-model:value="taskForm.task_content"
          :rows="6"
          placeholder="请输入任务内容"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';
import dayjs from 'dayjs';

const props = defineProps({
  open: Boolean
});

const emit = defineEmits(['update:open', 'created']);

const taskForm = ref({
  task_name: '',
  task_content: '',
  group_id: undefined,
  deadline: null
});

const groups = ref([]);
const groupsLoading = ref(false);
const creating = ref(false);

const fetchGroups = async () => {
  groupsLoading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/groups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    groups.value = response.data;
  } catch (error) {
    console.error('获取分组列表失败:', error);
    message.error('获取分组列表失败');
  } finally {
    groupsLoading.value = false;
  }
};

const createTask = async () => {
  if (!validateForm()) return;
  
  try {
    creating.value = true;
    console.log('发送任务创建请求:', {
      task_name: taskForm.value.task_name,
      task_content: taskForm.value.task_content,
      group_id: taskForm.value.group_id,
      deadline: taskForm.value.deadline
    });

    const response = await axios.post('http://localhost:3000/api/tasks', {
      task_name: taskForm.value.task_name,
      task_content: taskForm.value.task_content,
      group_id: taskForm.value.group_id,
      deadline: dayjs(taskForm.value.deadline).format('YYYY-MM-DD HH:mm:ss')
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    message.success('任务发布成功');
    emit('created');
    handleCancel();
  } catch (error) {
    console.error('发布任务失败:', error);
    if (error.response) {
      // 服务器响应错误
      message.error(error.response.data.error || '发布任务失败，请重试');
    } else if (error.request) {
      // 请求发出但没有收到响应
      message.error('无法连接到服务器，请检查网络连接');
    } else {
      // 其他错误
      message.error('发布任务失败，请重试');
    }
  } finally {
    creating.value = false;
  }
};

const validateForm = () => {
  if (!taskForm.value.task_name?.trim()) {
    message.warning('请输入任务名称');
    return false;
  }
  if (!taskForm.value.group_id) {
    message.warning('请选择目标分组');
    return false;
  }
  if (!taskForm.value.deadline) {
    message.warning('请设置截止时间');
    return false;
  }
  if (!taskForm.value.task_content?.trim()) {
    message.warning('请输入任务内容');
    return false;
  }
  return true;
};

const handleCancel = () => {
  taskForm.value = {
    task_name: '',
    task_content: '',
    group_id: undefined,
    deadline: null
  };
  emit('update:open', false);
};

onMounted(fetchGroups);
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl;
}
</style> 