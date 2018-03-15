'use strict';

module.exports = function (sequelize, DataTypes) {
  const userReview = sequelize.define('userReview', {

    user_review_id: {
      type:  DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    restaurant_dish_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references : {
        model : 'restaurantDish',
        key : 'restaurant_dish_id',
        onUpdate: 'cascade',
        onDelete: 'cascade'
      }
    },
    audio_review_url : {
      type: DataTypes.TEXT
    },
    text_review : {
      type: DataTypes.TEXT
    },
    rating : {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName:true,
    tableName:'userReview'
  });

  return userReview;
};
