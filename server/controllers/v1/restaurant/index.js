'use strict';

const controller = require('./restaurant.controller');
const router = require('express').Router();

router.get('/:restaurantInfoId', controller.getRestaurantInforamtion);

module.exports = router;
