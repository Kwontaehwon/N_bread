const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      email: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider: { //snsType
        type: Sequelize.STRING(),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: Sequelize.STRING(),
        allowNull: true,
      },
      accessToken: {
        type: Sequelize.STRING(),
        allowNull: true,
      },
      curLocation1:{
        type:Sequelize.STRING(),
        allowNull:true,
      },
      curLocation2: {
        type: Sequelize.STRING(),
        allowNull: true,
      },
      curLocation3: {
        type: Sequelize.STRING(),
        allowNull: true,
      },
      userStatus:{
        type: Sequelize.STRING (),
        allowNull: true,
      },
      refreshToken: {
        type : Sequelize.STRING(),
        allowNull : true
      }
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.Group, { foreignKey : 'userId', sourceKey : 'id' } );
    db.User.hasOne(db.Deal, { foreignKey: 'userId', sourceKey : 'id' });
    db.User.hasMany(db.Comment, { foreignKey: 'userId', sourceKey: 'id' });
    db.User.hasMany(db.DealReport, { foreignKey : 'reporterId', sourceKey : 'id' } );
  }
};
