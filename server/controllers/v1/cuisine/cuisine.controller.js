'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

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
    const cuisineList = yield db.cuisineInfo.findAll({
      attributes : ['cuisine_info_id', 'cuisine_name', 'cuisine_image_url']
    });
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
