<template>
  <div class="app-container calendar-list-container">
    <div class="filter-container">
      <el-button class="filter-item" style="margin: 10px 0;" @click="handleCreate" type="primary" icon="el-icon-edit">添加用户</el-button>
    </div>
    <el-table :data="list" v-loading.body="listLoading" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" align="center" label="ID" width="50px"></el-table-column>
      <el-table-column prop="phone" align="center" label="手机号"></el-table-column>
      <el-table-column prop="des" align="center" label="描述"></el-table-column>
      <el-table-column prop="registerTime" align="center" label="注册时间" ></el-table-column>
      <el-table-column prop="updateTime" align="center" label="更新时间" ></el-table-column>
      <el-table-column prop="expiryTime" align="center" label="过期时间" ></el-table-column>
      <el-table-column align="center" label="状态" width="100px">
        <template scope="scope">
          <el-button :type="scope.row.status === 1 ? 'info' : 'danger'" size="mini">{{ scope.row.status | statusFilter }}</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="220px">
        <template scope="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button type="primary" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>

    </el-table>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading.body="updateLoading" size="tiny">
      <el-form :rules="rules" ref="dataForm" :model="temp" label-width="100px"  style='width: 400px;'>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="temp.phone"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="des">
          <el-input type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="请输入内容" v-model="temp.des"></el-input>
        </el-form-item>
        <el-form-item label="过期时间" prop="expiryTime">
          <el-input type="date" v-model="temp.expiryTime"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">确 定c</el-button>
        <el-button v-else type="primary" @click="updateData">确 定u</el-button>
      </div>
    </el-dialog>
    <el-dialog title="删除" :visible.sync="dialogDeleteVisible" v-loading.body="deleteLoading" size="tiny">
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogDeleteVisible = false">取 消</el-button>
        <el-button type="primary" @click="deleteData">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import _ from 'lodash';
import moment from 'moment';
import { userInsert, userDelete } from '@/api/user';
  export default {
    name: 'inlineEditTable',
    data() {
      return {
        listLoading: true,
        updateLoading: false,
        deleteLoading: false,
        dialogStatus: '',
        textMap: {
          update: '编辑',
          create: '创建'
        },
        dialogFormVisible: false,
        dialogDeleteVisible: false,
        temp: {
          id: undefined,
          phone: 0,
          des: '',
          registerTime: 0,
          updateTime: new Date(),
          expiryTime: 0,
        },
        rules: {
          phone: [{ required: true, pattern:/^(((13[0-9]{1})|(14[57]{1})|(15[0-9]{1})|(17[678]{1})|(18[0-9]{1}))+\d{8})$/, message: '请输入正确的手机号', trigger: 'change' }],
          des: [{ required: true, message: '必填项', trigger: 'blur' }],
          expiryTime: [{ required: true, message: '必填项', trigger: 'blur' }]
        }
      }
    },
    filters: {
      statusFilter: (status) => {
        return {
          '-1': '过期',
          '1': '正常'
        }[status]
      }
    },
    created() {
      this.getUserList();
    },
    computed: {
      list() {
        return  this.$store.state.user.userList.map(v => {
          v.registerTime = moment.unix(v.registerTime).format('YYYY-MM-DD HH:ss');
          v.updateTime = moment.unix(v.updateTime).format('YYYY-MM-DD HH:ss');
          v.expiryTime = moment(v.expiryTime, 'YYYYMMDD').format('YYYY-MM-DD');
          return v;
        });
      }
    },
    methods: {
      getUserList() {
        this.listLoading = true;
        this.$store.dispatch('getUserList').then((res)  => {
          this.listLoading = false;
          // this.list = res;
        })
      },
      handleUpdate(row) {
        this.temp = {...row};
        this.temp.updateTime = new Date(this.temp.updateTime);
        this.dialogStatus = 'update';
        this.dialogFormVisible = true;
      },
      createData() {
        let vm = this;
        vm.updateLoading = true;
        vm.temp.expiryTime = vm.temp.expiryTime.replace(/-/g, '');
        this.$refs['dataForm'].validate((valid) => {
          if(valid) {
            userInsert(vm.temp).then(res => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getUserList();
                vm.$message({
                  message: '添加成功！',
                  type: 'success'
                })
              } else {
                vm.$message({
                  message: '系统出错！',
                  type: 'error'
                })
              }
            })
          }
        })
      },
      updateData() {
        let vm = this;
        vm.updateLoading = true;
        vm.$refs['dataForm'].validate((valid) => {
          if(valid) {
            const tempData = {...vm.temp};
            tempData.updateTime = Math.floor(tempData.updateTime / 1000);
            tempData.expiryTime = tempData.expiryTime.replace(/-/g, '');
            vm.$store.dispatch('userUpdate', tempData).then(res => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getUserList();
                vm.$message({
                  message: '更新成功！',
                  type: 'success'
                })
              } else {
                vm.$message({
                  message: '系统出错！',
                  type: 'error'
                })
              }
            });
          } else {
            console.log('valid err');
          }
        })
      },
      resetTemp() {
        this.temp = {
          id: undefined,
          phone: 0,
          des: '',
          registerTime: new Date(),
          updateTime: new Date(),
          expiryTime: 0,
        }
      },
      handleCreate() {
        this.resetTemp();
        this.dialogStatus = 'create'
        this.dialogFormVisible = true;
      },
      handleDelete(row) {
        this.temp = {...row};
        this.dialogDeleteVisible = true;
      },
      deleteData() {
        let vm = this;
        vm.deleteLoading = true;
        userDelete(vm.temp).then(res => {
          vm.deleteLoading = false;
          vm.dialogDeleteVisible = false;
          if(res.iRet === 0) {
            vm.getUserList();
            vm.$message({
              message: '删除成功！',
              type: 'success'
            })
          } else {
            vm.$message({
              message: '删除失败！',
              type: 'error'
            })
          }
        })
      }
    }
  }
</script>

<style scoped>
</style>
