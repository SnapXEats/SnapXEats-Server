'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const _ = require('underscore');

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
