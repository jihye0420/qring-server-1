const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

const auth = require('../middleware/auth');

// 피드백 질문들 생성
router.post('/question/:meetingId', auth.checkToken, feedbackController.create);

// 피드백 질문 목록(현재 피드백 목록 가져와야할 때,)
router.get('/question/:meetingId', auth.checkToken, feedbackController.readAll);

// 피드백 결과 목록
router.post('/result/:meetingId', auth.checkToken, feedbackController.postResult);

// 피드백 결과 목록
router.get('/result/:meetingId', auth.checkToken, feedbackController.getResult);

// 모임원이 결과를 제출했을 때, 결과를 받는 url이 필요
router.post("/submission/:groupId/:meetingId", feedbackController.submitResult);

// 단답형만 결과 목록 더 보여야함
router.get('/result/more/:feedbackId', auth.checkToken, feedbackController.shortAnswer);

module.exports = router;