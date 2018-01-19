'use strict';

const  requestPromise = require('request-promise');

const userFieldSet = 'name, picture';

/**
 * getFBUserInfo - Get user information from FB
 *
 * @param {String} userId - url address
 * @param {String}  userAccessToken - user access token for get data
 *
 * @returns {Object} userData - user information which we get from fb
 */

const getFBUserInfo = function (userId, userAccessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      uri: `https://graph.facebook.com/v2.8/${userId}`,
      qs: {
        access_token: userAccessToken,
        fields: userFieldSet
      }
    };
    requestPromise(options)
      .then(userData => {
        resolve(JSON.parse(userData));
      }).catch(err => {
        reject(err);
      });
  });
};

/**
 * getInstagramUserInfo - Get user information from Instagram
 *
 * @param {String} userId - url address
 * @param {String}  userAccessToken - user access token for get data
 *
 * @returns {Object} userData - user information which we get from Instagram
 */
const getInstagramUserInfo = function (userId, userAccessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      uri: `https://api.instagram.com/v1/users/${userId}/?access_token=${userAccessToken}`
    };
    requestPromise(options)
      .then(userData => {
        resolve(JSON.parse(userData));
      }).catch(err => {
      reject(err);
    });
  });
};


module.exports = {
  getFBUserInfo,
  getInstagramUserInfo
};
