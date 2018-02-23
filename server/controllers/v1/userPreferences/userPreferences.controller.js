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
 *                type: integer
 *              restaurant_price:
 *                type: integer
 *              restaurant_distance:
 *                type: integer
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

/**
 * @swagger
 * definition:
 *   userSelectedFoodPreferences:
 *     type: object
 *     properties:
 *       user_food_preferences_id:
 *         type: string
 *       food_type_info_id:
 *         type: string
 *       food_name:
 *         type: string
 *       food_image_url:
 *         type: string
 *       is_food_like:
 *         type: boolean
 *       is_food_favourite:
 *         type: boolean
 */

/**
 * @swagger
 * definition:
 *   userSelectedCuisinePreferences:
 *     type: object
 *     properties:
 *       user_cuisine_preferences_id:
 *         type: string
 *       cuisine_info_id:
 *         type: string
 *       cuisine_name:
 *         type: string
 *       cuisine_image_url:
 *         type: string
 *       is_cuisine_like:
 *         type: boolean
 *       is_cuisine_favourite:
 *         type: boolean
 */

/**
 * @swagger
 * definition:
 *   userSetPreferences:
 *     type: object
 *     properties:
 *       user_preferences_id:
 *         type: string
 *       restaurant_rating:
 *         type: number
 *       restaurant_price:
 *         type: number
 *       restaurant_distance:
 *         type: number
 *       sort_by_distance:
 *         type: boolean
 *       sort_by_rating:
 *         type: boolean
 *       userCuisinePreferences:
 *         type: array
 *         items:
 *           $ref: "#/definitions/userSelectedCuisinePreferences"
 *       userFoodPreferences:
 *         type: array
 *         items:
 *           $ref: "#/definitions/userSelectedFoodPreferences"
 */

/**
 * @swagger
 * /api/v1/userPreferences:
 *   get:
 *     summary: Get user all preferences
 *     description: get user all preferences as an JSON object
 *     tags:
 *       - User Preference
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: an authorization header (Bearer eyJhbGciOiJI...)
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/userSetPreferences"
 */

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

/**
 * Update user preferences
 *
 * @param {Object} userPreferences - preferences of user
 * @param {string} userId - unique id of user
 *
 * @returns {Object} result - updated result of user preferences
 */
function updateUserPreferences(userPreferences, userId) {
  return co(function* () {
    const findUserPreferences = yield db.userPreferences.find({
			where : {
        user_id : userId
			},
			attributes : ['user_preferences_id', 'restaurant_rating', 'restaurant_price',
			'restaurant_distance', 'sort_by_distance', 'sort_by_rating']
		});
    const result = yield findUserPreferences.updateAttributes(userPreferences);
    return Promise.resolve({
      result
    });
  }).catch((err) => {
    return err;
  });
}

function filterCuisinePreferences(userCuisinePreferences) {
  return new Promise((resolve, reject)=>{
  	let cuisineCount, deleteCuisinePreference = [], addCuisinePreference = [];
  	for(cuisineCount = 0; cuisineCount < userCuisinePreferences.length; cuisineCount++){
  		let cuisine = userCuisinePreferences[cuisineCount];
  		if(cuisine.hasOwnProperty('user_cuisine_preferences_id')){
        deleteCuisinePreference.push(cuisine);
			} else if(cuisine.hasOwnProperty('cuisine_info_id') && (cuisine.hasOwnProperty('is_cuisine_favourite')
				|| cuisine.hasOwnProperty('is_cuisine_like'))){
        addCuisinePreference.push(cuisine);
			}
		}
		if(cuisineCount === userCuisinePreferences.length){
  		resolve({
        addCuisinePreference,
        deleteCuisinePreference
      });
		}
	})
}

function filterFoodPreferences(userFoodPreferences) {
  return new Promise((resolve, reject)=>{
    let foodCount, deleteFoodPreference = [], addFoodPreference = [];
    for(foodCount = 0; foodCount < userFoodPreferences.length; foodCount++){
      let foodType = userFoodPreferences[foodCount];
      if(foodType.hasOwnProperty('user_food_preferences_id')){
        deleteFoodPreference.push(foodType);
      } else if(foodType.hasOwnProperty('food_type_info_id') &&
        (foodType.hasOwnProperty('is_food_favourite') || foodType.hasOwnProperty('is_food_like'))){
        addFoodPreference.push(foodType);
      }
    }
    if(foodCount === userFoodPreferences.length){
      resolve({
        addFoodPreference,
        deleteFoodPreference
      });
    }
  })
}

function deleteUserCuisineData(deleteCuisinePreference) {
  return co(function* () {
    let cuisineCount;
    for(cuisineCount = 0; cuisineCount < deleteCuisinePreference.length; cuisineCount++){
      const deletedUserCuisinePreferences = yield db.userCuisinePreferences.destroy({
        where : {
          user_cuisine_preferences_id : deleteCuisinePreference[cuisineCount].user_cuisine_preferences_id
        }
      });
    }
    if(cuisineCount === deleteCuisinePreference.length){
      return Promise.resolve({"msg" : "All cuisine deleted successfully"} );
    }
  }).catch((err) => {
    return err;
  });
}


