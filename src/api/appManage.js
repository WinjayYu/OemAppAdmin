/**
 * Created by winjayyu on 2017/12/11.
 */
import yFetch from '@/utils/yFetch';

const getAppList = () => {
  return yFetch('/app/appList', 'GET');
};

export default {
  getAppList
}
