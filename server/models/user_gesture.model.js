'use strict';
let CONSTANTS = require('./../../lib/constants');

module.exports = function (sequelize, DataTypes) {
  const userGestures = sequelize.define('userGestures', {
    user_gesture_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id : {
      type: DataTypes.UUID,
      allowNull: false,
      references : {
        model : 'users',
        key : 'user_id',
        onUpdate: 'cascade',
        onDelete: 'cascade'
      }
    },
    restaurant_dish_id : {
      type: DataTypes.UUID,
      allowNull: false,
      references : {
        model : 'restaurantDish',
        key : 'restaurant_dish_id',
        onUpdate: 'cascade',
        onDelete: 'cascade'
      }
    },
    gesture_type : {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status : {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:CONSTANTS.DB.STATUS.ACTIVE
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'userGestures'
  });
  return userGestures;
};
