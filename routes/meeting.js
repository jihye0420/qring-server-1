const express = require('express');
const router = express.Router();
const util = require('../modules/util');
const meetingController = require('../controllers/meeting');
const upload = require('../modules/multer');

//첫 모임 생성
router.post('/create',upload.single('image'),meetingController.createNewGroup);

//이어서 모임 생성
router.post('/create/:id',upload.single('image'),meetingController.createNewMeeting);

//모임 정보 조회
router.get('/info/:id',meetingController.getInfo);

//모임 정보 수정
router.put('/info/:id',upload.single('image'),meetingController.putInfo);

//모임 회차 정보 조회
router.get('/list/:id/:round',meetingController.round);
// router.get('/result',meetingController.result);

module.exports = router;