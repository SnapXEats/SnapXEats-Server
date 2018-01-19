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
        resolve(token);
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
        access_token : accessToken
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
        name : data.full_name,
        access_token : accessToken,
        user_image_url : data.profile_picture,
        social_platform : socialPlatform
      };
      userInformation = yield createUser(userInfo);
    }
    const token = yield issueToken(userInformation.user_id, userInformation.user_type);
    return ({
      token,
      user_id : userInformation.user_id
    });
  }).then((createdUserData) => {
    res.status(200)
      .json({ userInfo : createdUserData });
  }).catch((err) => {
    res.status(400).json(err);
  });
};
