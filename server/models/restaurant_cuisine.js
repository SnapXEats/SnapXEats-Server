'use strict';

module.exports = function (sequelize, DataTypes) {
	const restaurantCuisine = sequelize.define('restaurantCuisine', {
		
		restaurant_cuisine_id: {
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
		restaurant_info_id : {
			type: DataTypes.UUID,
			allowNull: false,
			references : {
				model : 'restaurantInfo',
				key : 'restaurant_info_id',
				onUpdate: 'cascade',
				onDelete: 'cascade'
			}
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName:true,
		tableName:'restaurantCuisine'
	});
	
	return restaurantCuisine;
};
