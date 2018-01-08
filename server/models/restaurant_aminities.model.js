'use strict';

module.exports = function (sequelize, DataTypes) {
  const restaurantAminities = sequelize.define('restaurantAminities', {

    restaurant_aminity_id: {
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
    aminity_name : {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'restaurantAminities'
  });

  return restaurantAminities;
};
