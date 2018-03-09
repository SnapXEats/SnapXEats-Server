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
        attributes : ['restaurant_rating', 'restaurant_price',
				'restaurant_distance', 'sort_by_distance', 'sort_by_rating']
      }),
			db.userCuisinePreferences.findAll({
        where : {
          user_id : userId
        },
        attributes:['cuisine_info_id','is_cuisine_like', 'is_cuisine_favourite']
			}),
      db.userFoodPreferences.findAll({
        where : {
          user_id : userId
        },
				attributes:['food_type_info_id', 'is_food_like', 'is_food_favourite']
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
 *       food_type_info_id:
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
 *   userSetPreferences:
 *     type: object
 *     properties:
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
      userCuisinePreferences : [],
      userFoodPreferences : []
    };
    if (userAllPreferences.userPreferences) {
      userPreferences.restaurant_rating = userAllPreferences.userPreferences.restaurant_rating;
      userPreferences.restaurant_price = userAllPreferences.userPreferences.restaurant_price;
      userPreferences.restaurant_distance = userAllPreferences.userPreferences.restaurant_distance;
      userPreferences.sort_by_distance = userAllPreferences.userPreferences.sort_by_distance;
      userPreferences.sort_by_rating = userAllPreferences.userPreferences.sort_by_rating;
    }

    let cuisineCount, foodCount;
    for(cuisineCount = 0; cuisineCount < userAllPreferences.userCuisinePreferences.length;
		cuisineCount++){
    	let cuisineInfo =  userAllPreferences.userCuisinePreferences[cuisineCount];
      userPreferences.userCuisinePreferences.push({
        cuisine_info_id : cuisineInfo.cuisine_info_id,
        is_cuisine_like : cuisineInfo.is_cuisine_like,
        is_cuisine_favourite : cuisineInfo.is_cuisine_favourite

			});
		}

    for(foodCount = 0; foodCount < userAllPreferences.userFoodPreferences.length;
        foodCount++){
      let foodTypeInfo =  userAllPreferences.userFoodPreferences[foodCount];
      userPreferences.userFoodPreferences.push({
        food_type_info_id : foodTypeInfo.food_type_info_id,
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
 *
 * @returns {Object} result - updated result of user preferences
 */
function updateOrCreateUserPreferences(userPreferences) {
  return co(function* () {
    let result;
    const findUserPreferences = yield db.userPreferences.find({
			where : {
        user_id : userPreferences.user_id
			},
			attributes : ['user_preferences_id', 'restaurant_rating', 'restaurant_price',
			'restaurant_distance', 'sort_by_distance', 'sort_by_rating']
		});

    if(findUserPreferences){
      result = yield findUserPreferences.updateAttributes(userPreferences);
    } else {
      result = yield db.userPreferences.create(userPreferences);
    }
    return Promise.resolve({
      result
    });
  }).catch((err) => {
    return err;
  });
}

function filterCuisinePreferences(userCuisinePreferences, user_id) {
  return co(function* () {
  	let cuisineCount, updateCuisinePreference = [], addCuisinePreference = [];
  	for(cuisineCount = 0; cuisineCount < userCuisinePreferences.length; cuisineCount++){
  		let cuisine = userCuisinePreferences[cuisineCount];
  		if(cuisine.hasOwnProperty('cuisine_info_id') && (cuisine.hasOwnProperty('is_cuisine_favourite')
				|| cuisine.hasOwnProperty('is_cuisine_like'))){
  		  let findCuisineInfo = yield db.userCuisinePreferences.find({
          where : {
            cuisine_info_id : cuisine.cuisine_info_id,
            user_id : user_id
          }
        });
  		  if(findCuisineInfo){
          updateCuisinePreference.push(cuisine);
        } else {
          addCuisinePreference.push(cuisine);
        }
			}
		}
		if(cuisineCount === userCuisinePreferences.length){
  		return({
        addCuisinePreference,
        updateCuisinePreference
      });
		}
	})
}

function filterFoodPreferences(userFoodPreferences, user_id) {
  return co(function* () {
    let foodCount, updateFoodPreference = [], addFoodPreference = [];
    for(foodCount = 0; foodCount < userFoodPreferences.length; foodCount++){
      let foodType = userFoodPreferences[foodCount];
      if(foodType.hasOwnProperty('food_type_info_id') &&
        (foodType.hasOwnProperty('is_food_favourite') || foodType.hasOwnProperty('is_food_like'))){
        let findFoodInfo = yield db.userFoodPreferences.find({
          where : {
            food_type_info_id : foodType.food_type_info_id,
            user_id : user_id
          }
        });
        if(findFoodInfo){
          updateFoodPreference.push(foodType);
        } else {
          addFoodPreference.push(foodType);
        }
      }
    }
    if(foodCount === userFoodPreferences.length){
      return({
        addFoodPreference,
        updateFoodPreference
      });
    }
  })
}

function updateUserCuisineData(updateCuisinePreference, user_id) {
  return co(function* () {
    let cuisineCount;
    for(cuisineCount = 0; cuisineCount < updateCuisinePreference.length; cuisineCount++){
      let findUserCuisinePreferences = yield db.userCuisinePreferences.find({
        where : {
          cuisine_info_id : updateCuisinePreference[cuisineCount].cuisine_info_id,
          user_id : user_id
        },
        attributes : ['user_cuisine_preferences_id','cuisine_info_id', 'user_id',
        'is_cuisine_like', 'is_cuisine_favourite']
      });

      yield findUserCuisinePreferences.updateAttributes(updateCuisinePreference[cuisineCount]);
    }
    if(cuisineCount === updateCuisinePreference.length){
      return Promise.resolve({"msg" : "All cuisine updated successfully"} );
    }
  }).catch((err) => {
    return err;
  });
}


function updateUserFoodData(updateFoodPreference, user_id) {
  return co(function* () {
    let foodCount;
    for(foodCount = 0; foodCount < updateFoodPreference.length; foodCount++){
      let findUserFoodPreferences = yield db.userFoodPreferences.find({
        where : {
          food_type_info_id : updateFoodPreference[foodCount].food_type_info_id,
          user_id : user_id
        },
        attributes : ['user_food_preferences_id', 'user_id', 'food_type_info_id',
        'is_food_like', 'is_food_favourite']
      });

      yield findUserFoodPreferences.updateAttributes(updateFoodPreference[foodCount]);
    }
    if(foodCount === updateFoodPreference.length){
      return Promise.resolve({"msg" : "All food type updated successfully"} );
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
      yield db.userFoodPreferences.create(foodType);
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
      yield db.userCuisinePreferences.create(cuisineType);
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
      userPreferences.user_id = userId;
      yield updateOrCreateUserPreferences(userPreferences);
    }
    if (userCuisinePreferences && userCuisinePreferences.length > 0) {
     let filteredCuisineData = yield filterCuisinePreferences(userCuisinePreferences,userId);
     yield addUserCuisineData(filteredCuisineData.addCuisinePreference, userId);
     yield updateUserCuisineData(filteredCuisineData.updateCuisinePreference, userId);
    }
    if (userFoodPreferences && userFoodPreferences.length > 0) {
      let filteredFoodData = yield filterFoodPreferences(userFoodPreferences, userId);
      yield addUserFoodData(filteredFoodData.addFoodPreference, userId);
      yield updateUserFoodData(filteredFoodData.updateFoodPreference, userId);
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
