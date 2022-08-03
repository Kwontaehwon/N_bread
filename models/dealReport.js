const Sequelize = require('sequelize');

module.exports = class DealReport extends Sequelize.Model {
  static init(sequelize) { 
    return super.init({ //이미지,링크, written 처리,status처리
      content: {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      title:{
        type: Sequelize.STRING(),
        allowNull: true,
      }
    }, { // 글 삭제 여부(추가?) ||  작성시간(timestamp?), 현재모집인원(수정 필요), 
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'DealReport',
      tableName: 'dealReports',
      paranoid: true,
      charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Group.belongsTo(db.User, { foreignKey : 'reporterId', targetKey : 'id' } );
    db.Group.belongsTo(db.Deal, { foreignKey: 'dealId', targetKey : 'id' });
  }
};
