<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="text-xl font-bold mb-4">提交情况</h2>
      
      <a-table
        :columns="columns"
        :data-source="submissions"
        :loading="loading"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'submitted' ? 'blue' : 'green'">
              {{ record.status === 'submitted' ? '已提交' : '已批改' }}
            </a-tag>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" @click="viewSubmission(record)">
                查看详情
              </a-button>
              <a-button 
                v-if="userRole === 'teacher' && record.status === 'submitted'"
                type="link"
                @click="reviewSubmission(record)"
              >
                批改
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- 查看提交详情的抽屉 -->
      <a-drawer
        v-model:visible="showSubmissionDetail"
        title="提交详情"
        placement="right"
        width="500"
      >
        <template v-if="currentSubmission">
          <div class="mb-4">
            <h3 class="font-bold">提交内容：</h3>
            <p class="whitespace-pre-wrap">{{ currentSubmission.content }}</p>
          </div>
          
          <div v-if="currentSubmission.file_url" class="mb-4">
            <h3 class="font-bold">附件：</h3>
            <a :href="currentSubmission.file_url" target="_blank">
              下载附件
            </a>
          </div>

          <div v-if="currentSubmission.status === 'reviewed'" class="mb-4">
            <h3 class="font-bold">得分：</h3>
            <p>{{ currentSubmission.score }}</p>
            
            <h3 class="font-bold mt-4">教师评语：</h3>
            <p class="whitespace-pre-wrap">{{ currentSubmission.teacher_comment }}</p>
          </div>
        </template>
      </a-drawer>

      <!-- 批改作业的抽屉 -->
      <a-drawer
        v-model:visible="showReviewDrawer"
        title="批改作业"
        placement="right"
        width="500"
        @close="closeReviewDrawer"
      >
        <template v-if="currentSubmission">
          <a-form layout="vertical">
            <a-form-item label="得分">
              <a-input-number 
                v-model:value="reviewForm.score" 
                :min="0" 
                :max="100"
              />
            </a-form-item>

            <a-form-item label="评语">
              <a-textarea
                v-model:value="reviewForm.comment"
                :rows="4"
                placeholder="请输入评语..."
              />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" @click="submitReview">
                提交批改
              </a-button>
            </a-form-item>
          </a-form>
        </template>
      </a-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import axios from 'axios';

const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['close']);
const userRole = localStorage.getItem('userRole');

const columns = [
  {
    title: '学生',
    dataIndex: 'student_name',
    key: 'student_name',
  },
  {
    title: '提交时间',
    dataIndex: 'submit_time',
    key: 'submit_time',
    customRender: ({ text }) => new Date(text).toLocaleString()
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: '操作',
    key: 'action',
  }
];

const submissions = ref([]);
const loading = ref(false);
const showSubmissionDetail = ref(false);
const showReviewDrawer = ref(false);
const currentSubmission = ref(null);
const reviewForm = ref({
  score: 0,
  comment: ''
});

const fetchSubmissions = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`http://localhost:3000/api/tasks/${props.taskId}/submissions`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    submissions.value = response.data;
  } catch (error) {
    console.error('获取提交情况失败:', error);
    message.error('获取提交情况失败');
  } finally {
    loading.value = false;
  }
};

const viewSubmission = (submission) => {
  currentSubmission.value = submission;
  showSubmissionDetail.value = true;
};

const reviewSubmission = (submission) => {
  currentSubmission.value = submission;
  reviewForm.value = {
    score: 0,
    comment: ''
  };
  showReviewDrawer.value = true;
};

const submitReview = async () => {
  try {
    await axios.post(`http://localhost:3000/api/submissions/${currentSubmission.value.submission_id}/review`, {
      score: reviewForm.value.score,
      comment: reviewForm.value.comment
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    message.success('批改成功');
    await fetchSubmissions();
    showReviewDrawer.value = false;
  } catch (error) {
    console.error('批改失败:', error);
    message.error('批改失败，请重试');
  }
};

const closeModal = () => {
  emit('close');
};

const closeReviewDrawer = () => {
  showReviewDrawer.value = false;
  reviewForm.value = {
    score: 0,
    comment: ''
  };
};

onMounted(fetchSubmissions);
</script>

<style scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl;
}
</style> 