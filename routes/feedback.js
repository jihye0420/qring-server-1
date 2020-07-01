const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

router.get('/question/list', feedbackController.readAll);
router.post('/question', feedbackController.create);
//router.put('/question', feedbackController.update);
//router.delete('/question', feedbackController.remove);

module.exports = router;