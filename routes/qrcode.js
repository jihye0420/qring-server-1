const express = require('express');
const router = express.Router();
const util  = require('../modules/util');
const auth = require('../middleware/auth');
const qrcodeGenerator = require('../modules/qrcode');
const meetingModel = require('../models/meeting');

/**
 * QR코드 테스트
 */
router.get('/', auth.checkToken, async(req, res) => {

  const userEmail = req.email;
  const meetingId = req.query.meetingId;

  await qrcodeGenerator.makeQrcode(userEmail, meetingId); 

  res.status(200).send(util.success(200, "QR코드 생성 성공"));
}); 

/**
 * 웹 출석 폼 제출
 */
router.post('/', async(req, res) => {
  const meetingId = req.query.meetingId;
  const {name, email, abroad, health} = req.body;

  const result = await meetingModel.findById({
    _id: meetingId
  }, {
    _id : 0,
    user : 1,
  });
  
  // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
  const flag = await result.user.some(element => {
    if (email === element.email){
      res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
      return true;
    }
  });

  // DB에 추가하기
  if (!flag){
    const filter = {_id: meetingId};
    const update = {user : {name, email, abroad, health}};
    await meetingModel.findOneAndUpdate(filter, {$push : update});

    res.status(200).send(util.success(200, "제출에 성공하였습니다."));
  }
});

module.exports = router;