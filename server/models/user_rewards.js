'use strict';

module.exports = function (sequelize, DataTypes) {
  const userRewards = sequelize.define('userRewards', {
    user_reward_id: {
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
    reward_type : {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reward_point : {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    restaurant_dish_id : {
      type: DataTypes.UUID,
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
    tableName:'userRewards'
  });
  return userRewards;
};
