const path = require("path");
const qrCode = require("qrcode");
const AWS = require("aws-sdk");
const fs = require("fs");
const s3Info = require("../config/s3info.json");
const util = require("../modules/util");
const meetingModel = require("../models/meeting");
const moment = require('moment');

const s3 = new AWS.S3({
  accessKeyId: s3Info.accessKeyId,
  secretAccessKey: s3Info.secretAccessKey,
  region: s3Info.region,
});

module.exports = {
  /**
   * QR 코드 생성
   */
  makeQrcode: async (req, res) => {
    const userEmail = req.email;
    const meetingId = req.params.meetingId;

    const qrInformation = `http://qring-server-dev.ap-northeast-2.elasticbeanstalk.com/qrcode/check/${meetingId}`;

    qrCode;

    qrCode.toFile(
      path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`),
      qrInformation,
      (err, string) => {
        if (err) {
          console.log(err);
          throw err;
        }

        const param = {
          Bucket: "qring",
          Key: "qrcode/" + `${meetingId}`,
          ACL: "public-read",
          Body: fs.createReadStream(
            path.join(
              __dirname,
              `../public/qrcode/${userEmail}and${meetingId}.png`
            )
          ),
          ContentType: "image/png",
        };

        // s3 버킷에 업로드
        s3.upload(param, async (err, data) => {
          if (err) throw err;
          console.log("QRcode generator", data.Location);

          // DB에 이미지 링크 저장
          const filter = { _id: meetingId };
          const update = { qrImg: data.Location };
          const result = await meetingModel.updateOne(filter, { $set: update });

          fs.unlink(
            path.join(
              __dirname,
              `../public/qrcode/${userEmail}and${meetingId}.png`
            ),
            (err) => {
              if (err) throw err;
            }
          );
        });
      }
    );

    res.status(200).send(util.success(200, "QR코드 생성 성공"));
  },

  /**
   * 웹 출석 폼 제출
   */
  submitForm: async (req, res) => {
    const meetingId = req.params.meetingId;
    const { name, email, abroad, health } = req.body;

    if (!meetingId) {
      res.status(400).send(util(fail(400, "meetingId가 없습니다.")));
    }

    const result = await meetingModel.findById(
      {
        _id: meetingId,
      },
      {
        _id: 0,
        date: 1,
        startTime: 1,
        endTime:1, 
        late: 1,
        user: 1,
      }
    );

    // 시작 시간 시, 분
    const startTime_hour = parseInt(result.startTime.substring(0, 2));
    const startTime_min = parseInt(result.startTime.substring(3, 5));

    // 지각 시, 분으로 쪼개기
    const late_hour = parseInt(result.late / 60);
    const late_min = result.late % 60;

    // 지각 마감 시간
    const lateLimit_hour = startTime_hour + late_hour;
    const lateLimit_min = startTime_min + late_min;
    if (lateLimit_min >= 60){
      lateLimit_hour += 1;
      lateLimit_min -= 60;
    }

    const late = result.date.concat(" ", lateLimit_hour, ":", lateLimit_min, " ");
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const start = result.date.concat(" ", result.startTime+":00");
    const end = result.date.concat(" ", result.endTime+":00");

    // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
    const flag = await result.user.some((element) => {
      if (email === element.email) {
        res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
        return true;
      }
    });

    // DB에 추가하기
    if (!flag) {
      // 지각 여부 체크
      let attendance = 1;
      if (now < start || now > end ){
        res.status(401).send(util.fail(401, "출석 가능 시간이 아닙니다."));
        return;
      } else {
        if (now > late){
          attendance = 0;
          isAdded = false;
        }
      }

      const isAdded = false;
      const filter = { _id: meetingId };
      const update = { user: { name, email, abroad, health, attendance, isAdded }};

      await meetingModel.findOneAndUpdate(filter, { $push: update });
      res.status(200).send(util.success(200, "제출에 성공하였습니다."));
    }
  },

  /**
   * 관리자가 사용자 직접 추가
   */
  addUser: async(req, res) => {
    const meetingId = req.params.meetingId;
    const { name, email, abroad, health } = req.body;

    if (!meetingId) {
      res.status(400).send(util(fail(400, "meetingId가 없습니다.")));
    }

    const result = await meetingModel.findById({ _id: meetingId }, {_id: 0, user: 1 });

    // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
    const flag = await result.user.some((element) => {
      if (email === element.email) {
        res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
        return true;
      }
    });

    if (!flag){
      const attendance = -1;
      const isAdded = true;
      
      const filter = { _id: meetingId };
      const update = { user: { name, email, abroad, health, attendance, isAdded }};
      await meetingModel.findOneAndUpdate(filter, { $push: update });

      res.status(200).send(util.success(200, "사용자 추가에 성공하였습니다."));
    }
  },

  userCheck: async (req, res) => {
    const meetingId = req.params.meetingId;
    res.render("index");
  },
  feedbackCheck: async (req, res) => {
    const meetingId = req.params.meetingId;
    console.log(meetingId);
    const result = await meetingModel.findOne({ _id: meetingId });
    const feedBack = result.feedBack;
    res.render("feedback", { feedBack: feedBack });
  },
};
