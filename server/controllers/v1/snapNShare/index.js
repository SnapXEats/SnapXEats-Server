'use strict';

const controller = require('./snapNShare.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');
let multiparty = require('connect-multiparty');
let multipartyMiddleware = multiparty();

router.use(multipartyMiddleware);
router.post('/', auth.isAuthenticated(), controller.fileUploadToS3);

module.exports = router;
