const mysql = require('mysql2/promise');
const config = global.config;
const logger = require('../common/logger')
const pool = mysql.createPool({
  host: config.DB.host,
  user: config.DB.user,
  database: config.DB.database,
  password: config.DB.password
});

async function executeQuery(sql) {
  try {
    const [rows] = await pool.query(sql);
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
  const res = await executeQuery('SELECT * FROM `t_user` WHERE expiry_time > NOW()');
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
				concat('"name":"', b.name, '"'),
				concat(',"icon":"', b.icon, '"'),
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
    item.array = JSON.parse(item.array);
    return item;
  });
  return res;
}

export default {
  appList,
  userList,
  groupList
}

