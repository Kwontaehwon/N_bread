const Sequelize = require('sequelize');

class Group extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        amount: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'Group',
        tableName: 'groups',
        paranoid: true,
        charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
        collate: 'utf8mb4_general_ci',
      },
    );
  }

  static associate(db) {
    db.Group.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id' });
    db.Group.belongsTo(db.Deal, { foreignKey: 'dealId', targetKey: 'id' });
  }
}

export { Group };
