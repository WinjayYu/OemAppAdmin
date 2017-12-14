/**
 * Created by winjayyu on 2017/12/14.
 */

import { groupList } from '@/api/groupManage';

const groupManage = {
  state: {
    groupList: [],
  },

  mutations: {
    SET_GROUP_LIST: (state, groupList) => {
      state.groupList = groupList;
    }
  },

  actions: {
    getGroupList({commit}) {
      return new Promise((resolve, reject) => {
        groupList().then((res) => {
          commit('SET_GROUP_LIST', res);
          resolve(res);
        }).catch(err => {
          reject(err);
        })
      })
    }
  }
}


export default groupManage;
