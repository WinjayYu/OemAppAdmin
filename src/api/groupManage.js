/**
 * Created by winjayyu on 2017/12/14.
 */

import yFetch from '@/utils/yFetch';

const groupList = () => {
  return yFetch('/group/groupList', 'GET');
};

export {
  groupList
}
