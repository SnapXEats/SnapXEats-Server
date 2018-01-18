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
 *       - cusine_name
 *       - cusine_image_url
 *     properties:
 *       cusine_name:
 *         type: string
 *       cusine_image_url:
 *         type: string
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
 *           type: array
 *           items:
 *             "$ref": "#/definitions/cuisine_info"
 */
exports.getCusineList = function (req, res) {
  return co(function* () {
    return yield db.cusineInfo.findAll({
      attributes : ['cusine_info_id', 'cusine_name', 'cusine_image_url']
    });
  }).then((cusineList) => {
    res.status(200)
      .json(cusineList);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
