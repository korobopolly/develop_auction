const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = require('../models/user');

// 로그인 
module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email, password, done) => {
    try {
      // 데이터 베이스에서 사용자가 입력한 이메일 정보를 가져온다.
      const exUser = await User.findOne({ where: { email } });
      // 이메일이 존재할 때
      if (exUser) {
        // 사용자가 로그인하기 위해 입력한 이메일과 비밀번호를 데이터 베이스와 비교한다.
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {
          done(null, exUser);
        } else {
          // 이메일에 맞는 비밀번호와 일치하지 않을 때
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
        // 이메일이 데이터 베이스에 존재하지 않을 때
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};