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

db.restaurantInfo.hasMany(db.restaurantDish, {
  foreignKey: 'restaurant_info_id'
});

db.restaurantDish.hasMany(db.restaurantDishLabel, {
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
      sleep(1200);
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

    if (cusineArray.length > 0) {
      for (let cuisineCount = 0; cuisineCount < cusineArray.length; cuisineCount++) {
        let cuisineInfoId = cusineArray[cuisineCount];
        let foodLabel = yield db.cuisineInfo.find({
          where: {
            cuisine_info_id: cuisineInfoId
          }
        });
        const labelJson = {
          dish_label: foodLabel.cuisine_name
        };
        findFoodLabelArray.push(labelJson);
      }
      whereClause = {
        $or: findFoodLabelArray
      };
    }

    if (restaurant_rating > 0){
      whereClauseForRating = {
        $gte: parseFloat(restaurant_rating),
        $lte: parseFloat(restaurant_rating) + 0.9
      };
    } else {
      whereClauseForRating = {
        $gte: 0,
        $lte: 5.0
      };
    }

    if(restaurant_price > 0){
      whereClauseForPrice = restaurant_price;
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
exports.getDIshes = function (req, res) {
  return co(function* () {
    const googleIds = [];
    let cuisineArray = [];
    let foodPreferenceData = [];
    let distance = 1610;
    let restaurant_rating, restaurant_price, sort_by_distance;
    let sort_by_rating = 0;
    if(req.decodedData) {
      let userId = req.decodedData.user_id;
      let resolvedPromises = yield Promise.all([
        db.userPreferences.find({
        where : {
          user_id : userId
        },
        attributes : ['restaurant_rating', 'restaurant_price', 'restaurant_distance',
          'sort_by_distance', 'sort_by_rating']
        }),
        db.userFoodPreferences.find({
          where : {
            user_id : userId
          },
          attributes : ['food_type_info_id', 'is_food_like', 'is_food_favourite']
        })
      ]);

      let preferenceData = resolvedPromises[0];
      let userFoodPreferenceData = resolvedPromises[1];

      if(preferenceData.restaurant_distance){
        distance = preferenceData.restaurant_distance * 1610;
      }

      if(preferenceData.restaurant_rating){
        restaurant_rating = preferenceData.restaurant_rating;
      }

      if(preferenceData.restaurant_price){
        restaurant_price = preferenceData.restaurant_price;
      }

      if(preferenceData.sort_by_distance){
        sort_by_distance = preferenceData.sort_by_distance;
      }

      if(preferenceData.sort_by_rating){
        sort_by_rating = preferenceData.sort_by_rating;
      }

      if(userFoodPreferenceData.length > 0){
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
    let restaurantData =  yield findRestaurantData(data.googleIds, restaurant_rating, restaurant_price,
      foodPreferenceData, cuisineArray);
    if(!sort_by_rating){
      return restaurantData;
    } else {
      let restaurantSortedData = _.sortBy(restaurantData, function(foodObject) {
        return foodObject.restaurant_rating;
      });
      return restaurantSortedData.reverse();
    }

  }).then((data) => {
    res.status(200)
      .json({ dishesInfo : data });
  }).catch((err) => {
    res.status(400).json(err);
  });
};
