<template>
  <div class="app-container calendar-list-container">
    <div class="filter-container">
      <el-button class="filter-item" style="margin: 10px 0;" @click="handleCreate" type="primary" icon="el-icon-edit">添加组</el-button>
    </div>
    <el-table :data="list" v-loading.body="listLoading" border fit highlight-current-row style="width: 100%">
      <el-table-column prop="id" align="center" label="ID" width="50px"></el-table-column>
      <el-table-column prop="name" align="center" label="名称"></el-table-column>
      <el-table-column prop="des" align="center" label="描述"></el-table-column>
      <el-table-column label="app" align="center">
        <template scope="scope">
          <span class="state" v-for="item in scope.row.array" :key="item.id">{{item.name}}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="220px">
        <template scope="scope">
          <el-button type="primary" size="small" @click="handleUpdate(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center"  label="拖拽排序" width="100">
        <template scope="scope">
          <img :src="drag" alt="drag" class="drag">
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button v-if="dialogStatus=='create'" type="primary" @click="createData">确 定</el-button>
        <el-button v-else type="primary" @click="updateData">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { groupUpdate, groupInsert, groupOrder } from '@/api/groupManage';
  import Sortable from 'sortablejs';
  import drag from '@/assets/images/drag.png';

  export default {
    data() {
      return {
        drag,
        listLoading: false,
        dialogStatus: false,
        dialogFormVisible: false,
        updateLoading: false,
        dragLoading: false,
        dragVisible: false,
        textMap: {
          update: '编辑',
          create: '创建'
        },
        temp: {
          id: undefined,
          name: '',
          des: '',
          array: [],
        },
        checklist: [],   // checkBox列表 如：[2] 会选中id为2的group
        checklistTemp: [],  // 检验checkList有没有发生变化
        appInGroup: [],
        appList: [],
        newList: [],
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
    mounted(){
      this.setSort();
    },
    methods: {
      getGroupList() {
        let vm = this;
        this.listLoading = true;
        this.$store.dispatch('getGroupList').then(res => {
          vm.listLoading = false;
          vm.olderList = vm.list.map(v => {
            return { order: v.groupOrder, id: v.id }
          });
          vm.newList = vm.olderList.slice();
        });

      },
      handleUpdate(row) {
        console.log(row);
        this.temp = {...row};
        this.dialogStatus = 'update';
        this.dialogFormVisible = true;
        this.handleAppList();
      },
      handleCreate () {
        this.reset();
        this.dialogStatus = 'create';
        this.dialogFormVisible = true;
        this.handleAppList();
      },
      handleAppList () {
        let vm = this;
        this.$store.dispatch('getAppList').then(res => {
          if(!res) {
            vm.$message({
              message: '获取组列表出错！',
              type: 'error'
            })
          } else {
            vm.appList = res;
            if(vm.temp.array) {
              vm.appInGroup = vm.temp.array.map(v => {
                v.flag = 1;
                v.id = parseInt(v.id);
                vm.checklist.push(v.id);
                return v;
              });
            }
            vm.checklistTemp = [...vm.checklist];

            vm.appInGroup = _.unionBy(vm.appInGroup, vm.appList, 'id');
          }
        })
      },
      createData () {
        let vm = this;
        vm.updateLoading = true;
        this.$refs['dataForm'].validate((valid) => {
          if(valid) {
            groupInsert(vm.temp).then((res) => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getGroupList();
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
        vm.$refs['dataForm'].validate(valid => {
          if(valid) {
            const tempData = {...vm.temp};
            let equTemp = vm.checklistTemp.sort((a,b) => a-b).toString();
            let equ = vm.checklist.sort((a,b) => a-b).toString();
            if(equTemp !== equ) {    // 只有当checkbox发生了变化后才将此值传给后台
              tempData.checklist = vm.checklist;
            }
            groupUpdate(tempData).then(res => {
              vm.updateLoading = false;
              vm.dialogFormVisible = false;
              if(res.iRet === 0) {
                vm.getGroupList();
                vm.$message({
                  message: '更新成功！',
                  type: 'success'
                })
                this.reset();
              } else {
                vm.$message({
                  message: '系统出错！',
                  type: 'error'
                });
                this.reset();
              }
            })
          }
        })
      },
      reset() {
        this.dialogFormVisible = false;
        this.dialogDeleteVisible = false;
        this.appInGroup = {};
        this.checklistTemp = [];
        this.checklist = [];
        this.appList = [];
        this.temp = {
          id: undefined,
          name: '',
          des: '',
          array: [],
        };
      },
      cancel() {
        this.reset();
      },
      setSort() {
        let vm = this;
        const el = document.querySelectorAll('tbody')[0];
        this.sortable = Sortable.create(el,{
          animation: 300,
          dragClass: '.drag',
          onStart: evt => {
            vm.dragLoading = true;
            vm.dragVisible = true;
          },
          onEnd: evt => {
            const tempIndex = vm.newList.splice(evt.oldIndex, 1)[0];
            vm.newList.splice(evt.newIndex, 0, tempIndex);
console.log(vm.newList)
            groupOrder(vm.newList).then((res) =>{
              if(res.iRet === 0) {
                vm.dragLoading = false;
                vm.dragVisible = false;
//                vm.getAppList();
              }
            });

          }
        })
      },
    },

  }

</script>
