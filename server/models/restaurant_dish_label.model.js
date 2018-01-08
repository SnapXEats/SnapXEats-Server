'use strict';

module.exports = function (sequelize, DataTypes) {
  const restaurantDishLabel = sequelize.define('restaurantDishLabel', {

    restaurant_dish_label_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    dish_label : {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'restaurantDishLabel'
  });

  return restaurantDishLabel;
};
