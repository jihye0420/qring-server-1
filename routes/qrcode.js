const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const qrcodeController = require("../controllers/qrcode");

/**
 * QR 코드 생성
 */
router.get("/:groupId/:meetingId", auth.checkToken, qrcodeController.makeQrcode);

/**
 * 웹 출석 폼 제출
 */
router.post("/:groupId/:meetingId", qrcodeController.submitForm);

/**
 * 관리자가 직접 사용자 추가
 */
router.post("/:meetingId", auth.checkToken, qrcodeController.addUser);

/**
 * 참석자 정보 수정
 */
router.put("/:meetingId", auth.checkToken, qrcodeController.updateUser);

/**
 * 참석자 정보 삭제
 */
router.delete("/:meetingId", auth.checkToken, qrcodeController.deleteUser);

router.get("/check/:groupId/:meetingId", qrcodeController.userCheck);
router.post("/feedback/:meetingId", qrcodeController.feedbackCheck);

module.exports = router;
