'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const requestPromise = require('request-promise');

const _ = require('underscore');

const CONSTANTS = require('./../../../../lib/constants');

const key = process.env.googleKey;

db.restaurantInfo.hasMany(db.restaurantTiming, {
	foreignKey: 'restaurant_info_id'
});

db.restaurantInfo.hasMany(db.restaurantAminities, {
  foreignKey: 'restaurant_info_id'
});
/**
 * Get near by places result
 *
 * @param {String} address - url address
 *
 * @returns {Object} googleIds - Array
 *                   pgtoken   - String (Page token for search next page result)
 */
function getPlaceInformation(address) {
	return new Promise((resolve, reject) => {
		return requestPromise(address)
			.then((result) => {
				const placeResult = JSON.parse(result);
				let placeInfoJSON;
				if (placeResult.result && placeResult.result.opening_hours) {
					placeInfoJSON = {
						isOpenNow : placeResult.result.opening_hours.open_now
					};
				}
				resolve(placeInfoJSON);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

/**
 * Get Restaurant details from DB
 *
 * @param {String} restaurantInfoId - unique id of restaurant
 *
 * @returns {Object} restaurant Information
 *
 */
function getRestaurantDetails(restaurantInfoId) {
	return new Promise((resolve, reject) => {
		db.restaurantInfo.find({
			attributes: ['restaurant_info_id', 'restaurant_place_id', 'restaurant_name',
				'location_lat', 'location_long', 'restaurant_address',
				'restaurant_price', 'restaurant_rating', 'restaurant_contact_no'],
			where: {
				restaurant_info_id: restaurantInfoId
			},
			include: [{
				model : db.restaurantAminities,
				attributes : ['aminity_name']
			},{
				model: db.restaurantTiming,
				attributes: ['restaurant_open_close_time', 'day_of_week']
			}, {
				model: db.restaurantDish,
				attributes: ['dish_image_url', 'created_at'],
				include : [{
					attributes : ['dish_label'],
					model : db.restaurantDishLabel,
					where : {
            dish_label: {
              $ne: 'place'
            }
					}
				}]
			}]
		}).then((restaurantInfo) => {
			resolve(restaurantInfo);
		}).catch((err) => {
			reject(err);
		});
	});
}

/**
 * Find Restaurant pics from DB
 *
 * @param {String} restaurantInfoId - unique id of restaurant
 *
 * @returns {Object} restaurant Pics
 *
 */
function findRestaurantPics(restaurantInfoId) {
  return new Promise((resolve, reject) => {
    db.restaurantDish.findAll({
			where : {
        restaurant_info_id : restaurantInfoId
			},
      attributes: ['dish_image_url','created_at'],
      order : [
        [db.restaurantDishLabel,'dish_label', 'ASC']
      ],
        include : [{
          attributes : ['dish_label'],
          model : db.restaurantDishLabel
        }]
    }).then((restaurantPics) => {
      resolve(restaurantPics);
    }).catch((err) => {
      reject(err);
    });
  });
}
/**
 * @swagger
 * definition:
 *   restaurant_timing:
 *     type: object
 *     properties:
 *       restaurant_open_close_time:
 *         type: string
 *       day_of_week:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   restaurant_dishes:
 *     type: object
 *     properties:
 *       dish_image_url:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   restaurant_dishes_info:
 *     type: object
 *     properties:
 *       dish_image_url:
 *         type: string
 *       created_date:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   restaurantDetails:
 *     type: object
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       location_lat:
 *         type: string
 *       location_long:
 *         type: string
 *       restaurant_contact_no:
 *         type: string
 *       restaurant_address:
 *         type: string
 *       isOpenNow:
 *         type: boolean
 *       restaurant_timings:
 *         type: array
 *         items:
 *           $ref: '#/definitions/restaurant_timing'
 *       restaurant_speciality:
 *          type: array
 *          items:
 *            $ref: '#/definitions/restaurant_dishes'
 *       restaurant_pics:
 *          type: array
 *          items:
 *            $ref: '#/definitions/restaurant_dishes_info'
 *       restaurant_amenities:
 *          type: array
 *          items:
 *            type: string
 */

/**
 * @swagger
 * /api/v1/restaurant/{restaurantInfoId}:
 *   get:
 *     summary: Get information of restaurant
 *     description: Get information of restaurant as an JSON Object
 *     tags:
 *       - Restaurant
 *     parameters:
 *      - in: path
 *        name: restaurantInfoId
 *        schema:
 *          type: string
 *        description: restaurant's unique ID
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/restaurantDetails"
 */
exports.getRestaurantInforamtion = function (req, res) {
	return co(function* () {
		const restaurantInfoId = req.params.restaurantInfoId;
		let restaurantDetails = {};
		let restaurantInformation = yield getRestaurantDetails(restaurantInfoId);
		let foodImageCount, picCount, amenityCount;
		let restaurant_speciality = [], restaurant_pics = [], restaurantAmenities = [];
		for(foodImageCount = 0 ; foodImageCount < restaurantInformation.restaurantDishes.length;
		foodImageCount++){
      restaurant_speciality.push({
        dish_image_url : restaurantInformation.restaurantDishes[foodImageCount].dish_image_url
      });
		}

		let restaurantAllPics = yield findRestaurantPics(restaurantInfoId);

    for(picCount = 0 ; picCount < restaurantAllPics.length; picCount++){
      restaurant_pics.push({
        dish_image_url : restaurantAllPics[picCount].dish_image_url,
        created_date : restaurantAllPics[picCount].created_at
      });
    }

    let amenities = restaurantInformation.restaurantAminities;

    for(amenityCount = 0 ; amenityCount < amenities.length; amenityCount++){
      restaurantAmenities.push(
        amenities[amenityCount].aminity_name
      );
    }

		let address_url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
			restaurantInformation.restaurant_place_id + '&key=' + key;

		restaurantDetails.restaurant_info_id = restaurantInformation.restaurant_info_id;
		restaurantDetails.restaurant_name = restaurantInformation.restaurant_name;
		restaurantDetails.location_lat = restaurantInformation.location_lat;
		restaurantDetails.location_long = restaurantInformation.location_long;
		restaurantDetails.restaurant_contact_no = restaurantInformation.restaurant_contact_no;
		restaurantDetails.restaurant_address = restaurantInformation.restaurant_address;
		restaurantDetails.restaurant_rating = restaurantInformation.restaurant_rating;
		restaurantDetails.restaurant_price = restaurantInformation.restaurant_price;
		restaurantDetails.restaurant_timings = restaurantInformation.restaurantTimings;
		restaurantDetails.restaurant_speciality = restaurant_speciality;
    restaurantDetails.restaurant_amenities = restaurantAmenities;
		restaurantDetails.restaurant_pics = restaurant_pics;

		let isHotelOpen = yield getPlaceInformation(address_url);
		if (isHotelOpen) {
			restaurantDetails.isOpenNow = isHotelOpen.isOpenNow;
		}
		return ({
			restaurantDetails
		});
	}).then((restaurantDetails) => {
		res.status(200)
			.json(restaurantDetails);
	}).catch((err) => {
		res.status(400).json({
			message: err.message
		});
	});
};

/**
 * @swagger
 * definition:
 *   restaurantInformation:
 *     type: object
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       restaurant_address:
 *         type: string
 *       isOpenNow:
 *         type: boolean
 *       restaurant_timings:
 *         type: array
 *         items:
 *           $ref: '#/definitions/restaurant_timing'
 *       restaurant_pics:
 *          type: array
 *          items:
 *            $ref: '#/definitions/restaurant_dishes_info'
 *       restaurant_aminities:
 *          type: array
 *          items:
 *            type: string
 */


/**
 * @swagger
 * /api/v1/restaurant/restaurantDetails/{restaurantInfoId}:
 *   get:
 *     summary: Get Details of restaurant
 *     description: Get Details of restaurant as an JSON Object
 *     tags:
 *       - Restaurant
 *     parameters:
 *      - in: path
 *        name: restaurantInfoId
 *        schema:
 *          type: string
 *        description: restaurant's unique ID
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/restaurantInformation"
 */

exports.getRestaurantDetails = function (req, res) {
  return co(function* () {
    const restaurantInfoId = req.params.restaurantInfoId;
    let restaurantDetails = {};
    let restaurantInformation = yield getRestaurantDetails(restaurantInfoId);
    let picCount, aminityCount;
    let restaurant_pics = [], restaurantAminities = [];

    let restaurantAllPics = yield findRestaurantPics(restaurantInfoId);

    for(picCount = 0 ; picCount < restaurantAllPics.length; picCount++){
      restaurant_pics.push({
        dish_image_url : restaurantAllPics[picCount].dish_image_url,
				created_date : restaurantAllPics[picCount].created_at
      });
    }
    let aminities = restaurantInformation.restaurantAminities;

    for(aminityCount = 0 ; aminityCount < aminities.length; aminityCount++){
      restaurantAminities.push(
      	aminities[aminityCount].aminity_name
        );
    }
    let address_url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
      restaurantInformation.restaurant_place_id + '&key=' + key;

    restaurantDetails.restaurant_info_id = restaurantInformation.restaurant_info_id;
    restaurantDetails.restaurant_name = restaurantInformation.restaurant_name;
    restaurantDetails.restaurant_address = restaurantInformation.restaurant_address;
    restaurantDetails.restaurant_timings = restaurantInformation.restaurantTimings;
    restaurantDetails.restaurant_aminities = restaurantAminities;
    restaurantDetails.restaurant_pics = restaurant_pics;

    let isHotelOpen = yield getPlaceInformation(address_url);
    if (isHotelOpen) {
      restaurantDetails.isOpenNow = isHotelOpen.isOpenNow;
    }
    return ({
      restaurantDetails
    });
  }).then((restaurantDetails) => {
    res.status(200)
      .json(restaurantDetails);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};

/**
 * @swagger
 * paths:
 *  /api/v1/restaurant/checkIn:
 *    post:
 *      summary: Create user check in into the restaurant.
 *      tags:
 *        - Restaurant
 *      description: insert user check in into the restaurant as a JSON object
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
 *          description: User check in into the restaurant.
 *          schema:
 *            type: object
 *            properties:
 *              restaurant_info_id:
 *                type: string
 *              reward_point:
 *                type: integer
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

exports.userCheckIn = function (req, res) {
  return co(function* () {
    let userRewardsData = _.pick(req.body,'restaurant_info_id', 'reward_point');
    userRewardsData.reward_type = CONSTANTS.USER_CHECK_IN.RESTAURANT_CHECK_IN;
    userRewardsData.user_id = req.decodedData.user_id;

    yield db.userRewards.create(userRewardsData);
    return ({
      message: 'User\'s check in into restaurant succesfully'
    });
  }).then((userCheckInMessage) => {
    res.status(200)
      .json(userCheckInMessage);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
