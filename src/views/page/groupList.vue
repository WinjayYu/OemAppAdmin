<template>
  <div class="app-container calendar-list-container">
    <el-table :data="list" v-loading.body="listLoading" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" align="center" label="ID" width="50px"></el-table-column>
      <el-table-column prop="name" align="center" label="名称"></el-table-column>
      <el-table-column prop="des" align="center" label="描述"></el-table-column>
      <el-table-column label="app" align="center">
        <template scope="scope">
          <el-button type="text" v-for="item in scope.row.array" :key="item.id">{{item.name}}</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="220px">
        <template scope="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading.body="updateLoading" size="tiny">
      <el-form :rules="rules" ref="dataForm" :model="temp">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="des">
          <el-input v-model="temp.des"></el-input>
        </el-form-item>
        <el-form-item label="app:" prop="">
        <template>
          <el-checkbox-group v-model="checklist">
          <el-checkbox v-for="item in appInGroup" v-if="item.flag" :label="item.id" :key="item.id">{{item.name}}</el-checkbox>
          <el-checkbox v-else :label="item.id" :key="item.id">{{item.name}}</el-checkbox>
        </el-checkbox-group>
        </template>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import _ from 'lodash';
  export default {
    data() {
      return {
        listLoading: false,
        dialogStatus: false,
        dialogFormVisible: false,
        updateLoading: false,
        textMap: {
          update: '编辑',
          create: '创建'
        },
        temp: {
          id: undefined,
          name: '',
          order: '',
          des: '',
          array: [],
        },
        checklist: [],   // checkBox列表 如：[2] 会选中id为2的group
        checklistTemp: [],  // 检验checkList有没有发生变化
        appInGroup: [],
        appList: [],
        rules: {
          name: [{required: true, message: '必填项', trigger: 'blur'}],
          des: [{required: true, message: '必填项', trigger: 'blur'}],
        },
      }
    },
    computed: {
      list() {
        return this.$store.state.groupManage.groupList;
      }
    },
    created() {
      this.getGroupList();
    },
    methods: {
      getAppList() {
        this.appList = this.$store.state.appManage.appList;
      },
      getGroupList() {
        let vm = this;
        this.listLoading = true;
        this.$store.dispatch('getGroupList').then(res => {
          vm.listLoading = false;
        })
      },
      handleUpdate(row) {
        console.log(row)
        let vm = this;
        this.temp = {...row};
        this.dialogStatus = 'update';
        this.dialogFormVisible = true;
        this.getAppList();
        this.$store.dispatch('getAppList').then(res => {
          if(!res) {
            vm.$message({
              message: '获取组列表出错！',
              type: 'error'
            })
          } else {
            vm.appInGroup = vm.temp.array.map(v => {
              v.flag = 1;
              vm.checklist.push(v.id);
              return v;
            })
            vm.checklistTemp = [...vm.checklist];
            vm.appInGroup = _.unionBy(vm.appInGroup, vm.appList, 'id');
          }
        })
      },
    }
  }

</script>
