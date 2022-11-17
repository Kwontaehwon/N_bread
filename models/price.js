const Sequelize = require('sequelize');

module.exports = class Price extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            lPrice: { //snsType 
                type: Sequelize.JSON(),
                allowNull: false,
            },
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Price',
            tableName: 'prices',
            paranoid: true,
            charset: 'utf8', //mb4 적용해야지 이모티콘 사용 가능
            collate: 'utf8_general_ci',
        });
    }

    static associate(db) {
        db.Price.belongsTo(db.Deal, { foreignKey: { name: 'dealId', targetKey: 'id' }, onDelete: 'CASCADE' });

        //db.Comment.belongsTo(db.Comment,{as : 'Reply',foreignKey : 'parentId'});
        //db.Comment.hasMany(db.Comment, { as: 'Reply', sourceKey: 'id', useJunctionTable: false});
    }
};
