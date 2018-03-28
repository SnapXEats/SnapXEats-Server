'use strict';

const controller = require('./restaurant.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.get('/:restaurantInfoId', controller.getRestaurantInforamtion);
router.get('/restaurantDetails/:restaurantInfoId', controller.getRestaurantDetails);
router.post('/checkIn', auth.isAuthenticated(), controller.userCheckIn);
router.get('/checkIn/getRestaurants', auth.isAuthenticated(), controller.getRestaurantForCheckIn);

module.exports = router;
