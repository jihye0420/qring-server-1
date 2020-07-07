const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middleware/auth');

/**
 * 이메일 중복 확인
 */
router.get('/email', userController.checkEmail);

/**
 * 회원 가입
 */
router.post('/signup', userController.signUp);

/**
 * 이메일 인증
 */
router.get("/auth", userController.authenticate);

/**
 * 로그인
 */
router.post("/signin", userController.signIn);


/**
 * 프로필 수정
 */
router.post("/profile", auth.checkToken, userController.editProfile);

/**
 * 프로필 읽기
 */
router.get("/profile", auth.checkToken, userController.readProfile);

module.exports = router;