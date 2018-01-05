
const CronJob = require("cron").CronJob;
const logger = require('../common/logger');
const TIME_ZONE = "Asia/Shanghai";
const dataCon = require('../controllers/app');


try {
	//每分钟执行一次
  dataCon.default.allData();
	 let job = new CronJob('* * * * *', async () => {
        logger.data.info('cronjob start');
			try{
				await dataCon.default.allData();
			} catch (ex){
				logger.error.error("拉取数据出错！",ex);
			}
	 }, null, true, TIME_ZONE);

} catch (ex) {
	logger.data.error("cron pattern not valid!", ex);
}

