import {getGroupList} from '@/api/group'

const group = {
  state: {
    groupList: []
  },

  mutations: {
    SET_GROUP_LIST: (state, groupList) => {
      state.groupList = groupList;
    }
  },

  actions: {
    getGroupList({commit}, state) {
      return new Promise((resolve, reject) => {
        getGroupList().then((res) => {
          commit('SET_GROUP_LIST', res );
          resolve(res);
        }).catch((err) => {
          reject(err);
        })
      })
    }
  }
}
