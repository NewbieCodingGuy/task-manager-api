const Bull = require("bull");

const redisConfig = require("../config/redis.js");
const emailQueue = new Bull("email", {
  redis: redisConfig,
});

module.exports = emailQueue;
