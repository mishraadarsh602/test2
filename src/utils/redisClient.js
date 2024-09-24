const { createClient } = require('redis');
const redisClient = createClient ({
    url : "rediss://default:AVaRAAIjcDEyNTFjNzM3ZWU5ZjM0OWY1ODQ5M2IxMTQzMGM5MzZkYnAxMA@allowing-seagull-22161.upstash.io:6379"
  });


module.exports=redisClient;