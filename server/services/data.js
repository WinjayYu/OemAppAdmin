const mysql = require('mysql2/promise');
const config = global.config;
const logger = require('../common/logger');
const _ = require('lodash');
const parse = require('await-busboy');
const read = require('read-all-stream');
const path = require('path');
import cache from '../common/cache';

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
  let res = await executeQuery(`select a.*, a.app_order as appOrder from t_app a order by a.app_order asc`);

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
                                 from t_group c order by c.group_order asc`);

  for(let i = 0; i < res.length; i++) {
    res[i].apps = await executeQuery(`select a.id, a.name, a.icon, a.url from t_app a where a.id in (select ag.app_id from t_app_group ag where ag.group_id = ${res[i].id} )`)
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
      `UPDATE t_app SET app_order = ${i + 1} WHERE id = ${item[i].id}`
    );
  }
  return {iRet: 0}
};

const appInsertSer = async (item) => {
  let maxOrder = await executeQuery(`SELECT MAX(a.app_order) AS appOrder FROM t_app a`);

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
	    ${registerTime},
	    ${maxOrder[0].appOrder + 1}
	    )`);

  if(insertApp) {
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
    let group = [];
    let temp = {};
    let data = cache.get();
    if(data) {
      let userGroup = data.user[name];
      if (!userGroup) {
        return {iRet: 0, message: 'ok', group: []};
      }
      userGroup.forEach((v, i) => {
        let groupApp = data.group[v.id];
        temp.id = v.id;
        temp.name = groupApp.name;
        temp.des = groupApp.des;
        temp.apps = groupApp.apps;
        group.push(temp);
      });
      return { iRet: 0, message: 'ok', group };
    } else {
      return  { iRet: -1, message: '暂无数据' }
    }
  } catch (e) {
    return { iRet: -1, message: e };
  }
};

const groupInsert = async (item) => {

  let maxOrder = await executeQuery(`SELECT MAX(g.group_order) AS groupOrder FROM t_group g`);

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
	    ${registerTime},
	    ${maxOrder[0].groupOrder + 1}
	    )`);
  if(insertGroup) {
    return { iRet: 0 }
  } else {
    return { iRet: -1 }
  }
};

const groupOrder = async (item) => {
  let res;
  for(let i = 0; i < item.length; i++) {
    res = await executeQuery(
      `UPDATE t_group SET group_order = ${i + 1} WHERE id = ${item[i].id}`
    );
  }
  return {iRet: 0}
};

const allData = async () => {
  try {
    let userGroup = await executeQuery(`
  SELECT
	a.name,
	CONCAT(
		'[',
		GROUP_CONCAT(
			'{',
			CONCAT('"id":', ug.group_id),
			'}'
		),
		']'
	) AS groups
FROM
	t_user a
LEFT JOIN t_user_group ug ON a.id = ug.user_id
WHERE
	a. STATUS <> 0
AND a.expiry_time > CURDATE()
GROUP BY
	a.id
    `);

    let userGroupRes = {};
    for(let i = 0; i < userGroup.length; i++) {
      userGroup[i].groups = JSON.parse(userGroup[i].groups);
      let name = userGroup[i].name;
      userGroupRes[name] = userGroup[i].groups;
    }

    cache.set({ key: "user", data: userGroupRes });

    let groupApp = await executeQuery(`
    SELECT
	t1.id,
	t1.name,
	t1.des,
	CONCAT(
		'[',
		GROUP_CONCAT(
			'{',
			CONCAT('"id":', a.id),
			CONCAT(',"name":"', a.name, '"'),
			CONCAT(',"url":"', a.url, '"'),
			CONCAT(',"icon":"', a.icon, '"'),
			'}'
		),
		']'
	) AS apps
FROM
	t_app a
JOIN (
	SELECT
		g.id,
		g.name,
		g.des,
		ag.app_id
	FROM
		t_group g
	LEFT JOIN t_app_group ag ON g.id = ag.group_id
) t1
on
	a.id = t1.app_id
WHERE
	a.status <> 0
GROUP BY
	t1.id
    `) ;

    let groupAppRes = {};
    for(let i = 0; i < groupApp.length; i++) {
      groupApp[i].apps = JSON.parse(groupApp[i].apps);
      let id = groupApp[i].id;
      groupAppRes[id] = {name: groupApp[i].name, des:groupApp[i].des, apps:groupApp[i].apps};
    }

    cache.set({ key: "group", data: groupAppRes });
  } catch (e) {
    logger.error.error(e);
    return null;
  }
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
  groupOrder,
  allData
}

