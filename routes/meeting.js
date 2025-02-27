const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting');
const upload = require('../middleware/multer');
const auth = require('../middleware/auth');

//첫 모임 생성
router.post('/', auth.checkToken, upload.single('image'), meetingController.createNewGroup);

//이어서 모임 생성 groupId
router.post('/:groupid', auth.checkToken, upload.single('image'), meetingController.createNewMeeting);

//모임 시간 확인
router.post('/info/time', auth.checkToken, meetingController.time);

//회차 보기에서 각 meeting 정보 조회
router.get('/info/:meetingid', auth.checkToken, meetingController.getInfoInRound);

//이어서 생성시 모임 정보 조회 meetingId
router.get('/info/:groupid/:meetingid', auth.checkToken, meetingController.getInfo);

//모임 정보 수정 meetingId
router.put('/info/:groupid/:meetingid', auth.checkToken, upload.single('image'), meetingController.putInfo);

// 모임삭제 
router.delete('/:groupid/:meetingid', auth.checkToken, meetingController.deleteMeeting);

//모임 리스트, 내 모임, 이어서 생성시
router.get('/list', auth.checkToken, meetingController.list);

//가까운 모임 socket
router.get('/list/proceed', auth.checkToken, meetingController.ProceedMeeting);

//모임 회차 정보 조회 groupId 
router.get('/list/:groupid', auth.checkToken, meetingController.round);

// qr코드 확인
router.get('/qrcode/:meetingId', auth.checkToken, meetingController.getQrcode);


module.exports = router;