const groupModel = require('../models/group');
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
            image
        } = req.body;
        
        if (!admin || !name || !date || !startTime || !endTime || !headCount ){
            res.status(400).send(util.fail(400,'필요한 값이 없습니다.'))
        }

        var newMeeting = new groupModel();
        newMeeting.admin = req.body.admin;
        newMeeting.meeting = [
            name = req.body.name,
            date = req.body.date,
            startTime = req.body.startTime,
            endTime = req.body.endTime,
            headCount = req.body.headCount
        ]

        console.log(newMeeting);
        console.log(newMeeting.meeting);
        console.log(newMeeting.meeting.name);
        console.log(newMeeting.meeting.date);

        await newMeeting.save();

        res.status(200).send(util.success(200, '새 모임 생성 성공'));

    },
    // router.get('/list',meetingController.list);
    list : async (req, res)=>{

    },
    // router.get('/info',meetingController.getInfo);
    getInfo : async(req, res) => {
        // let meeting = await groupModel.findById(req.params.id)

        // res.status(200).json({
        //     admin : meeting.admin,
        //     name : meeting.name,
        //     date : meeting.date,
        //     startTime : meeting.startTime,
        //     endTime : meeting.endTime,
        //     headCount : meeting.headCount
        // })

    },
    // router.put('/list',meetingController.putInfo);
    putInfo : async(req, res)=>{
        // let meeting = await groupModel.findById(req.params.id)

        // const {
        //     admin,
        //     name,
        //     date,
        //     startTime,
        //     endTime,
        //     headCount,
        //     image
        // } = req.body;

        // meeting.admin = req.body.admin;
        // meeting.meeting.name = req.body.name;
        // meeting.meeting.date = req.body.date;
        // meeting.meeting.startTime = req.body.startTime;
        // meeting.meeting.endTime = req.body.endTime;
        // meeting.meeting.headCount = req.body.headCount;

        // await meeting.save();

        // await res.status(200).send(util.success(200, '모임 정보 수정 성공'));

    },
    // router.get('/result',meetingController.result);
    result : async(req,res)=>{

    }
}



