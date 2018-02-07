'use strict';

const controller = require('./cuisine.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.get('/', auth.isAuthenticatedOrNot(), controller.getCuisineList);

module.exports = router;
