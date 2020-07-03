const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

const auth = require('../middleware/auth');

// 피드백 질문 목록
router.post('/question/:id', auth.checkToken, feedbackController.create);


module.exports = router;