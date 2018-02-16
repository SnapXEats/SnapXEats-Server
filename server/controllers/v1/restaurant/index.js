'use strict';

const controller = require('./restaurant.controller');
const router = require('express').Router();

router.get('/:restaurantInfoId', controller.getRestaurantInforamtion);
router.get('/restaurantDetails/:restaurantInfoId', controller.getRestaurantDetails);

module.exports = router;
