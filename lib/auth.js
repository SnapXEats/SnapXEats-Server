/* eslint-disable no-param-reassign */
'use strict';

const compose = require('composable-middleware');

const jwt = require('jsonwebtoken');

const CONSTANTS = require('./constants');

const db = require('./../server/models');
/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticated() {
  return compose()
  // Validate jwt
    .use((req, res, next) => {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, CONSTANTS.SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).json({ message : 'User not authenticated' });
          }
          db.userToken.find({
            where : {
							user_id : decoded.user_id,
							access_token : token
            }
          }).then((userTokenInfo) => {
            if (userTokenInfo) {
							req.decodedData = decoded;
							next();
							return 0;
						} else {
							return res.status(403).json({ message : 'User not authenticated' });
            }
          }).catch((error) => {
						return res.status(403).json({ message : error });
					});
        });
      } else {
        return res.status(403).json({ message : 'User not authenticated' });
      }
      return 0;
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
function hasRole(roleRequired) {
  if (!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use((req, res, next) => {
      if (CONSTANTS.userRoles.indexOf(req.decodedData.role) >=
        CONSTANTS.userRoles.indexOf(roleRequired)) {
        next();
      } else {
        res.status(403).send('Forbidden');
      }
    });
}

/**
 * Attaches the user object to the request if authenticated
 * Otherwise returns 403
 */
function isAuthenticatedOrNot() {
	return compose()
	// Validate jwt
		.use((req, res, next) => {
			if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
				const token = req.headers.authorization.split(' ')[1];
				jwt.verify(token, CONSTANTS.SECRET, (err, decoded) => {
					if (err) {
						req.decodedData = null;
						next();
						return 0;
					}
					db.userToken.find({
						where : {
							user_id : decoded.user_id,
							access_token : token
						}
					}).then((userTokenInfo) => {
						if (userTokenInfo) {
							req.decodedData = decoded;
							next();
							return 0;
						} else {
							req.decodedData = null;
							next();
							return 0;
						}
					}).catch((error) => {
						return res.status(403).json({ message : error });
					});
				});
			} else {
				req.decodedData = null;
				next();
				return 0;
			}
			return 0;
		});
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.isAuthenticatedOrNot = isAuthenticatedOrNot;
