/* eslint import/no-dynamic-require:off, global-require:off */
import Vue from 'vue';
import Router from 'vue-router';

/* layout */
import Layout from '../views/layout/Layout';

// in development env not use Lazy Loading,because Lazy Loading large page will
// cause webpack hot update too slow.so only in production use Lazy Loading
const _import = require(`./_import_${process.env.NODE_ENV}`);

/* login */
const Login = _import('login/index');

/* dashboard */
const dashboard = _import('dashboard/index');

/* error page */
const Err404 = _import('404');

/* demo page */
const Form = _import('page/form');
const Table = _import('table/index');
const UserList  = _import('page/userList');
const AppList  = _import('page/appList');
const GroupList = _import('page/groupList');

Vue.use(Router);

/**
  * icon : the icon show in the sidebar
  * hidden : if `hidden:true` will not show in the sidebar
  * redirect : if `redirect:noredirect` will not redirct in the levelbar
  * noDropdown : if `noDropdown:true` will not has submenu in the sidebar
  * meta : `{ role: ['admin'] }`  will control the page role
  * */
export const constantRouterMap = [
  { path: '/login', component: Login, hidden: true },
  { path: '/404', component: Err404, hidden: true },
  {
    path: '/',
    component: Layout,
    redirect: '/user',
    name: 'Home',
    hidden: true,
    children: [{ path: 'dashboard', component: dashboard }]
  }
];

export default new Router({
  // mode: 'history', //后端支持可开
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRouterMap
});

export const asyncRouterMap = [
  {
    path: '/user',
    component: Layout,
    redirect: '/user/userList',
    name: '用户',
    icon: 'el-icon-menu',
    noDropdown: true,
    children: [
      {path: 'userList', component: UserList, name: '用户列表', meta: {title: '用户列表'}}
    ]
  },

  {
    path: '/app',
    component: Layout,
    redirect: '/app/appList',
    name: 'app',
    meta: {
      title: 'app',
      icon: 'icon-drag'
    },
    icon: 'el-icon-star-on',
    noDropdown: true,
    children: [
      {path: 'appList', component: AppList, name: 'app列表', meta: {title: 'app列表'}}
    ]
  },

  {
    path: '/group',
    component: Layout,
    redirect: '/group/groupList',
    name: 'group',
    meta: {
      title: 'group',
      icon: 'icon-drag'
    },
    icon: 'el-icon-time',
    noDropdown: true,
    children: [
      {path: 'groupList', component: GroupList, name: '组列表', meta: {title: '组列表'}}
    ]
  },

  { path: '*', redirect: '/404', hidden: true }
];
