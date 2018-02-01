'use strict';

module.exports = function (sequelize, DataTypes) {
	const userToken = sequelize.define('userToken', {
		user_token_id: {
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
		access_token : {
			type: DataTypes.TEXT
		}
	}, {
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName:true,
		tableName:'userToken'
	});
	return userToken;
};
