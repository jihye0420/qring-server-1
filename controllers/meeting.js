const groupModel = require('../models/group');
const meetingModel = require('../models/meeting');
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');

module.exports = {
    // router.post('/create',meetingController.create);
    create : async (req, res) => {
        const {
            admin,
            name,
            date,
            startTime,
            endTime,
            headCount,
        } = req.body;
        
        if (!admin || !name || !date || !startTime || !endTime || !headCount){
            res.status(400).send(util.fail(400,'필요한 값이 없습니다.'))
        }

        var newMeeting = new meetingModel ();
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
        
        
        let fin_meeting = await newMeeting.save();

        var newGroup = new groupModel();
        newGroup.admin = req.body.admin;
        newGroup.meetings.push(fin_meeting._id)

        await newGroup.save();

        res.status(200).send(util.success(200, '새 모임 생성 성공'));

    },
    // router.get('/info',meetingController.getInfo);
    getInfo : async(req, res) => {
        const meetingId = req.params.id
        const meetingObject = await meetingModel.findOne({_id : meetingId})
        console.log(meetingId);
        console.log(meetingObject);
        res.status(200).json({
            name : meetingObject.name,
            date : meetingObject.date,
            startTime : meetingObject.startTime,
            endTime : meetingObject.endTime,
            headCount : meetingObject.headCount,
            image : meetingObject.image
        })
    },
    // router.put('/list',meetingController.putInfo);
    putInfo : async(req, res)=>{
        const meetingId = req.params.id
        let meeting = await meetingModel.findOne({_id : meetingId})

        const {
            name,
            date,
            startTime,
            endTime,
            headCount,
        } = req.body;

        if (!name || !date || !startTime || !endTime || !headCount ){
            res.status(400).send(util.fail(400,'필요한 값이 없습니다.'))
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
                return res.status(CODE.OK).send(util.fail(CODE.OK, '유효하지 않은 형식입니다.'));
            }
            meeting.image = image;
        }

        await meeting.save();

        await res.status(200).send(util.success(200, '모임 정보 수정 성공'));

    },
    // router.get('/list',meetingController.list);
    list : async (req, res)=>{

    },
    // router.get('/result',meetingController.result);
    result : async(req,res)=>{

    }
}



