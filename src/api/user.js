import yFetch from '@/utils/yFetch';

const postLogin = (email, password) => {
  return yFetch('/user/login', 'POST', { email, password });
};

const postLogout = () => {
  return yFetch('/user/logout', 'GET', null, { headers: { Accept: 'text/plain' } });
};

const getUserInfo = () => {
  return yFetch('/user', 'GET');
};

const getUserList = () => {
  return yFetch('/user/userList', 'GET');
};

const userUpdate = (data) => {
  return yFetch('/user/userUpdate', 'POST', data);
}

const userInsert = (data) => {
  return yFetch('/user/userInsert', 'POST', data);
}

export {
  postLogin,
  postLogout,
  getUserInfo,
  getUserList,
  userUpdate,
  userInsert
};
