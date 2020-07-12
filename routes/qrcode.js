const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const qrcodeController = require("../controllers/qrcode");

/**
 * QR 코드 생성
 */

router.get("/feedback/:meetingId", qrcodeController.feedbackCheck);

router.get(
  "/:groupId/:meetingId",
  auth.checkToken,
  qrcodeController.makeQrcode
);

router.post("/checkresult/:meetingId", qrcodeController.confirm); // 삭제예정

/**
 * 웹 출석 폼 제출
 */
router.post("/:groupId/:meetingId", qrcodeController.submitForm);

/**
 * 관리자가 직접 사용자 추가
 */

router.post("/:meetingId", auth.checkToken, qrcodeController.addUser);

router.get("/check/:groupId/:meetingId", qrcodeController.userCheck);

module.exports = router;
