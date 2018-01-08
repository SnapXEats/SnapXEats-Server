'use strict';

module.exports = function (sequelize, DataTypes) {
  const restaurantDish = sequelize.define('restaurantDish', {

    restaurant_dish_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    restaurant_info_id : {
      type: DataTypes.UUID,
      allowNull: false,
      references : {
        model : 'restaurantInfo',
        key : 'restaurant_info_id',
        onUpdate: 'cascade',
        onDelete: 'cascade'
      }
    },
    dish_image_url : {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'restaurantDish'
  });

  return restaurantDish;
};
