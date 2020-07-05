const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting');
const upload = require('../middleware/multer');
const auth = require('../middleware/auth');

//첫 모임 생성
router.post('/create',auth.checkToken, upload.single('image'), meetingController.createNewGroup);

//이어서 모임 생성
router.post('/create/:id',auth.checkToken, upload.single('image'), meetingController.createNewMeeting);

//모임 정보 조회
router.get('/info/:id',auth.checkToken, meetingController.getInfo);

//모임 정보 수정
router.put('/info/:id',auth.checkToken, upload.single('image'), meetingController.putInfo);

//모임 리스트
//router.get('/list/:id',auth.checkToken,meetingController.list);

//모임 회차 정보 조회
router.get('/list/:round',auth.checkToken, meetingController.round);
// router.get('/result',meetingController.result);

module.exports = router;