'use strict';

const controller = require('./userPreferences.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/', auth.isAuthenticated(), controller.setUserPreferences);
router.get('/', auth.isAuthenticated(), controller.getUserPreferences);
router.put('/:userPreferencesId', auth.isAuthenticated(), controller.editUserPreferences);

module.exports = router;
