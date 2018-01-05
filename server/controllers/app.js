import dataSer from '../services/data'
let LRU = require("lru-cache");
let options = {
  max: 2000,
  maxAge: 1000 * 60
}
let cache = LRU(options);

const appList = async (ctx) => {
  let res = await dataSer.appList();

  ctx.body = res;
};

const userList = async (ctx) => {
  let res = await dataSer.userList();
  ctx.body = res;
};

const groupList = async (ctx) => {
  let res = await dataSer.groupList();
  ctx.body = res;
};

const userUpdate = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.userUpdate(item);
  ctx.body = res;
};

const userInsert = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.userInsert(item);
  ctx.body = res;
};

const userDelete = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.userDeleteSer(item);
  ctx.body = res;
};

const appUpdate = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.appUpdateSer(item);
  ctx.body = res;
};

const appStatus = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.appStatusSer(item);
  ctx.body = res;
};

const appOrder = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.appOrderSer(item);
  ctx.body = res;
};

const appInsert = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.appInsertSer(item);
  ctx.body = res;
};

const imgUpload = async (ctx) => {
  let res = await dataSer.imgUpload(ctx);
  ctx.body = res
};

const groupUpdate = async (ctx) => {
  let body = ctx.request.body;
  let res = await dataSer.groupUpdate(body);
  ctx.body = res;
};

const groupInsert = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.groupInsert(item);
  ctx.body = res;
};

const groupInUser = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.groupInUser(item);
  ctx.body = res;
};

const groupOrder = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.groupOrder(item);
  ctx.body = res;
};

const allData = async () => {
  let { userGroup, groupApp } = await dataSer.allData();
  if(userGroup && groupApp) {
    cache.set("user", userGroup);
    cache.set("group", groupApp);
  }
};

const result = async (ctx)  => {
  let res = {group: []};
  let { name } = ctx.request.body;
  let userJson = cache.get('user');
  let groupJson = cache.get('group');

  if(!userJson || !groupJson) {
    ctx.body =  { iRet:-1, message:'system error' }
    return;
  }

  let groupInUser = userJson[name];
  if(!groupInUser) {
    ctx.body =  { iRet:0, message:'ok', group:[] }
    return;
  }
  groupInUser.forEach((v, i) => {
    res.group.push(groupJson.groupApp[v.id]);
  });
  res.iRet = 0;
  res.message = 'ok';

  ctx.body = res;
};

export default {
  appList,
  userList,
  groupList,
  userUpdate,
  userInsert,
  userDelete,
  appUpdate,
  appStatus,
  appOrder,
  appInsert,
  imgUpload,
  groupUpdate,
  result,
  groupInsert,
  groupInUser,
  groupOrder,
  allData
}
