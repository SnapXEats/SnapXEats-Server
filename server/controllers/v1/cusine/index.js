'use strict';

const controller = require('./cusine.controller');
const router = require('express').Router();

router.get('/', controller.getCusineList);

module.exports = router;
