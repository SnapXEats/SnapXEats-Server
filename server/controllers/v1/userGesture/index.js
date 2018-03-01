'use strict';

const controller = require('./userGesture.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/', auth.isAuthenticated(), controller.insertUserGestures);
router.get('/wishlist', auth.isAuthenticated(), controller.getUserWishList);
router.delete('/wishlist', auth.isAuthenticated(), controller.deleteUserWishList);

module.exports = router;
