const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

const router = express.Router();

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password, money, birth} = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect('/join?joinError=이미 가입된 이메일입니다.');
    }
    // 만나이 계산하기
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
  // 미성년자일 경우 회원가입 불가
    if (calcAge(birth)<19){
      return res.redirect('/join?joinError=미성년자는 가입할 수 없습니다.');
    }
    
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
      money,
      birth,
    });
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

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

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;