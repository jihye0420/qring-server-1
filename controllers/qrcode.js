const path = require("path");
const qrCode = require("qrcode");
const AWS = require("aws-sdk");
const fs = require("fs");
const s3Info = require("../config/s3info.json");
const util = require("../modules/util");
const meetingModel = require("../models/meeting");
const groupModel = require("../models/group");
const moment = require('moment');

const s3 = new AWS.S3({
  accessKeyId: s3Info.accessKeyId,
  secretAccessKey: s3Info.secretAccessKey,
  region: s3Info.region,
});

const qrcodeController = {
  /**
   * QR 코드 생성
   */
  makeQrcode: async (req, res) => {
    const userEmail = req.email;
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;

    const qrInformation = `http://qring-server-dev.ap-northeast-2.elasticbeanstalk.com/qrcode/check/${groupId}/${meetingId}`;

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
          const filter = {
            _id: meetingId
          };
          const update = {
            qrImg: data.Location
          };
          await meetingModel.updateOne(filter, {
            $set: update
          });

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
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const {
      name,
      email,
      abroad,
      health
    } = req.body;

    if (!meetingId) {
      res.status(400).send(util(fail(400, "meetingId가 없습니다.")));
    }

    const groupInfo = await groupModel.findById({
      _id: groupId
    }, {
      meetings: 1
    });
    const rounds = groupInfo.meetings.length;

    const meetingInfo = await meetingModel.findById({
      _id: meetingId,
    }, {
      _id: 0,
      date: 1,
      startTime: 1,
      endTime: 1,
      late: 1,
      user: 1,
    });


    // 출결 확인하기
    const attendanceFlag =
      await qrcodeController.checkAttendance(meetingInfo.startTime, meetingInfo.endTime, meetingInfo.late, meetingInfo.date);

    //------새로 생성된 경우------//
    if (rounds == 1) {
      console.log("새로운 모임");

      // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
      const flag = await meetingInfo.user.some((element) => {
        if (email === element.email) {
          res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
          return true;
        }
      });

      // DB에 추가하기
      if (!flag) {
        // 지각 여부 체크
        let attendance = 1;
        const isAdded = false;
        if (attendanceFlag === -1) {
          res.status(401).send(util.fail(401, "출석 가능 시간이 아닙니다."));
          return;
        }
        if (attendanceFlag === 0) { // 지각
          attendance = 0;
        }

        let now = moment().format('YYYY-MM-DD HH:mm:ss');
        const filter = {
          _id: meetingId
        };
        const update = {
          user: {
            name,
            email,
            abroad,
            health,
            attendance,
            isAdded,
            now
          }
        };

        await meetingModel.findOneAndUpdate(filter, {
          $push: update
        });
      }
    } else { //------이어서 만들기 또는 2회차 이상인 경우-------//
      console.log("이어서 만들기");
      // 출석 확인하기
      let attendance = 1;
      if (attendanceFlag === -1) {
        res.status(401).send(util.fail(401, "출석 가능 시간이 아닙니다."));
        return;
      }
      if (attendanceFlag === 0) { //지각
        attendance = 0;
      }

      let isAdded = false;
      let createdAt = "";
      const result = meetingInfo.user.some((element) => {
        isAdded = element.isAdded;
        createdAt = element.createdAt;
        return !!~element.email.search(email);
      });

      if (result) {
        // 이어서 가져왔을 때만 업데이트하도록 === isAdded가 false인 경우 
        if (!isAdded) {

          // 중복 방지를 위해서 시간을 비교해서 update
          const startTime = meetingInfo.date + " " + meetingInfo.startTime;
          const endTime = meetingInfo.date + " " + meetingInfo.endTime;
          if (createdAt <= startTime || createdAt >= endTime) {
            const filter = {
              _id: meetingId,
              'user.email': email
            };
            let update = {
              'user.$.name': name,
              'user.$.email': email,
              'user.$.abroad': abroad,
              'user.$.health': health,
              'user.$.attendance': attendance,
              'user.$.isAdded': isAdded,
              'user.$.createdAt': new moment().format('YYYY-MM-DD HH:mm:ss')
            };
            await meetingModel.findOneAndUpdate(filter, {
              $set: update
            });
          } else {
            res.status(400).send(util.success(400, "이미 제출하셨습니다."));
            return;
          }

        }
        // 이번 회차에서 새로 추가된 참석자인 경우에는 이메일 중복 제출을 방지 === isAdded가 true인 경우
        else {
          res.status(400).send(util.success(400, "이미 제출하셨습니다."));
          return;
        }
      } else {
        // result가 false면 없는 이메일 === 새로 추가되는 참석자
        isAdded = true;

        let now = moment().format('YYYY-MM-DD HH:mm:ss');
        const filter = {
          _id: meetingId
        };
        const update = {
          user: {
            name,
            email,
            abroad,
            health,
            attendance,
            isAdded,
            now
          }
        };
        await meetingModel.findOneAndUpdate(filter, {
          $push: update
        });
      }

      res.status(200).send(util.success(200, "제출에 성공하였습니다."));
    }
  },

  /**
   *  출결 확인하기
   */
  checkAttendance: async (startTime, endTime, lateTime, date) => {
    // 시작 시간 시, 분
    const startTime_hour = parseInt(startTime.substring(0, 2));
    const startTime_min = parseInt(startTime.substring(3, 5));

    // 지각 시, 분으로 쪼개기
    const late_hour = parseInt(lateTime / 60);
    const late_min = lateTime % 60;

    // 지각 마감 시간
    let lateLimit_hour = startTime_hour + late_hour;
    let lateLimit_min = startTime_min + late_min;
    if (lateLimit_min >= 60) {
      lateLimit_hour += 1;
      lateLimit_min -= 60;
    }
    if (lateLimit_hour < 10) {
      lateLimit_hour = "0" + lateLimit_hour.toString();
    }
    if (lateLimit_min < 10) {
      lateLimit_min = "0" + lateLimit_min.toString();
    }

    let now = moment().format('YYYY-MM-DD HH:mm:ss');
    const start = date.concat(" ", startTime + ":00");
    const end = date.concat(" ", endTime + ":00");
    const late = date.concat(" ", lateLimit_hour, ":", lateLimit_min, ":00");

    if (now < start || now > end) {
      return -1; // 출석 체크 아예 불가능
    } else {
      if (now > late) {
        return 0; // 지각
      }
    }
    return 1;
  },

  /**
   * 관리자가 사용자 직접 추가
   */
  addUser: async (req, res) => {
      const meetingId = req.params.meetingId;
      const {
        name,
        email,
        abroad,
        health
      } = req.body;

      if (!meetingId) {
        res.status(400).send(util.fail(400, "meetingId가 없습니다."));
    }

    const result = await meetingModel.findById({
      _id: meetingId
    }, {
      _id: 0,
      user: 1
    });

    // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
    const flag = await result.user.some((element) => {
      if (email === element.email) {
        res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
        return true;
      }
    });

    if (!flag) {
      const attendance = -1;
      const isAdded = true;

      const filter = {
        _id: meetingId
      };
      const update = {
        user: {
          name,
          email,
          abroad,
          health,
          attendance,
          isAdded
        }
      };
      await meetingModel.findOneAndUpdate(filter, {
        $push: update
      });

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
    const result = await meetingModel.findOne({
      _id: meetingId
    });
    const feedBack = result.feedBack;
    res.render("feedback", {
      feedBack: feedBack
    });
  }
};

module.exports = qrcodeController;