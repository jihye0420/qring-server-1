const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const qrcodeController = require("../controllers/qrcode");

/**
 * QR 코드 생성
 */
router.get("/:meetingId", auth.checkToken, qrcodeController.makeQrcode);

/**
 * 웹 출석 폼 제출
 */
router.post("/:meetingId", qrcodeController.submitForm);

/**
 * 관리자가 직접 사용자 추가
 */
router.post("/add/:meetingId", qrcodeController.addUser);

router.get("/check/:meetingId", qrcodeController.userCheck);
router.post("/feedback/:meetingId", qrcodeController.feedbackCheck);

module.exports = router;
