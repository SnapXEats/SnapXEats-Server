'use strict';

const controller = require('./cuisine.controller');
const router = require('express').Router();

router.get('/', controller.getCuisineList);

module.exports = router;
