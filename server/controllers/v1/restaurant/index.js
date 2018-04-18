'use strict';

const controller = require('./restaurant.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.get('/:restaurantInfoId', controller.getRestaurantInforamtion);
router.post('/checkIn', auth.isAuthenticated(), controller.userCheckIn);
router.get('/checkIn/getRestaurants', controller.getRestaurantForCheckIn);

module.exports = router;
