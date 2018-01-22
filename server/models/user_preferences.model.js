'use strict';

module.exports = function (sequelize, DataTypes) {
	const userPreferences = sequelize.define('userPreferences', {
		user_preferences_id: {
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
		restaurant_rating : {
			type: DataTypes.INTEGER
		},
		restaurant_price : {
			type: DataTypes.STRING
		},
		restaurant_distance : {
			type: DataTypes.INTEGER
		},
		sort_by_distance : {
			type: DataTypes.BOOLEAN
		},
		sort_by_rating : {
			type: DataTypes.BOOLEAN
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName:true,
		tableName:'userPreferences'
	});
	return userPreferences;
};
