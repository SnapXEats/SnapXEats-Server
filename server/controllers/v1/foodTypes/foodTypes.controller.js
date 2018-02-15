'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const _ = require('lodash');

db.userFoodPreferences.belongsTo(db.foodTypeInfo, {
    foreignKey: 'food_type_info_id'
});

/**
 * findUserPreferences (Find user preferences data from db)
 *
 * @param {string} userId - user unique id
 *
 * @returns {array} userFood - food preferences of user
 */

function findUserPreferences(userId) {
  return co(function* () {
    let userFood = yield db.userFoodPreferences.findAll({
      attributes: ['user_food_preferences_id', 'food_type_info_id','is_food_like',
        'is_food_favourite'],
      where : {
        user_id : userId
      },
      include : [{
        model : db.foodTypeInfo,
        attributes : ['food_type_info_id', 'food_name', 'food_image_url']
      }]
    });
    return Promise.resolve(userFood);
  }).catch((err) => {
    return err;
  });
}

/**
 * @swagger
 * definition:
 *   food_info:
 *     type: object
 *     required:
 *       - food_type_info_id
 *     properties:
 *       food_type_info_id:
 *         type: string
 *       food_name:
 *         type: string
 *       food_image_url:
 *         type: string
 *       is_food_like:
 *         type: string
 *       is_food_favourite:
 *         type: string
 *       user_food_preferences_id:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   foodTypeList:
 *     type: object
 *     properties:
 *       foodTypeList:
 *         type: array
 *         items:
 *           $ref: "#/definitions/food_info"
 */
/**
 * @swagger
 * /api/v1/foodTypes:
 *   get:
 *     summary: List all food types
 *     description: List all food types as an JSON array
 *     tags:
 *       - FoodTypes
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: an authorization header (Bearer eyJhbGciOiJI...)
 *         type: string
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/foodTypeList"
 */
exports.getFoodTypesList = function (req, res) {
  return co(function* () {
    let foodTypeList;
    if(!req.decodedData) {
      foodTypeList = yield db.foodTypeInfo.findAll({
        attributes : ['food_type_info_id', 'food_name', 'food_image_url']
      });
    } else {
      let userId = req.decodedData.user_id;
      foodTypeList = yield db.foodTypeInfo.findAll({
        attributes : ['food_type_info_id', 'food_name', 'food_image_url']
      });
      let userFoodPreferences = yield findUserPreferences(userId);
      for(let foodCount = 0; foodCount < userFoodPreferences.length; foodCount++){
        let userFoodObject = userFoodPreferences[foodCount];
        let object = {
          food_type_info_id : userFoodObject.foodTypeInfo.food_type_info_id,
          food_name : userFoodObject.foodTypeInfo.food_name,
          food_image_url : userFoodObject.foodTypeInfo.food_image_url,
          is_food_like : userFoodObject.is_food_like,
          is_food_favourite : userFoodObject.is_food_favourite,
          user_food_preferences_id : userFoodObject.user_food_preferences_id
        };
        let index = _.findIndex(foodTypeList, { food_type_info_id: object.food_type_info_id });
        foodTypeList.splice(index, 1, object);
      }
    }
    return ({ foodTypeList });
  }).then((foodTypeList) => {
    res.status(200)
      .json(foodTypeList);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
