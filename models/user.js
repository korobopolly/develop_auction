// 사용자 모델

// 'sequelize' 모듈을 받아온다.
const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      // 이메일 정보
      email: {
        type: Sequelize.STRING(40),
        allowNull: false,
        unique: true,
      },
      // 닉네임 정보
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      // 비밀번호 정보
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      // 보유자산 정보
      money: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      // 유저 모델에 생년월일을 저장한다.
      birth: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    }, {
      sequelize,
      timestamps: true,
      paranoid: true,
      modelName: 'User',
      tableName: 'users',
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

   // 데이터 베이스 및 서버와 모델을 연결한다.
  static associate(db) {
    db.User.hasMany(db.Auction);
  }
};