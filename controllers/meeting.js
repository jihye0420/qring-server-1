const group = require('../models/group');
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');

const group = {
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

        let newMeeting = new group()
        newMeeting.admin = req.body.admin
        newMeeting.meeting.name = req.body.name
        newMeeting.meeting.date = req.body.date
        newMeeting.meeting.startTime = req.body.startTime
        newMeeting.meeting.endTime = req.body.endTime
        newMeeting.meeting.headCount = req.body.headCount

        await newMeeting.save()

        res.status(200).send(util.success(200, '새 모임 생성 성공'))

    },
    // router.get('/list',meetingController.list);
    list : async (req, res)=>{

    },
    // router.get('/info',meetingController.getInfo);
    getInfo : async(req, res) => {
        let meeting

        if (req.body.meetingId){
            meeting = await group.findById(req.body.meetingId)
        }

        
    },
    // router.put('/list',meetingController.putInfo);
    getInfo : async(req, res)=>{

    },
    // router.get('/result',meetingController.result);
    result : async(req,res)=>{

    }
}



