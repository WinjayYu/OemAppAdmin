<template>
  <div class="app-container calendar-list-container">
    <div class="filter-container">
      <el-button class="filter-item" style="margin-left: 10px;" @click="handleCreate" type="primary" icon="el-icon-edit">添加APP</el-button>
    </div>
    <el-table :data="list" v-loading.body="listLoading" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="appOrder" align="center" label="顺序" width="70px"></el-table-column>
      <el-table-column prop="id" align="center" label="ID" width="50px"></el-table-column>
      <el-table-column prop="name" align="center" label="名称"></el-table-column>
      <el-table-column prop="des" align="center" label="描述"></el-table-column>
      <el-table-column label="icon" align="center" width="100px">
        <template scope="scope">
          <img :src="scope.row.icon" alt="" style="width: 50px">
        </template>
      </el-table-column>
      <el-table-column prop="url" label="url" align="center"></el-table-column>
      <el-table-column label="所在组" align="center">
        <template scope="scope">
          <el-button type="text" v-for="item in scope.row.groups" :key="item.id">{{item.name}}</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="220px">
        <template scope="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status" type="primary" size="small" @click="handleAppStatus(scope.row)">下架</el-button>
          <el-button v-else type="primary" size="small" @click="handleAppStatus(scope.row)">上架</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" label="拖拽" width="100">
        <template scope="scope">
          <img :src="drag" alt="drag">
        </template>
      </el-table-column>
    </el-table>
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" v-loading.body="updateLoading" size="tiny">
      <el-form :rules="rules" ref="dataForm" :model="temp">
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name"></el-input>
        </el-form-item>
        <el-form-item label="url" prop="url">
          <el-input v-model="temp.url"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="des">
          <el-input v-model="temp.des"></el-input>
        </el-form-item>
        <el-form-item label="icon" prop="icon">
          <el-input v-model="temp.icon"></el-input>
        </el-form-item>
        <!--<el-form-item label="所在组:" prop="">-->
          <!--<template>-->
            <!--<el-checkbox-group v-model="checklist">-->
              <!--<el-checkbox v-for="item in appInGroup" v-if="item.flag" :label="item.id" :key="item.id">{{item.name}}</el-checkbox>-->
              <!--<el-checkbox v-else :label="item.id" :key="item.id">{{item.name}}</el-checkbox>-->
            <!--</el-checkbox-group>-->
          <!--</template>-->
        <!--</el-form-item>-->
      </el-form>
      <template>
        <el-upload
          ref="upload"
          class="avatar-uploader"
          action="/api/app/imgUpload"
          :data="uploadData"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          :before-upload="beforeAvatarUpload">
          <img v-if="imageUrl" :src="imageUrl" class="avatar">
          <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>
      </template>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">确 定c</el-button>
        <el-button v-else type="primary" @click="updateData">确 定u</el-button>
      </div>
    </el-dialog>
    <el-dialog :title="statusMap[statusFlag]" :visible.sync="dialogDeleteVisible" v-loading.body="deleteLoading" size="tiny">
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="setAppStatus">确 定</el-button>
      </span>
    </el-dialog>
    <div :visible.sync="dragVisible" v-loading.body="dragLoading"></div>
    <div class='show-d'>默认顺序 &nbsp; {{ olderList}}</div>
    <div class='show-d'>拖拽后顺序{{newList}}</div>
  </div>
