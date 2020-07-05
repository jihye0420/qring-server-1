const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

const auth = require('../middleware/auth');

// 피드백 질문들 생성
router.post('/question/:id', auth.checkToken, feedbackController.create);

// 피드백 질문 목록
router.get('/question/:id', auth.checkToken, feedbackController.readAll);

// 피드백 결과 목록
router.get('/feedback/result/:id/:round', auth.checkToken, feedbackController.result);

module.exports = router;