'use strict';

const controller = require('./foodTypes.controller');
const router = require('express').Router();

router.get('/', controller.getFoodTypesList);

module.exports = router;
