'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

/**
 * @swagger
 * definition:
 *   food_info:
 *     type: object
 *     required:
 *       - food_type_info_id
 *       - food_name
 *       - food_image_url
 *     properties:
 *       food_type_info_id:
 *         type: string
 *       food_name:
 *         type: string
 *       food_image_url:
 *         type: string
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
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: array
 *           items:
 *             "$ref": "#/definitions/food_info"
 */
exports.getFoodTypesList = function (req, res) {
  return co(function* () {
    const foodTypeList = yield db.foodTypeInfo.findAll({
      attributes : ['food_type_info_id', 'food_name', 'food_image_url']
    });
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
