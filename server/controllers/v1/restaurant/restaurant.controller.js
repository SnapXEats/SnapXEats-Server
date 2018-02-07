'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const requestPromise = require('request-promise');

const key = process.env.googleKey;

db.restaurantInfo.hasMany(db.restaurantTiming, {
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
				'location_lat', 'location_long', 'restaurant_address', 'restaurant_contact_no'],
			where: {
				restaurant_info_id: restaurantInfoId
			},
			include: [{
				model: db.restaurantTiming,
				attributes: ['restaurant_open_close_time', 'day_of_week']
			}, {
				model: db.restaurantDish,
				attributes: ['dish_image_url']
			}]
		}).then((restaurantInfo) => {
			resolve(restaurantInfo);
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
 */

/**
 * @swagger
 * /api/v1/restaurant:
 *   get:
 *     summary: Get information of restaurant
 *     description: Get information of restaurant as an JSON Object
 *     tags:
 *       - Restaurant
 *     parameters:
 *      - in: query
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

		let address_url = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' +
			restaurantInformation.restaurant_place_id + '&key=' + key;

		restaurantDetails.restaurant_info_id = restaurantInformation.restaurant_info_id;
		restaurantDetails.restaurant_name = restaurantInformation.restaurant_name;
		restaurantDetails.location_lat = restaurantInformation.location_lat;
		restaurantDetails.location_long = restaurantInformation.location_long;
		restaurantDetails.restaurant_contact_no = restaurantInformation.restaurant_contact_no;
		restaurantDetails.restaurant_address = restaurantInformation.restaurant_address;
		restaurantDetails.restaurant_timings = restaurantInformation.restaurantTimings;
		restaurantDetails.restaurant_speciality = restaurantInformation.restaurantDishes;

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
