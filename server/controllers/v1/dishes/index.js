'use strict';

const controller = require('./dishes.controller');
const router = require('express').Router();
const auth = require('./../../../../lib/auth');
let deeplink = require('node-deeplink');

router.get('/', auth.isAuthenticatedOrNot(), controller.getDIshes);
router.get('/smartPhoto', deeplink({
  fallback: 'http://www.snapxeats.com/',
  android_package_name: 'com.citylifeapps.cups',
  ios_store_link:
    'https://itunes.apple.com/in/app/imdb-movies-tv/id342792525?mt=8'
}), controller.getSmartPic);
router.post('/', auth.isAuthenticated(), controller.restaurantDishOfUser);
router.get('/user/smartPhotos', auth.isAuthenticated(), controller.getDishesOfUser);

module.exports = router;
