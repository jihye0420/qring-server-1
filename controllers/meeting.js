const adminModel = require('../models/admin');
const groupModel = require('../models/group');
const meetingModel = require('../models/meeting');
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');
const async = require('pbkdf2/lib/async');

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
            headCount,
        } = req.body;

        if (!name || !date || !startTime || !endTime || !headCount) {
            return res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
        }

        var newMeeting = new meetingModel();
        newMeeting.name = req.body.name,
            newMeeting.date = req.body.date,
            newMeeting.startTime = req.body.startTime,
            newMeeting.endTime = req.body.endTime,
            newMeeting.headCount = req.body.headCount

        const image = req.file.location;
        // data check - undefined
        if (image !== undefined) {
            const type = req.file.mimetype.split('/')[1];
            if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                return res.status(400).send(util.fail(400, '유효하지 않은 형식입니다.'));
            }
            newMeeting.image = image;
        }

        newMeeting.qrImg = "";

        let fin_meeting = await newMeeting.save();

        var newGroup = new groupModel();
        const admin = await adminModel.findOne({
            email: adminEmail
        })

        newGroup.admin = admin._id;
        newGroup.meetings.push(fin_meeting._id)

        await newGroup.save();

        return res.status(200).send(util.success(200, '새 모임 생성 성공', newGroup));

    },

    /**
     * 이어서 모임 생성
     */
    createNewMeeting: async (req, res) => {
        const groupId = req.params.id;
        const {
            name,
            date,
            startTime,
            endTime,
            headCount,
        } = req.body;

        if (!name || !date || !startTime || !endTime || !headCount) {
            return res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
        }

        var newMeeting = new meetingModel();
        newMeeting.name = req.body.name,
            newMeeting.date = req.body.date,
            newMeeting.startTime = req.body.startTime,
            newMeeting.endTime = req.body.endTime,
            newMeeting.headCount = req.body.headCount

        const image = req.file.location;
        // data check - undefined
        if (image !== undefined) {
            const type = req.file.mimetype.split('/')[1];
            if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                return res.status(400).send(util.fail(400, '유효하지 않은 형식입니다.'))
            }
            newMeeting.image = image;
        }

        newMeeting.qrImg = "";

        let fin_meeting = await newMeeting.save();

        const group = await groupModel.findOne({
            _id: groupId
        })
        group.meetings.push(fin_meeting._id);

        await group.save();

        return res.status(200).send(util.success(200, '이어서 모임 생성 성공', group));

    },

    /**
     * 이어서 모임 생성할 때, default값으로 띄어줄때 사용하는 API
     */
    getInfo: async (req, res) => {
        const meetingId = req.params.id
        const meetingObject = await meetingModel.findOne({
            _id: meetingId
        })
        const data = {
            meeting : meetingObject
        }
        return res.status(200).send(util.success(200, '모임 정보 조회 성공', data));
    },

    /**
     * 모임 편집 기능
     */
    putInfo: async (req, res) => {
        const meetingId = req.params.id
        let meeting = await meetingModel.findOne({
            _id: meetingId
        })

        const {
            name,
            date,
            startTime,
            endTime,
            headCount,
        } = req.body;

        if (!name || !date || !startTime || !endTime || !headCount) {
            return res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
        }

        meeting.name = req.body.name;
        meeting.date = req.body.date;
        meeting.startTime = req.body.startTime;
        meeting.endTime = req.body.endTime;
        meeting.headCount = req.body.headCount;

        const image = req.file.location;
        // data check - undefined
        if (image !== undefined) {
            const type = req.file.mimetype.split('/')[1];
            if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                return res.status(400).send(util.fail(400, '유효하지 않은 형식입니다.'));
            }
            meeting.image = image;
        }

        await meeting.save();

        return res.status(200).send(util.success(200, '모임 정보 수정 성공', meeting));

    },
    /**
     * 모임 리스트 (각 그룹에서 최신 모임반환) 진행중 / 완료 & 예정 나눠서 반환
     */
    list : async(req,res)=>{
        const adminId = req.params.id;


    },
    /**
     * 모임 리스트에서 각 회차의 정보 조회 round가 -1일때 마지막 회차와 회차 수 반환, 다른 수 일때는 해당 회차 정보 반환
     */
    round: async (req, res) => {
        const adminEmail = req.email;
        const admin = await adminModel.findOne({
            email: adminEmail
        })
        const adminId = admin._id;
        const round = req.params.round;

        const group = await groupModel.findOne({
            admin: adminId
        })

        const meetings = group.meetings;

        if (round == -1) {
            let meeting = await meetingModel.findOne({
                _id: meetings[meetings.length - 1]
            })

            let user = [];
            let cnt = 1;
            for (let item of meeting.user) {
                if (cnt > 3) break;
                user.push(item);
                cnt++;
            }

            let feedBack = [];
            cnt = 1;
            for (let item of meeting.feedBack) {
                if (cnt > 3) break;
                feedBack.push(item);
                cnt++;
            }

            const data = {
                meeting: {
                    _id : meeting._id,
                    user: user,
                    feedBack: feedBack,
                    name: meeting.name,
                    date: meeting.date,
                    startTime: meeting.startTime,
                    endTime: meeting.endTime,
                    headCount: meeting.headCount,
                    image: meeting.image,
                    qrImg: meeting.qrImg
                }
            }

            return res.status(200).send(util.success(200, '모임 회차 조회 성공', data));
        } else {
            let meeting = await meetingModel.findOne({
                _id: meetings[round - 1]
            })

            let user = [];
            let cnt = 1;
            for (let item of meeting.user) {
                if (cnt > 3) break;
                user.push(item);
                cnt++;
            }

            let feedBack = [];
            cnt = 1;
            for (let item of meeting.feedBack) {
                if (cnt > 3) break;
                feedBack.push(item);
                cnt++;
            }

            const data = {
                meeting: {
                    _id : meeting._id,
                    user: user,
                    feedBack: feedBack,
                    name: meeting.name,
                    date: meeting.date,
                    startTime: meeting.startTime,
                    endTime: meeting.endTime,
                    headCount: meeting.headCount,
                    image: meeting.image,
                    qrImg: meeting.qrImg
                }
            }

            return res.status(200).send(util.success(200, '모임 회차 조회 성공', data));
        }
    },
    // router.get('/result',meetingController.result);
    result: async (req, res) => {

    }
}