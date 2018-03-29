'use strict';

module.exports = function (sequelize, DataTypes) {
  const userRewardDish = sequelize.define('userRewardDish', {
    user_reward_dish_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_reward_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      references : {
        model : 'userRewards',
        key : 'user_reward_id',
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
    tableName:'userRewardDish'
  });
  return userRewardDish;
};
