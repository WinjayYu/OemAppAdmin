/**
 * Created by winjayyu on 2017/12/11.
 */
import yFetch from '@/utils/yFetch';

const getAppList = () => {
  return yFetch('/app/appList', 'GET');
};

const appUpdate = (data) => {
  return yFetch('/app/appUpdate', 'POST', data);
};

const appStatus = (data) => {
  return yFetch('/app/appStatus', 'POST', data);
};

export {
  getAppList,
  appUpdate,
  appStatus
}
