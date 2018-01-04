const mysql = require('mysql2/promise');
const config = global.config;
const logger = require('../common/logger');
const _ = require('lodash');
const parse = require('await-busboy');
const read = require('read-all-stream');
const path = require('path');

var upFileUpload = require('@up/file-upload')({
  bucket: "upcdnfiles",
  busid: "cdnAsync"
});
var fs = require("fs");
const pool = mysql.createPool({
  host: config.DB.host,
  user: config.DB.user,
  database: config.DB.database,
  password: config.DB.password
});

async function executeQuery(sql) {
  try {
    let [rows] = await pool.query(sql);
    return rows;
  }catch(e) {
    logger.error.error(e);
    return null;
  }
}

// app列表
const appList = async () => {
  let res = await executeQuery(`select a.*, ao.app_order as appOrder from t_app a left join t_app_order ao on a.id = ao.app_id order by ao.app_order asc`);

  for(let i = 0; i < res.length; i++) {
    res[i].groups = await executeQuery(`select g.id, g.name from t_group g where g.id in (select ag.group_id from t_app_group ag where ag.app_id = ${res[i].id})`)
  }
  return res;
};

// app更新
const appUpdateSer = async (item) => {
  let updateTime = Math.floor(new Date() / 1000);
  const res1 = await executeQuery(`
    UPDATE t_app
    SET name = '${item.name}',
     des = '${item.des}',
     update_time = '${updateTime}',
     icon = '${item.icon}'
    WHERE
      id = ${item.id}`);

  if(item.hasOwnProperty('checklist')) {
    await executeQuery(`DELETE FROM t_app_group WHERE app_id = ${item.id}`);
    item.checklist.forEach(async (v) => {
      await executeQuery(`INSERT INTO t_app_group VALUES (${item.id}, ${v})`)
    })
  }
  if(res1) {
    return {iRet: 0, res1}
  } else {
    return {iRet: -1}
  }
};

const appStatusSer = async (item) => {
  let status = !item.status;
  const res = await executeQuery(`
    UPDATE t_app
    SET status = ${status}
    WHERE 
      id = ${item.id}`)
  if(res) {
    return {iRet: 0, res}
  } else {
    return {iRet: -1}
  }
};

const userList = async () => {
  const res = await executeQuery('SELECT a.id, a.name, a.des, a.register_time as registerTime, a.update_time as updateTime, a.expiry_time as expiryTime, a.status FROM `t_user` a');

  return res;
};

const groupInUser = async (item) => {
  const res = await executeQuery(`select g.id, g.name from t_user_group ug join t_group g on ug.group_id = g.id where ug.user_id = ${item.id}`)
  return res;
}

// 组列表
const groupList = async () => {

  let res = await executeQuery(`select c.id, c.name, c.des, c.register_time as registerTime, c.update_time as updateTime 
                                 from t_group c left join t_group_order go on c.id = go.group_id order by go.group_order asc`);

  for(let i = 0; i < res.length; i++) {
    res[i].array = await executeQuery(`select a.id, a.name from t_app a where a.id in (select ag.app_id from t_app_group ag where ag.group_id = ${res[i].id} )`)
  }

  return res;
};

// 用户更新
const userUpdate = async (item) => {
  let res = await executeQuery(
    `UPDATE t_user
    SET name = '${item.name}', des = '${item.des}', update_time = '${item.updateTime}',  expiry_time = '${item.expiryTime}'
    WHERE
    id = ${item.id}`
  );
  if(item.hasOwnProperty('checklist')) {
    await executeQuery(`DELETE FROM t_user_group WHERE user_id = ${item.id}`);
    for(let i = 0; i < item.checklist.length; i++ ) {
      await executeQuery(`INSERT INTO t_user_group (user_id, group_id) VALUES (${item.id}, ${item.checklist[i]})`)
    }
  }

  if(res) {
    return {iRet: 0, res};
  } else {
    return {iRet: -1}
  }
};

// 添加用户
const userInsert = async (item) => {
console.log(item);
  let registerTime = Math.floor(new Date() / 1000);
  let updateTime = registerTime;
  let res = await executeQuery(
    `INSERT INTO t_user (id, name, des, register_time, update_time, expiry_time, status)
      VALUES
        (
          NULL,
          '${item.name}',
          '${item.des}',
          '${registerTime}',
          '${updateTime}',
          '${item.expiryTime}',
          1
        )`
  );
  if(item.hasOwnProperty('checklist')) {
    for(let i = 0; i < item.checklist.length; i++ ) {
      await executeQuery(`INSERT INTO t_user_group (user_id, group_id) VALUES (${res.insertId}, ${item.checklist[i]})`)
    }
  }
  if(res) {
    return {iRet: 0, res}
  } else {
    return {iRet: -1}
  }
}

