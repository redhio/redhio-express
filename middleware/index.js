const createWithWebhook = require('./webhooks');
const withShop = require('./withShop');

module.exports = function createMiddleware(redhioConfig) {
  const withWebhook = createWithWebhook(redhioConfig);

  return {
    withShop,
    withWebhook,
  };
};
