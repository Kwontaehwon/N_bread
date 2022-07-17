const Sequelize = require('sequelize');

module.exports = class Reply extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            content: { //snsType 
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            isDeleted: {
                type: Sequelize.INTEGER,
                allowNull: true,
            }
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Reply',
            tableName: 'replies',
            paranoid: true,
            charset: 'utf8', //mb4 적용해야지 이모티콘 사용 가능
            collate: 'utf8_general_ci',
        }); 
    }

    static associate(db) { 
        db.Reply.belongsTo(db.Deal, { foreignKey: 'dealId', targetKey: 'id' });
        db.Reply.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id' });
        db.Reply.belongsTo(db.Comment, { foreignKey: 'parentId', targetKey: 'id' });
        
    }
};
