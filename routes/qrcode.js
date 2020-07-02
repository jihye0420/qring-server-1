const express = require('express');
const router = express.Router();
const util  = require('../modules/util');
const auth = require('../middleware/auth');
const qrcodeGenerator = require('../modules/qrcodeGenerator');

/**
 * QR코드 테스트
 */
router.get('/', auth.checkToken, async(req, res) => {

  const userEmail = req.email;
  const meetingId = req.params.meetingId;

  qrcodeGenerator.makeQrcode(userEmail, meetingId);

  res.status(200).send(util.success(200, "QR코드 생성 성공"));
});

module.exports = router;