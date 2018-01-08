'use strict';

module.exports = function (sequelize, DataTypes) {
  const restaurantTiming = sequelize.define('restaurantTiming', {

    restaurant_timing_id: {
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
    restaurant_open_time : {
      type: DataTypes.STRING,
      allowNull: false
    },
    restaurant_close_time : {
      type: DataTypes.STRING,
      allowNull: false
    },
    restaurant_time_day : {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'restaurantTiming'
  });

  return restaurantTiming;
};
