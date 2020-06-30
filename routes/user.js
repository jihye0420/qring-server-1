const express = require('express');
const router = express.Router();
const util = require('../modules/util');
const user = require('../controllers/user');
const {
    sendEmail
} = require('../controllers/user');

/**
 * 회원 가입
 */
router.post('/', async (req, res) => {

    const {
        email,
        pw,
        pwCheck
    } = req.body;

    // 비밀번호와 비밀번호 확인이 같지 않을 때
    if (pw !== pwCheck) {
        res.status(400).send(util.fail(400, "비밀번호 확인 실패"));
        return;
    }

    // 파라미터 확인
    if (!email || !pw || !pwCheck) {
        res.status(400).send(util.fail(400, "필수 정보를 입력하세요."));
        return;
    }

    // id 중복 확인
    // try{
    //     const result = await users.findOne({email:email},{_id:0,email:1})

    //      그리고 auth가 false이면

    //     if(result){
    //         res.status(400).send(util.fail(400, "이미 존재하는 email입니다."))
    //         return;
    //     }
    // }catch (err) { 
    //     if(err){
    //         res.status(200).json({
    //             message:"email server error."
    //         })
    //         return;
    //     }
    // }

    // 이메일 전송
    user.sendEmail(email);

    res.status(200).send(util.success(200, "이메일 전송 완료"));
});


/**
 * 이메일 인증
 */
router.get("/auth", function (req, res, next) {
    let email = req.query.email;
    let token = req.query.token;

    // token이 일치하면 테이블에서 email을 찾아 회원가입 승인 로직 구현

    // 여기서 email을 나중에 pw로 바꾸기
    user.signUp(email);
    res.status(200).send(util.success(200, "이메일 토큰 일치"));
});

module.exports = router;