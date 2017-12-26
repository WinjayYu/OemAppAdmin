/**
 * Created by winjayyu on 2017/12/14.
 */

import yFetch from '@/utils/yFetch';

const groupList = () => {
  return yFetch('/group/groupList', 'GET');
};

const groupUpdate = (data) => {
  return yFetch('/group/groupUpdate', 'POST', data);
};

const groupInsert = (data) => {
  return yFetch('/group/groupInsert', 'POST', data);
}

export {
  groupList,
  groupUpdate,
  groupInsert
}
