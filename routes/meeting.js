const express = require('express');
const router = express.Router();
const util = require('../modules/util');
const meetingController = require('../controllers/meeting');
const upload = require('../modules/multer');

router.post('/create',upload.single('image'),meetingController.createNewGroup);
router.post('/create/:id',upload.single('image'),meetingController.createNewMeeting);
router.get('/info/:id',meetingController.getInfo);
router.put('/info/:id',upload.single('image'),meetingController.putInfo);
router.get('/list/:id',meetingController.list);
// router.get('/result',meetingController.result);

module.exports = router;