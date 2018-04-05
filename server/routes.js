/**
 * Main application routes
 */

'use strict';
const req = require;

module.exports = function (app) {
  app.use('/api/v1/cuisine', req('./controllers/v1/cuisine'));
  app.use('/api/v1/dishes', req('./controllers/v1/dishes'));
  app.use('/api/v1/users', req('./controllers/v1/users'));
	app.use('/api/v1/foodTypes', req('./controllers/v1/foodTypes'));
	app.use('/api/v1/userPreferences', req('./controllers/v1/userPreferences'));
	app.use('/api/v1/restaurant', req('./controllers/v1/restaurant'));
  app.use('/api/v1/userGesture', req('./controllers/v1/userGesture'));
  app.use('/api/v1/snapNShare',req('./controllers/v1/snapNShare'));
  app.use('/api/v1/foodJourney',req('./controllers/v1/foodJourney'));
};
