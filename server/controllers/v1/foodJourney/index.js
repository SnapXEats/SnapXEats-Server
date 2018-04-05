'use strict';

const controller = require('./foodJourney.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.get('/', auth.isAuthenticated(), controller.getFoodJourney);

module.exports = router;
