'use strict';

const appRoot = require('app-root-path');

const db = require(`${appRoot}/server/models`);

const co = require('co');

const CONSTANTS = require('./../../../../lib/constants');

const getUserData = require('./../../../../lib/get_user_data');

const jwt = require('jsonwebtoken');

const moment = require('moment');


/**
 * findUser - Find user information from DB
 *
 * @param {String} socialId - social id of user
 * @param {String}  socialPlatform - platform from user sign up
 *
 * @returns {Object} userData - user information which we get from db
 */
const findUser = function (socialId, socialPlatform) {
  return new Promise((resolve, reject) => {
    db.users.find({
      where: {
        social_id: socialId,
        social_platform: socialPlatform
      }
    })
      .then((userInfo) => {
        resolve(userInfo);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * createUser - create new user information in DB
 *
 * @param {Object} userInformation - user information object
 *
 * @returns {Object} userInfo - user information which we created in db
 */
const createUser = function (userInformation) {
  return new Promise((resolve, reject) => {
    db.users.create({
      social_id : userInformation.social_id,
      name : userInformation.name,
      access_token : userInformation.access_token,
      user_image_url : userInformation.user_image_url,
      social_platform : userInformation.social_platform
    }).then((userInfo) => {
      resolve(userInfo);
    }).catch((err) => {
      reject(err);
    });
  });
};


/**
 * Returns a jwt token signed by the app secret
 */
function issueToken(id, userType) {
  return new Promise((resolve, reject) => {
    jwt.sign({ user_id: id,
        current_time: moment()
          .format(),
        role: userType
      },
      CONSTANTS.SECRET, (err, token) => {
        if (err) {
          reject(err);
        }
        db.userToken.find({
          where : {
            user_id : id
          }
        }).then((userTokenInfo) => {
          if (userTokenInfo) {
						userTokenInfo.updateAttributes({
							access_token : token
            }).then(() => {
              resolve(token);
            }).catch((error) => {
              reject(error);
            });
          } else {
            db.userToken.create({
              access_token : token,
              user_id : id
            }).then(() => {
							resolve(token);
						}).catch((error) => {
							reject(error);
						});
          }
        });
      });
  });
}
/**
 * @swagger
 * definition:
 *   Users:
 *     type: object
 *     required:
 *       - name
 *       - login_type
 *       - user_type
 *       - status
 *     properties:
 *       social_id:
 *         type: string
 *       name:
 *         type: string
 *       access_token:
 *         type: string
 *       user_image_url:
 *         type: string
 *       social_platform:
 *         type: string
 *       login_type:
 *         type: string
 *       user_type:
 *         type: string
 *       status:
 *         type: string
 */

/**
 * @swagger
 * paths:
 *  /api/v1/users:
 *    post:
 *      summary: Create a new user.
 *      tags:
 *        - Users
 *      description: Add a new user as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: body
 *          name: user
 *          description: The user to create.
 *          schema:
 *            type: object
 *            required:
 *              - access_token
 *              - social_platform
 *              - social_id
 *            properties:
 *              access_token:
 *                type: string
 *              social_platform:
 *                type: string
 *              social_id:
 *                type: string
 *              first_time_login:
 *                type: boolean
 *      responses:
 *        201:
 *          description: Created
 */
exports.signUp = function (req, res) {
  return co(function* () {
    const accessToken = req.body.access_token;
    const socialPlatform = req.body.social_platform;
    const socialId = req.body.social_id;
    let data;
    let userInformation;

    const userData = yield findUser(socialId, socialPlatform);
    if (userData) {
      userInformation = yield userData.updateAttributes({
        access_token : accessToken,
        first_time_login : false
      });
    } else if (socialPlatform === CONSTANTS.SOCIAL_PLATFORM.FACEBOOK) {
      data = yield getUserData.getFBUserInfo(socialId, accessToken);
      const userInfo = {
        social_id : socialId,
        name : data.name,
        access_token : accessToken,
        user_image_url : data.picture.data.url,
        social_platform : socialPlatform
      };
      userInformation = yield createUser(userInfo);
    } else if (socialPlatform === CONSTANTS.SOCIAL_PLATFORM.INSTAGRAM) {
      data = yield getUserData.getInstagramUserInfo(socialId, accessToken);
      const userInfo = {
        social_id : socialId,
        name : data.data.full_name,
        access_token : accessToken,
        user_image_url : data.data.profile_picture,
        social_platform : socialPlatform
      };
      userInformation = yield createUser(userInfo);
    }
    const token = yield issueToken(userInformation.user_id, userInformation.user_type);
    return ({
      token,
      user_id : userInformation.user_id,
      social_platform : socialPlatform,
      first_time_login : userInformation.first_time_login
    });
  }).then((createdUserData) => {
    res.status(200)
      .json({ userInfo : createdUserData });
  }).catch((err) => {
    res.status(400).json(err);
  });
};

/**
 * @swagger
 * paths:
 *  /api/v1/users/address:
 *    post:
 *      summary: Create a user address.
 *      tags:
 *        - Users
 *      description: Add a user address as a JSON object
 *      consumes:
 *        - application/json
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          description: an authorization header (Bearer eyJhbGciOiJI...)
 *          required: true
 *          type: string
 *        - in: body
 *          name: Address
 *          description: User address to create.
 *          schema:
 *            type: object
 *            required:
 *              - address
 *              - address_type
 *            properties:
 *              address:
 *                type: string
 *              address_type:
 *                type: string
 *      responses:
 *        201:
 *          description: Created
 */

exports.saveUserAddresses = function (req, res) {
	return co(function* () {
		const userAddress = req.body.address;
		const userAddressType = req.body.address_type;
		const userId = req.decodedData.user_id;
		if (userAddress && userAddressType) {
			yield db.userAddresses.create({
				address :userAddress,
				address_type: userAddressType,
				user_id : userId
      });
		}
		return ({
			message: 'user address inserted succesfully'
		});
	}).then((userAddressMessage) => {
		res.status(200)
			.json(userAddressMessage);
	}).catch((err) => {
		res.status(400).json({
			message: err.message
		});
	});
};

/**
 * @swagger
 * definition:
 *   address:
 *     type: object
 *     properties:
 *       user_address_id:
 *         type: string
 *       address:
 *         type: string
 *       adress_type:
 *         type: string
 */

/**
 * @swagger
 * definition:
 *   userAddresses:
 *     type: object
 *     properties:
 *       userAddresses:
 *         type: array
 *         items:
 *           $ref: "#/definitions/address"
 */
/**
 * @swagger
 * /api/v1/users/address/{userId}:
 *   get:
 *     summary: List user's all addresses
 *     description: List user's all addresses as an JSON array
 *     tags:
 *       - Users
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: an authorization header (Bearer eyJhbGciOiJI...)
 *         required: true
 *         type: string
 *       - in: path
 *         name: userId
 *         description: User's unique id
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: object
 *           "$ref": "#/definitions/userAddresses"
 */

exports.getUserAddresses = function (req, res) {
	return co(function* () {
		const userId = req.params.userId;
		const userAddresses = yield db.userAddresses.findAll({
			attributes : ['user_address_id', 'address', 'address_type'],
			where : {
				user_id: userId
			}
		});
		return ({
			userAddresses
		});
	}).then((userAddresses) => {
		res.status(200)
			.json(userAddresses);
	}).catch((err) => {
		res.status(400).json({
			message: err.message
		});
	});
};

/**
 * @swagger
 * /api/v1/users/logout:
 *   get:
 *     summary: User can logged out
 *     description: User can logged out from this API
 *     tags:
 *       - Users
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
 *           name: message
 *           type: string
 */

exports.loggedOutUser = function (req, res) {
  return co(function* () {
    const userId = req.decodedData.user_id;
    let userInformation = yield db.userToken.find({
      where : {
        user_id: userId
      }
    });

    yield userInformation.updateAttributes({
      access_token : null
    });

    return ({
     "message" : "User logged out successfully"
    });
  }).then((userLogOutInfo) => {
    res.status(200)
      .json(userLogOutInfo);
  }).catch((err) => {
    res.status(400).json({
      message: err.message
    });
  });
};
