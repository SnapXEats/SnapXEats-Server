'use strict';

const controller = require('./userGesture.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/dislike', auth.isAuthenticated(), controller.dislikePictureByUser);
router.post('/wishList', auth.isAuthenticated(), controller.wishListPictureByUser);
router.post('/like', auth.isAuthenticated(), controller.pictureLikeByUser);

module.exports = router;
