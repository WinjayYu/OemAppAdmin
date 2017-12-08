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

export default {
  appList,
  userList,
  groupList
}
