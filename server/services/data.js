const mysql = require('mysql2/promise');
const config = global.config;
const logger = require('../common/logger');
const _ = require('lodash');
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

const appList = async () => {
  const res = await executeQuery('SELECT a.*, g.name FROM `t_app` a JOIN `t_group` g ON a.id = g.id');
  return res;
};

const userList = async () => {
  const res = await executeQuery('SELECT a.id, a.phone, a.des, a.register_time as registerTime, a.update_time as updateTime, a.expiry_time as expiryTime FROM `t_user` a WHERE expiry_time > CURDATE()');
  return res;
};

const groupList = async () => {
  let res = await executeQuery(`  SELECT
	c.*, d.array
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
  let sql =  `INSERT INTO t_user
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
  console.log('sql',sql)
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
  )
  if(res) {
    return {iRet: 0, res}
  } else {
    return {iRet: -1}
  }
}

export default {
  appList,
  userList,
  groupList,
  userUpdate,
  userInsert
}

