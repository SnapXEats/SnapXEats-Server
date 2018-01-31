'use strict';

module.exports = function (sequelize, DataTypes) {
	const userAddresses = sequelize.define('userAddresses', {
		user_address_id: {
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
		address : {
			type: DataTypes.TEXT,
			allowNull: false
		},
		address_type : {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName:true,
		tableName:'userAddresses'
	});
	return userAddresses;
};
