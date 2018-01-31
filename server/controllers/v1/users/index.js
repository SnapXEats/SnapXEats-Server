'use strict';

const controller = require('./users.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');

router.post('/', controller.signUp);
router.post('/address', auth.isAuthenticated(), controller.saveUserAddresses);

module.exports = router;
