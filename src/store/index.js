import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';
import app from './modules/app';
import user from './modules/user';
import permission from './modules/permission';
import getters from './getters';
import appManage from './modules/appManage';

Vue.use(Vuex);

const isDev = process.env.NODE_ENV === 'development';
const store = new Vuex.Store({
  modules: {
    app,
    user,
    permission,
    appManage
  },
  getters,
  plugins: isDev ? [createLogger()] : []
});

export default store;
