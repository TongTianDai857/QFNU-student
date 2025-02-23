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
                  type="link" 
                  @click="viewGroupMembers(item)"
                >
                  查看成员
                </a-button>
                <a-button 
                  v-if="userRole === 'teacher'" 
                  type="link" 
                  danger 
                  @click="deleteGroup(item.group_id)"
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
                    学生数量: {{ item.members ? item.members.length : 0 }}
                  </div>
                  <div>
                    <ClockCircleOutlined class="mr-2" />
                    创建时间: {{ formatDate(item.create_time) }}
                  </div>
                </div>
              </template>
            </a-list-item-meta>

            <div class="students-list mt-4">
              <a-tag v-for="member in item.members" 
                    :key="member.student_id"
                    class="mb-2 mr-2">
                {{ member.student_name }}
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
      v-model:open="showModal"
      @created="handleGroupCreated"
    />

    <!-- 查看成员模态框 -->
    <a-modal
      v-model:open="showMembersModal"
      title="组内成员详情"
      :footer="null"
      width="800px"
    >
      <a-table
        :columns="columns"
        :data-source="currentGroupMembers"
        :loading="membersLoading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button 
                v-if="userRole === 'teacher'"
                type="link" 
                danger
                @click="removeMember(record)"
              >
                移除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { 
  PlusOutlined, 
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import GroupCreateModal from './GroupCreateModal.vue';

const groups = ref([]);
const showModal = ref(false);
const loading = ref(false);
const userRole = localStorage.getItem('userRole');

const showMembersModal = ref(false);
const currentGroupMembers = ref([]);
const membersLoading = ref(false);

const columns = [
  {
    title: '学号',
    dataIndex: 'student_id',
    key: 'student_id',
  },
  {
    title: '姓名',
    dataIndex: 'student_name',
    key: 'student_name',
  },
  {
    title: '班级',
    dataIndex: 'class_name',
    key: 'class_name',
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
  }
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

const fetchGroups = async () => {
  loading.value = true;
  try {
    const response = await axios.get('http://localhost:3000/api/groups', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (Array.isArray(response.data)) {
      groups.value = response.data.map(group => ({
        ...group,
        members: group.members || [] // 确保members数组存在
      }));
    } else {
      groups.value = [];
      console.error('返回的数据格式不正确:', response.data);
    }
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

const viewGroupMembers = async (group) => {
  membersLoading.value = true;
  try {
    const response = await axios.get(`http://localhost:3000/api/groups/${group.group_id}/members`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    currentGroupMembers.value = response.data;
    showMembersModal.value = true;
  } catch (error) {
    console.error('获取成员详情失败:', error);
    message.error('获取成员详情失败');
  } finally {
    membersLoading.value = false;
  }
};

const removeMember = async (member) => {
  try {
    await message.confirm('确定要移除该成员吗？');
    await axios.delete(`http://localhost:3000/api/groups/${member.group_id}/members/${member.student_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    message.success('成员移除成功');
    // 刷新成员列表和分组列表
    await viewGroupMembers({ group_id: member.group_id });
    await fetchGroups();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除成员失败:', error);
      message.error('移除成员失败');
    }
  }
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

.ant-tag {
  margin: 4px;
  padding: 4px 8px;
}

.ant-table {
  margin-top: 16px;
}
</style>