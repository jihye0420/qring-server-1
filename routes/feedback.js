const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback');

const auth = require('../middleware/auth');


router.get('/question/list', auth.checkToken, async (req, res, next) => {
    const userEmail = req.email
    const decoded = req.decoded
    console.log(userEmail)
    console.log(decoded)
    //await feedbackController.readAll
});

router.post('/question', auth.checkToken, feedbackController.create);


//router.post('/question', feedbackController.create);
//router.put('/question', feedbackController.update);
//router.delete('/question', feedbackController.remove);

module.exports = router;