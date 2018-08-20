'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const requestPromise = require('request-promise');

const _ = require('underscore');

const CONSTANTS = require('./../../../../lib/constants');

const key = process.env.googleKey;

const sleep = require('system-sleep');

const unique = require('array-unique');

db.restaurantInfo.hasMany(db.restaurantTiming, {
	foreignKey: 'restaurant_info_id'
});

db.restaurantInfo.hasMany(db.restaurantAminities, {
  foreignKey: 'restaurant_info_id'
});

db.restaurantCuisine.belongsTo(db.cuisineInfo, {
  foreignKey: 'cuisine_info_id'
});

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

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
				attributes: ['restaurant_dish_id', 'dish_image_url', 'created_at'],
				include : [{
					attributes : ['dish_label'],
					model : db.restaurantDishLabel,
					where : {
            dish_label: {
              $like : '%dish%'
            }
					}
				},{
          model : db.userReview,
          attributes : ['audio_review_url', 'text_review']
        }]
			}, {
        model: db.restaurantCuisine,
        attributes: ['cuisine_info_id'],
        include: [{
          model: db.cuisineInfo,
          attributes: ['cuisine_name']
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
      attributes: ['restaurant_dish_id', 'dish_image_url','created_at'],
      order : [
        [db.restaurantDishLabel,'dish_label', 'ASC']
      ],
        include : [{
          attributes : ['dish_label'],
          model : db.restaurantDishLabel,
          where : {
            dish_label: {
              $notLike : '%dish%'
            }
          }
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
 *       restaurant_dish_id:
 *         type: string
 *       dish_image_url:
 *         type: string
 *       text_review:
 *         type: string
 *       audio_review_url:
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
 *       restaurant_type:
 *         type: string
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
		for(foodImageCount = 0 ; foodImageCount < restaurantInformation.restaurantDishes.length &&
    restaurant_speciality.length < 5;
		foodImageCount++){
		  restaurant_speciality.push({
          dish_image_url : restaurantInformation.restaurantDishes[foodImageCount].dish_image_url
        });
		}

    for (foodImageCount = 0; foodImageCount < restaurantInformation.restaurantDishes.length &&
    restaurant_pics.length < 5;
         foodImageCount++) {
      let audio_review_url = null,
        text_review = null;

      if (restaurantInformation.restaurantDishes[foodImageCount].userReview &&
        restaurantInformation.restaurantDishes[foodImageCount].userReview.audio_review_url) {
        audio_review_url = restaurantInformation.restaurantDishes[foodImageCount].userReview.audio_review_url;
      }
      if (restaurantInformation.restaurantDishes[foodImageCount].userReview &&
        restaurantInformation.restaurantDishes[foodImageCount].userReview.text_review) {
        text_review = restaurantInformation.restaurantDishes[foodImageCount].userReview.text_review;
      }

      if (audio_review_url || text_review) {
        restaurant_pics.push({
          restaurant_dish_id : restaurantInformation.restaurantDishes[foodImageCount].restaurant_dish_id,
          dish_image_url: restaurantInformation.restaurantDishes[foodImageCount].dish_image_url,
          audio_review_url: audio_review_url,
          text_review: text_review,
          created_date: restaurantInformation.restaurantDishes[foodImageCount].created_at
        });
      }
    }

    for (foodImageCount = 0; foodImageCount < restaurantInformation.restaurantDishes.length &&
    restaurant_pics.length < 5;
         foodImageCount++) {
      let audio_review_url,
        text_review;

      if (restaurantInformation.restaurantDishes[foodImageCount].userReview &&
        restaurantInformation.restaurantDishes[foodImageCount].userReview.audio_review_url) {
        audio_review_url = restaurantInformation.restaurantDishes[foodImageCount].userReview.audio_review_url;
      }

      if (restaurantInformation.restaurantDishes[foodImageCount].userReview &&
        restaurantInformation.restaurantDishes[foodImageCount].userReview.text_review) {
        text_review = restaurantInformation.restaurantDishes[foodImageCount].userReview.text_review;
      }

      if (restaurant_pics.length < 5 && !audio_review_url && !text_review) {
        restaurant_pics.push({
          restaurant_dish_id : restaurantInformation.restaurantDishes[foodImageCount].restaurant_dish_id,
          dish_image_url: restaurantInformation.restaurantDishes[foodImageCount].dish_image_url,
          audio_review_url: null,
          text_review: null,
          created_date: restaurantInformation.restaurantDishes[foodImageCount].created_at
        });
      }
    }

    let restaurantAllPics = yield findRestaurantPics(restaurantInfoId);

    for (picCount = 0; picCount < restaurantAllPics.length && restaurant_pics.length < 5; picCount++) {
      restaurant_pics.push({
        restaurant_dish_id : restaurantAllPics[picCount].restaurant_dish_id,
        dish_image_url: restaurantAllPics[picCount].dish_image_url,
        created_date: restaurantAllPics[picCount].created_at,
        audio_review_url: null,
        text_review: null
      });
    }
    let amenities = restaurantInformation.restaurantAminities;

    for(amenityCount = 0 ; amenityCount < amenities.length; amenityCount++){
      restaurantAmenities.push(
        amenities[amenityCount].aminity_name.capitalize()
      );
    }

    const restaurantTimings = _.uniq(restaurantInformation.restaurantTimings, function(restaurant){
            return restaurant.day_of_week;
          });
        const restaurant_amenities = _.uniq(restaurantAmenities);
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
		restaurantDetails.restaurant_timings = restaurantTimings;
		restaurantDetails.restaurant_speciality = restaurant_speciality;
    restaurantDetails.restaurant_amenities = restaurant_amenities;
		restaurantDetails.restaurant_pics = restaurant_pics;
		restaurantDetails.restaurant_type = '';

		let isHotelOpen = yield getPlaceInformation(address_url);
		if (isHotelOpen) {
			restaurantDetails.isOpenNow = isHotelOpen.isOpenNow;
		}

    if(restaurantInformation.restaurantCuisine && restaurantInformation.restaurantCuisine.cuisineInfo){
      restaurantDetails.restaurant_type = restaurantInformation.restaurantCuisine.cuisineInfo.cuisine_name
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
 *   dishInformationForShare:
 *     type: object
 *     properties:
 *       restaurant_dish_id:
 *         type: string
 */

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
 *              reward_type:
 *                type: string
 *                example: restaurant_check_in,snap_and_share
 *              restaurantDishes:
 *                type: array
 *                items:
 *                  "$ref": "#/definitions/dishInformationForShare"
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
 *              reward_point:
 *                type: integer
 */

exports.userCheckIn = function (req, res) {
  return co(function* () {
    let userRewardsData = _.pick(req.body,'restaurant_info_id', 'reward_type');
    let restaurantDishes = req.body.restaurantDishes;
    userRewardsData.user_id = req.decodedData.user_id;

    if(userRewardsData.reward_type === CONSTANTS.USER_REWARDS.RESTAURANT_CHECK_IN &&
        userRewardsData.restaurant_info_id){
      userRewardsData.reward_point = CONSTANTS.USER_REWARDS.REWARD_POINT_FOR_CHECK_IN;
      yield db.userRewards.create(userRewardsData);
      return ({
        message: 'User\'s check in into restaurant succesfully',
        reward_point : CONSTANTS.USER_REWARDS.REWARD_POINT_FOR_CHECK_IN
      });
    } else if(userRewardsData.reward_type === CONSTANTS.USER_REWARDS.SNAP_AND_SHARE &&
        userRewardsData.restaurant_info_id && restaurantDishes.length > 0) {
      userRewardsData.reward_point = CONSTANTS.USER_REWARDS.REWARD_POINT_FOR_SHARE;
      let rewardData = yield db.userRewards.create(userRewardsData);
      let dishCount;
      for(dishCount = 0; dishCount < restaurantDishes.length; dishCount++){
        let user_reward_dish_data = restaurantDishes[dishCount];
        user_reward_dish_data.user_reward_id = rewardData.user_reward_id;
        yield db.userRewardDish.create(user_reward_dish_data);
      }

      if(dishCount === restaurantDishes.length){
        return ({
          message: 'User has succesfully share image on social platform',
          reward_point : CONSTANTS.USER_REWARDS.REWARD_POINT_FOR_SHARE
        });
      }
    } else {
      throw new Error('Some data is missing');
    }

  }).then((userCheckInMessage) => {
    res.status(200)
      .json(userCheckInMessage);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};

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
      sleep(1200);
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
 *
 * @returns {Array} restaurant_info_id - String (restaurant unique id)
 *                   restaurant_name   - String (Name of restaurant)
 *                   restaurant_type   - String (type of restaurant)
 *                   restaurant_logo   - String (Logo of restaurant)
 */
function findRestaurantData(restaurantArray) {
  return co(function* () {
    let restaurantCount = 0;
    const responseArray = [];
    for (restaurantCount; restaurantCount < restaurantArray.length; restaurantCount++) {
      const result = yield db.restaurantInfo.find({
        where : {
          restaurant_google_id : restaurantArray[restaurantCount]
        },
        attributes : ['restaurant_info_id', 'restaurant_name'],
        include : [{
          model : db.restaurantDish,
          attributes : ['dish_image_url'],
          include : [{
            model : db.restaurantDishLabel,
            attributes : ['dish_label'],
            where : {
              dish_label : {
                $like : '%dish%'
              }
            }
          }]
        },{
          model : db.restaurantCuisine,
          attributes : ['cuisine_info_id'],
          include : [{
            model : db.cuisineInfo,
            attributes : ['cuisine_name']
          }]
        }]
      });
      if (result) {
        let restaurantObject = {
          restaurant_info_id : result.restaurant_info_id,
          restaurant_name : result.restaurant_name,
          restaurant_type : '',
          restaurant_logo : result.restaurantDishes[0].dish_image_url
        };

        if(result.restaurantCuisine && result.restaurantCuisine.cuisineInfo){
          restaurantObject.restaurant_type = result.restaurantCuisine.cuisineInfo.cuisine_name
        }
        responseArray.push(restaurantObject);
      }
    }
    if(restaurantCount === restaurantArray.length) {
      return Promise.resolve(responseArray);
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   restaurantInfoForCheckIn:
 *     type: object
 *     properties:
 *       restaurant_info_id:
 *         type: string
 *       restaurant_name:
 *         type: string
 *       restaurant_type:
 *         type: string
 *       restaurant_logo:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   restaurantsInfoForCheckIn:
 *     type: object
 *     properties:
 *       restaurants_info:
 *         type: array
 *         items:
 *           $ref: "#/definitions/restaurantInfoForCheckIn"
 */

/**
 * @swagger
 * /api/v1/restaurant/checkIn/getRestaurants:
 *   get:
 *     summary: Get near by restaurants for check-in
 *     description: List all near by restaurants for check-in as an JSON array
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
 *     tags:
 *       - Restaurant
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/restaurantsInfoForCheckIn"
 */
exports.getRestaurantForCheckIn = function (req, res) {
  return co(function* () {
    const distance = 20;
    const googleIds = [];
    if(req.query.latitude && req.query.latitude) {
      let data = yield getRestaurant(req.query.latitude, req.query.longitude, distance, googleIds);
      if (data.pgtoken) {
        data = yield getRestaurant(req.query.latitude, req.query.longitude,
          distance, data.googleIds, data.pgtoken);
      }
      return yield findRestaurantData(data.googleIds);
    } else {
      throw new Error('Some parameter is missing');
    }

  }).then((response) => {
    res.status(200)
      .json({restaurants_info : response});
  }).catch((err) => {
    console.log(err);
    res.status(400).json({
      message: err.message
    });
  });
};
