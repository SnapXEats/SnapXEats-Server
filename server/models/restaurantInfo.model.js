'use strict';

module.exports = function (sequelize, DataTypes) {
  const restaurantInfo = sequelize.define('restaurantInfo', {

    restaurant_info_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    restaurant_google_id : {
      type: DataTypes.TEXT,
      allowNull: false
    },
    restaurant_place_id : {
      type: DataTypes.TEXT,
      allowNull: false
    },
    restaurant_name: {
      type : DataTypes.STRING,
      allowNull : false
    },
    location_lat : {
      type : DataTypes.FLOAT,
      allowNull : false
    },
    location_long : {
      type : DataTypes.FLOAT,
      allowNull : false
    },
    restaurant_price : {
      type : DataTypes.INTEGER
    },
    restaurant_address : {
      type : DataTypes.TEXT,
      allowNull : false
    },
    restaurant_contact_no : {
      type : DataTypes.BIGINT,
      allowNull : false
    },
    restaurant_rating : {
      type : DataTypes.FLOAT,
      allowNull : false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'restaurantInfo'
  });

  return restaurantInfo;
};
