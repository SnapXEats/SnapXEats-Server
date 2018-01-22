'use strict';

module.exports = function (sequelize, DataTypes) {
  const cuisineInfo = sequelize.define('cuisineInfo', {

    cuisine_info_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    cuisine_name : {
      type: DataTypes.STRING,
      allowNull: false
    },
    cuisine_image_url : {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'cuisineInfo'
  });

  return cuisineInfo;
};
