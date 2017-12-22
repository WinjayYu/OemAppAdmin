import yFetch from '@/utils/yFetch';

const getGroupList = () => {
  return yFetch('/group/groupList', 'GET');
};

export {
  getGroupList
}
