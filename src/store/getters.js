const getters = {
  sidebar: state => state.app.sidebar,
  token: state => state.user.auth.token,
  userInfo: state => state.user.userInfo,
  permission_routers: state => state.permission.routers,
  addRouters: state => state.permission.addRouters,
  userList: state => state.user.userList,
  appInGroupList: (state, id) => {
    return state.groupManage.groupList.map(item => {
      if(item.array) {
        item.array.forEach((obj, index) => {
          if (id === obj.id) {
            item.flag = 1;
          }
        })
      }
      return item;
    })
  }
};
export default getters;
