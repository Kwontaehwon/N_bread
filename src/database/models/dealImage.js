const Sequelize = require('sequelize');

module.exports = class DealImage extends Sequelize.Model {
    static init(sequelize) {
        return super.init({ //이미지,링크, written 처리,status처리
            dealId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            dealImage: { // dealSpot? 장소 테이블을 하나더 만들어야하나.
                type: Sequelize.STRING(),
                allowNull: false,
            },
            
        }, { // 글 삭제 여부(추가?) ||  작성시간(timestamp?), 현재모집인원(수정 필요), 
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'DealImage',
            tableName: 'dealImages',
            paranoid: true,
            charset: 'utf8mb4', //mb4 적용해야지 이모티콘 사용 가능
            collate: 'utf8mb4_general_ci',
        });
    }

    static associate(db) {
        db.DealImage.belongsTo(db.Deal, { foreignKey: 'dealId', targetKey: 'id' });
    }
};
