'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const CONSTANTS = require('./../../../../lib/constants');

const _ = require('underscore');

db.restaurantDish.belongsTo(db.restaurantInfo, {
  foreignKey: 'restaurant_info_id'
});

db.userGestures.belongsTo(db.restaurantDish, {
  foreignKey: 'restaurant_dish_id'
});

/**
 * insertLikeDishByUser (Insert dish which is like by user)
 *
 * @param {string} user_id - user unique id
 * @param {array}  like_dish_array - dishes like by user
 *
 * @returns {object} message
 */

function insertLikeDishByUser(user_id, like_dish_array) {
  return co(function* () {
    let like_dish_count;
    for(like_dish_count = 0; like_dish_count < like_dish_array.length; like_dish_count++){
      yield db.userGestures.create({
        user_id : user_id,
        restaurant_dish_id : like_dish_array[like_dish_count].restaurant_dish_id,
        gesture_type : CONSTANTS.USER_GESTURE.LIKE_BY_USER
      });
    }
    if (like_dish_count === like_dish_array.length){
      return Promise.resolve({
        message : 'like dishes by user are inserted successfully'
      });
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * insertDisLikeDishByUser (Insert dish which is dislike by user)
 *
 * @param {string} user_id - user unique id
 * @param {array}  dislike_dish_array - dishes dislike by user
 *
 * @returns {object} message
 */

function insertDisLikeDishByUser(user_id, dislike_dish_array) {
  return co(function* () {
    let dislike_dish_count;
    for(dislike_dish_count = 0; dislike_dish_count < dislike_dish_array.length; dislike_dish_count++){
      yield db.userGestures.create({
        user_id : user_id,
        restaurant_dish_id : dislike_dish_array[dislike_dish_count].restaurant_dish_id,
        gesture_type : CONSTANTS.USER_GESTURE.DISLIKE_BY_USER
      });
    }
    if (dislike_dish_count === dislike_dish_array.length){
      return Promise.resolve({
        message : 'Dislike dishes by user are inserted successfully'
      });
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * insertWishListDishByUser (Insert dish which is user's wishlist)
 *
 * @param {string} user_id - user unique id
 * @param {array}  wishlist_dish_array - dishes wishlist by user
 *
 * @returns {object} message
 */
function insertWishListDishByUser(user_id, wishlist_dish_array) {
  return co(function* () {
    let wishlist_dish_count;
    for(wishlist_dish_count = 0; wishlist_dish_count < wishlist_dish_array.length; wishlist_dish_count++){
      let userWishList = yield db.userGestures.find({
        where : {
          user_id : user_id,
          restaurant_dish_id : wishlist_dish_array[wishlist_dish_count].restaurant_dish_id,
          gesture_type : CONSTANTS.USER_GESTURE.WISHLIST_OF_USER
        }
      });

      if(!userWishList){
        yield db.userGestures.create({
          user_id : user_id,
          restaurant_dish_id : wishlist_dish_array[wishlist_dish_count].restaurant_dish_id,
          gesture_type : CONSTANTS.USER_GESTURE.WISHLIST_OF_USER
        });
      }
    }
    if (wishlist_dish_count === wishlist_dish_array.length){
      return Promise.resolve({
        message : 'Wishlist dishes of user are inserted successfully'
      });
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   gesture:
 *     type: object
 *     required:
 *       - restaurant_dish_id
 *     properties:
 *       restaurant_dish_id:
 *         type: string
 */

/**
 * @swagger
 * paths:
 *  /api/v1/userGesture:
 *    post:
 *      summary: insert user gestures on dish.
 *      tags:
 *        - User Gestures
 *      description: insert user gestures on dish as a JSON object
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
 *            properties:
 *              like_dish_array:
 *                type: array
 *                items:
 *                  $ref: "#/definitions/gesture"
 *              dislike_dish_array:
 *                type: array
 *                items:
 *                  $ref: "#/definitions/gesture"
 *              wishlist_dish_array:
 *                type: array
 *                items:
 *                  $ref: "#/definitions/gesture"
 *      responses:
 *        200:
 *          description: Created
 */

exports.insertUserGestures = function (req, res) {
	return co(function* () {
		let user_id = req.decodedData.user_id;
		let like_dish_array = req.body.like_dish_array;
    let dislike_dish_array = req.body.dislike_dish_array;
    let wishlist_dish_array = req.body.wishlist_dish_array;

    if(like_dish_array && like_dish_array.length > 0){
      yield insertLikeDishByUser(user_id, like_dish_array);
    }

    if(dislike_dish_array && dislike_dish_array.length > 0){
      yield insertDisLikeDishByUser(user_id, dislike_dish_array);
    }

    if(wishlist_dish_array && wishlist_dish_array.length > 0){
      yield insertWishListDishByUser(user_id, wishlist_dish_array);
    }
		return ({
			message: 'User\'s gestures on dish inserted succesfully'
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
 * findUserWishList (Find user wishlist from db)
 *
 * @param {String} user_id - Unique user id for search wishlist
 *
 * @returns {Array} userGestures - Object (user wishlist object)
 *
 */
function findUserWishList(user_id) {
  return co(function* () {
    let userGestures = yield db.userGestures.findAll({
      where : {
        user_id : user_id,
        gesture_type : CONSTANTS.USER_GESTURE.WISHLIST_OF_USER,
        status : CONSTANTS.DB.STATUS.ACTIVE
      },
      attributes : ['user_gesture_id','restaurant_dish_id','created_at'],
      include : [{
        model : db.restaurantDish,
        attributes : ['restaurant_info_id', 'dish_image_url'],
        include : [{
          model : db.restaurantInfo,
          attributes : ['restaurant_name', 'restaurant_address']
        }]
      }]
    });
    return Promise.resolve(userGestures);
  }).catch((err) => {
    return err;
  });
}

/**
 * filterUserWishListArray (Filter user wish list array and make JSON array)
 *
 * @param {Array} userGestures - user wish list Array
 *
 * @returns {Array} user_wishlist - Object (user wishlist object)
 *
 */
function filterUserWishListArray(userGestures) {
  return co(function* () {
    let user_wishlist = [];
    let wishlist_count;
    for(wishlist_count = 0; wishlist_count < userGestures.length; wishlist_count++){
      let wishlist = userGestures[wishlist_count];
      let user_add_array = wishlist.restaurantDish.restaurantInfo.restaurant_address.split(',');
      let restaurant_address = user_add_array[1];
      let wishlist_object = {
        user_gesture_id : wishlist.user_gesture_id,
        restaurant_info_id : wishlist.restaurantDish.restaurant_info_id,
        restaurant_name : wishlist.restaurantDish.restaurantInfo.restaurant_name,
        restaurant_address : restaurant_address.trim(),
        dish_image_url : wishlist.restaurantDish.dish_image_url,
        created_at : wishlist.created_at
      };
      user_wishlist.push(wishlist_object);
    }

    if(wishlist_count === userGestures.length){
      return ({
        user_wishlist
      });
    }
    return Promise.resolve(userGestures);
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   wishListInfo:
 *     type: object
 *     properties:
 *       user_gesture_id:
 *         type: string
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       restaurant_address:
 *         type: string
 *       dish_image_url:
 *         type: string
 *       created_at:
 *          type: string
 */

/**
 * @swagger
 * definition:
 *   user_wishlist:
 *     type: object
 *     properties:
 *       user_wishlist:
 *         type: array
 *         items:
 *           $ref: "#/definitions/wishListInfo"
 */

/**
 * @swagger
 * paths:
 *  /api/v1/userGesture/wishlist:
 *    get:
 *      summary: Get user wish list of dish.
 *      tags:
 *        - User Gestures
 *      description: Get user wish list of dish as a JSON array
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *      produces:
 *       - application/json
 *      responses:
 *        200:
 *          description: "successful operation"
 *          schema:
 *            type: object
 *            "$ref": "#/definitions/user_wishlist"
 */

exports.getUserWishList = function (req, res) {
  return co(function* () {
    let user_id = req.decodedData.user_id;
    let userGestures = yield findUserWishList(user_id);
    return yield filterUserWishListArray(userGestures);

  }).then((userWishList) => {
    res.status(200)
      .json(userWishList);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};

/**
 * deleteUserWishListData (Delete user wish list from db)
 *
 * @param {Array} userGestures - user wish list Array
 *
 * @returns {Object} message - string (success response)
 *
 */
function deleteUserWishListData(userGestures) {
  return co(function* () {
    let wishlist_count;
    for(wishlist_count = 0; wishlist_count < userGestures.length; wishlist_count++){
      let wishlist = userGestures[wishlist_count];
      yield db.userGestures.destroy({
        where : {
          user_gesture_id : wishlist.user_gesture_id
        }
      });
    }

    if(wishlist_count === userGestures.length){
      return ({
        message : "user wishlist deleted successfully"
      });
    }
    return Promise.resolve(userGestures);
  }).catch((err) => {
    return err;
  });
}
/**
 * @swagger
 * definition:
 *   wishList:
 *     type: object
 *     properties:
 *       user_gesture_id:
 *         type: string
 */

/**
 * @swagger
 * paths:
 *  /api/v1/userGesture/wishlist/:
 *    delete:
 *      summary: Delete user wish list of dish.
 *      tags:
 *        - User Gestures
 *      description: delete user wish list of dish as a JSON array
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: body
 *          name: user preferences
 *          description: Set user preferences.
 *          schema:
 *            type: object
 *            properties:
 *              user_wishlist:
 *                type: array
 *                items:
 *                  "$ref": "#/definitions/wishList"
 *      produces:
 *       - application/json
 *      responses:
 *        200:
 *          description: "successful operation"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 */

exports.deleteUserWishList = function (req, res) {
  return co(function* () {
    let userGestures = req.body.user_wishlist;
    if(userGestures && userGestures.length > 0){
      return yield deleteUserWishListData(userGestures);
    } else {
      throw new Error("Some data is missing");
    }

  }).then((deleteUserWishListMsg) => {
    res.status(200)
      .json(deleteUserWishListMsg);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
