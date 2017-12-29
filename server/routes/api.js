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
  .get('/app/appList', appCtrl.appList)
  .get('/user/userList', appCtrl.userList)
  .get('/group/groupList', appCtrl.groupList)


router.post('/user/userUpdate', appCtrl.userUpdate)
router.post('/user/userInsert', appCtrl.userInsert)
router.post('/user/userDelete', appCtrl.userDelete)
router.post('/app/appUpdate', appCtrl.appUpdate)
router.post('/app/appStatus', appCtrl.appStatus)
router.post('/app/appOrder', appCtrl.appOrder)
router.post('/app/appInsert', appCtrl.appInsert)
router.post('/app/imgUpload', appCtrl.imgUpload)
router.post('/group/groupUpdate', appCtrl.groupUpdate)
router.post('/group/groupInsert', appCtrl.groupInsert)
router.post('/group/groupInUser', appCtrl.groupInUser)
router.post('/group/groupOrder', appCtrl.groupOrder)

router.post('/result', appCtrl.result)

export default router;
