/**
 * Main application routes
 */

'use strict';
const req = require;

module.exports = function (app) {
  app.use('/api/v1/cuisine', req('./controllers/v1/cusine'));
  app.use('/api/v1/dishes', req('./controllers/v1/dishes'));
  app.use('/api/v1/users', req('./controllers/v1/users'));
};
