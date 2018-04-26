'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const  requestPromise = require('request-promise');

const unique = require('array-unique');

const key = process.env.googleKey;

const sleep = require('system-sleep');

const type = require('type-of-is');

const _ = require('underscore');

const moment = require('moment');
require('moment-range');

const CONSTANTS = require('./../../../../lib/constants');

db.restaurantInfo.hasMany(db.restaurantDish, {
  foreignKey: 'restaurant_info_id'
});

db.restaurantDish.hasMany(db.restaurantDishLabel, {
  foreignKey: 'restaurant_dish_id'
});

db.restaurantDish.hasOne(db.userReview, {
  foreignKey: 'restaurant_dish_id'
});

db.userSmartPics.belongsTo(db.restaurantDish, {
  foreignKey: 'restaurant_dish_id'
});

/**
 * Get near by places result
 *
 * @param {String} address - url address
 * @param {Array}  googleIds - for push result of google id
 *
 * @returns {Object} googleIds - Array
 *                   pgtoken   - String (Page token for search next page result)
 */
function getPlacesResult(adress, googleIds) {
  return new Promise((resolve, reject) => {
    return requestPromise(adress)
      .then((result) => {
        const results = JSON.parse(result);
        const pgtoken = results.next_page_token;
        let placeCount = 0;

        for (placeCount; placeCount < results.results.length; placeCount++) {
          googleIds.push(results.results[placeCount].id);
        }

        if (placeCount === results.results.length) {
          if (pgtoken) {
            resolve({
              googleIds,
              pgtoken
            });
          } else {
            resolve({
              googleIds
            });
          }
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Get restaurant (Creating Url for search near by restaurants)
 *
 * @param {String} latitude - url address
 * @param {String}  longitude - for push result of google id
 * @param {Number}  distance - for push result of google id
 * @param {Boolean} sort_by_distance - for sorting distance wise
 * @param {Array}  googleIds - for push result of google id
 * @param {String}  pagetoken - for push result of google id
 *
 * @returns {Object} googleIds - Unique google ids array
 *                   pgtoken   - String (Page token for search next page result)
 */
function getRestaurant(latitude, longitude, distance, sort_by_distance, googleIds, pagetoken) {
  return co(function* () {
    let adr;
    let pgtoken;
    let result;
    if (pagetoken) {
      sleep(1500);
      if(sort_by_distance){
        adr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?rankBy=distance&location=${latitude},${longitude}&radius=${distance}&type=restaurant&key=${key}&pagetoken=${pagetoken}`;
        result = yield getPlacesResult(adr, googleIds);
      } else {
        adr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${distance}&type=restaurant&key=${key}&pagetoken=${pagetoken}`;
        result = yield getPlacesResult(adr, googleIds);
      }

    } else {
      if(sort_by_distance){
        adr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?rankBy=distance&location=${latitude},${longitude}&radius=${distance}&type=restaurant&key=${key}`;
        result = yield getPlacesResult(adr, googleIds);
      } else {
        adr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${distance}&type=restaurant&key=${key}`;
        result = yield getPlacesResult(adr, googleIds);
      }

    }
    if (result.pgtoken) {
      pgtoken = result.pgtoken;
    }
    return Promise.resolve({
      googleIds : unique(result.googleIds),
      pgtoken
    });
  }).catch((err) => {
    return err;
  });
}

/**
 * stringifyYesterday (Gives date of yesterday in stringify format)
 *
 * @returns {String} yesterday - date of yesterday
 *
 */
function stringifyYesterday() {
  let today = moment().utc().set({'hour': 0, 'minute': 0,'second' : 0});
  let yesterday = today.subtract(1,'days');
  return yesterday;
}

/**
 * checkDislikeOfDish (Check dislike dish by user and filtered out)
 *
 * @param {Object} restaurantDishesInfo - restaurant dishes information
 * @param {Array}  restaurantDishes - restaurant dishes array
 * @param {String}  userId - user unique id
 *
 * @returns {Object} restaurantDishesInfo - restaurant dishes information object
 *
 */
function checkDislikeOfDish(restaurantDishesInfo, restaurantDishes, userId) {
  return co(function* () {
    let dishCount;
    let date = stringifyYesterday();
    let yesterday = moment(date).format("YYYY-MM-DD");
    let today = moment().format("YYYY-MM-DD");
    let count = 0;
    for(dishCount = 0; dishCount < restaurantDishes.length; dishCount++){
      let userGesturesOnDishByUser = yield db.userGestures.findAll({
        attributes : ['created_at'],
        where : {
          restaurant_dish_id : restaurantDishes[dishCount].restaurant_dish_id,
          user_id : userId
        }
      });
      let countOfCreationDate;
      let flag = 0;
      for(countOfCreationDate = 0; countOfCreationDate < userGesturesOnDishByUser.length ; countOfCreationDate++){
        let dateOfDislike = moment(userGesturesOnDishByUser[countOfCreationDate].created_at).format("YYYY-MM-DD");
        let dateBeforeOneMonth = moment(today).add(-30, 'days').format('YYYY-MM-DD');

        if(dateOfDislike === today || dateOfDislike === yesterday){
          flag = 1;
        }

        if(dateOfDislike <= today && dateOfDislike >= dateBeforeOneMonth){
          count = count + 1;
        }

      }
      if(flag === 0 && count < 5 && countOfCreationDate === userGesturesOnDishByUser.length){
        restaurantDishesInfo.restaurantDishes.push(restaurantDishes[dishCount]);
      }
    }
    if(dishCount === restaurantDishes.length){
      return(restaurantDishesInfo);
    }
  });
}

/**
 * checkUserGesturesOnDishes (Find user gestures data from db)
 *
 * @param {Array} restaurantData - restaurant data as an array
 * @param {String}  userId - user unique id
 *
 * @returns {Array} restaurantDataAfterFilteration - restaurant filtered data
 *
 */
function checkUserGesturesOnDishes(restaurantData, userId){
  return co(function* () {
    if(!userId){
      return restaurantData;
    }
    let restaurantDataAfterFilteration = [];
    let restaurantCount;

    for(restaurantCount = 0; restaurantCount < restaurantData.length; restaurantCount++){
      let restaurantDishesInfo = {
        restaurant_info_id : restaurantData[restaurantCount].restaurant_info_id,
        restaurant_name : restaurantData[restaurantCount].restaurant_name,
        location_lat : restaurantData[restaurantCount].location_lat,
        location_long : restaurantData[restaurantCount].location_long,
        restaurant_price : restaurantData[restaurantCount].restaurant_price,
        restaurant_rating : restaurantData[restaurantCount].restaurant_rating,
        restaurantDishes : []
      };
      let restaurantDishes = restaurantData[restaurantCount].restaurantDishes;
      let restaurantInformation = yield checkDislikeOfDish(restaurantDishesInfo, restaurantDishes, userId);
      restaurantDataAfterFilteration.push(restaurantInformation);
    }
    if(restaurantCount === restaurantData.length){
      return restaurantDataAfterFilteration;
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * findRestaurantData (Find restaurant images and data from db)
 *
 * @param {Array} restaurantArray - google Ids array for search restaurant
 * @param {Array}  cusineArray - user preferences base on cuisine selection
 * @param {Array} foodPreferenceData - user preferences base on food selection
 * @param {Number} restaurant_rating - rating of restaurant
 * @param {Number} restaurant_price - price of restaurant
 *
 * @returns {Object} restaurant_info_id - String (restaurant unique id)
 *                   restaurant_name   - String (Name of restaurant)
 *                   restaurantDishes   - Array (Dishes array)
 */
function findRestaurantData(restaurantArray,restaurant_rating, restaurant_price,
                            foodPreferenceData, cusineArray) {
  return co(function* () {
    let restaurantCount = 0;
    const responseArray = [];
    let whereClause = {};
    let whereClauseForRating, whereClauseForPrice;
    const findFoodLabelArray = [];
    if (cusineArray && cusineArray.length > 0) {
      for (let cuisineCount = 0; cuisineCount < cusineArray.length; cuisineCount++) {
        let cuisineInfoId = cusineArray[cuisineCount];
        let foodLabel = yield db.cuisineInfo.find({
          where: {
            cuisine_info_id: cuisineInfoId
          }
        });

        const labelJson = {
          dish_label: {
            $like : `%${foodLabel.cuisine_name}%`
          }
        };
        findFoodLabelArray.push(labelJson);
      }
    }

    if (foodPreferenceData && foodPreferenceData.length > 0) {
      for (let foodCount = 0; foodCount < foodPreferenceData.length; foodCount++) {
        let foodId = foodPreferenceData[foodCount];
        let foodLabel = yield db.foodTypeInfo.find({
          where: {
            food_type_info_id: foodId
          }
        });
        const labelJson = {
          dish_label: {
            $like : `%${foodLabel.food_name}%`
          }
        };
        findFoodLabelArray.push(labelJson);
      }
      whereClause = {
        $or: findFoodLabelArray
      };
    } else {
      whereClause = {
        $or: findFoodLabelArray
      };
    }

    if (restaurant_rating > 3){
      whereClauseForRating = {
        $lte: parseFloat(restaurant_rating) + 0.5,
        $gte: parseFloat(restaurant_rating) - 0.5
      };
    } else {
      whereClauseForRating = {
        $gte: 0,
        $lte: 5.0
      };
    }

    if(restaurant_price > 0){
      whereClauseForPrice = {
        $gte: parseFloat(restaurant_price) - 1,
        $lte: parseFloat(restaurant_price) + 1
      };
    } else {
      whereClauseForPrice = {
        $gte: 0,
        $lte: 5.0
      }
    }

    for (restaurantCount; restaurantCount < restaurantArray.length; restaurantCount++) {
      const result = yield db.restaurantInfo.find({
        where : {
          restaurant_google_id : restaurantArray[restaurantCount],
          restaurant_rating : whereClauseForRating,
          restaurant_price : whereClauseForPrice
        },
        include : [{
          model : db.restaurantDish,
          attributes : ['restaurant_dish_id', 'dish_image_url'],
          include : [{
            model : db.restaurantDishLabel,
            attributes : ['dish_label'],
            where : whereClause
          }]
        }]
      });
      if (result) {
        responseArray.push({
          restaurant_info_id : result.restaurant_info_id,
          restaurant_name : result.restaurant_name,
          location_lat : result.location_lat,
          location_long : result.location_long,
          restaurant_price : result.restaurant_price,
          restaurant_rating : result.restaurant_rating,
          restaurantDishes : result.restaurantDishes
        });
      }
    }
    return Promise.resolve(responseArray);
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   dishLabelInfo:
 *     type: object
 *     required:
 *       - dish_label
 *     properties:
 *       dish_label:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   dishInfo:
 *     type: object
 *     required:
 *       - restaurant_dish_id
 *       - dish_image_url
 *     properties:
 *       restaurant_dish_id:
 *         type: string
 *       dish_image_url:
 *         type: string
 *       restaurantDishLabels:
 *         type: array
 *         items:
 *           $ref: "#/definitions/dishLabelInfo"
 */

/**
 * @swagger
 * definition:
 *   restaurantInfo:
 *     type: object
 *     required:
 *       - restaurant_info_id
 *       - restaurant_name
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       location_lat:
 *         type: number
 *         format : double
 *       location_long:
 *         type: number
 *         format : double
 *       restaurant_price:
 *         type: integer
 *       restaurantDishes:
 *         type: array
 *         items:
 *           $ref: "#/definitions/dishInfo"
 */

/**
 * @swagger
 * definition:
 *   dishesInfo:
 *     type: object
 *     properties:
 *       dishesInfo:
 *         type: array
 *         items:
 *           $ref: "#/definitions/restaurantInfo"
 */

/**
 * @swagger
 * /api/v1/dishes:
 *   get:
 *     summary: List all dishes on base of user preferences
 *     description: List all dishes as an JSON array
 *     parameters:
 *      - in: header
 *        name: Authorization
 *        description: an authorization header (Bearer eyJhbGciOiJI...)
 *        type: string
 *      - in: query
 *        name: latitude
 *        schema:
 *          type: number
 *        description: user's latitude of current location
 *      - in: query
 *        name: longitude
 *        schema:
 *          type: number
 *        description: user's longitude of current location
 *      - in: query
 *        name: restaurant_distance
 *        schema:
 *          type: integer
 *        description: user's distance preferences
 *      - in: query
 *        name: restaurant_price
 *        schema:
 *          type: integer
 *        description: user's price preferences
 *      - in: query
 *        name: restaurant_rating
 *        schema:
 *          type: integer
 *        description: user's rating preferences
 *      - in: query
 *        name: sort_by_rating
 *        schema:
 *          type: integer
 *      - in: query
 *        name: sort_by_distance
 *        schema:
 *          type: integer
 *        description: user's preferences on rating
 *      - in: query
 *        name: cuisineArray
 *        schema:
 *          type: string
 *        description: user's cuisine preferences
 *      - in: query
 *        name: cuisineArray
 *        schema:
 *          type: string
 *        description: user's cuisine preferences
 *      - in: query
 *        name: foodArray
 *        schema:
 *          type: string
 *        description: user's food preferences
 *      - in: query
 *        name: foodArray
 *        schema:
 *          type: string
 *        description: user's food preferences
 *     tags:
 *       - Dishes
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/dishesInfo"
 */
exports.getDishes = function (req, res) {
  return co(function* () {
    const googleIds = [];
    let cuisineArray = [];
    let foodPreferenceData = [];
    let distance = 1610;
    let restaurant_rating, restaurant_price, sort_by_distance;
    let sort_by_rating = 0;
    let userId;
    if(req.decodedData) {
      userId = req.decodedData.user_id;
      let resolvedPromises = yield Promise.all([
        db.userPreferences.find({
        where : {
          user_id : userId
        },
        attributes : ['restaurant_rating', 'restaurant_price', 'restaurant_distance',
          'sort_by_distance', 'sort_by_rating']
        }),
        db.userFoodPreferences.findAll({
          where : {
            user_id : userId
          },
          attributes : ['food_type_info_id', 'is_food_like', 'is_food_favourite']
        })
      ]);

      let preferenceData = resolvedPromises[0];
      let userFoodPreferenceData = resolvedPromises[1];

      if(preferenceData && preferenceData.restaurant_distance){
        distance = preferenceData.restaurant_distance * 1610;
      }

      if(preferenceData && preferenceData.restaurant_rating){
        restaurant_rating = preferenceData.restaurant_rating;
      }

      if(preferenceData && preferenceData.restaurant_price){
        restaurant_price = preferenceData.restaurant_price;
      }

      if(preferenceData && preferenceData.sort_by_distance){
        sort_by_distance = preferenceData.sort_by_distance;
      }

      if(preferenceData && preferenceData.sort_by_rating){
        sort_by_rating = preferenceData.sort_by_rating;
      }

      if(userFoodPreferenceData && userFoodPreferenceData.length > 0){
        userFoodPreferenceData.forEach((foodObject) => {
          foodPreferenceData.push(foodObject.food_type_info_id);
        });
      }

    } else if(!req.decodedData){
      if(req.query.restaurant_distance){
        distance = req.query.restaurant_distance * 1610;
      }

      if(req.query.restaurant_rating){
        restaurant_rating = req.query.restaurant_rating;
      }

      if(req.query.restaurant_price){
        restaurant_price = req.query.restaurant_price;
      }

      if(req.query.sort_by_distance){
        sort_by_distance = req.query.sort_by_distance;
      }

      if(req.query.sort_by_rating){
        sort_by_rating = req.query.sort_by_rating;
      }
      if (type(req.query.foodArray, String)) {
        foodPreferenceData.push(req.query.foodArray);
      } else {
        foodPreferenceData = req.query.foodArray;
      }
    }

    if (type(req.query.cuisineArray, String)) {
      cuisineArray.push(req.query.cuisineArray);
    } else {
      cuisineArray = req.query.cuisineArray;
    }

    let data = yield getRestaurant(req.query.latitude, req.query.longitude, distance,
      sort_by_distance, googleIds);
    if (data.pgtoken) {
      data = yield getRestaurant(req.query.latitude, req.query.longitude,
        distance, sort_by_distance, data.googleIds, data.pgtoken);
    }

    if (data.pgtoken) {
      data = yield getRestaurant(req.query.latitude, req.query.longitude,
        distance, sort_by_distance, data.googleIds, data.pgtoken);
    }
    let restaurantData =  yield findRestaurantData(data.googleIds, restaurant_rating, restaurant_price,
      foodPreferenceData, cuisineArray);
    if(!sort_by_rating){
      restaurantData = yield checkUserGesturesOnDishes(restaurantData, userId);
    } else {
      let restaurantSortedData = _.sortBy(restaurantData, function(foodObject) {
        return foodObject.restaurant_rating;
      });
      restaurantData = yield checkUserGesturesOnDishes(restaurantSortedData.reverse(), userId);
    }
    return restaurantData;
  }).then((data) => {
    res.status(200)
      .json({ dishesInfo : data });
  }).catch((err) => {
    res.status(400).json(err);
  });
};

/**
 * @swagger
 * definition:
 *   dishDetails:
 *     type: object
 *     properties:
 *       restaurant_dish_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       restaurant_address:
 *         type: string
 *       dish_image_url:
 *         type: string
 *       pic_taken_date:
 *         type: string
 *       audio_review_url:
 *         type: string
 *       text_review:
 *         type: string
 *       restaurant_amenities:
 *          type: array
 *          items:
 *            type: string
 */

/**
 * @swagger
 * /api/v1/dishes/{restaurant_dish_id}:
 *   get:
 *     summary: Get information of smart photo
 *     description: Get information of smart photo as an JSON Object
 *     tags:
 *       - Dishes
 *     parameters:
 *      - in: path
 *        name: restaurant_dish_id
 *        schema:
 *          type: string
 *        description: restaurant's dish ID for download smart photo
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/dishDetails"
 */
exports.getSmartPic = function (req, res) {
  return co(function* () {
    const restaurant_dish_id = req.params.restaurant_dish_id;
    let amenityCount, restaurantAmenities = [];
    let dishInformation = yield db.restaurantDish.find({
      where : {
        restaurant_dish_id : restaurant_dish_id
      },
      attributes : ['restaurant_dish_id', 'restaurant_info_id', 'dish_image_url', 'created_at'],
      include : [{
        model : db.userReview,
        attributes : ['audio_review_url', 'text_review']
      },{
        model : db.restaurantInfo,
        attributes: ['restaurant_name', 'restaurant_address'],
        include: [{
          model : db.restaurantAminities,
          attributes : ['aminity_name']
        }]
      }]
    });

    let amenities = dishInformation.restaurantInfo.restaurantAminities;

    for(amenityCount = 0 ; amenityCount < amenities.length; amenityCount++){
      restaurantAmenities.push(
        amenities[amenityCount].aminity_name.capitalize()
      );
    }

    return ({
      restaurant_dish_id: dishInformation.restaurant_dish_id,
      restaurant_name : dishInformation.restaurantInfo.restaurant_name,
      restaurant_address : dishInformation.restaurantInfo.restaurant_address,
      restaurant_aminities : restaurantAmenities,
      dish_image_url : dishInformation.dish_image_url,
      pic_taken_date : dishInformation.created_at,
      audio_review_url : dishInformation.userReview.audio_review_url || '',
      text_review : dishInformation.userReview.text_review || ''
    });
  }).then((data) => {
    res.status(200)
      .json(data);
  }).catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
};

/**
 * @swagger
 * paths:
 *  /api/v1/dishes/:
 *    post:
 *      summary: insert user downloaded smart picture.
 *      tags:
 *        - Dishes
 *      description: insert user downloaded smart picture as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: body
 *          name: user dish
 *          description: insert user downloaded smart picture.
 *          schema:
 *            type: object
 *            properties:
 *              restaurant_dish_id:
 *                type: string
 *                required : true
 *      responses:
 *        200:
 *          description: "successful operation"
 *          schema:
 *            type: object
 *            properties:
 *              message:
 *                type: string
 *              user_smart_pic_id:
 *                type: string
 */
exports.restaurantDishOfUser = function (req, res) {
  return co(function* () {
    let restaurant_dish_id = req.body.restaurant_dish_id;
    let user_id = req.decodedData.user_id;
    let userSmartPhoto = yield db.userSmartPics.create({
      user_id : user_id,
      restaurant_dish_id : restaurant_dish_id
    });

    return ({
      'message' : 'User downloaded smart picture successfully saved.',
      user_smart_pic_id : userSmartPhoto.user_smart_pic_id
      });
  }).then((data) => {
    res.status(200)
      .json(data);
  }).catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
};

function getUsersSmartPhoto(user_id){
  return co(function* () {
    let smartPicCount;
    let userSmartPhotos = [];
    let userAllSmartPhotos = yield db.userSmartPics.findAll({
      where : {
        user_id : user_id
      },
      attributes : ['restaurant_dish_id', 'created_at'],
      order: [
        ['created_at', 'DESC']
      ],
      include : [{
        model : db.restaurantDish,
        attributes : ['dish_image_url','restaurant_info_id'],
        include : [{
          model : db.restaurantInfo,
          attributes : ['restaurant_name']
        }]
      }]
    });
    for(smartPicCount = 0; smartPicCount < userAllSmartPhotos.length; smartPicCount++){
      let smartPicsInfo = {
        restaurant_dish_id : userAllSmartPhotos[smartPicCount].restaurant_dish_id,
        dish_image_url : userAllSmartPhotos[smartPicCount].restaurantDish.dish_image_url,
        restaurant_name : userAllSmartPhotos[smartPicCount].restaurantDish.restaurantInfo.restaurant_name
      };
      userSmartPhotos.push(smartPicsInfo);
    }
    if(smartPicCount === userAllSmartPhotos.length){
      return userSmartPhotos;
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   smartPhotoInfo:
 *     type: object
 *     properties:
 *       restaurant_dish_id:
 *         type: string
 *       dish_image_url:
 *         type: string
 *       restaurant_name:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   user_smart_photo:
 *     type: object
 *     properties:
 *       usersSmartPhotos:
 *         type: array
 *         items:
 *           $ref: "#/definitions/smartPhotoInfo"
 */

/**
 * @swagger
 * paths:
 *  /api/v1/dishes/user/smartPhotos:
 *    get:
 *      summary: Get user's all downloaded smart photos.
 *      tags:
 *        - Dishes
 *      description: Get user's all downloaded smart photos as a JSON array
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
 *            "$ref": "#/definitions/user_smart_photo"
 */
exports.getDishesOfUser = function (req, res) {
  return co(function* () {
    let user_id = req.decodedData.user_id;
    let usersSmartPhotos = yield getUsersSmartPhoto(user_id);

    return ({
      usersSmartPhotos
    });
  }).then((data) => {
    res.status(200)
      .json(data);
  }).catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
};
