/**
 * Created by winjayyu on 2018/1/8.
 */

import dataService from '../services/data';
const logger = require('../common/logger');

let _groups_of_user = {};
let _group_info = {};

const load = async () => {
  let temp_groups_of_user;
  let temp_group_info;
  try {
    temp_groups_of_user = await dataService.getGroupOfUser();
    temp_group_info = await dataService.getGroupInfo();
  } catch(err) {
    logger.error.error(err);
    return false;
  }
  _groups_of_user = temp_groups_of_user;
  _group_info = temp_group_info;

  return true;
}

/**
 * @param name username
 */
const get = name => {
  let gids = _groups_of_user[name];
  if(gids) {
    return gids.map(v => {
      return _group_info[v];
    })
  }
  return null;
};

export default  {
  load,
  get
}
