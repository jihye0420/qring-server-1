const groupModel = require('../models/group');
const util = require('../modules/util');
const statusCode = require('../modules/statusCode');
const resMessage = require('../modules/responseMessage');

// router.post('/create',meetingController.create);
const group = {
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
    }
}
// router.get('/list',meetingController.list);
// router.get('/info',meetingController.getInfo);
// router.put('/list',meetingController.putInfo);
// router.get('/result',meetingController.result);

