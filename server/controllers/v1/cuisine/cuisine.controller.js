'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const  requestPromise = require('request-promise');

const unique = require('array-unique');

const key = process.env.googleKey;

const sleep = require('system-sleep');

const _ = require('underscore');

db.restaurantInfo.hasOne(db.restaurantCuisine, {
	foreignKey: 'restaurant_info_id'
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
 * @returns {Object} restaurant_info_id - String (restaurant unique id)
 *                   cuisine_info_id   - String (Cuisine unique id)
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
        attributes : ['restaurant_info_id'],
				include : [{
					model : db.restaurantCuisine,
					attributes : ['cuisine_info_id']
				}]
			});
			if (result && result.restaurantCuisine) {
				 responseArray.push(result.restaurantCuisine);
			}
		}
		if(restaurantCount === restaurantArray.length) {
		  console.log(restaurantCount);
			return Promise.resolve(responseArray);
		}
	}).catch((err) => {
		return err;
	});
}


/**
 * findCuisineInfo (Find cuisine information from db)
 *
 * @param {Array} cuisineUniqueArray - Unique array for search cuisine
 *
 * @returns {Object} cuisine_info_id - String (cuisine unique id)
 *                   cuisine_name   - String (Name of cuisine)
 *                   cuisine_image_url   - String (cuisine image URL)
 */
function findCuisineInfo(cuisineUniqueArray) {
	return co(function* () {
		let cuisineCount = 0;
		const responseArray = [];
		for (cuisineCount; cuisineCount < cuisineUniqueArray.length; cuisineCount++) {
			const result = yield db.cuisineInfo.find({
				where : {
					cuisine_info_id : cuisineUniqueArray[cuisineCount].cuisine_info_id
				},
				attributes : ['cuisine_info_id', 'cuisine_name', 'cuisine_image_url'],
			});
			if (result) {
				responseArray.push(result);
			}
		}
		if(cuisineCount === cuisineUniqueArray.length) {
			console.log(cuisineCount);
			return Promise.resolve(responseArray);
		}
	}).catch((err) => {
		return err;
	});
}
/**
 * @swagger
 * definition:
 *   cuisine_info:
 *     type: object
 *     required:
 *       - cuisine_info_id
 *       - cuisine_name
 *       - cuisine_image_url
 *     properties:
 *       cuisine_info_id:
 *         type: string
 *       cuisine_name:
 *         type: string
 *       cuisine_image_url:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   cuisineList:
 *     type: object
 *     properties:
 *       cuisineList:
 *         type: array
 *         items:
 *           $ref: "#/definitions/cuisine_info"
 */

/**
 * @swagger
 * /api/v1/cuisine:
 *   get:
 *     summary: List all cuisines
 *     description: List all cuisines as an JSON array
 *     tags:
 *       - Cuisines
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
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/cuisineList"
 */
exports.getCuisineList = function (req, res) {
  return co(function* () {
		const distance = 1610;
		const googleIds = [];
		let data = yield getRestaurant(req.query.latitude, req.query.longitude, distance, googleIds);
		if (data.pgtoken) {
			data = yield getRestaurant(req.query.latitude, req.query.longitude,
				distance, data.googleIds, data.pgtoken);
		}
		const cuisineArrayResult = yield findRestaurantData(data.googleIds);
		const cuisineUniqueArray = _.uniq(cuisineArrayResult, function(cuisine){
			return cuisine.cuisine_info_id;
		});
		
		const cuisineList = yield findCuisineInfo(cuisineUniqueArray);
    return ({ cuisineList });
  }).then((cuisineList) => {
    res.status(200)
      .json(cuisineList);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
