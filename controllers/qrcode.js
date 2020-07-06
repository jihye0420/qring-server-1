const path = require("path");
const qrCode = require("qrcode");
const AWS = require("aws-sdk");
const fs = require("fs");
const s3Info = require("../config/s3info.json");
const util = require("../modules/util");
const meetingModel = require("../models/meeting");
const async = require("pbkdf2/lib/async");

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
        user: 1,
      }
    );

    // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
    const flag = await result.user.some((element) => {
      if (email === element.email) {
        res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
        return true;
      }
    });

    // DB에 추가하기
    if (!flag) {
      const filter = { _id: meetingId };
      const update = { user: { name, email, abroad, health } };

      await meetingModel.findOneAndUpdate(filter, { $push: update });

      res.status(200).send(util.success(200, "제출에 성공하였습니다."));
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
