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
      <el-table-column align="center" label="状态" width="150px">
        <template scope="scope">
          <span class="state s-danger" v-if="!scope.row.status">{{ scope.row.status | statusFilter }}</span>
          <span class="state s-info" v-if="handleExpiryTime(scope.row.expiryTime)">{{ scope.row.expiryTime | expiryTimeFilter }}</span>
          <span class="state" v-if="scope.row.status  && !handleExpiryTime(scope.row.expiryTime)">正常</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="220px">
        <template scope="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === 1" type="danger" size="small" @click="handleDelete(scope.row, 0)">删除</el-button>
          <el-button v-else type="warning" size="small" @click="handleDelete(scope.row, 1)">恢复</el-button>
        </template>
      </el-table-column>

    </el-table>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading.body="updateLoading" size="tiny" :show-close=false>
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
        <el-form-item label="组:" prop="">
          <template>
            <el-checkbox-group v-model="checklist">
              <el-checkbox v-for="item in groupInUser" v-if="item.flag" :label="item.id" :key="item.id">{{item.name}}</el-checkbox>
              <el-checkbox v-else :label="item.id" :key="item.id">{{item.name}}</el-checkbox>
            </el-checkbox-group>
          </template>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">确 定</el-button>
        <el-button v-else type="primary" @click="updateData">确 定</el-button>
      </div>
    </el-dialog>
    <el-dialog :title="statusMap[state]" :visible.sync="dialogDeleteVisible" v-loading.body="deleteLoading" size="tiny">
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
import { groupInUser } from '@/api/groupManage';
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
        statusMap: ['删除', '恢复'],
        dialogFormVisible: false,
        dialogDeleteVisible: false,
        state: -99,
        checklist: [],
        groupList: [],
        groupInUser: [],
        checklistTemp: [],
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
          '0': '已删除',
          '1': ''
        }[status]
      },
      expiryTimeFilter: (expiryTime) => {
        var now = moment().format('YYYYMMDD');
        expiryTime = moment(expiryTime, 'YYYY-MM-DD').format('YYYYMMDD');
        if (expiryTime - now < 0) {
          return '已过期'
        } else {
          return 'false';
        }
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
      },
    },
    methods: {
      handleExpiryTime(time) {
        var now = moment().format('YYYYMMDD');
        time = moment(time, 'YYYY-MM-DD').format('YYYYMMDD');
        if (time - now < 0) {
          return true;
        } else {
          return false;
        }
      },
      handleStatus(status) {

      },
      getGroupList() {
        let vm = this;
        vm.groupList = vm.$store.state.groupManage.groupList;
        if(vm.groupList.length === 0) {
          this.$store.dispatch('getGroupList').then(res => {
            vm.groupList = res;
            vm.calGroupInUser();
          })
        } else {
          vm.calGroupInUser();
        }
      },
      calGroupInUser() {
        let vm = this;
        if(vm.groupInUser) {
          vm.groupInUser.map(v => {
            v.flag = 1;
            vm.checklist.push(v.id);
            return v;
          });
          vm.checklistTemp = [...vm.checklist];
          vm.groupInUser = _.unionBy(vm.groupInUser, vm.groupList, 'id');
        } else {
          vm.checklistTemp = [];
          vm.groupInUser = vm.groupList;
        }
      },
      getUserList() {
        this.listLoading = true;
        this.$store.dispatch('getUserList').then((res)  => {
          this.listLoading = false;
          // this.list = res;
        })
      },
      handleUpdate(row) {
        let vm = this;
        this.temp = {...row};
        this.temp.updateTime = new Date(this.temp.updateTime);
        this.dialogStatus = 'update';
        this.dialogFormVisible = true;
        groupInUser({ id: this.temp.id }).then((res) => {
          vm.groupInUser = res;
          this.getGroupList()
        });
        this.$nextTick(() => {
          this.$refs['dataForm'].resetFields()
        })
      },
      createData() {
        let vm = this;
        this.$refs['dataForm'].validate((valid) => {
          if(valid) {
            vm.updateLoading = true;
            vm.temp.expiryTime = vm.temp.expiryTime.replace(/-/g, '');
            if(vm.checklist.length !== 0) {
              vm.temp.checklist = vm.checklist;
            }
            userInsert(vm.temp).then(res => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getUserList();
                vm.$message({
                  message: '添加成功！',
                  type: 'success'
                });
                this.$nextTick(() => {
                  this.$refs['dataForm'].resetFields();
                });
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
        vm.$refs['dataForm'].validate((valid) => {
          if(valid) {
            vm.updateLoading = true;
            const tempData = {...vm.temp};
            tempData.updateTime = Math.floor(tempData.updateTime / 1000);
            tempData.expiryTime = tempData.expiryTime.replace(/-/g, '');
            let equTemp = vm.checklistTemp.sort((a,b) => a-b).toString();
            let equ = vm.checklist.sort((a,b) => a-b).toString();
            if(equTemp !== equ) {    // 只有当checkbox发生了变化后才将此值传给后台
              tempData.checklist = vm.checklist;
            }
            vm.$store.dispatch('userUpdate', tempData).then(res => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              vm.reset();
              if(res.iRet === 0) {
                vm.getUserList();
                vm.$message({
                  message: '更新成功！',
                  type: 'success'
                });
                this.$nextTick(() => {
                  this.$refs['dataForm'].resetFields();
                });
              } else {
                vm.$message({
                  message: '系统出错！',
                  type: 'error'
                })
              }
            });
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
        this.getGroupList();
        this.$nextTick(() => {
          this.$refs['dataForm'].resetFields();
        });
      },
      handleDelete(row, state) {
        this.state = state;
        this.temp = {...row};
        this.dialogDeleteVisible = true;
      },
      deleteData() {
        let vm = this;
        vm.deleteLoading = true;
        vm.temp.state = vm.state;
        userDelete(vm.temp).then(res => {
          vm.deleteLoading = false;
          vm.dialogDeleteVisible = false;
          if(res.iRet === 0) {
            vm.getUserList();
            vm.$message({
              message: '操作成功！',
              type: 'success'
            })
          } else {
            vm.$message({
              message: '操作失败！',
              type: 'error'
            })
          }
        })
      },
      reset() {
        this.dialogFormVisible = false;
        this.dialogDeleteVisible = false;
        this.checklistTemp = [];
        this.checklist = [];
        this.groupInUser = [];
        this.temp = {
          id: undefined,
          phone: 0,
          des: '',
          registerTime: 0,
          updateTime: new Date(),
          expiryTime: 0,
        };
        this.$nextTick(() => {
          this.$refs['dataForm'].resetFields();
        });
      },
      cancel() {
        this.reset();
      }
    }
  }
</script>

<style scoped>
</style>
