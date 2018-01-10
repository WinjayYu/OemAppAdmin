/* eslint no-param-reassign:0 */
import { postLogin, postLogout, getUserInfo, getUserList, userUpdate } from '@/api/user';
import Cookies from 'js-cookie';
import _ from 'lodash';

const user = {
  state: {
    auth: {
      token: Cookies.get('Admin-Token')
    },
    userInfo: {
      name: '',
      avatar: '',
      roles: []
    },
    userList: [],
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.auth.token = token;
    },
    SET_USER_INFO: (state, userInfo) => {
      state.userInfo = userInfo;
    },
    SET_USER_LIST: (state, userList) => {
      state.userList = userList;
    },
    // SET_USER_UPDATE: (state, userUpdate) => {
    //   console.log('state', state);
    // }
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {
      const email = userInfo.email.trim();
      return new Promise((resolve, reject) => {
        postLogin(email, userInfo.password).then(response => {
          const data = response.data;
          if(data.success) {
            Cookies.set('Admin-Token', data.token);
            commit('SET_TOKEN', data.token, { expires: 2 });  // 有效期两天
            resolve();
          } else {
            reject('密码错误！')
          }
        }).catch(error => {
          reject(error);
        });
      });
    },


    // 获取用户信息
    GetInfo({ commit }) {
      return new Promise((resolve, reject) => {
        getUserInfo().then(response => {
          const data = response.data;
          commit('SET_USER_INFO', data);
          resolve(response);
        }).catch(error => {
          reject(error);
        });
      });
    },

    // 登出
    LogOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        postLogout(state.auth.token).then(() => {
          commit('SET_TOKEN', '');
          commit('SET_USER_INFO', {});
          Cookies.remove('Admin-Token');
          resolve();
        }).catch(error => {
          reject(error);
        });
      });
    },

    // 前端 登出
    FedLogOut({ commit }) {
      return new Promise(resolve => {
        commit('SET_TOKEN', '');
        Cookies.remove('Admin-Token');
        resolve();
      });
    },

    getUserList({commit}, state) {
     return new Promise((resolve, reject) => {
       getUserList().then((res) => {
         commit('SET_USER_LIST', res);
         resolve(res);
       }).catch(err => {
         reject(err);
       })
     })
    },

    userUpdate({commit}, userUpdateData) {
      return new Promise((resolve, reject) => {
        userUpdate(userUpdateData).then((res) => {
          resolve(res);
        }).catch(err => {
          reject(err);
        })
      })
    }
  }
};

export default user;
