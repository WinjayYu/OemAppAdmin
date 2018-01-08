/**
 * Created by winjayyu on 2018/1/8.
 */
let cache = {};

let set = function (option) {
  switch (option.key) {
    case "user":
      cache.user = option.data;
      break;
    case "group":
      cache.group = option.data;
      break;
    default:
      new Error('cache error');
  }
};

let get = function () {
  return cache;
};

export default {
  set,
  get
}
