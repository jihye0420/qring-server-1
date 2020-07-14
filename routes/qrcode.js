const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const qrcodeController = require("../controllers/qrcode");

/**
 * QR 코드 생성
 */

router.get("/feedback/:groupId/:meetingId", qrcodeController.feedbackCheck);

router.get(
  "/:groupId/:meetingId",
  auth.checkToken,
  qrcodeController.makeQrcode
);

/**
 * 웹 출석 폼 제출
 */
router.post("/submission/:groupId/:meetingId", qrcodeController.submitForm);

/**
 * 참석자 정보
 */
router.get(
  "/info/:groupId/:meetingId/:userId",
  auth.checkToken,
  qrcodeController.readUserInfo
);

/**
 * 관리자가 직접 사용자 추가
 */

router.post("/info/:meetingId", auth.checkToken, qrcodeController.addUser);

/**
 * 참석자 정보 수정
 */
router.put(
  "/info/:meetingId/:userId",
  auth.checkToken,
  qrcodeController.updateUser
);

/**
 * 참석자 정보 삭제
 */

router.delete(
  "/info/:meetingId/:userId",
  auth.checkToken,
  qrcodeController.deleteUser
);

router.get("/check/:groupId/:meetingId", qrcodeController.userCheck);

module.exports = router;