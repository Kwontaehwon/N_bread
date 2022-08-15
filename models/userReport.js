const Sequelize = require('sequelize');

module.exports = class UserReport extends Sequelize.Model {
  static init(sequelize) { 
    return super.init({
      content: {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      title:{
        type: Sequelize.STRING(),
        allowNull: true,
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'UserReport',
      tableName: 'userReports',
      paranoid: true,
      charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Group.belongsTo(db.User, { foreignKey : 'reporterId', targetKey : 'id' } );
  }
};