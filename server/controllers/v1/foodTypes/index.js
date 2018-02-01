'use strict';

const controller = require('./foodTypes.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.get('/', auth.isAuthenticated(), controller.getFoodTypesList);

module.exports = router;