//删除用户
const userDeleteSer = async (item) => {
  let res = await executeQuery(
    `UPDATE t_user SET status = ${item.state} WHERE id = ${item.id}`
  );
  if(res) {
    return {iRet: 0}
  } else {
    return {iRet: -1}
  }
};

const appOrderSer = async (item) => {
  let res;
  for(let i = 0; i < item.length; i++) {
    res = await  executeQuery(
      `UPDATE t_app_order SET app_order = ${i + 1} WHERE app_id = ${item[i].id}`
    );
  }
  return {iRet: 0}
};

const appInsertSer = async (item) => {
  let maxOrder = await executeQuery(`SELECT MAX(ao.app_order) AS appOrder FROM t_app_order ao`);

  let registerTime = getCurrentDate();
  let insertApp = await executeQuery(
    `INSERT INTO t_app
     VALUES
	    (
	    NULL,
	    '${item.name}',
	    '${item.url}',
	    '${item.des}',
	    '${item.icon}',
	    1,
	    ${registerTime},
	    ${registerTime}
	    )`);

  let insertOrder = await executeQuery(`insert into t_app_order values ( ${insertApp.insertId},  ${maxOrder[0].appOrder + 1} )`)
  if(insertApp && insertOrder) {
    return { iRet: 0 }
  } else {
    return { iRet: -1 }
  }
};

const imgUpload = async (ctx) => {
  let res;
  try{
    let parts = parse(ctx, {autoFields: true});
    let part;
    let pics = [];
    while (part = await parts) {
      let data = await read(part, {encoding: null});
        let ret = await upFileUpload.uploadFile(data, part.filename, 'OemApp', 0);
        pics.push(ret);
    }
    let url = 'https://cdn.upchina.com/' + pics[0];
    return { iRet: 0, url };
   } catch (e) {
    logger.error.error(e);
    return { iRet: -1 };
  }
};

// 获取当前时间，秒
function getCurrentDate() {
  return Math.floor(new Date() / 1000);
}

const groupUpdate = async (item) => {
  let updateTime = Math.floor(new Date() / 1000);
  const res1 = await executeQuery(`
    UPDATE t_group
    SET name = '${item.name}',
     des = '${item.des}',
     update_time = '${updateTime}'
    WHERE
      id = ${item.id}`);

  if(item.hasOwnProperty('checklist')) {
    await executeQuery(`DELETE FROM t_app_group WHERE group_id = ${item.id}`);
      for(let i = 0; i < item.checklist.length; i++ ) {
        await executeQuery(`INSERT INTO t_app_group VALUES (${item.checklist[i]}, ${item.id})`)
      }
  }
  if(res1) {
    return {iRet: 0, res1}
  } else {
    return {iRet: -1}
  }
};

const result = async (name) => {
  try {
    let group = await executeQuery(`select k.* from (select g.id, g.name, g.des from t_group g join (select * from t_user_group  where user_id = (
                            select id from t_user where name = '${name}')) t on g.id = t.group_id) k
                            left join t_group_order go on k.id = go.group_id order by go.group_order asc`);

    for(let i = 0; i < group.length; i++) {
      group[i].apps = await executeQuery(`select t.* from (select a.id, a.name, a.url, a.icon from t_app a where a.id in (select ag.app_id from t_app_group ag where ag.group_id = ${group[i].id}) 
                              ) t left join t_app_order ao on t.id = ao.app_id order by ao.app_id asc`);
    }

    return { iRet: 0, message: 'ok', group };
  } catch (e) {
    return { iRet: -1, message: e };
  }
};

const groupInsert = async (item) => {

  let maxOrder = await executeQuery(`SELECT MAX(go.group_order) AS groupOrder FROM t_group_order go`);

  let registerTime = getCurrentDate();
  let insertGroup = await executeQuery(
    `INSERT INTO t_group
     VALUES
	    (
	    NULL,
	    '${item.name}',
	    '${item.des}',
	    1,
	    ${registerTime},
	    ${registerTime}
	    )`);
  let insertOrder = await executeQuery(`insert into t_group_order values ( ${insertGroup.insertId}, ${maxOrder[0].groupOrder + 1} )`)
  if(insertGroup && insertOrder) {
    return { iRet: 0 }
  } else {
    return { iRet: -1 }
  }
};

const groupOrder = async (item) => {
  let res;
  for(let i = 0; i < item.length; i++) {
    res = await executeQuery(
      `UPDATE t_group_order SET group_order = ${i + 1} WHERE group_id = ${item[i].id}`
    );
  }
  return {iRet: 0}
}

export default {
  appList,
  userList,
  groupList,
  userUpdate,
  userInsert,
  userDeleteSer,
  appUpdateSer,
  appStatusSer,
  appOrderSer,
  appInsertSer,
  imgUpload,
  groupUpdate,
  result,
  groupInsert,
  groupInUser,
  groupOrder
}

