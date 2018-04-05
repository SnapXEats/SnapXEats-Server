'use strict';

module.exports = function (sequelize, DataTypes) {
  const userSmartPics = sequelize.define('userSmartPics', {
    user_smart_pic_id: {
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
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'userSmartPics'
  });
  return userSmartPics;
};
