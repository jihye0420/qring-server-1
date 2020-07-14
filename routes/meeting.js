const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meeting");
const upload = require("../middleware/multer");
const auth = require("../middleware/auth");

//첫 모임 생성
router.post(
  "/",
  auth.checkToken,
  upload.single("image"),
  meetingController.createNewGroup
);

//이어서 모임 생성 groupId
router.post(
  "/:groupid",
  auth.checkToken,
  upload.single("image"),
  meetingController.createNewMeeting
);

//이어서 모임 생성 groupId (image:"url")
router.post('/imageurl/:groupid', auth.checkToken, meetingController.createNewMeetingImageUrl);

//모임 시간 확인
<<<<<<< HEAD
router.get("/time", auth.checkToken, meetingController.time);
=======
router.post('/info/time', auth.checkToken, meetingController.time);
>>>>>>> cbf2f6dd0be91d1d7f75e701a03c08e06ab59f01

//이어서 생성시 모임 정보 조회 meetingId
router.get(
  "/info/:groupid/:meetingid",
  auth.checkToken,
  meetingController.getInfo
);

//모임 정보 수정 meetingId
<<<<<<< HEAD
router.put(
  "/info/:meetingid",
  auth.checkToken,
  upload.single("image"),
  meetingController.putInfo
);
=======
router.put('/info/:groupid/:meetingid', auth.checkToken, upload.single('image'), meetingController.putInfo);

//모임 정보 수정 meetingId (image:"url")
router.put('/info/imageurl/:groupid/:meetingid', auth.checkToken, upload.single('image'), meetingController.putInfoImageUrl);
>>>>>>> cbf2f6dd0be91d1d7f75e701a03c08e06ab59f01

// 모임삭제 meetingId
router.delete(
  "/:groupid/:meetingid",
  auth.checkToken,
  meetingController.deleteMeeting
);

//모임 리스트, 내 모임, 이어서 생성시
router.get("/list", auth.checkToken, meetingController.list);

<<<<<<< HEAD
//모임 회차 정보 조회 groupId
router.get("/list/:groupid", auth.checkToken, meetingController.round);
=======
//가까운 모임 socket
router.get('/list/proceed', auth.checkToken,meetingController.ProceedMeeting);

//모임 회차 정보 조회 groupId 
router.get('/list/:groupid', auth.checkToken, meetingController.round);
>>>>>>> cbf2f6dd0be91d1d7f75e701a03c08e06ab59f01

module.exports = router;
