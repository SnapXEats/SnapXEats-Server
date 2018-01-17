'use strict';

const controller = require('./dishes.controller');
const router = require('express').Router();

router.get('/', controller.getDIshes);

module.exports = router;
