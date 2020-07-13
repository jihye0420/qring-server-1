const path = require("path");
const qrCode = require("qrcode");
const AWS = require("aws-sdk");
const fs = require("fs");
const s3Info = require("../config/s3info.json");
const util = require("../modules/util");
const meetingModel = require("../models/meeting");
const groupModel = require("../models/group");
const moment = require("moment");
const {
  group
} = require("console");
const meeting = require("../models/meeting");

const s3 = new AWS.S3({
  accessKeyId: s3Info.accessKeyId,
  secretAccessKey: s3Info.secretAccessKey,
  region: s3Info.region,
});

const qrcodeController = {
  // /**
  //  * QR 코드 생성
  //  */
  // makeQrcode: async (req, res) => {
  //   const userEmail = req.email;
  //   const userId = req.userId;
  //   console.log(userId);
  //   const groupId = req.params.groupId;
  //   const meetingId = req.params.meetingId;

  //   const qrInformation = `http://qring-server-dev.ap-northeast-2.elasticbeanstalk.com/qrcode/check/${groupId}/${meetingId}`;

  //   qrCode.toFile(
  //     path.join(__dirname, `../public/qrcode/${userEmail}and${meetingId}.png`),
  //     qrInformation,
  //     (err, string) => {
  //       if (err) {
  //         console.log(err);
  //         throw err;
  //       }

  //       const param = {
  //         Bucket: "qring",
  //         Key: "qrcode/" + `${meetingId}`,
  //         ACL: "public-read",
  //         Body: fs.createReadStream(
  //           path.join(
  //             __dirname,
  //             `../public/qrcode/${userEmail}and${meetingId}.png`
  //           )
  //         ),
  //         ContentType: "image/png",
  //       };

  //       // s3 버킷에 업로드
  //       s3.upload(param, async (err, data) => {
  //         if (err) throw err;
  //         console.log("QRcode generator", data.Location);

  //         // DB에 이미지 링크 저장
  //         const filter = {
  //           _id: meetingId
  //         };
  //         const update = {
  //           qrImg: data.Location
  //         };
  //         await meetingModel.updateOne(filter, {
  //           $set: update
  //         });

  //         fs.unlink(
  //           path.join(
  //             __dirname,
  //             `../public/qrcode/${userEmail}and${meetingId}.png`
  //           ),
  //           (err) => {
  //             if (err) throw err;
  //           }
  //         );
  //       });
  //     }
  //   );

  //   res.status(200).send(util.success(200, "QR코드 생성 성공"));
  // },

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
      res.status(402).send(util.fail(402, "meetingId가 없습니다."));
    }

    const groupInfo = await groupModel.findById({
      _id: groupId,
    }, {
      meetings: 1,
    });
    const rounds = groupInfo.meetings.length;
    const meetingIdx = groupInfo.meetings.indexOf(meetingId);

    let meetingInfo = await meetingModel.findById({
      _id: meetingId,
    }, {
      _id: 0,
      date: 1,
      startTime: 1,
      endTime: 1,
      late: 1,
      headCount: 1,
      user: 1,
    });

    if (meetingInfo === null) {
      res
        .status(402)
        .send(util.fail(403, "groupId와 meetingId가 일치하지 않습니다."));
      return;
    }

    const now = moment().format("YYYY.MM.DD HH:mm:ss");
    const lDate = meetingInfo.date + " " + meetingInfo.startTime + ":00";
    let limitDate = new Date(lDate);
    //1시간 전부터 가능
    limitDate.setHours(limitDate.getHours() - 1);
    limitDate = moment(limitDate).format("YYYY.MM.DD HH:mm:ss");

    // 출결 확인하기
    const attendanceFlag = await qrcodeController.checkAttendance(
      meetingInfo.startTime,
      meetingInfo.endTime,
      meetingInfo.late,
      meetingInfo.date,
      limitDate
    );

    // 출석 확인하기
    let attendance = 1;
    let isAdded = false;
    if (attendanceFlag === 0) {
      //지각
      attendance = 0;
    }

    if (attendanceFlag === -1) {
      res.status(401).send(util.fail(401, "출석 가능 시간이 아닙니다."));
      return;
    } else {
      // 출석이 가능한 시간에 폼을 제출한 경우
      //------새로 생성된 경우------//
      if (rounds === 1 || meetingIdx === 0) {
        console.log("새로운 모임");

        // 중복 제출 방지 : 똑같은 이메일로 제출한 경우
        const flag = await meetingInfo.user.some((element) => {
          if (email === element.email) {
            res.status(400).send(util.fail(400, "이미 제출하셨습니다."));
            return true;
          }
        });

        // flag가 false면 DB에 추가하기
        if (!flag) {
          let createdAt = moment().format("YYYY.MM.DD HH:mm:ss");
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
              createdAt,
            },
          };

          await meetingModel.findOneAndUpdate(filter, {
            $push: update,
          });

          if (meetingInfo.user.length >= meetingInfo.headCount) {
            await meetingModel.findByIdAndUpdate({
              _id: meetingId,
            }, {
              $set: {
                headCount: meetingInfo.user.length + 1,
              },
            });
          }
          res.render("checkresult", {
            groupId: groupId,
            meetingId: meetingId,
          });
          // res.status(200).send(util.success(200, "제출에 성공하였습니다."));
        }
      } else {
        //------이어서 만들기 또는 2회차 이상인 경우-------//
        console.log("이어서 만들기");

        // 이전 미팅 유저들 가져오기
        if (meetingInfo.user.length == 0 && now >= limitDate) {
          meetingInfo = await qrcodeController.getPreUsers(
            meetingIdx,
            meetingId,
            groupInfo
          );
        }

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
                "user.email": email,
              };
              let update = {
                "user.$.name": name,
                "user.$.email": email,
                "user.$.abroad": abroad,
                "user.$.health": health,
                "user.$.attendance": attendance,
                "user.$.isAdded": isAdded,
                "user.$.createdAt": moment().format("YYYY.MM.DD HH:mm:ss"),
              };
              await meetingModel.findOneAndUpdate(filter, {
                $set: update,
              });
              res.status(200).send(util.success(200, "제출에 성공하였습니다."));
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

          const createdAt = moment().format("YYYY.MM.DD HH:mm:ss");

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
              createdAt,
            },
          };
          await meetingModel.findByIdAndUpdate(filter, {
            $push: update,
          });

          if (meetingInfo.user.length >= meetingInfo.headCount) {
            await meetingModel.findByIdAndUpdate({
              _id: meetingId,
            }, {
              $set: {
                headCount: meetingInfo.user.length + 1,
              },
            });
          }
          res.render("checkresult", {
            groupId: groupId,
            meetingId: meetingId,
          });
          // res.status(200).send(util.success(200, "제출에 성공하였습니다."));
        }
      }
    }
    // if (meetingInfo.user.length >= meetingInfo.headCount){
    //   await meetingModel.findByIdAndUpdate({_id: meetingId}, {$set : {
    //     headCount : meetingInfo.user.length+1
    //   }})
    // }
    // res.status(200).send(util.success(200, "제출에 성공하였습니다."));
  },

  /**
   * 이전 미팅 참석자 가져오기
   */
  getPreUsers: async (meetingIdx, meetingId, groupInfo) => {
    const preMeetingId = groupInfo.meetings[meetingIdx - 1]; // 이어 만들기인 경우에만 이전 미팅 참석자를 가져오므로 -1 OK
    const preMeetingInfo = await meetingModel.findById({
      _id: preMeetingId,
    }, {
      _id: 0,
      user: 1,
    });

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
      filter, {
        $set: update,
      }, {
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
    if (lateLimit_hour < 10) {
      lateLimit_hour = "0" + lateLimit_hour.toString();
    }
    if (lateLimit_min < 10) {
      lateLimit_min = "0" + lateLimit_min.toString();
    }

    let createdAt = moment().format("YYYY.MM.DD HH:mm:ss");
    const end = date.concat(" ", endTime + ":00");
    const late = date.concat(" ", lateLimit_hour, ":", lateLimit_min, ":00");

    console.log("createdAt:", createdAt);
    console.log("startLimit:", startLimit);
    console.log("end:", end);
    if (createdAt < startLimit || createdAt > end) {
      return -1; // 출석 체크 아예 불가능
    } else {
      if (createdAt > late) {
        return 0; // 지각
      }
    }
    return 1;
  },

  /**
   * 전체 참석자 정보 받아오기
   */
  readUserInfo: async (req, res) => {
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const userId = req.params.userId;

    let filter = {
      _id: meetingId,
    };

    const meetingInfo = await meetingModel.findById(filter, {
      _id: 0,
      user: 1,
      date: 1,
      startTime: 1,
      endTime: 1,
      headCount : 1
    });

    if (meetingInfo === undefined || meetingInfo === null) {
      return res
        .status(400)
        .send(util.fail(400, "해당하는 meetingId가 없습니다."));
    }

    const end = meetingInfo.date + " " + meetingInfo.endTime + ":00";
    const now = moment().format("YYYY.MM.DD HH:mm:ss");

    let present = await meetingInfo.user.filter((data) => data.attendance >= 0);
    present.sort((a, b) => {
      return a.createdAt < b.createdAt ? 1 : -1;
    });

    // -1일 땐 전체 참석자 정보 받아오기
    if (userId === "-1") {
      let absent = [];

      // 모임이 진행 중일 때 : 결석자는 제외하고 보여주기
      if (now < end) {
        return res.status(200).send(
          util.success(200, "모임 진행 중 전체 참석자 정보 불러오기 성공", {
            present: present,
            absent: absent,
          })
        );
      }
      // 모임이 끝난 후 : 결석자를 포함하여 보여주기
      else {
        absent = meetingInfo.user.filter((data) => data.attendance < 0);
        //참석자가 headCount수보다 작은 경우 익명의 가데이터 보내주기
        const alluser = present.length + absent.length;
        console.log (present.length,"O",absent.length,"a",alluser);
        if (alluser< meetingInfo.headCount) {
          for (let i=1; i<= meetingInfo.headCount - alluser; i++){
            const name = "결석한 회원 " + i;
            absent.push({
              name: name,
              email: null,
              abroad: false,
              health: false,
              attendance: -1,
              isAdded: false,
              createdAt: null
            })
          }
        }
        return res.status(201).send(
          util.success(201, "모임이 끝난 후 전체 참석자 정보 불러오기 성공", {
            present: present,
            absent: absent,
          })
        );
      }
    }

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
      const groupInfo = await groupModel.findById({
        _id: groupId,
      }, {
        _id: 0,
        meetings: 1,
      });
      if (groupInfo === undefined || groupInfo === null) {
        return res
          .status(400)
          .send(util.fail(402, "해당하는 groupId가 없습니다."));
      }
      const meetings = groupInfo.meetings;

      //let attendance = [0, 0, 0];
      const email = userInfo.email;

      // 병렬 처리(iterator)를 위해 forEach 대신 for ... of 사용
      // for (const mId of meetings) {
      //   const preMeetingInfo = await meetingModel.findById({
      //     _id: mId
      //   }, {
      //     _id: 0,
      //     user: 1
      //   });
      //   const preUserInfo = await preMeetingInfo.user.find(element => element.email === email);
      //   if (preUserInfo === null || preUserInfo === undefined) {
      //     //continue
      //   } else {
      //     attendance[preUserInfo.attendance + 1] += 1
      //   }
      // }

      let attendance = [0, 0, 0];
      const attendanceList = await qrcodeController.loopMeetingList(
        meetings,
        email
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
  },

  /**
   * 특정 참석자 정보 받아오기
   */
  loopMeetingList: async (meetings, email) => {
    const resultPromise = meetings.map(async (mId) => {
      const preMeetingInfo = await meetingModel.findById({
        _id: mId,
      }, {
        _id: 0,
        user: 1,
      });
      const preUserInfo = await preMeetingInfo.user.find(
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
        .filter((item) => item.type === "attendance")
        .map((item) => item.item),
    };
  },

  /**
   * 사용자 추가
   */
  addUser: async (req, res) => {
    const meetingId = req.params.meetingId;
    const {
      name,
      email
    } = req.body;

    if (!meetingId) {
      res.status(401).send(util.fail(401, "meetingId가 없습니다."));
    }

    const abroad = false;
    const health = false;
    const result = await meetingModel.findById({
      _id: meetingId,
    }, {
      _id: 0,
      user: 1,
    });

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
    const {
      name,
      attendance
    } = req.body;

    if (!name || !attendance) {
      return res
        .status(400)
        .send(util.fail(400, "필요한 파라미터가 없습니다."));
    }

    const filter = {
      _id: meetingId,
      "user._id": userId,
    };
    let update = {
      "user.$.name": name,
      "user.$.attendance": attendance,
    };
    const result = await meetingModel.findOneAndUpdate(
      filter, {
        $set: update,
      }, {
        new: true,
      }
    );

    if (result === null) {
      return res
        .status(401)
        .send(util.fail(401, "해당하는 meetingId가 없습니다."));
    }

    let data = {};
    result.user.some((element) => {
      if (element._id.toString() === userId) {
        data = element;
        return true;
      }
    });
    res
      .status(200)
      .send(util.success(200, "참석자 정보 수정에 성공했습니다.", data));
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

    const result = await meetingModel.findOneAndUpdate({
      _id: meetingId,
    }, {
      user: users,
    }, {
      new: true,
    });

    res
      .status(200)
      .send(util.success(200, "참석자 삭제에 성공했습니다.", result.user));
  },

  userCheck: async (req, res) => {
    const groupId = req.params.groupId;
    const meetingId = req.params.meetingId;
    const result = await meetingModel.findOne({
      _id: meetingId
    });
    res.render("index", {
      result: result,
      gId: groupId
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