'use strict';

const Umzug = require('umzug');
const Sequelize = require('sequelize');

const sequlizeInstance = new Sequelize('swaggertry', 'root', 'Niks@123');
const umzug = new Umzug({

  storage: 'sequelize',

  storageOptions: {
    sequelize: sequlizeInstance,
  },

  migrations: {
    params: [sequlizeInstance.getQueryInterface(), sequlizeInstance.constructor, () => {
      throw new Error('Migration tried to use old style "done" callback. ' +
        'Please upgrade to "umzug" and return a promise instead.');
    }],
    path: './migrations',
    pattern: /\.js$/
  }

});

umzug.up().then(() => {
  console.log('Migration complete!');
});
