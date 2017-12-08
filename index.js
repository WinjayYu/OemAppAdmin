const logger = require('./server/common/logger');
const ConfigHelper = require('@taf/taf-config-helper').Helper;
const path = require('path');

require('babel-core/register')({
  presets: [
    ['env', {
      targets: {
        node: true
      }
    }]
  ],
  ignore: /node_modules\/(?!koa-*)/,
});
// require('./server/app.js');

let fileName = 'OemAppAdmin.conf';

const start = function() {
  ConfigHelper.getConfig({
    fileName: fileName,
    path: path.resolve(__dirname, "./" + fileName)
  }).then(function (conf) {
    if(conf.iRet === ConfigHelper.E_RET.OK) {
      // 成功获取配置文件
      try {
        global.config = JSON.parse(conf.data);
        console.log(global.config)
        require('./server/app.js');
      } catch (e) {
        logger.exception.error('Fail to parse config: ', e);
      }
    } else {
      logger.error.error(conf);
    }
  })
};

start();
