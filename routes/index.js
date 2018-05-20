const express = require('express');
const bodyParser = require('body-parser');

const createShopifyAuthRoutes = require('./redhioAuth');
const shopifyApiProxy = require('./redhioApiProxy');

module.exports = function createRouter(redhioConfig) {
  const router = express.Router();
  const rawParser = bodyParser.raw({ type: '*/*' });
  const {auth, callback} = createRedhioAuthRoutes(redhioConfig)

  router.use('/auth/callback', callback);
  router.use('/auth', auth);
  router.use(
    '/api',
    rawParser,
    verifyApiCall,
    redhioApiProxy,
  );

  return router;
};

function verifyApiCall(request, response, next) {
  const {session} = request;

  if (session && session.accessToken) {
    next();
    return;
  }

  response.status(401).send();
  return;
}
