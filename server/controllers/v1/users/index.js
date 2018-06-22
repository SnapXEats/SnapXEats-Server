'use strict';

const controller = require('./users.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/', controller.signUp);
router.post('/address', auth.isAuthenticated(), controller.saveUserAddresses);
router.get('/address/:userId', auth.isAuthenticated(), controller.getUserAddresses);
router.get('/logout', auth.isAuthenticated(), controller.loggedOutUser);
router.get('/rewards', auth.isAuthenticated(), controller.getRewardPoint);

module.exports = router;
