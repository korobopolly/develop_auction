// 상품 모델

// 'sequelize' 모듈을 받아온다.
const Sequelize = require('sequelize');

module.exports = class Good extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      // 상품 이름 정보
      name: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      // 상품 사진 정보
      img: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      // 경매 시작 금액 정보
      price: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'Good',
      tableName: 'goods',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

   // 데이터 베이스 및 서버와 모델을 연결한다.
  static associate(db) {
    // 사용자 모델과 상품 모델 간에는 일대다 관계가 적용되므로 Owner와 Sold로 나누어 적용
    // 상품 등록자
    db.Good.belongsTo(db.User, { as: 'Owner' });
    // 낙찰자
    db.Good.belongsTo(db.User, { as: 'Sold' });
    db.Good.hasMany(db.Auction);
  }
};