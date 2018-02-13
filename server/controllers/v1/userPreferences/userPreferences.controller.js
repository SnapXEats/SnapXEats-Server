'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const _ = require('underscore');

db.userCuisinePreferences.belongsTo(db.cuisineInfo, {
  foreignKey: 'cuisine_info_id'
});

db.userFoodPreferences.belongsTo(db.foodTypeInfo, {
  foreignKey: 'food_type_info_id'
});
/**
 * Insert user preferences
 *
 * @param {Object} userPreferences - preferences of user
 *
 * @returns {Object} result - result of user preferences
 */
function insertUserPrefernces(userPreferences,userId) {
	return co(function* () {
		userPreferences.user_id = userId;
		const result = yield db.userPreferences.create(userPreferences);
		return Promise.resolve({
			result
		});
	}).catch((err) => {
		return err;
	});
}

/**
 * insert Cuisine Preferences
 *
 * @param {Array} userCuisinePreferences - cuisine preferences of user
 * @param {String} userId - unique id of user
 *
 * @returns {String} message - message for user cuisine preferences
 */
function insertCuisinePreferences(userCuisinePreferences, userId) {
	return co(function* () {
		let cuisineCount;
		for (cuisineCount = 0; cuisineCount < userCuisinePreferences.length; cuisineCount++) {
			let selectedCuisine = userCuisinePreferences[cuisineCount];
			selectedCuisine.user_id = userId;
			yield db.userCuisinePreferences.create(selectedCuisine);
		}
		// Insert Cuisine preferences
		if (cuisineCount === userCuisinePreferences.length) {
			return Promise.resolve({
				message: 'all cuisine preferences inserted succesfully'
			});
		}
	}).catch((err) => {
		return err;
	});
}

/**
 * insert Food Type Preferences
 *
 * @param {Array} userFoodPreferences - cuisine preferences of user
 * @param {String} userId - unique id of user
 *
 * @returns {String} message - message for user food preferences
 */
function insertFoodTypePreferences(userFoodPreferences, userId) {
	return co(function* () {
		let foodTypeCount;
		for (foodTypeCount = 0; foodTypeCount < userFoodPreferences.length; foodTypeCount++) {
			let selectedFoodType = userFoodPreferences[foodTypeCount];
			selectedFoodType.user_id = userId;
			yield db.userFoodPreferences.create(selectedFoodType);
		}
		// Insert Food Type preferences
		if (foodTypeCount === userFoodPreferences.length) {
			return Promise.resolve({
				message: 'all food preferences inserted succesfully'
			});
		}
	}).catch((err) => {
		return err;
	});
}

/**
 * @swagger
 * definition:
 *   cusinePreferences:
 *     type: object
 *     properties:
 *       cuisine_info_id:
 *         type: string
 *       is_cuisine_like:
 *         type: boolean
 *       is_cuisine_favourite:
 *         type: boolean
 */

/**
 * @swagger
 * definition:
 *   foodPreferences:
 *     type: object
 *     properties:
 *       food_type_info_id:
 *         type: string
 *       is_food_like:
 *         type: boolean
 *       is_food_favourite:
 *         type: boolean
 */

/**
 * @swagger
 * paths:
 *  /api/v1/userPreferences:
 *    post:
 *      summary: set users preferences.
 *      tags:
 *        - User Preference
 *      description: Set user preferences as a JSON object
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
 *              restaurant_rating:
 *                type: string
 *              restaurant_price:
 *                type: string
 *              restaurant_distance:
 *                type: string
 *              sort_by_distance:
 *                type: boolean
 *              sort_by_rating:
 *                type: boolean
 *              user_cuisine_preferences:
 *                type: array
 *                items:
 *                  "$ref": "#/definitions/cusinePreferences"
 *              user_food_preferences:
 *                type: array
 *                items:
 *                  "$ref": "#/definitions/foodPreferences"
 *      responses:
 *        201:
 *          description: Created
 */

