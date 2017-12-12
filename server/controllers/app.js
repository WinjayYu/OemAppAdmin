import dataSer from '../services/data'

const appList = async (ctx) => {
  let res = await dataSer.appList();

  ctx.body = res;
}

const userList = async (ctx) => {
  let res = await dataSer.userList();
  ctx.body = res;
}

const groupList = async (ctx) => {
  let res = await dataSer.groupList();
  ctx.body = res;
}

const userUpdate = async (ctx) => {
  let item = ctx.request.body;
  let res = await dataSer.userUpdate(item);
  ctx.body = res;
}

export default {
  appList,
  userList,
  groupList,
  userUpdate
}
