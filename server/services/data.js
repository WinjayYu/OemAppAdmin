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
  let res = await executeQuery(`SELECT
	a.*, d.groups, o.app_order as appOrder
FROM
	t_app a
LEFT JOIN 
	t_app_order o 
on
	a.id = o.app_id
LEFT JOIN (
	SELECT
		ag.app_id,
		ag.group_id,
		CONCAT(
			'[',
		GROUP_CONCAT(
			'{',
			concat('"name":"', g.name, '"'),
			concat(',"id":', g.id),
			'}'
			),
			']'
		) AS groups
	FROM
		t_app_group ag
	LEFT JOIN t_group g ON ag.group_id = g.id
	GROUP BY
		ag.app_id
) d ON a.id = d.app_id
ORDER BY o.app_order ASC`);
  res = res.map((item) => {
    if(!item.groups) {
      item.groups = item.groups === null ? '' : item.groups;
    } else {
      item.groups = JSON.parse(item.groups);
    }
    return item;
  });
  return res;
};

// app更新
const appUpdateSer = async (item) => {
  let updateTime = Math.floor(new Date() / 1000);
  console.log('111', item);
  const res1 = await executeQuery(`
    UPDATE t_app
    SET name = '${item.name}',
     des = '${item.des}',
     update_time = '${updateTime}'
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
  const res = await executeQuery('SELECT a.id, a.phone, a.des, a.register_time as registerTime, a.update_time as updateTime, a.expiry_time as expiryTime, a.status FROM `t_user` a where status <> 0');
  return res;
};

// 组列表
const groupList = async () => {
  let res = await executeQuery(`  SELECT
	c.id, c.name, c.des, c.order, c.register_time AS registerTime, c.update_time AS updateTime, d.array
FROM
	t_group c
LEFT JOIN (
	SELECT
		a.app_id,
		a.group_id,
		CONCAT(
			'[',
			GROUP_CONCAT(
				'{',
				CONCAT('"name":"', b.name, '"'),
				CONCAT(',"icon":"', b.icon, '"'),
				CONCAT(',"id":"', b.id, '"'),
				'}'
			),
			']'
		) AS array
	FROM
		t_app_group a
	LEFT JOIN t_app b ON a.app_id = b.id
	GROUP BY
		a.group_id
) d ON c.id = d.group_id`);

  // res.array = JSON.parse(res.array);
  res = res.map((item) => {
    if(!item.array) {
      item.array = item.array === null ? '' : item.array;
    } else {
      item.array = JSON.parse(item.array);
    }
    return item;
  });
  return res;
};

// 用户更新
const userUpdate = async (item) => {
  let res = await executeQuery(
    `UPDATE t_user
    SET phone = '${item.phone}', des = '${item.des}', update_time = '${item.updateTime}',  expiry_time = '${item.expiryTime}'
    WHERE
    id = ${item.id}`
  );

  if(res) {
    return {iRet: 0, res};
  } else {
    return {iRet: -1}
  }
};

// 添加用户
const userInsert = async (item) => {
  let registerTime = Math.floor(new Date() / 1000);
  let updateTime = registerTime;
  let res = await executeQuery(
    `INSERT INTO t_user
      VALUES
        (
          NULL,
          '${item.phone}',
          '${item.des}',
          '${registerTime}',
          '${updateTime}',
          '${item.expiryTime}',
          1
        )`
  );
  if(res) {
    return {iRet: 0, res}
  } else {
    return {iRet: -1}
  }
}

//删除用户
const userDeleteSer = async (item) => {
  let res = await executeQuery(
    `UPDATE t_user SET status = 0 WHERE id = ${item.id}`
  );
  if(res) {
    return {iRet: 0}
  } else {
    return {iRet: -1}
  }
};

const appOrderSer = async (item) => {
  let temp;
  let res;
  for(let i = 0; i < item.length; i++) {
    temp = await executeQuery(
      `SELECT app_id AS appId FROM t_app_order WHERE app_order = ${item[i]}`
    );
console.log(temp[0].appId + '   ' + i);
    res = await  executeQuery(
      `UPDATE t_app_order SET app_order = ${i + 1} WHERE app_id = ${temp[0].appId}`
    );
  }
  return {iRet: 0}
};

const appInsertSer = async (item) => {
  let registerTime = getCurrentDate();
  let res = executeQuery(
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
  if(res) {
    return { iRet: 0 }
  } else {
    return { iRet: -1 }
  }
};

const imgUpload = async (ctx) => {
  let body = ctx.request.body;
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
    console.log(pics);
   } catch (e) {
    logger.error.error(e);
    return { iRet: -1 };
  }
};

// 获取当前时间，秒
function getCurrentDate() {
  return Math.floor(new Date() / 1000);
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
  imgUpload
}

