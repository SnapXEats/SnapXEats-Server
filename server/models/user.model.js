'use strict';

module.exports = function (sequelize, DataTypes) {
  const users = sequelize.define('users', {

    user_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    social_id : {
      type: DataTypes.STRING,
      allowNull: false
    },
    name : {
      type: DataTypes.STRING,
      allowNull: false
    },
    access_token : {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user_image_url : {
      type: DataTypes.TEXT
    },
    social_platform : {
      type: DataTypes.STRING,
      allowNull: false
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
