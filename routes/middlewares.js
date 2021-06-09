// 로그인이 되었을 때
exports.isLoggedIn = (req, res, next) => {
  // 사용자가 로그인 했을 때
  if (req.isAuthenticated()) {
    next();
  } 
  //사용자가 로그인하지 않았을 때
  else {
    res.redirect('/?loginError=로그인이 필요합니다.');
  }
};

// 로그인이 되지 않았을 때
exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } 
  // 다시
  else {
    res.redirect('/');
  }
};
