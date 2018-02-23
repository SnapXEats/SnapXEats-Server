'use strict';

const controller = require('./dishes.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.get('/', auth.isAuthenticatedOrNot(), controller.getDIshes);

module.exports = router;
