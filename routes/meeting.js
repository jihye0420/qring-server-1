const express = require('express');
const router = express.Router();
const util = require('../modules/util');
const meetingController = require('../controllers/meeting');
const upload = require('../modules/multer');

router.post('/create',upload.single('image'),meetingController.create);
// router.get('/list',meetingController.list);
router.get('/info/:id',meetingController.getInfo);
router.put('/info/:id',meetingController.putInfo);
// router.get('/result',meetingController.result);

module.exports = router;