const Sequelize = require('sequelize');

class DealReport extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        content: {
          type: Sequelize.STRING(),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'DealReport',
        tableName: 'dealReports',
        paranoid: true,
        charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
        collate: 'utf8mb4_general_ci',
      },
    );
  }

  static associate(db) {
    db.DealReport.belongsTo(db.User, {
      foreignKey: 'reporterId',
      targetKey: 'id',
    });
    db.DealReport.belongsTo(db.Deal, { foreignKey: 'dealId', targetKey: 'id' });
  }
}

export { DealReport };
