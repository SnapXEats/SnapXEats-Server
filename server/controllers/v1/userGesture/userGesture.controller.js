'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const CONSTANTS = require('./../../../../lib/constants');

/**
 * @swagger
 * paths:
 *  /api/v1/userGesture/dislike:
 *    post:
 *      summary: set dislike dish by user.
 *      tags:
 *        - User Gestures
 *      description: set dislike dish by user as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: body
 *          name: user gestures
 *          description: Set user gestures(dislike).
 *          schema:
 *            type: object
 *            required:
 *              - restaurant_dish_id
 *            properties:
 *              restaurant_dish_id:
 *                type: string
 *      responses:
 *        201:
 *          description: Created
 */

exports.dislikePictureByUser = function (req, res) {
	return co(function* () {
		let user_id = req.decodedData.user_id;
		let restaurant_dish_id = req.body.restaurant_dish_id;

		let createGesture = yield db.userGestures.create({
      user_id : user_id,
      restaurant_dish_id : restaurant_dish_id,
      gesture_type : CONSTANTS.USER_GESTURE.DISLIKE_BY_USER
		});
		return ({
			message: 'Dish photo dislike by user inserted succesfully',
      user_gesture_id : createGesture.user_gesture_id
		});
	}).then((userGestureMessage) => {
		res.status(200)
			.json(userGestureMessage);
	}).catch((err) => {
		res.status(400).json({
			message: err.message
		});
	});
};

/**
 * @swagger
 * paths:
 *  /api/v1/userGesture/wishList:
 *    post:
 *      summary: Add dish in to user wish list.
 *      tags:
 *        - User Gestures
 *      description: Add wish list in to user as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: body
 *          name: user gestures
 *          description: Set user gestures(wish list).
 *          schema:
 *            type: object
 *            required:
 *              - restaurant_dish_id
 *            properties:
 *              restaurant_dish_id:
 *                type: string
 *      responses:
 *        201:
 *          description: Created
 */

exports.wishListPictureByUser = function (req, res) {
  return co(function* () {
    let user_id = req.decodedData.user_id;
    let restaurant_dish_id = req.body.restaurant_dish_id;

    let createGesture = yield db.userGestures.create({
      user_id : user_id,
      restaurant_dish_id : restaurant_dish_id,
      gesture_type : CONSTANTS.USER_GESTURE.WISHLIST_OF_USER
    });
    return ({
      message: 'Dish photo added in to user wishlist succesfully',
      user_gesture_id : createGesture.user_gesture_id
    });
  }).then((userGestureMessage) => {
    res.status(200)
      .json(userGestureMessage);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};

/**
 * @swagger
 * paths:
 *  /api/v1/userGesture/like:
 *    post:
 *      summary: set like dish by user.
 *      tags:
 *        - User Gestures
 *      description: set like dish by user as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: body
 *          name: user gestures
 *          description: Set user gestures(like).
 *          schema:
 *            type: object
 *            required:
 *              - restaurant_dish_id
 *            properties:
 *              restaurant_dish_id:
 *                type: string
 *      responses:
 *        201:
 *          description: Created
 */

exports.pictureLikeByUser = function (req, res) {
  return co(function* () {
    let user_id = req.decodedData.user_id;
    let restaurant_dish_id = req.body.restaurant_dish_id;

    let createGesture = yield db.userGestures.create({
      user_id : user_id,
      restaurant_dish_id : restaurant_dish_id,
      gesture_type : CONSTANTS.USER_GESTURE.LIKE_BY_USER
    });
    return ({
      message: 'Dish photo liked by user inserted succesfully',
      user_gesture_id : createGesture.user_gesture_id
    });
  }).then((userGestureMessage) => {
    res.status(200)
      .json(userGestureMessage);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
