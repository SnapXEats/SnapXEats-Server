/**
 * Main application routes
 */

'use strict';
const req = require;

module.exports = function (app) {
  app.use('/api/v1/cusine', req('./controllers/v1/cusine'));
  app.use('/api/v1/dishes', req('./controllers/v1/dishes'));
};
