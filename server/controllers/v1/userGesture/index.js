'use strict';

const controller = require('./userGesture.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/dislike', auth.isAuthenticated(), controller.dislikePictureByUser);

module.exports = router;
