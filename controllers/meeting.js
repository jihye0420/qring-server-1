const adminModel = require('../models/admin');
const groupModel = require('../models/group');
const meetingModel = require('../models/meeting');
const util = require('../modules/util');
const moment = require('moment');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');
const async = require('pbkdf2/lib/async');
const qrcodeController = require('../controllers/qrcode');

module.exports = {
    /**
     * 첫 모임 생성 
     */
    createNewGroup: async (req, res) => {
        const adminEmail = req.email;
        const {
            name,
            date,
            startTime,
            endTime,
            late,
            headCount,
            feedBack
        } = req.body;


        if (feedBack) {
            var parsedFeedbacks = await feedBack.map((fb) => {
                let parsedFb;
                if (typeof fb === 'string') {
                    parsedFb = JSON.parse(fb);
                }
                return parsedFb;
            })
        }

        if (!name || !date || !startTime || !endTime || !late || !headCount) {
            return res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
        }

        var newMeeting = new meetingModel();
        newMeeting.name = req.body.name
        newMeeting.date = req.body.date
        newMeeting.startTime = req.body.startTime
        newMeeting.endTime = req.body.endTime
        newMeeting.late = req.body.late
        newMeeting.headCount = req.body.headCount
        if (feedBack) {
            newMeeting.feedBack = parsedFeedbacks
        }

        let image = null;
        // data check - undefined
        if (req.file !== undefined) {
            image = req.file.location;
            const type = req.file.mimetype.split('/')[1];
            if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                return res.status(401).send(util.fail(401, '유효하지 않은 형식입니다.'));
            }
        }
        newMeeting.image = image;
        //newMeeting.qrImg = "";

        let fin_meeting = await newMeeting.save();

        var newGroup = new groupModel();
        const admin = await adminModel.findOne({
            email: adminEmail
        });

        const qrKey = await qrcodeController.makeQrcode(adminEmail, newGroup._id, fin_meeting._id);
        newMeeting.qrImg = qrKey;

        newGroup.admin = admin._id;
        newGroup.meetings.push(fin_meeting._id);
        await newGroup.save();

        admin.groups.push(newGroup._id);
        await admin.save();

        const data = {
            "groupid": newGroup._id,
            "meeting": [{
                "name": newMeeting.name,
                "date": newMeeting.date,
                "startTime": newMeeting.startTime,
                "endTime": newMeeting.endTime,
                "image": newMeeting.image,
                "qrImg": newMeeting.qrImg,
                "late": newMeeting.late,
                "headCount": newMeeting.headCount
            }]
        }

        return res.status(200).send(util.success(200, '새 모임 생성 성공', data));

    },

    /**
     * 이어서 모임 생성
     */
    createNewMeeting: async (req, res) => {
        const adminEmail = req.email;
        const groupId = req.params.groupid;
        const {
            name,
            date,
            startTime,
            endTime,
            late,
            headCount,
            feedBack
        } = req.body;


        const parsedFeedbacks = feedBack.map((fb) => {
            let parsedFb;
            if (typeof fb === 'string') {
                parsedFb = JSON.parse(fb);
            }
            return parsedFb;
        })

        if (!name || !date || !startTime || !endTime || !late || !headCount) {
            return res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
        }

        var newMeeting = new meetingModel();
        newMeeting.name = req.body.name
        newMeeting.date = req.body.date
        newMeeting.startTime = req.body.startTime
        newMeeting.endTime = req.body.endTime
        newMeeting.late = req.body.late
        newMeeting.headCount = req.body.headCount
        newMeeting.feedBack = parsedFeedbacks


        let image = null;
        // data check - undefined
        if (req.file !== undefined) {
            image = req.file.location;
            const type = req.file.mimetype.split('/')[1];
            if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                return res.status(401).send(util.fail(401, '유효하지 않은 형식입니다.'));
            }
        }
        newMeeting.image = image;

        let fin_meeting = await newMeeting.save();

        // qr코드 생성
        newMeeting.qrImg = await qrcodeController.makeQrcode(adminEmail, groupId, fin_meeting._id);

        try {
            const group = await groupModel.findOne({
                _id: groupId
            })
            group.meetings.push(fin_meeting._id);
            await group.save();

            const data = {
                "groupid": group._id,
                "meeting": [{
                    "name": newMeeting.name,
                    "date": newMeeting.date,
                    "startTime": newMeeting.startTime,
                    "endTime": newMeeting.endTime,
                    "image": newMeeting.image,
                    "qrImg": newMeeting.qrImg,
                    "late": newMeeting.late,
                    "headCount": newMeeting.headCount
                }]
            }

            return res.status(200).send(util.success(200, '이어서 모임 생성 성공', data));
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
            email: adminEmail
        })
        const allGroup = await groupModel.find({
            admin: admin._id
        });

        const {
            date,
            startTime,
            endTime,
        } = req.body;


        for (let groupItem of allGroup) {
            for (let meetingId of groupItem.meetings) {
                try {
                    let meetingItem = await meetingModel.findOne({
                        _id: meetingId
                    })

                    if (meetingItem.date == date) {
                        if (meetingItem.endTime <= startTime) {
                            continue;
                        } else if (meetingItem.startTime >= endTime) {
                            continue;
                        } else {
                            return res.status(400).send(util.fail(400, '모임 시간이 중복됩니다.'));
                        }
                    }
                } catch (e) {
                    return res.status(401).send(util.fail(401, "meeting 데이터 오류"));
                }
            }
        }

        return res.status(200).send(util.success(200, '모임 생성이 가능한 시간입니다.'))
    },

    /**
     * 이어서 모임 생성할 때, default값으로 띄어줄때 사용하는 API
     */
    getInfo: async (req, res) => {
        const groupId = req.params.groupid
        const meetingId = req.params.meetingid
        try {
            const meetingObject = await meetingModel.findOne({
                _id: meetingId
            })

            for (let userItem of meetingObject.user) {
                userItem.attendance = '결석';
            }

            const data = {
                "groupId": groupId,
                "meeting": {
                    "_id": meetingObject._id,
                    "user": meetingObject.user,
                    "name": meetingObject.name,
                    "date": meetingObject.date,
                    "startTime": meetingObject.startTime,
                    "endTime": meetingObject.endTime,
                    "late": meetingObject.late,
                    "headCount": meetingObject.headCount,
                    "image": meetingObject.image
                }
            }

            return res.status(200).send(util.success(200, '모임 정보 조회 성공', data));
        } catch (e) {
            return res.status(400).send(util.fail(400, "해당하는 meeting이 없습니다."));
        }
    },

    /**
     * 모임 편집 기능
     */
    putInfo: async (req, res) => {
        const meetingId = req.params.meetingid
        try {
            let meeting = await meetingModel.findOne({
                _id: meetingId
            })

            const {
                name,
                date,
                startTime,
                endTime,
                late,
                headCount,
            } = req.body;

            if (!name || !date || !startTime || !endTime || !late || !headCount) {
                return res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
            }

            meeting.name = req.body.name;
            meeting.date = req.body.date;
            meeting.startTime = req.body.startTime;
            meeting.endTime = req.body.endTime;
            meeting.late = req.body.late;
            meeting.headCount = req.body.headCount;

            let image = null;
            // data check - undefined
            if (req.file !== undefined) {
                image = req.file.location;
                const type = req.file.mimetype.split('/')[1];
                if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                    return res.status(401).send(util.fail(401, '유효하지 않은 형식입니다.'));
                }
            }
            newMeeting.image = image;

            const data = {
                "name": meeting.name,
                "data": meeting.date,
                "startTime": meeting.startTime,
                "endTime": meeting.endTime,
                "late": meeting.late,
                "headCount": meeting.headCount,
                "image": meeting.image,
                "qrImg": meeting.qrImg
            }

            await meeting.save();

            return res.status(200).send(util.success(200, '모임 정보 수정 성공', data));
        } catch (e) {
            return res.status(402).send(util.fail(402, "해당하는 meeting이 없습니다."));
        }
    },
    /**
     * 모임 삭제
     */
    deleteMeeting: async (req, res) => {
        const groupId = req.params.groupid;
        const meetingId = req.params.meetingid;
        try {
            const group = await groupModel.findOne({
                _id: groupId
            });

            console.log(meetingId);
            if (group.meetings.length > 1) {
                const newMeetings = [];
                for (let Item of group.meetings) {
                    console.log(Item);
                    if (Item != meetingId) {
                        newMeetings.push(Item);
                    }
                }
                group.meetings = newMeetings;
                console.log(newMeetings);
                await group.save();
            } else {
                await groupModel.deleteOne({
                    _id: groupId
                })
            }
        } catch (e) {
            return res.status(400).send(util.fail(400, "해당하는 group이 없습니다."));
        }

        await meetingModel.deleteOne({
            _id: meetingId
        });

        return res.status(200).send(util.success(200, '모임 삭제 성공'));
    },
    /**
     * 모임 리스트 (각 그룹에서 최신 모임반환) 진행중 / 완료 & 예정 나눠서 반환
     */
    list: async (req, res) => {
        const adminEmail = req.email;
        const admin = await adminModel.findOne({
            email: adminEmail
        })
        const allGroup = admin.groups;

        const today = moment().format('YYYY-MM-DD');
        const end = [];
        const proceed = [];

        for (let groupid of allGroup) {
            const group = await groupModel.findOne({
                _id: groupid
            })
            try {
                const lastMeeting = await meetingModel.findOne({
                    _id: group.meetings[group.meetings.length - 1]
                })
                const userCount = lastMeeting.user.length;
                var feedBackCount;
                if (lastMeeting.feedBack.length > 0) {
                    feedBackCount = lastMeeting.feedBack[0].result.length;
                } else feedBackCount = 0;
                let Item = {
                    groupId: group._id,
                    meetingId: lastMeeting._id,
                    image: lastMeeting.image,
                    name: lastMeeting.name,
                    date: lastMeeting.date,
                    userCount: userCount,
                    feedBackCount: feedBackCount
                }
                if (lastMeeting.date < today) { //종료된 모임
                    end.push(Item);
                } else { //진행중이거나 예정된 모임
                    proceed.push(Item);
                }
            } catch (e) {
                return res.status(400).send(util.fail(400, "meeting 데이터 오류"));
            }
        }

        end.sort(function (a, b) {
            if (a.date === b.date) { //오름차순
                return a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0;
            }
            return a.date > b.date ? -1 : a.date < b.date ? 1 : 0; //내림차순 
        })
        proceed.sort(function (a, b) {
            if (a.date === b.date) { //오름차순
                return a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0;
            }
            return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; //오름차순
        })

        const meetingList = proceed.concat(end);

        return res.status(200).send(util.success(200, "모임 리스트 조회", meetingList));
    },

    /**
     * 모임 리스트에서 각 회차의 정보 조회 round가 -1일때 마지막 회차와 회차 수 반환, 다른 수 일때는 해당 회차 정보 반환
     */
    round: async (req, res) => {
        const groupId = req.params.groupid;

        let data = [];
        try {
            const group = await groupModel.findOne({
                _id: groupId
            })

            const meetings = group.meetings


            for (let Item of meetings) {
                try {
                    let meeting = await meetingModel.findOne({
                        _id: Item
                    })

                    const userCount = meeting.user.length;
                    var feedBackCount;
                    if (meeting.feedBack.length > 0) {
                        feedBackCount = meeting.feedBack[0].result.length;
                    } else feedBackCount = 0;
                    const meetingdata = {
                        "meetingid": meeting._id,
                        "name": meeting.name,
                        "date": meeting.date,
                        "userCount": userCount,
                        "feedBackCount": feedBackCount,
                        "headCount": meeting.headCount,
                        "image": meeting.image,
                        "qrImg": meeting.qrImg
                    }

                    data.push(meetingdata);
                } catch (e) {
                    return res.status(401).send(util.fail(401, "meeting 데이터 오류"));
                }
            }
        } catch (e) {
            return res.status(401).send(util.fail(401, "해당하는 group이 없습니다."));
        }
        data = data.reverse();
        return res.status(200).send(util.success(200, '모임 회차 조회 성공', data));

    },
}