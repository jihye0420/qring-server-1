const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

const auth = require('../middleware/auth');


router.get('/question/list', auth.checkToken, feedbackController.readAll);

router.post('/question', auth.checkToken, feedbackController.create);

//router.put('/question/:id', feedbackController.update);
//router.delete('/question/:id', feedbackController.remove);

module.exports = router;