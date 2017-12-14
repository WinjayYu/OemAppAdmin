import {getAppList} from '@/api/appManage';

const appManage = {
  state: {
    appList: []
  },

  mutations: {
    SET_APP_LIST: (state, appList) => {
      state.appList = appList;
    }
  },

  actions: {
    getAppList({commit}, state) {
      return new Promise((resolve, reject) => {
        getAppList().then((res) => {
          commit('SET_APP_LIST', res);
          resolve(res);
        }).catch(err => {
          reject(err);
        })
      })
    }
  }
};

export default appManage;
