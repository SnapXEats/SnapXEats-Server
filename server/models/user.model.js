'use strict';

const CONSTANTS = require('./../../lib/constants');

module.exports = function (sequelize, DataTypes) {
  const users = sequelize.define('users', {

    user_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    social_id : {
      type: DataTypes.STRING
    },
    name : {
      type: DataTypes.STRING,
      allowNull: false
    },
    password : {
      type: DataTypes.STRING
    },
    access_token : {
      type: DataTypes.TEXT
    },
    user_image_url : {
      type: DataTypes.TEXT
    },
    social_platform : {
      type: DataTypes.STRING
    },
    login_type : {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: CONSTANTS.LOGIN_TYPE.SOCIAL
    },
    user_type : {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: CONSTANTS.USER_TYPE.LOCAL
    },
    status : {
      type : DataTypes.STRING,
      allowNull : false,
      defaultValue : CONSTANTS.DB.STATUS.ACTIVE
    },
    salt : {
      type : DataTypes.STRING
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'users'
  });

  return users;
};
