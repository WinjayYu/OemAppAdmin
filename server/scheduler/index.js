
const CronJob = require("cron").CronJob;
const logger = require('../common/logger');
const TIME_ZONE = "Asia/Shanghai";
import cache from '../common/cache';

try {
	//每分钟执行一次
	 let job = new CronJob('* * * * *', async () => {
        logger.data.info('cronjob start');
			try{
				await cache.load();
			} catch (ex){
				logger.error.error("拉取数据出错！",ex);
			}
	 }, null, true, TIME_ZONE, null, true);

} catch (ex) {
	logger.data.error("cron pattern not valid!", ex);
}