exports.setUserPreferences = function (req, res) {
	return co(function* () {
		const userCuisinePreferences = req.body.user_cuisine_preferences;
		const userFoodPreferences = req.body.user_food_preferences;
		const userPreferences = _.pick(req.body, 'restaurant_rating', 'restaurant_price',
			'restaurant_distance', 'sort_by_distance', 'sort_by_rating');
		const userId = req.decodedData.user_id;
		if (userPreferences.hasOwnProperty('restaurant_rating') ||
			userPreferences.hasOwnProperty('restaurant_price') ||
			userPreferences.hasOwnProperty('restaurant_distance') ||
			userPreferences.hasOwnProperty('sort_by_distance') ||
			userPreferences.hasOwnProperty('sort_by_rating')) {
			yield insertUserPrefernces(userPreferences, userId);
		}
		if (userCuisinePreferences && userCuisinePreferences.length > 0) {
			yield insertCuisinePreferences(userCuisinePreferences, userId);
		}
		if (userFoodPreferences && userFoodPreferences.length > 0) {
			yield insertFoodTypePreferences(userFoodPreferences, userId);
		}
		return ({
			message: 'all preferences inserted succesfully'
		});
	}).then((userPreferencesMessage) => {
		res.status(200)
			.json(userPreferencesMessage);
	}).catch((err) => {
		res.status(400).json({
			message: err.message
		});
	});
};

/**
 * Get User Preferences from database
 *
 * @param {String} userId - unique id of user
 *
 * @returns {Object} User preferences - user food,cuisine and restaurant preferences
 */

function getUserPreferncesFromDB(userId) {
  return co(function* () {
    let resolvedPromises = yield Promise.all([
    	db.userPreferences.find({
				where : {
          user_id : userId
				},
        attributes : ['user_preferences_id', 'restaurant_rating', 'restaurant_price',
				'restaurant_distance', 'sort_by_distance', 'sort_by_rating']
      }),
			db.userCuisinePreferences.findAll({
        where : {
          user_id : userId
        },
        attributes:['user_cuisine_preferences_id', 'is_cuisine_like', 'is_cuisine_favourite'],
        include : [{
          model : db.cuisineInfo,
          attributes : ['cuisine_info_id', 'cuisine_name', 'cuisine_image_url']
        }]
			}),
      db.userFoodPreferences.findAll({
        where : {
          user_id : userId
        },
				attributes:['user_food_preferences_id', 'is_food_like', 'is_food_favourite'],
				include : [{
        	model : db.foodTypeInfo,
					attributes : ['food_type_info_id', 'food_name', 'food_image_url']
				}]
      })
    	]);
    return({
      userPreferences : resolvedPromises[0],
      userCuisinePreferences : resolvedPromises[1],
      userFoodPreferences : resolvedPromises[2]
		})
  });
};


exports.getUserPreferences = function (req, res) {
  return co(function* () {
    const userId = req.decodedData.user_id;
    let userAllPreferences = yield getUserPreferncesFromDB(userId);
    let userPreferences = {
      user_preferences_id : userAllPreferences.userPreferences.user_preferences_id,
      restaurant_rating : userAllPreferences.userPreferences.restaurant_rating,
      restaurant_price : userAllPreferences.userPreferences.restaurant_price,
      restaurant_distance : userAllPreferences.userPreferences.restaurant_distance,
      sort_by_distance : userAllPreferences.userPreferences.sort_by_distance,
      sort_by_rating : userAllPreferences.userPreferences.sort_by_rating,
      userCuisinePreferences : [],
      userFoodPreferences : []
		};

    let cuisineCount, foodCount;
    for(cuisineCount = 0; cuisineCount < userAllPreferences.userCuisinePreferences.length;
		cuisineCount++){
    	let cuisineInfo =  userAllPreferences.userCuisinePreferences[cuisineCount];
      userPreferences.userCuisinePreferences.push({
        user_cuisine_preferences_id : cuisineInfo.user_cuisine_preferences_id,
        cuisine_info_id : cuisineInfo.cuisineInfo.cuisine_info_id,
        cuisine_name : cuisineInfo.cuisineInfo.cuisine_name,
        cuisine_image_url : cuisineInfo.cuisineInfo.cuisine_image_url,
        is_cuisine_like : cuisineInfo.is_cuisine_like,
        is_cuisine_favourite : cuisineInfo.is_cuisine_favourite

			});
		}

    for(foodCount = 0; foodCount < userAllPreferences.userFoodPreferences.length;
        foodCount++){
      let foodTypeInfo =  userAllPreferences.userFoodPreferences[foodCount];
      userPreferences.userFoodPreferences.push({
        user_food_preferences_id : foodTypeInfo.user_food_preferences_id,
        food_type_info_id : foodTypeInfo.foodTypeInfo.food_type_info_id,
        food_name : foodTypeInfo.foodTypeInfo.food_name,
        food_image_url : foodTypeInfo.foodTypeInfo.food_image_url,
        is_food_like : foodTypeInfo.is_food_like,
        is_food_favourite : foodTypeInfo.is_food_favourite

      });
    }

    return ({
      userPreferences
    });
  }).then((userPreferences) => {
    res.status(200)
      .json(userPreferences);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
