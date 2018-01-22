'use strict';

module.exports = function (sequelize, DataTypes) {
	const userCuisinePreferences = sequelize.define('userCuisinePreferences', {
		user_cuisine_preferences_id: {
			type:  DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4
		},
		cuisine_info_id : {
			type: DataTypes.UUID,
			allowNull: false,
			references : {
				model : 'cuisineInfo',
				key : 'cuisine_info_id',
				onUpdate: 'cascade',
				onDelete: 'cascade'
			}
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
		is_cusine_like : {
			type: DataTypes.BOOLEAN
		},
		is_cusine_favourite : {
			type: DataTypes.BOOLEAN
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName:true,
		tableName:'userCuisinePreferences'
	});
	return userCuisinePreferences;
};