function deleteUserFoodData(deleteFoodPreference) {
  return co(function* () {
    let foodCount;
    for(foodCount = 0; foodCount < deleteFoodPreference.length; foodCount++){
      const deletedUserFoodPreferences = yield db.userFoodPreferences.destroy({
        where : {
          user_food_preferences_id : deleteFoodPreference[foodCount].user_food_preferences_id
        }
      });
    }
    if(foodCount === deleteFoodPreference.length){
      return Promise.resolve({"msg" : "All food type deleted successfully"} );
    }
  }).catch((err) => {
    return err;
  });
}


function addUserFoodData(addFoodPreference, userId) {
  return co(function* () {
    let foodCount;
    for(foodCount = 0; foodCount < addFoodPreference.length; foodCount++){
      let foodType = addFoodPreference[foodCount];
      foodType.user_id = userId;
      const addedUserFoodPreferences = yield db.userFoodPreferences.create(foodType);
    }
    if(foodCount === addFoodPreference.length){
      return Promise.resolve({"msg" : "All food type added successfully"} );
    }
  }).catch((err) => {
    return err;
  });
}

function addUserCuisineData(addCuisinePreference, userId) {
  return co(function* () {
    let cuisineCount;
    for(cuisineCount = 0; cuisineCount < addCuisinePreference.length; cuisineCount++){
      let cuisineType = addCuisinePreference[cuisineCount];
      cuisineType.user_id = userId;
      const addedUserCuisinePreferences = yield db.userCuisinePreferences.create(cuisineType);
    }
    if(cuisineCount === addCuisinePreference.length){
      return Promise.resolve({"msg" : "All cuisine type added successfully"} );
    }
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * paths:
 *  /api/v1/userPreferences/:
 *    put:
 *      summary: Edit user preferences.
 *      description: Edit preferences of user as a JSON object
 *      tags:
 *        - User Preference
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
 *          description: update user preferences.
 *          schema:
 *            type: object
 *            properties:
 *              restaurant_rating:
 *                type: integer
 *              restaurant_price:
 *                type: integer
 *              restaurant_distance:
 *                type: integer
 *              sort_by_distance:
 *                type: boolean
 *              sort_by_rating:
 *                type: boolean
 *              user_cuisine_preferences:
 *                type: array
 *                items:
 *                  - type : object
 *                    properties:
 *                      user_cuisine_preferences_id:
 *                        type: string
 *                  - type : object
 *                    properties:
 *                      cuisine_info_id:
 *                        type: string
 *                      is_cuisine_like:
 *                        type: boolean
 *                      is_cuisine_favourite:
 *                        type: boolean
 *              user_food_preferences:
 *                type: array
 *                items:
 *                  - type : object
 *                    properties:
 *                      user_food_preferences_id:
 *                        type: string
 *                  - type : object
 *                    properties:
 *                      food_type_info_id:
 *                        type: string
 *                      is_food_like:
 *                        type: boolean
 *                      is_food_favourite:
 *                        type: boolean
 *      responses:
 *        201:
 *          description: Updated
 */
exports.editUserPreferences = function (req, res) {
  return co(function* () {
    const userId = req.decodedData.user_id;
    const userCuisinePreferences = req.body.user_cuisine_preferences;
    const userFoodPreferences = req.body.user_food_preferences;
    const userPreferences = _.pick(req.body,'restaurant_rating', 'restaurant_price',
      'restaurant_distance', 'sort_by_distance', 'sort_by_rating');
    if (userPreferences.hasOwnProperty('restaurant_rating') ||
      userPreferences.hasOwnProperty('restaurant_price') ||
      userPreferences.hasOwnProperty('restaurant_distance') ||
      userPreferences.hasOwnProperty('sort_by_distance') ||
      userPreferences.hasOwnProperty('sort_by_rating')) {
      yield updateUserPreferences(userPreferences, userId);
    }
    if (userCuisinePreferences && userCuisinePreferences.length > 0) {
     let filteredCuisineData = yield filterCuisinePreferences(userCuisinePreferences);
     yield addUserCuisineData(filteredCuisineData.addCuisinePreference, userId);
     yield deleteUserCuisineData(filteredCuisineData.deleteCuisinePreference);
    }
    if (userFoodPreferences && userFoodPreferences.length > 0) {
      let filteredFoodData = yield filterFoodPreferences(userFoodPreferences);
      yield addUserFoodData(filteredFoodData.addFoodPreference, userId);
      yield deleteUserFoodData(filteredFoodData.deleteFoodPreference);
    }
    return ({
      message: 'all preferences updated succesfully'
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
