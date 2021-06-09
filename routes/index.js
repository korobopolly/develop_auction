const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');
const passport = require('passport');

const { Good, Auction, User } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

// 라우터에서 현재 사용자의 정보를 받아온다.
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const goods = await Good.findAll({ where: { SoldId: null } });
    res.render('main', {
      title: 'NodeAuction',
      goods,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// join.html과 랜더링
router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeAuction',
  });
});

// good.html과 랜더링
router.get('/good', isLoggedIn, (req, res) => {
  res.render('good', { title: '상품 등록 - NodeAuction' });
});

// uploads 폴더에 상품 이미지를 등록한다.
try {
  fs.readdirSync('uploads');
} catch (error) {
  // 폴더가 없다면 폴더를 생성한다.
  console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
  fs.mkdirSync('uploads');
}
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 상품
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price } = req.body;
    // 상품 데이터 베이스에 OwnerId, name, img, price값을 생성한다.
    const good = await Good.create({
      OwnerId: req.user.id,
      name,
      img: req.file.filename,
      price,
    });

    // end에 새로운 시간을 저장한다.
    const end = new Date();

    // 3시간 뒤
    if(end.getHours < 21){
      end.setHours(end.getHours + 3);
    }
    else{
      end.setDate(end.getDate() + 1);
      if(end.getHours == 21)
        end.setHours(0);
      if(end.getHours == 22)
        end.setHours(1);
      if(end.getHours == 23)
        end.setHours(2);
    }
    
    // 시간이 종료됐을 때, 스케쥴링
    schedule.scheduleJob(end, async () => {
      // 옥션 데이터 베이스에서 정보를 받아온다.
      const success = await Auction.findOne({
        where: { GoodId: good.id },
        order: [['bid', 'DESC']],
      });
      // 상품에 관한 정보를 업데이트 한다.
      // SoldId에 낙찰자의 Id 저장한다.
      await Good.update({ SoldId: success.UserId }, { where: { id: good.id } });
      // 낙찰자에 관한 정보를 업데이트 한다.
      // 보유 자산에서 낙찰금을 빼 저장한다.
      await User.update({
        money: sequelize.literal(`money - ${success.bid}`),
      }, {
        where: { id: success.UserId },
      });
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 상품 id 라우터
router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  try {
    // Owner로 되어있는 유저 모델의 상품을 가져온다.
    const [good, auction] = await Promise.all([
      Good.findOne({
        where: { id: req.params.id },
        include: {
          model: User,
          as: 'Owner',
        },
      }),
      // 옥션에서 입찰금을 가져온다.
      Auction.findAll({
        where: { goodId: req.params.id },
        include: { model: User },
        order: [['bid', 'ASC']],
      }),
    ]);
    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 경매에 관한 라우터
router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.findOne({
      where: { id: req.params.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    }); 
   
    // 상품 등록자가 입찰을 할 수 없도록 한다.
    if(good.OwnerId == req.user.id){
      // '상품 등록자는 입찰할 수 없습니다'라는 메시지를 출력한다.
      return res.status(403).send('상품 등록자는 입찰할 수 없습니다.');
    }
    
    // 입찰 금액이 시작 가격보다 낮을 경우
    if (good.price >= bid) {
      // '시작 가격보다 높게 입찰해야 합니다.'라는 메시지를 출력한다.
      return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
    }

    // 입찰가가 시작 가격보다 높지만 1000원 단위가 아닐 경우
    if(bid >= good.price){
      if(bid % 1000 != 0)
      // '1000원 단위로 입찰할 수 있습니다.'라는 메시지를 출력한다.
      return res.status(403).send('1000원 단위로 입찰할 수 있습니다.');
    }

    // 경매가 종료된 후 입찰을 시도할 경우
    if (new Date(good.createdAt).valueOf() + (3 * 60 * 60 * 1000) < new Date()) {
      // '경매가 이미 종료되었습니다'라는 메시지를 출력한다.
      return res.status(403).send('경매가 이미 종료되었습니다');
    }

    // 입찰가가 이전 입찰가보다 낮을 경우
    if (good.Auctions[0] && good.Auctions[0].bid >= bid) {
      // '이전 입찰가보다 높아야 합니다'라는 메시지를 출력한다.
      return res.status(403).send('이전 입찰가보다 높아야 합니다');
    }

    // 현재 입찰가가 시작 가격보다 100배 이상일 경우 입찰가 단위를 높인다.
    if(good.Auctions[0] && good.Auctions[0].bid >= 100 * good.price)
    {
      if(good.Auctions[0]+9999 && good.Auctions[0].bid+9999 >= bid){
        // 입찰가가 10000원 단위가 아닐 경우
        if(bid % 10000 != 0)
        // '10000원 단위로 입찰할 수 있습니다.'라는 메시지를 출력한다.
        return res.status(403).send('10000원 단위로 입찰할 수 있습니다.');
      }
    }
    // 현재 입찰가가 시작 가격보다 100배 이상이 아닐 경우 입찰가 단위를 1000원으로 한다.
    else{
      // 기존 입찰가보다 1000원 이상 높아야 입찰할 수 있도록 한다.
       if(good.Auctions[0]+999 && good.Auctions[0].bid+999 >= bid) {
        // 입찰가가 1000원 단위가 아닐 경우
        if(bid % 1000 != 0)
        // '1000원 단위로 입찰할 수 있습니다.'라는 메시지를 출력한다.
        return res.status(403).send('1000원 단위로 입찰할 수 있습니다.');
      }
    }
    
    // 보유 자산보다 입찰가가 높을 경우
    if(req.user.money < bid){
      // '보유 자산보다 낮아야 합니다.'라는 메시지를 출력한다.
      return res.status(403).send('보유 자산보다 낮아야 합니다.');
    }

    const result = await Auction.create({
      bid,
      msg,
      UserId: req.user.id,
      GoodId: req.params.id,
    });

    // 실시간으로 입찰 내역 전송
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 사용자가 낙찰한 상품 목록
router.get('/list', isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({
      where: { SoldId: req.user.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    res.render('list', { title: '낙찰 목록 - NodeAuction', goods });
  } catch (error) {
    console.error(error);
    next(error);
  }
});


// 낙찰된 목록 보여주기
router.get('/endlist', isLoggedIn, async (req, res, next) => {
  try {
    const Op = require('sequelize').Op;
    const goods = await Good.findAll({
      where: {SoldId: {[Op.ne]: null}},      // SoldId가 null이 아닐 경우
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    res.render('list', { title: '경매 종료 목록 - NodeAuction', goods });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 라우터 모듈을 내보낸다.
module.exports = router;