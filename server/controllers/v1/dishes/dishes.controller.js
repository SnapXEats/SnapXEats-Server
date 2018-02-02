'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const  requestPromise = require('request-promise');

const unique = require('array-unique');

const key = process.env.googleKey;

const sleep = require('system-sleep');

const type = require('type-of-is');

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
 * @param {Array}  googleIds - for push result of google id
 * @param {String}  pagetoken - for push result of google id
 *
 * @returns {Object} googleIds - Unique google ids array
 *                   pgtoken   - String (Page token for search next page result)
 */
function getRestaurant(latitude, longitude, distance, googleIds, pagetoken) {
  return co(function* () {
    let adr;
    let pgtoken;
    let result;
    if (pagetoken) {
      sleep(1000);
      adr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${distance}&type=restaurant&key=${key}&pagetoken=${pagetoken}`;
      result = yield getPlacesResult(adr, googleIds);
    } else {
      adr = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${distance}&type=restaurant&key=${key}`;
      result = yield getPlacesResult(adr, googleIds);
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
 *
 * @returns {Object} restaurant_info_id - String (restaurant unique id)
 *                   restaurant_name   - String (Name of restaurant)
 *                   restaurantDishes   - Array (Dishes array)
 */
function findRestaurantData(restaurantArray, cusineArray) {
  return co(function* () {
    let restaurantCount = 0;
    const responseArray = [];
    let whereClause = {};
    const findFoodLabelArray = [];
    if (cusineArray.length > 0) {
      cusineArray.forEach((cuisine) => {
        const labelJson = {
          dish_label: cuisine
        };
        findFoodLabelArray.push(labelJson);
      });
      whereClause = {
        $or : findFoodLabelArray
      };
    }
    for (restaurantCount; restaurantCount < restaurantArray.length; restaurantCount++) {
      const result = yield db.restaurantInfo.find({
        where : {
          restaurant_google_id : restaurantArray[restaurantCount]
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
 * /api/v1/Dishes:
 *   get:
 *     summary: List all dishes on base of user preferences
 *     description: List all dishes as an JSON array
 *     parameters:
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
 *        name: cuisineArray
 *        schema:
 *          type: string
 *        description: user's cuisine preferences
 *      - in: query
 *        name: cuisineArray
 *        schema:
 *          type: string
 *        description: user's cuisine preferences
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
    const distance = 1610;
    const googleIds = [];
    let cuisineArray = req.query.cuisineArray;
		cuisineArray = cuisineArray.replace(/'/g, '"');
		cuisineArray = JSON.parse(cuisineArray);
    let data = yield getRestaurant(req.query.latitude, req.query.longitude, distance, googleIds);
    if (data.pgtoken) {
      data = yield getRestaurant(req.query.latitude, req.query.longitude,
        distance, data.googleIds, data.pgtoken);
    }
    return yield findRestaurantData(data.googleIds, cuisineArray);
  }).then((data) => {
    res.status(200)
      .json({ dishesInfo : data });
  }).catch((err) => {
    res.status(400).json(err);
  });
};
