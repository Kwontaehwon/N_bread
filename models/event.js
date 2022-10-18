const Sequelize = require('sequelize');

module.exports = class Event extends Sequelize.Model {
  static init(sequelize) { 
    return super.init({ //이미지,링크, written 처리,status처리
      title : {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      eventImage: { 
        type: Sequelize.STRING(),
      },
      type : {
        type: Sequelize.STRING(),
        allowNull: false,
      },
      target : {
        type: Sequelize.STRING(),
        allowNull: false,
      },
    eventStatus : {
        type : Sequelize.INTEGER(),
        allowNull : false,
        defaultValue : -1
      }
    }, { // 글 삭제 여부(추가?) ||  작성시간(timestamp?), 현재모집인원(수정 필요), 
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Event',
      tableName: 'events',
      paranoid: true,
      charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {

  }
};
