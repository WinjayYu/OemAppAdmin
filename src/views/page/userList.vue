<template>
  <div class="app-container calendar-list-container">
    <el-table :data="list" v-loading.body="listLoading" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" align="center" label="ID" width="50px"></el-table-column>
      <el-table-column prop="phone" align="center" label="手机号"></el-table-column>
      <el-table-column prop="des" align="center" lable="描述"></el-table-column>
      <el-table-column prop="registerTime" align="center" label="注册时间" ></el-table-column>
      <el-table-column prop="updateTime" align="center" label="更新时间" ></el-table-column>
      <el-table-column prop="expiryTime" align="center" label="过期时间" ></el-table-column>

      <el-table-column align="center" label="操作" width="220">
        <template scope="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">编辑</el-button>
        </template>
      </el-table-column>

    </el-table>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading.body="updateLoading">
      <el-form ref="dataForm" :model="temp" label-width="70px"  style='width: 400px; margin-left:70px;'>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="temp.phone"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="des">
          <!--<el-input type="" v-model="temp.des"></el-input>-->
          <el-input type="textarea" :autosize="{ minRows: 2, maxRows: 4}" placeholder="请输入内容" v-model="temp.des"></el-input>
        </el-form-item>
        <el-form-item label="过期时间" prop="phone">
          <el-input type="month" v-model="temp.expiryTime"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">确 定c</el-button>
        <el-button v-else type="primary" @click="updateData">确 定u</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
//  import { fetchList } from '@/api/user/getUserList'
import { mapState } from 'vuex';
import _ from 'lodash';
import moment from 'moment';
  export default {
    name: 'inlineEditTable',
    data() {
      return {
        listLoading: true,
        updateLoading: false,
        dialogStatus: '',
        textMap: {
          update: '编辑',
          create: '创建'
        },
        dialogFormVisible: false,
        temp: {
          id: undefined,
          phone: 0,
          des: '',
          registerTime: 0,
          updateTime: new Date(),
          expiryTime: 0,
        },
        rules: {
          phone: [{ required: true, message: '必填项', trigger: 'change' }],
          des: [{ required: true, message: '必填项', trigger: 'change' }],
          expiryTime: [{ required: true, message: '必填项', trigger: 'blur' }]
        }
      }
    },
    filters: {
      statusFilter(status) {
        const statusMap = {
          published: 'success',
          draft: 'info',
          deleted: 'danger'
        }
        return statusMap[status]
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
      getList() {
        this.listLoading = true
        fetchList(this.listQuery).then(response => {
          console.log('list', response);
          const items = response.data.items
          this.list = items.map(v => {
            this.$set(v, 'edit', false) // https://vuejs.org/v2/guide/reactivity.html
            v.originalTitle = v.title //  will be used when user click the cancel botton
            return v
          })
          this.listLoading = false
        })
      },
      getUserList() {
        this.listLoading = true;
        this.$store.dispatch('getUserList').then((res)  => {
          this.listLoading = false;
          console.log('res',res)
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

      },
      updateData() {
        let vm = this;
        vm.updateLoading = true;
        vm.$refs['dataForm'].validate((valid) => {
          if(valid) {
            const tempData = {...vm.temp};
            tempData.updateTime = Math.floor(tempData.updateTime / 1000);
            vm.$store.dispatch('userUpdate', tempData).then(res => {
              vm.updateLoading = false;
              this.dialogFormVisible = false;
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
      }
    }
  }
</script>

<style scoped>
  .edit-input {
    padding-right: 100px;
  }
  .custom-dialog {
    width: 36%;
  }
</style>
