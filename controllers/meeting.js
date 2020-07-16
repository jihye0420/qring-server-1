const adminModel = require("../models/admin");
const groupModel = require("../models/group");
const meetingModel = require("../models/meeting");
const util = require("../modules/util");
const moment = require("moment");
const statusCode = require("../modules/statusCode");
const resMessage = require("../modules/responseMessage");
const async = require("pbkdf2/lib/async");
const qrcodeController = require("../controllers/qrcode");

async function deleteProceeds(admin, meetingId) {
    const newProceeds = admin.proceeds.filter(
        (item) => item.meetingId != meetingId
    );
    admin.proceeds = newProceeds;
    await admin.save();
}

async function pushProceeds(admin, groupId, newMeeting) {
    const proceed = {
        groupId: groupId,
        meetingId: newMeeting._id,
        date: newMeeting.date,
        startTime: newMeeting.startTime,
        endTime: newMeeting.endTime,
    };
    admin.proceeds.push(proceed);
    admin.proceeds.sort(function (a, b) {
        if (a.date === b.date) {
            //오름차순
            return a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0;
        }
        return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; //오름차순
    });
    await admin.save();
}

async function cleanProceeds(admin) {
    const now = moment().format("YYYY.MM.DD HH:mm:ss");
    for (let meeting of admin.proceeds) {
        const end = meeting.date + " " + meeting.endTime + ":00";
        var feedBackEnd = new Date(end);
        feedBackEnd.setHours(feedBackEnd.getHours() + 2);
        feedBackEnd = moment(feedBackEnd).format("YYYY.MM.DD HH:mm:ss");

        //피드백 제출까지 종료된 모임
        if (now >= feedBackEnd) {
            admin.proceeds.shift();
        } else {
            break;
        }
    }
    await admin.save();
}

async function timeCompareProceeds(admin,newMeeting){
    for (let meetingItem of admin.proceeds) {
        if (meetingItem.date == newMeeting.date) {
            if (meetingItem.meetingId ==newMeeting.meetingId) {
                continue;
            }
            else if (meetingItem.endTime <= newMeeting.startTime) {
                continue;
            } else if (meetingItem.startTime >= newMeeting.endTime) {
                continue;
            } else {
                return false;
            }
        } else if (meetingItem.date > newMeeting.date) break;
    }

    return true;
}

