'use strict';

module.exports = function (sequelize, DataTypes) {
  const cusineInfo = sequelize.define('cusineInfo', {

    cusine_info_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    cusine_name : {
      type: DataTypes.STRING,
      allowNull: false
    },
    cusine_image_url : {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'cusineInfo'
  });

  return cusineInfo;
};
