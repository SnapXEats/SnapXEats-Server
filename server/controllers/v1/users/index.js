'use strict';

const controller = require('./users.controller');
const router = require('express').Router();

router.post('/', controller.signUp);

module.exports = router;
