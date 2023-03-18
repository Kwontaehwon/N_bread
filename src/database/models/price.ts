const Sequelize = require('sequelize');

class Price extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(),
          allowNull: false,
        },
        link: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        image: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        lPrice: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        hPrice: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        mallName: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        productId: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        productType: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        brand: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        maker: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        category1: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        category2: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        category3: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
        category4: {
          type: Sequelize.STRING(),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: 'Price',
        tableName: 'prices',
        paranoid: true,
        charset: 'utf8', //mb4 적용해야지 이모티콘 사용 가능
        collate: 'utf8_general_ci',
      },
    );
  }

  static associate(db) {
    db.Price.belongsTo(db.Deal, {
      foreignKey: { name: 'dealId', targetKey: 'id' },
      onDelete: 'CASCADE',
    });

    //db.Comment.belongsTo(db.Comment,{as : 'Reply',foreignKey : 'parentId'});
    //db.Comment.hasMany(db.Comment, { as: 'Reply', sourceKey: 'id', useJunctionTable: false});
  }
}

export { Price };
