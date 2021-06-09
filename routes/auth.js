const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

// 회원 가입할 때의 라우터
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  // email, nick, password, money, birth를 저장할 수 있게 한다.
  const { email, nick, password, money, birth} = req.body;
  try {
    // 데이터 베이스에 작성한 이메일이 존재하는 지 확인한다.
    const exUser = await User.findOne({ where: { email } });
    // 존재한다면 redirect 시킨다.
    if (exUser) {
      return res.redirect('/join?joinError=이미 가입된 이메일입니다.');
    }

    // 만나이 계산하는 함수
    function calcAge(birth) {
      var date = new Date();
      var year = date.getFullYear();
      var month = (date.getMonth() + 1);
      var day = date.getDate();
      if (month < 10) month = '0' + month;
      if (day < 10) day = '0' + day;
      var monthDay = month + day;
      birth = birth.replace('-', '').replace('-', '');
      var birthdayy = birth.substr(0, 4);
      var birthdaymd = birth.substr(4, 4);
      var age = monthDay < birthdaymd ? year - birthdayy - 1 : year - birthdayy;
      return age;
  }
  // 미성년자일 경우 회원가입을 불가하게 한다.
    if (calcAge(birth)<19){
      return res.redirect('/join?joinError=미성년자는 가입할 수 없습니다.');
    }
    
    // 입력받은 정보를 토대로 회원 정보를 데이터 베이스에 저장한다.
    // 비밀번호는 hash를 통해 암호화하여 저장한다.
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
      money,
      birth,
    });
    // 회원가입 완료되면 홈 화면으로 돌아간다.
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
    // 오류가 생기면 오류를 반환한다.
  }
});

// 로그인할 때 라우터
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

// 로그아웃할 때 라우터
router.get('/logout', isLoggedIn, (req, res) => {
  // 이용자가 로그아웃을 하면 세션을 없애고 홈 화면으로 돌아가게 한다.
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

// 라우터 모듈을 내보낸다.
module.exports = router;