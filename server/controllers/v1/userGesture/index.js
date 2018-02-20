'use strict';

const controller = require('./userGesture.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/dislike', auth.isAuthenticated(), controller.dislikePictureByUser);
router.post('/wishList', auth.isAuthenticated(), controller.wishListPictureByUser);
router.post('/like', auth.isAuthenticated(), controller.pictureLikeByUser);
router.get('/undo', auth.isAuthenticated(), controller.undoDislikePictureByUser);

module.exports = router;
