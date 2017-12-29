import dataSer from '../services/data'

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

const result = async (ctx)  => {
  let { phone } = ctx.request.body;
  let res = await dataSer.result(phone);
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
}

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
  groupOrder
}
