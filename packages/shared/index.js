// packages/shared/index.js
const { queues, getQueuesHealth } = require('./queues');

module.exports = {
  ...require('./models'),
  queues,
  getQueuesHealth,
  constants: require('./constants'),
};