async function listLoop(allGroup) {
    const today = moment().format("YYYY.MM.DD");
    const resultPromises = allGroup.map(async (groupid, index, array) => {
        const group = await groupModel.findById({
            _id: groupid,
        }, {
            meetings: 1,
        });
        const lastMeeting = await meetingModel.findById({
            _id: group.meetings[group.meetings.length - 1],
        });
        const present = await lastMeeting.user.filter((data) => data.attendance >= 0);
        var feedBackCount;
        let isFeedBack = false;
        if (lastMeeting.feedBack.length > 0) {
            isFeedBack = true;
            feedBackCount = lastMeeting.feedBack[0].result.length;
        } else feedBackCount = 0;

        let Item = {
            groupId: groupid,
            meetingId: lastMeeting._id,
            image: lastMeeting.image,
            name: lastMeeting.name,
            date: lastMeeting.date,
            headCount: lastMeeting.headCount,
            userCount: present.length,
            feedBackCount: feedBackCount,
            isFeedBack: isFeedBack,
        };
        if (lastMeeting.date < today) {
            //종료된 모임

            return {
                type: "end",
                Item,
            };
        } else {
            //진행중이거나 예정된 모임
            return {
                type: "proceed",
                Item,
            };
        }
    });
    const resolvedResult = await Promise.all(resultPromises);
    return {
        end: resolvedResult
            .filter((item) => item.type === "end")
            .map((item) => item.Item),
        proceed: resolvedResult
            .filter((item) => item.type === "proceed")
            .map((item) => item.Item),
    };
}
module.exports = {
    // 첫 모임 생성 & 피드백
    createNewGroup: async (req, res) => {
        const adminEmail = req.email;
        const {
            name,
            date,
            startTime,
            endTime,
            late,
            headCount,
            feedBack,
        } = req.body;

        let isFeedBack = false;
        if (feedBack) {
            isFeedBack = true;
            var parsedFeedbacks = await feedBack.map((fb) => {
                let parsedFb;
                if (typeof fb === "string") {
                    parsedFb = JSON.parse(fb);
                }
                return parsedFb;
            });
        }

        if (!name || !date || !startTime || !endTime || !late || !headCount) {
            return res.status(400).send(util.fail(400, "필요한 값이 없습니다."));
        }

        //데이터 대입
        var newMeeting = new meetingModel();
        newMeeting.name = req.body.name;
        newMeeting.date = req.body.date;
        newMeeting.startTime = req.body.startTime;
        newMeeting.endTime = req.body.endTime;
        newMeeting.late = req.body.late;
        newMeeting.headCount = req.body.headCount;
        if (feedBack) {
            newMeeting.feedBack = parsedFeedbacks;
        }

        //이미지가 안들어 왔을때 null로 저장, 들어오면 S3 url 저장
        let image = null;
        if (req.file !== undefined) {
            image = req.file.location;
            const type = req.file.mimetype.split("/")[1];
            if (type !== "jpeg" && type !== "jpg" && type !== "png") {
                return res
                    .status(401)
                    .send(util.fail(401, "유효하지 않은 형식입니다."));
            }
        }
        newMeeting.image = image;
        //newMeeting.qrImg = "";

        let fin_meeting = await newMeeting.save();

        // 그룹 만들어 meetings 배열에 새 미팅 아이디 저장, admin의 groups 배열에 새그룹 id 저장
        var newGroup = new groupModel();
        const admin = await adminModel.findOne({
            email: adminEmail,
        });

        const qrKey = await qrcodeController.makeQrcode(
            adminEmail,
            newGroup._id,
            fin_meeting._id
        );
        newMeeting.qrImg = qrKey;

        newGroup.admin = admin._id;
        newGroup.meetings.push(fin_meeting._id);
        await newGroup.save();

        admin.groups.push(newGroup._id);
        await admin.save();

        // for res
        const data = {
            groupid: newGroup._id,
            name: newMeeting.name,
            date: newMeeting.date,
            startTime: newMeeting.startTime,
            endTime: newMeeting.endTime,
            image: newMeeting.image,
            qrImg: newMeeting.qrImg,
            late: newMeeting.late,
            headCount: newMeeting.headCount,
            isFeedBack: isFeedBack,
        };

        await pushProceeds(admin, newGroup._id, newMeeting);
        return res.status(200).send(util.success(200, "새 모임 생성 성공", data));
    },
    /**
     * 이어서 모임 생성
     */
    createNewMeeting: async (req, res) => {
        const adminEmail = req.email;
        const admin = await adminModel.findOne({
            email: adminEmail,
        });
        const groupId = req.params.groupid;
        const {
            name,
            date,
            startTime,
            endTime,
            late,
            headCount,
            feedBack,
        } = req.body;

        // 피드백 파싱
        let isFeedBack = false;
        if (feedBack) {
            isFeedBack = true;
            var parsedFeedbacks = await feedBack.map((fb) => {
                let parsedFb;
                if (typeof fb === "string") {
                    parsedFb = JSON.parse(fb);
                }
                return parsedFb;
            });
        }

        if (!name || !date || !startTime || !endTime || !late || !headCount) {
            return res.status(400).send(util.fail(400, "필요한 값이 없습니다."));
        }

        //데이터 대입
        var newMeeting = new meetingModel();
        newMeeting.name = req.body.name;
        newMeeting.date = req.body.date;
        newMeeting.startTime = req.body.startTime;
        newMeeting.endTime = req.body.endTime;
        newMeeting.late = req.body.late;
        newMeeting.headCount = req.body.headCount;
        if (feedBack) {
            newMeeting.feedBack = parsedFeedbacks;
        }

        //이미지가 안들어 왔을때 null로 저장, 들어오면 S3 url 저장
        let image = null;
        if (req.file !== undefined) {
            image = req.file.location;
            const type = req.file.mimetype.split("/")[1];
            if (type !== "jpeg" && type !== "jpg" && type !== "png") {
                return res
                    .status(401)
                    .send(util.fail(401, "유효하지 않은 형식입니다."));
            }
        }
        newMeeting.image = image;

        let fin_meeting = await newMeeting.save();

        // qr코드 생성
        newMeeting.qrImg = await qrcodeController.makeQrcode(
            adminEmail,
            groupId,
            fin_meeting._id
        );

        try {
            const group = await groupModel.findOne({
                _id: groupId,
            });
            group.meetings.push(fin_meeting._id);
            await group.save();

            const data = {
                groupid: group._id,
                name: newMeeting.name,
                date: newMeeting.date,
                startTime: newMeeting.startTime,
                endTime: newMeeting.endTime,
                image: newMeeting.image,
                qrImg: newMeeting.qrImg,
                late: newMeeting.late,
                headCount: newMeeting.headCount,
                isFeedBack: isFeedBack,
            };
            await pushProceeds(admin, group._id, fin_meeting);
            return res
                .status(200)
                .send(util.success(200, "이어서 모임 생성 성공", data));
        } catch (e) {
            return res.status(402).send(util.fail(402, "해당하는 group이 없습니다."));
        }
    },
    /**
     * 모임 생성시 시간 중복 확인
     */
    time: async (req, res) => {
        const adminEmail = req.email;
        const admin = await adminModel.findOne({
            email: adminEmail,
        });

        const newMeeting = {
            meetingId: null,
            date : req.body.date,
            startTime: req.body.startTime,
            endTime : req.body.endTime
        }

        await cleanProceeds(admin);
        const result = await timeCompareProceeds(admin, newMeeting);

        if (result) {
            return res
            .status(200)
            .send(util.success(200, "모임 생성이 가능한 시간입니다."));
        }else {
            return res
            .status(400)
            .send(util.fail(400, "모임 시간이 중복됩니다."));
        }
    },
    /**
     * 이어서 모임 생성할 때, default값으로 띄어줄때 사용하는 API
     */
    getInfoInRound: async (req, res) => {
        //try {
            const meetingId = req.params.meetingid;
            const meeting = await meetingModel.findById({
                _id : meetingId
            })
    
            const present = await meeting.user.filter((data) => data.attendance >= 0);
    
            let isFeedBack = false;
            let feedBackCount;
            if (meeting.feedBack.length > 0) {
                isFeedBack = true;
                feedBackCount = meeting.feedBack[0].result.length;
            } else feedBackCount = 0;
    
            const data = {
                meetingId: req.params.meetingid,
                image: meeting.image,
                qrImg: meeting.qrImg,
                name: meeting.name,
                date: meeting.date,
                startTime : meeting.startTime,
                endTime : meeting.endTime,
                headCount: meeting.headCount,
                userCount: present.length,
                feedBackCount: feedBackCount,
                isFeedBack: isFeedBack
            }
    
            return res.status(200).send(util.success(200,"각 회차 모임 정보 조회", data));
        // } catch (e){
        //     return res.status(400).send(util.success(400,"해당하는 meeting이 없습니다."));
        // }
        
    },
    /**
     * 이어서 모임 생성할 때, default값으로 띄어줄때 사용하는 API
     */
    getInfo: async (req, res) => {
        const groupId = req.params.groupid;
        const meetingId = req.params.meetingid; //이전회차
        try {
            const meetingObject = await meetingModel.findOne({
                _id: meetingId,
            });

            const data = {
                groupId: groupId,
                meeting: {
                    name: meetingObject.name,
                    date: meetingObject.date,
                    startTime: meetingObject.startTime,
                    endTime: meetingObject.endTime,
                    late: meetingObject.late,
                    headCount: meetingObject.headCount,
                    image: meetingObject.image,
                },
            };

            return res
                .status(200)
                .send(util.success(200, "모임 정보 조회 성공", data));
        } catch (e) {
            return res
                .status(400)
                .send(util.fail(400, "해당하는 meeting이 없습니다."));
        }
    },

    /**
     * 모임 편집 기능
     */
    putInfo: async (req, res) => {
        const admin = await adminModel.findOne({
            email: req.email,
        });
        const meetingId = req.params.meetingid;
        const groupId = req.params.groupid;
        try {
            let meeting = await meetingModel.findOne({
                _id: meetingId,
            });

            const {
                name,
                date,
                startTime,
                endTime,
                late,
                headCount
            } = req.body;

            if (!name || !date || !startTime || !endTime || !late || !headCount) {
                return res.status(400).send(util.fail(400, "필요한 값이 없습니다."));
            }

            const now = moment().format("YYYY.MM.DD HH:mm:ss");

            const start = meeting.date + " " + meeting.startTime + ":00";
            var attendStart = new Date(start);
            attendStart.setHours(attendStart.getHours() - 1);
            attendStart = moment(attendStart).format("YYYY.MM.DD HH:mm:ss");

            if (attendStart < now) {
                return res.status(406).send(util.success(406, "이미 진행중인 혹은 종료된 모임입니다."));
            }
        
            const newStart = date + " " + startTime + ":00";
            var newAttendStart = new Date(newStart);
            newAttendStart.setHours(newAttendStart.getHours() - 2);
            newAttendStart = moment(newAttendStart).format("YYYY.MM.DD HH:mm:ss");
    
            if (newAttendStart < now) {
                return res.status(404).send(util.success(404, "모임 시작 시간이 너무 가까워 수정이 불가합니다."));
            }

            const newMeeting = {
                meetingId: meetingId,
                date : req.body.date,
                startTime: req.body.startTime,
                endTime : req.body.endTime
            }
            
            await cleanProceeds(admin);
            const result = await timeCompareProceeds(admin, newMeeting);
    
            if (!result) {
                return res
                .status(403)
                .send(util.fail(403, "모임 시간이 중복됩니다."));
            }

            let image = null;
            // data check - undefined
            if (req.file !== undefined) {
                image = req.file.location;
                const type = req.file.mimetype.split("/")[1];
                if (type !== "jpeg" && type !== "jpg" && type !== "png") {
                    return res
                        .status(401)
                        .send(util.fail(401, "유효하지 않은 형식입니다."));
                }
            }

            meeting.name = req.body.name;
            meeting.date = req.body.date;
            meeting.startTime = req.body.startTime;
            meeting.endTime = req.body.endTime;
            meeting.late = req.body.late;
            meeting.headCount = req.body.headCount;
            meeting.image = image;

            await meeting.save();

            const data = {
                "name": meeting.name,
                "date": meeting.date,
                "startTime": meeting.startTime,
                "endTime": meeting.endTime,
                "late": meeting.late,
                "headCount": meeting.headCount,
                "image": meeting.image,
                "qrImg": meeting.qrImg
            }

            await deleteProceeds(admin, meetingId);
            await pushProceeds(admin, groupId, meeting);
            return res
                .status(200)
                .send(util.success(200, "모임 정보 수정 성공", data));
        } catch (e) {
            return res
                .status(402)
                .send(util.fail(402, "해당하는 meeting이 없습니다."));
        }
    },
    /**
     * 모임 삭제
     */
    deleteMeeting: async (req, res) => {
        const groupId = req.params.groupid;
        const meetingId = req.params.meetingid;
        const admin = await adminModel.findOne({
            email: req.email,
        });
        try {
            const group = await groupModel.findOne({
                _id: groupId,
            });

            //group에 meeting이 1개 이상인 경유 -> meeting만 삭제
            if (group.meetings.length > 1) {
                const newMeetings = [];
                for (let Item of group.meetings) {
                    if (Item != meetingId) {
                        newMeetings.push(Item);
                    }
                }
                group.meetings = newMeetings;
                await group.save();
            } else {
                //group에 meeting이 1개 meeting, group, admin에 groupid 삭제
                const newGroups = [];
                for (let Item of admin.groups) {
                    if (Item != groupId) {
                        newGroups.push(Item);
                    }
                }
                admin.groups = newGroups;
                await admin.save();
                await groupModel.deleteOne({
                    _id: groupId,
                });
            }
        } catch (e) {
            return res.status(400).send(util.fail(400, "해당하는 group이 없습니다."));
        }

        await meetingModel.deleteOne({
            _id: meetingId,
        });

        await deleteProceeds(admin, meetingId);
        return res.status(200).send(util.success(200, "모임 삭제 성공"));
    },
    /**
     * 모임 리스트 (각 그룹에서 최신 모임반환) 진행중 / 완료 & 예정 나눠서 반환
     */
    list: async (req, res) => {
        const adminEmail = req.email;
        const admin = await adminModel.findOne({
            email: adminEmail,
        });
        const allGroup = admin.groups;
        if (allGroup.length === 0) {
            return res.status(200).send(util.success(200, "모임 리스트 조회", null));
        }

        try {
            const result = await listLoop(allGroup);

            let end = result.end;
            let proceed = result.proceed;

            end.sort(function (a, b) {
                if (a.date === b.date) {
                    //오름차순
                    return a.startTime < b.startTime ?
                        -1 :
                        a.startTime > b.startTime ?
                        1 :
                        0;
                }
                return a.date > b.date ? -1 : a.date < b.date ? 1 : 0; //내림차순
            });
            proceed.sort(function (a, b) {
                if (a.date === b.date) {
                    //오름차순
                    return a.startTime < b.startTime ?
                        -1 :
                        a.startTime > b.startTime ?
                        1 :
                        0;
                }
                return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; //오름차순
            });
            const meetingList = proceed.concat(end);
            return res
                .status(200)
                .send(util.success(200, "모임 리스트 조회", meetingList));
        } catch (e) {
            return res
                .status(400)
                .send(util.success(400, "meeting 데이터 오류", null));
        }
    },
    /**
     * 홈 화면에 현재 진행중인 모임 socket
     */
    ProceedMeeting: async (req, res) => {
        const admin = await adminModel.findOne({
            email: req.email,
        });
        //const lastMeeting = await proceedMeeting(req.email);
        //data에 이미지랑 isFeedBack FeedBackCount
        await cleanProceeds(admin);
        if (admin.proceeds.length > 0) {
            const lastMeeting = await meetingModel.findById({
                _id: admin.proceeds[0].meetingId,
            });

            const start = lastMeeting.date + " " + lastMeeting.startTime + ":00";
            const end = lastMeeting.date + " " + lastMeeting.endTime + ":00";
            let isFeedBack = false;
            if (lastMeeting.feedBack.length > 0) {
                isFeedBack = true;
                feedBackCount = lastMeeting.feedBack[0].result.length;
            } else feedBackCount = 0;
            const data = {
                groupId: admin.proceeds[0].groupId,
                meetingId: lastMeeting._id,
                name: lastMeeting.name,
                image: lastMeeting.image,
                qrImg: lastMeeting.qrImg,
                start: start,
                end: end,
                attendCount: lastMeeting.user.length,
                feedBackCount: feedBackCount,
                headCount: lastMeeting.headCount,
                isFeedBack: isFeedBack,
            };
            res.status(200).send(util.success(200, "가까운 모임 조회", data));
        } else {
            res.status(200).send(util.success(200, "가까운 모임 조회", null));
        }
    },
    /**
     * groupid에 meetings에 있는 모든 meeting에 대한 정보 넘겨주기
     */
    round: async (req, res) => {
        const groupId = req.params.groupid;

        let data = [];
        try {
            const group = await groupModel.findOne({
                _id: groupId,
            });

            const meetings = group.meetings;

            try {
                const resultPromises = meetings.map(async (Item) => {
                    let meeting = await meetingModel.findOne({
                        _id: Item,
                    });
                    const present = await meeting.user.filter((data) => data.attendance >= 0);
                    let isFeedBack = false;
                    var feedBackCount;
                    if (meeting.feedBack.length > 0) {
                        isFeedBack = true;
                        feedBackCount = meeting.feedBack[0].result.length;
                    } else feedBackCount = 0;
                    const meetingdata = {
                        meetingid: meeting._id,
                        image: meeting.image,
                        qrImg: meeting.qrImg,
                        name: meeting.name,
                        date: meeting.date,
                        headCount: meeting.headCount,
                        userCount: present.length,
                        feedBackCount: feedBackCount,
                        isFeedBack: isFeedBack,
                    };
                    return meetingdata;
                });
                data = await Promise.all(resultPromises);
            } catch (e) {
                return res.status(401).send(util.fail(401, "meeting 데이터 오류"));
            }
        } catch (e) {
            return res.status(401).send(util.fail(401, "해당하는 group이 없습니다."));
        }
        data = data.reverse();
        return res.status(200).send(util.success(200, "모임 회차 조회 성공", data));
    },

    /**
     * QRcode 확인하기
     */
    getQrcode: async (req, res) => {
        const meetingId = req.params.meetingId;

        const meeting = await meetingModel.findById({
            _id: meetingId,
        }, {
            _id: 0,
            qrImg: 1
        });

        return res.status(200).send(util.success(200, "qr코드 받아오기", meeting.qrImg));
    }
};