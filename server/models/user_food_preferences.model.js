'use strict';

module.exports = function (sequelize, DataTypes) {
	const userFoodPreferences = sequelize.define('userFoodPreferences', {
		user_food_preferences_id: {
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
		food_type_info_id : {
			type: DataTypes.UUID,
			allowNull: false,
			references : {
				model : 'foodTypeInfo',
				key : 'food_type_info_id',
				onUpdate: 'cascade',
				onDelete: 'cascade'
			}
		},
		is_food_like : {
			type: DataTypes.BOOLEAN
		},
		is_food_favourite : {
			type: DataTypes.BOOLEAN
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName:true,
		tableName:'userFoodPreferences'
	});
	return userFoodPreferences;
};
