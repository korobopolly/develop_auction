const { Op } = require('Sequelize');

const { Good, Auction, User, sequelize } = require('./models');

module.exports = async () => {
  console.log('checkAuction');
  try {
    const yesterday = new Date();

    // 어제 시간
    if(yesterday.getHours < 3){
      yesterday.setDate(yesterday.getDate()-1);
      if(yesterday.getHours()==2){
        yesterday.setHours(23)
      }
      if(yesterday.getHours()==1){
        yesterday.setHours(22)
      }
      if(yesterday.getHours()==0){
        yesterday.setHours(21)
      }
    }
    else{
      yesterday.setHours(yesterday.getHours()-3)
    }

    // tartgets에 상품 데이터 베이스에서 SoldId가 null인 것을 가져온다.
    const targets = await Good.findAll({
      where: {
        SoldId: null,
        createdAt: { [Op.lte]: yesterday },
      },
    });
    targets.forEach(async (target) => {
      const success = await Auction.findOne({
        where: { GoodId: target.id },
        order: [['bid', 'DESC']],
      });
      // 상품의 SoldId를 낙찰자 Id로 바꾼다.
      await Good.update({ SoldId: success.UserId }, { where: { id: target.id } });
      // 사용자의 보유 자산에서 낙찰금을 빼서 저장한다.
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`),
      }, {
        where: { id: success.UserId },
      });
    });
  } catch (error) {
    console.error(error);
  }
};