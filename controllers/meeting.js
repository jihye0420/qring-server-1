const groupModel = require('../models/group');
const meetingModel = require('../models/meeting');
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');

module.exports = {
    /**
     * 첫 모임 생성 
     */
    createNewGroup: async (req, res) => {
        const {
            admin,
            name,
            date,
            startTime,
            endTime,
            headCount,
        } = req.body;

        if (!admin || !name || !date || !startTime || !endTime || !headCount) {
            res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
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
                return res.status(CODE.OK).send(util.fail(CODE.OK, '유효하지 않은 형식입니다.'));
            }
            newMeeting.image = image;
        }

        newMeeting.qrImg = "";

        let fin_meeting = await newMeeting.save();

        var newGroup = new groupModel();
        newGroup.admin = req.body.admin;
        newGroup.meetings.push(fin_meeting._id)

        await newGroup.save();

        res.status(200).send(util.success(200, '새 모임 생성 성공'));

    },

    /**
     * 이어서 모임 생성
     */
    createNewMeeting: async (req, res) => {
        const adminId = req.params.id;
        const {
            name,
            date,
            startTime,
            endTime,
            headCount,
        } = req.body;

        if (!name || !date || !startTime || !endTime || !headCount) {
            res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
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
                return res.status(CODE.OK).send(util.fail(CODE.OK, '유효하지 않은 형식입니다.'));
            }
            newMeeting.image = image;
        }

        newMeeting.qrImg = "";

        let fin_meeting = await newMeeting.save();

        const group = await groupModel.findOne({
            admin: adminId
        })
        group.meetings.push(fin_meeting._id);

        await group.save();

        res.status(200).send(util.success(200, '새 모임 생성 성공'));

    },

    /**
     * 이어서 모임 생성할 때, default값으로 띄어줄때 사용하는 API
     */
    getInfo: async (req, res) => {
        const meetingId = req.params.id
        const meetingObject = await meetingModel.findOne({
            _id: meetingId
        })
        console.log(meetingId);
        console.log(meetingObject);
        res.status(200).json({
            name: meetingObject.name,
            date: meetingObject.date,
            startTime: meetingObject.startTime,
            endTime: meetingObject.endTime,
            headCount: meetingObject.headCount,
            image: meetingObject.image
        })
    },

    /**
     * 모임 편집 및 피드백 질문 편집 기능
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
            title,
            content,
            choice,
            form
        } = req.body;

        if (!name || !date || !startTime || !endTime || !headCount) {
            res.status(400).send(util.fail(400, '필요한 값이 없습니다.'))
            return
        }

        meeting.name = req.body.name;
        meeting.date = req.body.date;
        meeting.startTime = req.body.startTime;
        meeting.endTime = req.body.endTime;
        meeting.headCount = req.body.headCount;

        meeting.feedBack = {
            title: req.body.title,
            content: req.body.content,
            choice: req.body.choice,
            form: req.body.form
        }


        const image = req.file.location;
        // data check - undefined
        if (image !== undefined) {
            const type = req.file.mimetype.split('/')[1];
            if (type !== 'jpeg' && type !== 'jpg' && type !== 'png') {
                return res.status(CODE.OK).send(util.fail(CODE.OK, '유효하지 않은 형식입니다.'));
            }
            meeting.image = image;
        }

        await meeting.save();

        await res.status(200).send(util.success(200, '모임 정보 수정 성공', meeting));

    },

    /**
     * 이어서 모임 생성할 때, default값으로 띄어줄때 사용하는 API
     */
    list: async (req, res) => {
        const adminId = req.params.id;

        const group = await groupModel.findOne({
            admin: adminId
        })

        const meetingArray = [];
        const meetings = group.meetings;
        for (let item of meetings) {
            let meeting = await meetingModel.findOne({
                _id: item
            })
            meetingArray.push({
                name: meeting.name,
                date: meeting.date,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                headCount: meeting.headCount,
                image: meeting.image
            })
        }

        res.status(200).json({
            meetings: meetingArray
        })
    },
    // router.get('/result',meetingController.result);
    result: async (req, res) => {

    }
}