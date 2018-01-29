'use strict';

module.exports = function (sequelize, DataTypes) {
	const foodTypeInfo = sequelize.define('foodTypeInfo', {
		food_type_info_id: {
			type: DataTypes.UUID,
			allowNull: false,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4
		},
		food_name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		food_image_url : {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName: true,
		tableName: 'foodTypeInfo'
	});
	return foodTypeInfo;
};
