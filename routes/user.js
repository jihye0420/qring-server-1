const express = require('express');
const router = express.Router();
const util = require('../modules/util');
const jwt = require('../modules/jwt');
const userController = require('../controllers/user');
const adminModel = require('../models/admin');
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


module.exports = router;