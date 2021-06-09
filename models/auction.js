// 경매 모델

// 'sequelize' 모듈을 받아온다.
const Sequelize = require('sequelize');

module.exports = class Good extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      // 입찰 금액 정보
      bid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // 메시지 정보
      msg: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'Auction',
      tableName: 'auctions',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  // 데이터 베이스 및 서버와 모델을 연결한다.
  static associate(db) {
    db.Auction.belongsTo(db.User);
    db.Auction.belongsTo(db.Good);
  }
};