</template>
<script>
  import { appUpdate,appStatus,appOrder,appInsert,imgUpload } from '@/api/appManage'
  import _ from 'lodash';
  import Sortable from 'sortablejs';
  import drag from '@/assets/images/drag.png';


  export default {
    data() {
      return {
        drag,
        listLoading: false,
        updateLoading: false,
        dialogFormVisible: false,
        dialogStatus: false,
        dialogDeleteVisible: false,
        deleteLoading: false,
        dragLoading: false,
        dragVisible: false,
        statusFlag: '',
        uploadData: {},
        temp: {
          id: undefined,
          name: '',
          des: '',
          url: '',
          status: '',
          appOrder: '',
          updateTime: '',
          groups: []
        },
        textMap: {
          update: '编辑',
          create: '创建'
        },
        statusMap: {
          putAway: '上架',
          soldOut: '下架'
        },
        checklist: [],   // checkBox列表 如：[2] 会选中id为2的group
        checklistTemp: [],  // 检验checkList有没有发生变化
        appInGroup: [],
        sortable: null,
        olderList: [],
        newList: [],
        imageUrl: '',
        rules: {
          name: [{required: true, message: '必填项', trigger: 'blur'}],
          des: [{required: true, message: '必填项', trigger: 'blur'}],
          url: [{required: true, message: '必填项', trigger: 'blur'}],
          icon: [{required: true, message: '必填项', trigger: 'blur'}]
        }
      }
    },
    created() {
      this.getAppList();
    },
    computed: {
      list() {
        return this.$store.state.appManage.appList;
      },
      groupList() {
        return this.$store.state.groupManage.groupList;
      }
    },
    methods: {
      getAppList() {
        let vm = this;
        this.listLoading = true;
        this.$store.dispatch('getAppList').then(res => {
          vm.listLoading = false;
          vm.setSort();
          vm.olderList = vm.list.map(v => v.appOrder);
          vm.newList = vm.olderList.slice();
        })
      },
      handleUpdate(row) {
        let vm = this;
        vm.checklist = [];
        vm.checklistTemp = [];
        this.temp = {...row};
        this.dialogStatus = 'update';
        this.dialogFormVisible = true;
        this.uploadData = {id: row.id};
        this.$store.dispatch('getGroupList').then(res => {
          if(!res) {
            vm.$message({
              message: '获取组列表出错！',
              type: 'error'
            })
          } else {
            if(vm.temp.groups) {
              vm.appInGroup = vm.temp.groups.map(v => {
                v.flag = 1;
                vm.checklist.push(v.id);
                return v;
              });
              vm.checklistTemp = [...vm.checklist];
              vm.appInGroup = _.unionBy(vm.appInGroup, vm.groupList, 'id');
            }
          }
        });
      },
      handleCreate(row) {
        this.resetTemp();
        this.dialogStatus = 'create';
        this.dialogFormVisible = true;
      },
      updateData() {
        let vm = this;
        vm.updateLoading = true;
        vm.$refs['dataForm'].validate(valid => {
          if(valid) {
            const tempData = {...vm.temp};
            let equTemp = vm.checklistTemp.sort((a,b) => a-b).toString();
            let equ = vm.checklist.sort((a,b) => a-b).toString();
            if(equTemp !== equ) {    // 只有当checkbox发生了变化后才将此值传给后台
              tempData.checklist = vm.checklist;
            }
            appUpdate(tempData).then(res => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getAppList();
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
            })
          }
        })
      },
      createData() {
        let vm = this;
        vm.updateLoading = true;
        this.$refs['dataForm'].validate(valid => {
          if(valid) {
            appInsert(vm.temp).then((res) => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getAppList();
                vm.$message({
                  message: '添加成功！',
                  type: 'success'
                })
              }else {
                vm.$message({
                  message: '系统出错！',
                  type: 'error'
                })
              }
            })
          }
        })
      },
      handleAppStatus(row) {
        this.temp = {...row};
        this.statusFlag = this.temp.status === 1 ? 'soldOut' : 'putAway';
        this.dialogDeleteVisible = true;
      },
      setAppStatus() {
        let vm = this;
        vm.deleteLoading = true;
        appStatus(vm.temp).then(res => {
          vm.deleteLoading = false;
          vm.dialogDeleteVisible = false;
          if(res.iRet === 0) {
            vm.getAppList();
            vm.$message({
              message: '操作成功！',
              type: 'success'
            })
          } else {
            vm.$message({
              message: '系统出错！',
              type: 'error'
            })
          }
        })
      },
      resetTemp() {
        this.temp = {
          id: undefined,
          name: '',
          des: '',
          url: '',
          status: '',
          appOrder: '',
          updateTime: '',
          groups: []
        }
      },
      setSort() {
        let vm = this;
        const el = document.querySelectorAll('tbody')[0];
        this.sortable = Sortable.create(el,{
          onStart: evt => {
            vm.dragLoading = true;
            vm.dragVisible = true;
          },
          onEnd: evt => {
            const tempIndex = vm.newList.splice(evt.oldIndex, 1)[0];
            vm.newList.splice(evt.newIndex, 0, tempIndex);
            appOrder(vm.newList).then((res) =>{
              if(res.iRet === 0) {
                vm.dragLoading = false;
                vm.dragVisible = false;
                vm.getAppList();
              }
            });

          }
        })
      },
      handleAvatarSuccess(res, file) {
        this.imageUrl = URL.createObjectURL(file.raw);
      },
      beforeAvatarUpload(file) {
        const isImg = /(png|jpe?g|gif)/g.test(file.type);
        const isLt2M = file.size / 1024 / 1024 < 2;

        if (!isImg) {
          this.$message.error('上传图片格式不对!');
        }
        if (!isLt2M) {
          this.$message.error('上传图片大小不能超过 2MB!');
        }
        return isImg && isLt2M;
      },
      cancel() {
        this.dialogFormVisible = false;
        this.dialogDeleteVisible = false;
        this.uploadData = {};
        this.imageUrl = '';
      }
    }
  }
</script>

<style>
  .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
</style>
