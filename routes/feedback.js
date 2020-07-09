const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

const auth = require('../middleware/auth');

// 피드백 질문들 생성
router.post('/question/:meetingId', auth.checkToken, feedbackController.create);

// 피드백 질문 목록(이전 피드백 목록 가져와야할 때,)
router.get('/question/:nowId/:beforeId', auth.checkToken, feedbackController.beforeReadAll);

// 피드백 질문 목록(현재 피드백 목록 가져와야할 때,)
router.get('/question/:nowId', auth.checkToken, feedbackController.newReadAll);

// 피드백 결과 목록
router.get('/result/:meetingId', auth.checkToken, feedbackController.result);

// 단답형만 결과 목록 더 보여야함

module.exports = router;