const path = require("path");
const qrCode = require("qrcode");
const AWS = require("aws-sdk");
const fs = require("fs");
const s3Info = require("../config/s3info.json");
const util = require("../modules/util");
const meetingModel = require("../models/meeting");
const groupModel = require("../models/group");
const moment = require("moment");
const meeting = require("../models/meeting");

const s3 = new AWS.S3({
  accessKeyId: s3Info.accessKeyId,
  secretAccessKey: s3Info.secretAccessKey,
  region: s3Info.region,
});

const qrcodeController = {
  /**
   * QR 코드 생성 함수형
   */
  makeQrcode: async (userEmail, groupId, meetingId) => {
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
            _id: meetingId,
          };
          const update = {
            qrImg: data.Location,
          };
          await meetingModel.updateOne(filter, {
            $set: update,
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
    return `https://qring.s3.ap-northeast-2.amazonaws.com/qrcode/${meetingId}`;
  },

  /**
   * 웹 출석 폼 제출 : 이전 미팅 참석자들 참조
   */

  alreadyFeedback: async (req, res) => {
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const meetingInfo = await meetingModel.findById({ _id: meetingId });
    res.render("checkresult", {
      groupId: groupId,
      meetingId: meetingId,
      result: 1,
      meetingInfo: meetingInfo,
    });
  },

  submitForm: async (req, res) => {
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;

    const { name, email, abroad, health } = req.body;
    //list에 있는 값을 feedback.result에 순서대로 하나씩 push해야한다.
    const groupInfo = await groupModel.findById(
      {
        _id: groupId,
      },
      {
        meetings: 1,
      }
    );

    const meetingIdx = groupInfo.meetings.indexOf(meetingId);
    const meetingInfo = await meetingModel.findById(
      {
        _id: meetingId,
      },
      {
        _id: 0,
        user: 1,
        date: 1,
        startTime: 1,
        endTime: 1,
        late: 1,
      }
    );

    if (groupInfo === null || meetingInfo === null) {
      return res
        .status(402)
        .send(util.fail(402, "해당하는 groupId 또는 meetingId가 없습니다."));
    }

    let isAdded = false;
    // 이어서 생성된 모임인 경우
    if (meetingIdx != 0) {
      const preMeetingId = groupInfo.meetings[meetingIdx - 1]; // 이전 회차 모임 id
      const preMeetingInfo = await meetingModel.findById(
        {
          _id: preMeetingId,
        },
        {
          _id: 0,
          user: 1,
        }
      );
      const result = preMeetingInfo.user.some((element) => {
        return !!~element.email.search(email);
      });

      // 이메일이 이전 회차에 존재하지 않는 경우
      if (!result) {
        isAdded = true;
      }
    }
    // 출석 확인하기
    const lDate = meetingInfo.date + " " + meetingInfo.startTime + ":00";
    let limitDate = new Date(lDate);
    limitDate.setHours(limitDate.getHours() - 1);
    limitDate = moment(limitDate).format("YYYY.MM.DD HH:mm:ss");

    // 출결 확인하기
    const attendance = await qrcodeController.checkAttendance(
      meetingInfo.startTime,
      meetingInfo.endTime,
      meetingInfo.late,
      meetingInfo.date,
      limitDate
    );

    const createdAt = moment().format("YYYY.MM.DD HH:mm:ss");
    if (attendance === -1) {
      res.render("checkresult", {
        groupId: groupId,
        meetingId: meetingId,
        result: 0,
        meetingInfo: meetingInfo,
      });
      return;
    } else {
      // 이메일 중복 제출 방지 : 똑같은 이메일로 제출한 경우 체크하기
      const flag = meetingInfo.user.some((element) => {
        return !!~element.email.search(email);
      });

      // 해당 이메일로 이미 제출을 한 경우
      if (flag) {
        res.render("checkresult", {
          groupId: groupId,
          meetingId: meetingId,
          result: 2,
          meetingInfo: meetingInfo,
        });
      }
      //첫 제출인 경우
      else {
        const update = {
          user: {
            name,
            email,
            abroad,
            health,
            attendance,
            isAdded,
            createdAt,
          },
        };
        await meetingModel.findByIdAndUpdate(
          {
            _id: meetingId,
          },
          {
            $push: update,
          }
        );

        let present = await meetingInfo.user.filter(
          (data) => data.attendance >= 0
        );
        req.io.to(meetingId).emit("homeAttendCnt", present.length + 1);
        req.io.to(meetingId).emit("meetingAttendCnt", present.length + 1);

        res.render("checkresult", {
          groupId: groupId,
          meetingId: meetingId,
          result: 1,
          meetingInfo: meetingInfo,
        });
        return;
      }
    }
  },

  /**
   * 이전 미팅 참석자 가져오기
   */
  getPreUsers: async (meetingIdx, meetingId, groupInfo) => {
    const preMeetingId = groupInfo.meetings[meetingIdx - 1]; // 이어 만들기인 경우에만 이전 미팅 참석자를 가져오므로 -1 OK
    const preMeetingInfo = await meetingModel.findById(
      {
        _id: preMeetingId,
      },
      {
        _id: 0,
        user: 1,
      }
    );

    preMeetingInfo.user.forEach((element) => {
      element.attendance = -1;
      element.isAdded = false;
    });

    const filter = {
      _id: meetingId,
    };
    const update = {
      user: preMeetingInfo.user,
    };
    const meetingInfo = await meetingModel.findByIdAndUpdate(
      filter,
      {
        $set: update,
      },
      {
        new: true,
      }
    );
    return meetingInfo;
  },

  /**
   *  출결 확인하기
   */
  checkAttendance: async (startTime, endTime, lateTime, date, startLimit) => {
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
    // 지각 시간 포맷 맞추기
    if (lateLimit_hour < 10) {
      lateLimit_hour = "0" + lateLimit_hour.toString();
    }
    if (lateLimit_min < 10) {
      lateLimit_min = "0" + lateLimit_min.toString();
    }

    let createdAt = moment().format("YYYY.MM.DD HH:mm:ss");
    const end = date.concat(" ", endTime + ":00");
    const late = date.concat(" ", lateLimit_hour, ":", lateLimit_min, ":00");

    if (createdAt < startLimit || createdAt > end) {
      return -1; // 출석 체크 아예 불가능
    } else {
      if (createdAt > late) {
        return 0; // 지각
      }
    }
    return 1; // 나머지는 출석
  },

  /**
   * 참석자 정보 받아오기
   */
  readUserInfo: async (req, res) => {
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const userId = req.params.userId;

    if (!groupId || !meetingId || !userId) {
      return res.status(400).send(util.fail(400, "파라미터 값이 없습니다."));
    }

    let filter = {
      _id: meetingId,
    };

    const meetingInfo = await meetingModel.findById(filter, {
      _id: 0,
      user: 1,
      date: 1,
      startTime: 1,
      endTime: 1,
      headCount: 1,
    });

    const startTime = meetingInfo.date + " " + meetingInfo.startTime + ":00";
    const endTime = meetingInfo.date + " " + meetingInfo.endTime + ":00";

    if (meetingInfo === undefined || meetingInfo === null) {
      return res
        .status(400)
        .send(util.fail(400, "해당하는 meetingId가 없습니다."));
    }

    let present = await meetingInfo.user.filter((data) => data.attendance >= 0);
    present.forEach((element) => {
      const hour = parseInt(element.createdAt.substring(11, 13));
      const ap = hour > 12 ? " pm" : " am";
      element.createdAt =
        hour.toString() + element.createdAt.substring(13, 16) + ap;
    });
    present.sort((a, b) => {
      return a.createdAt < b.createdAt ? 1 : -1;
    });

    // -1일 땐 전체 참석자 정보 받아오기
    if (userId === "-1") {
      console.log("-1ㅇㅔ 들어옴");
      absent = meetingInfo.user.filter((data) => data.attendance < 0);
      //참석자가 headCount수보다 작은 경우 익명의 가데이터 보내주기
      const alluser = present.length + absent.length;
      if (alluser < meetingInfo.headCount) {
        for (let i = 1; i <= meetingInfo.headCount - alluser; i++) {
          const name = "결석한 회원 " + i;
          absent.push({
            _id: null,
            name: name,
            email: null,
            abroad: false,
            health: false,
            attendance: -1,
            isAdded: false,
            createdAt: null,
          });
        }
      }
      return res.status(201).send(
        util.success(201, "모임이 끝난 후 전체 참석자 정보 불러오기 성공", {
          startTime: startTime,
          endTime: endTime,
          present: present,
          absent: absent,
        })
      );
    } else {
      // 참석자 4명 이하로 받아오기
      if (userId === "4") {
        let limit = 0;
        if (present.length < 4) {
          limit = present.length;
        } else {
          limit = 4;
        }
        return res.status(202).send(
          util.success(202, "참석자 정보 4명만 불러오기 성공", {
            present: present.slice(0, limit),
          })
        );
      }

      // 특정 참석자 정보 받아오기
      else {
        let userInfo = meetingInfo.user.find(
          (element) => element._id.toString() === userId
        );
        if (userInfo === undefined || userInfo === null) {
          return res
            .status(401)
            .send(util.fail(401, "해당하는 userId가 없습니다."));
        }
        const groupInfo = await groupModel.findById(
          {
            _id: groupId,
          },
          {
            _id: 0,
            meetings: 1,
          }
        );
        if (groupInfo === undefined || groupInfo === null) {
          return res
            .status(400)
            .send(util.fail(402, "해당하는 groupId가 없습니다."));
        }
        const meetings = groupInfo.meetings;

        //let attendance = [0, 0, 0];
        const email = userInfo.email;

        let attendance = [0, 0, 0];
        const attendanceList = await qrcodeController.loopMeetingList(
          meetings,
          email,
          userId
        );
        attendanceList.attendance.forEach((state) => {
          attendance[state + 1] += 1;
        });

        await res.status(200).send(
          util.success(200, "참석자 불러오기 성공", {
            userInfo,
            attendance,
          })
        );
      }
    }
  },

  /**
   * 특정 참석자 정보 받아오기 : 누적된 출결 상태 구하기
   */
  loopMeetingList: async (meetings, email) => {
    const resultPromise = meetings.map(async (mId) => {
      const preMeetingInfo = await meetingModel.findById(
        {
          _id: mId,
        },
        {
          _id: 0,
          user: 1,
        }
      );

      const preUserInfo = preMeetingInfo.user.find(
        (element) => element.email === email
      );

      if (preUserInfo === null || preUserInfo === undefined) {
        //continue
      } else {
        let item = preUserInfo.attendance;
        return {
          type: "attendance",
          item,
        };
      }
    });
    const resolvedResult = await Promise.all(resultPromise);
    return {
      attendance: resolvedResult
        .filter((item) => item && item.type === "attendance")
        .map((item) => item.item),
    };
  },

  /**
   * 사용자 추가
   */
  addUser: async (req, res) => {
    const meetingId = req.params.meetingId;
    const { name, email } = req.body;

    if (!meetingId) {
      res.status(401).send(util.fail(401, "meetingId가 없습니다."));
    }

    const abroad = false;
    const health = false;
    const result = await meetingModel.findById(
      {
        _id: meetingId,
      },
      {
        _id: 0,
        user: 1,
      }
    );

    if (result === null || result === undefined) {
      res.status(400).send(util.fail(400, "해당하는 meetingId가 없습니다."));
    }

    // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
    const flag = await result.user.some((element) => {
      if (email === element.email) {
        res.status(401).send(util.fail(401, "이미 제출하셨습니다."));
        return true;
      }
    });

    // flag가 false면
    if (!flag) {
      const attendance = -1;
      const isAdded = true;

      const filter = {
        _id: meetingId,
      };
      const update = {
        user: {
          name,
          email,
          abroad,
          health,
          attendance,
          isAdded,
        },
      };
      await meetingModel.findOneAndUpdate(filter, {
        $push: update,
      });

      res.status(200).send(util.success(200, "사용자 추가에 성공하였습니다."));
    }
  },

  /**
   * 참석자 정보 수정
   */
  updateUser: async (req, res) => {
    const meetingId = req.params.meetingId;
    const userId = req.params.userId;
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .send(util.fail(400, "필요한 파라미터가 없습니다."));
    }

    const filter = {
      _id: meetingId,
      "user._id": userId,
    };
    update = {
      "user.$.name": name,
    };
    await meetingModel.findOneAndUpdate(filter, {
      $set: update,
    });

    res.status(200).send(util.success(200, "참석자 정보 수정에 성공했습니다."));
  },

  /**
   * 참석자 정보 삭제
   */
  deleteUser: async (req, res) => {
    const meetingId = req.params.meetingId;
    const userId = req.params.userId;

    const filter = {
      _id: meetingId,
      "user._id": userId,
    };

    const meetingInfo = await meetingModel.findOne(filter, {
      _id: 0,
      user: 1,
    });
    console.log(meetingInfo);
    if (meetingInfo === null) {
      return res
        .status(400)
        .send(util.fail(400, "meetingId 또는 userId가 맞지 않습니다."));
    }
    let users = meetingInfo.user;
    const idx = users.findIndex(function (user) {
      return user._id.toString() === userId;
    });
    if (idx > -1) users.splice(idx, 1);

    const result = await meetingModel.findOneAndUpdate(
      {
        _id: meetingId,
      },
      {
        user: users,
      },
      {
        new: true,
      }
    );

    res.status(200).send(util.success(200, "참석자 삭제에 성공했습니다."));
  },

  feedbackResult: async (req, res) => {
    const resultList = req.body;
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const result = await meetingModel.findOne({
      _id: meetingId,
    });
    for (var i in resultList) {
      console.log(resultList[i]);
    }
    res.render("feedbackresult", {
      result: result,
      gId: groupId,
    });
  },

  userCheck: async (req, res) => {
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const result = await meetingModel.findOne({
      _id: meetingId,
    });
    res.render("index", {
      result: result,
      gId: groupId,
    });
  },

  feedbackCheck: async (req, res) => {
    const meetingId = req.params.meetingId;
    const groupId = req.params.groupId;
    const result = await meetingModel.findOne({
      _id: meetingId,
    });
    res.render("feedback", {
      result: result,
      groupId: groupId,
    });
  },
};

module.exports = qrcodeController;
