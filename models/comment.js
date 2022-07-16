const Sequelize = require('sequelize');

module.exports = class Comment extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            content: { //snsType
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'local',
            },
            isDeleted: {
                type: Sequelize.STRING(70),
                allowNull: true,
            },
        }, {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Comment',
            tableName: 'comments',
            paranoid: true,
            charset: 'utf8', //mb4 적용해야지 이모티콘 사용 가능
            collate: 'utf8_general_ci',
        });
    }

    static associate(db) {
        db.Comment.belongsTo(db.Deal,{ foreignKey: 'dealId', targetKey: 'id' }); 
        db.Comment.belongsTo(db.User, { foreignKey: 'UserId', targetKey: 'id' }); //comment테이블에 dealId, userId각각 추가
        db.Comment.belongsTo(db.Comment,{as : 'reply',though : 'comment_reply'});
    }
};
