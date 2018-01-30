'use strict';

const controller = require('./userPreferences.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/', auth.isAuthenticated(), controller.setUserPreferences);

module.exports = router;
