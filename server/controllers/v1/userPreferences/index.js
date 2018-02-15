'use strict';

const controller = require('./userPreferences.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/', auth.isAuthenticated(), controller.setUserPreferences);
router.get('/', auth.isAuthenticated(), controller.getUserPreferences);
router.put('/', auth.isAuthenticated(), controller.editUserPreferences);

module.exports = router;
