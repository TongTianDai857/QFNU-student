<template>
  <div class="container mx-auto p-6">
    <a-card class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">分组管理</h1>
          <a-button 
            type="primary" 
            @click="showModal = true"
            v-if="userRole === 'teacher'"
          >
            <template #icon><PlusOutlined /></template>
            创建新分组
          </a-button>
        </div>
      </template>

      <!-- 分组列表 -->
      <a-list
        :data-source="groups"
        :loading="loading"
        item-layout="vertical"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-space>
                <a-button 
                  v-if="userRole === 'teacher'" 
                  type="link" 
                  danger 
                  @click="deleteGroup(item.id)"
                >
                  删除分组
                </a-button>
              </a-space>
            </template>

            <a-list-item-meta>
              <template #title>
                <div class="flex items-center">
                  <TeamOutlined class="mr-2" />
                  <span class="font-bold">{{ item.group_name }}</span>
                </div>
              </template>
              <template #description>
                <div class="text-gray-500">
                  <div>
                    <UserOutlined class="mr-2" />
                    学生数量: {{ item.students?.length || 0 }}
                  </div>
                </div>
              </template>
            </a-list-item-meta>

            <div class="students-list mt-4">
              <a-tag v-for="student in item.students" 
                    :key="student.StudentID"
                    class="mb-2 mr-2">
                {{ student.Name }}
              </a-tag>
            </div>
          </a-list-item>
        </template>

        <template #empty>
          <a-empty description="暂无分组" />
        </template>
      </a-list>
    </a-card>

    <!-- 创建分组模态框 -->
    <GroupCreateModal 
      v-model:visible="showModal"
      @created="handleGroupCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { 
  PlusOutlined, 
  TeamOutlined,
  UserOutlined 
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import GroupCreateModal from '../components/GroupCreateModal.vue';

const groups = ref([]);
const showModal = ref(false);
const loading = ref(false);
const userRole = localStorage.getItem('userRole');

const fetchGroups = async () => {
  loading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/groups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    groups.value = response.data;
  } catch (error) {
    console.error('获取分组失败:', error);
    message.error('获取分组列表失败');
  } finally {
    loading.value = false;
  }
};

const deleteGroup = async (groupId) => {
  try {
    await message.confirm('确定要删除这个分组吗？');
    await axios.delete(`http://localhost:3000/api/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    message.success('删除成功');
    await fetchGroups();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      message.error('删除分组失败');
    }
  }
};

const handleGroupCreated = async () => {
  message.success('分组创建成功');
  await fetchGroups();
};

onMounted(fetchGroups);
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
</style> 