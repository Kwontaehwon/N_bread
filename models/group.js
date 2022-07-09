const Sequelize = require('sequelize');

module.exports = class Group extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
       amount : {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Group',
      tableName: 'groups',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Group.belongsTo(db.User,{ foreignKey : 'userId', sourceKey : 'id' } );
    db.Group.belongsTo(db.Deal, { foreignKey : 'dealId', sourceKey : 'id' });
  }
};
