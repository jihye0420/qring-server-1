const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middleware/auth');

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


module.exports = router;