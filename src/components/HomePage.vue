<template>
  <a-flex>
    <a-card title="个人资料" hoverable style="width: 50vw">
      <p>姓名：{{ student.name }}</p>
      <p>学号：{{ student.studentID }}</p>
    </a-card>
    <a-card title="目标待办" hoverable style="width: 50vw">
    </a-card>
  </a-flex>
  <a-flex>
    <a-card title="通知公告" hoverable style="width: 100vw;height: 32vw">
      <div style="width: 80vw;height: 25vw;">
        <a-card 
          v-for="i in notices" 
          :key="i.id" 
          hoverable 
          @click="loadNotice(i.id)"
        >
          {{ i.title }}
        </a-card>
      </div>
      <div style="text-align: center;">
        <a-pagination 
          v-model:current="current" 
          :total="maxid" 
          :defaultPageSize=1 
          show-less-items 
          @change="pageChange" 
        />
      </div>
    </a-card>
  </a-flex>
</template>

<script>
import axios from 'axios';
import { Card, Flex, Pagination } from 'ant-design-vue';

export default {
  name: 'ChildComponent',
  components: {
    'a-card': Card,
    'a-flex': Flex,
    'a-pagination': Pagination,
  },
  data() {
    return {
      student: [],
      notices: [],
      titles: []
    };
  },
  created() {
    this.fetchStudents();
    this.fetchNotices();
  },
  methods: {
    async fetchStudents() {
      try {
        const response = await axios.get('http://localhost:3000/api/student');
        this.students = response.data;
      } catch (error) {
        console.error('获取学生数据失败:', error);
      }
      //暂未和登录对接，设置一个默认的学号
      const targetStudentID = 2023123456;
      this.student = this.students.find(student => student.studentID === targetStudentID);
    },
    async fetchNotices() {
      try {
        const response = await axios.get('http://localhost:3000/api/notice');
        this.notices = response.data;
      } catch (error) {
        console.error('获取通知数据失败:', error);
      }
      this.titles = this.notices.map((notice) => notice.title);
    },
    pageChange(page) {
      this.currentPage = page;
      //返回当前页码
    },
    loadNotice(page) {
      this.$emit('change-component', 'NoticePage');
    }
  }
};
</script>