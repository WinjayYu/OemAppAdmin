import koaRouter from 'koa-router';
import authCtrl from '../controllers/user';
import tableCtrl from '../controllers/table';
import appCtrl from '../controllers/app'

const router = koaRouter();

router
  .post('/user/login', authCtrl.postLogin)
  .get('/user/logout', authCtrl.postLogout)
  .get('/user', authCtrl.getUserInfo)

  .get('/table/list', tableCtrl.getList)
  .get('/appList', appCtrl.appList)
  .get('/user/userList', appCtrl.userList)
  .get('/groupList', appCtrl.groupList)

router.post('/user/userUpdate', appCtrl.userUpdate)
router.post('/user/userInsert', appCtrl.userInsert)

export default router;
