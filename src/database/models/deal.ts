const Sequelize = require('sequelize');

class Deal extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        //이미지,링크, written 처리,status처리
        loc3: {
          type: Sequelize.STRING(),
          allowNull: false,
        },
        mystatus: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        title: {
          type: Sequelize.STRING(),
          allowNull: false,
        },
        link: {
          type: Sequelize.STRING(),
          allowNull: false,
        },
        totalPrice: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        personalPrice: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        currentMember: {
          // 관계식으로 작성해야되나.?
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        totalMember: {
          // member가 아니라 amount가 적절한 말. + 추가적으로 currentMemeber를 따로 저장할것인가?
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        dealDate: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        dealPlace: {
          // dealSpot? 장소 테이블을 하나더 만들어야하나.
          type: Sequelize.STRING(),
          allowNull: false,
        },
        content: {
          type: Sequelize.STRING(),
          allowNull: false,
        },
        status: {
          type: Sequelize.STRING(),
          allowNull: false,
          defaultValue: '모집중',
        },
        loc1: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        loc2: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        isCertificated: {
          type: Sequelize.BOOLEAN(),
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        // 글 삭제 여부(추가?) ||  작성시간(timestamp?), 현재모집인원(수정 필요),
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'Deal',
        tableName: 'deals',
        paranoid: true,
        charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
        collate: 'utf8mb4_general_ci',
      },
    );
  }

  static associate(db) {
    db.Deal.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id' });
    db.Deal.hasMany(db.Group, { foreignKey: 'dealId', sourceKey: 'id' });
    db.Deal.hasMany(db.Comment, {
      foreignKey: { name: 'dealId', sourceKey: 'id' },
      onDelete: 'CASCADE',
    });
    db.Deal.hasMany(db.DealImage, {
      foreignKey: { name: 'dealId', sourceKey: 'id' },
    });
    db.Deal.hasMany(db.DealReport, { foreignKey: 'dealId', sourceKey: 'id' });
    db.Deal.hasMany(db.Price, { foreignKey: 'dealId', sourceKey: 'id' });
  }
}

export { Deal };
