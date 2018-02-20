'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const CONSTANTS = require('./../../../../lib/constants');


db.restaurantDish.belongsTo(db.restaurantInfo, {
  foreignKey: 'restaurant_info_id'
});

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

function findDislikeDishesPics(user_id) {
  return co(function* () {
    let findDislikePictures = yield db.userGestures.findAll({
      where : {
        user_id : user_id,
        gesture_type : CONSTANTS.USER_GESTURE.DISLIKE_BY_USER,
        status : CONSTANTS.DB.STATUS.ACTIVE
      },
      attributes : ['user_gesture_id', 'restaurant_dish_id'],
      order: 'created_at DESC'
    });

    return Promise.resolve(findDislikePictures);
  }).catch((err) => {
    return err;
  });
}

function findDishInformation(restaurant_dish_id) {
  return co(function* () {
    let findDishInfo = yield db.restaurantDish.find({
      attributes : ['restaurant_dish_id', 'dish_image_url','restaurant_info_id'],
      where : {
        restaurant_dish_id : restaurant_dish_id
      },
      include : [{
        model : db.restaurantInfo,
        attributes : ['restaurant_name', 'location_lat', 'location_long', 'restaurant_price']
      }]
    });
    return Promise.resolve(findDishInfo);
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   dislikeDishInfo:
 *     type: object
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       location_lat:
 *         type: number
 *       location_long:
 *         type: number
 *       restaurant_price:
 *         type: number
 *       restaurantDish:
 *         type: object
 *         properties:
 *           restaurant_dish_id:
 *             type: string
 *           dish_image_url:
 *             type: string
 */

/**
 * @swagger
 * /api/v1/userGesture/undo:
 *   get:
 *     summary: Get dish information which is last dislike by user
 *     description: Get dish information as an JSON Object
 *     tags:
 *       - User Gestures
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: an authorization header (Bearer eyJhbGciOiJI...)
 *         type: string
 *         required : true
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/dislikeDishInfo"
 */

exports.undoDislikePictureByUser = function (req, res) {
  return co(function* () {
    let user_id = req.decodedData.user_id;
    let findDislikePictures = yield findDislikeDishesPics(user_id);

    if(findDislikePictures.length > 1){
      let restaurantDishInfo = yield findDishInformation(findDislikePictures[0].restaurant_dish_id);

      yield findDislikePictures[0].updateAttributes({
        status : CONSTANTS.DB.STATUS.DELETE
      });
      return ({
        restaurant_info_id : restaurantDishInfo.restaurant_info_id,
        restaurant_name : restaurantDishInfo.restaurantInfo.restaurant_name,
        location_lat : restaurantDishInfo.restaurantInfo.location_lat,
        location_long : restaurantDishInfo.restaurantInfo.location_long,
        restaurant_price : restaurantDishInfo.restaurantInfo.restaurant_price,
        restaurantDish : {
          restaurant_dish_id : restaurantDishInfo.restaurant_dish_id,
          dish_image_url : restaurantDishInfo.dish_image_url
        }
      });
    } else {
      return ({
        message : 'There is nothing to undo'
      })
    }

  }).then((userUnlikePicture) => {
    res.status(200)
      .json(userUnlikePicture);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
