const express = require('express');
const router = express.Router();
const util = require('../modules/util');
const jwt = require('../modules/jwt');
const user = require('../controllers/user');
const adminModel = require('../models/admin');
const encrypt = require('../modules/crypto');

/**
 * 회원 가입
 */
router.post('/signup', async(req, res) => {
    const {
        email,
        pw,
        pwCheck
    } = req.body;

    // 비밀번호와 비밀번호 확인이 같지 않을 때
    if (pw !== pwCheck){
        res.status(400).send(util.fail(400, "비밀번호가 맞지 않습니다."));
        return;
    }

    // 파라미터 확인
    if (!email || !pw || !pwCheck) {
        res.status(400).send(util.fail(400, "필수 정보를 입력하세요."));
        return;
    }

    // id 중복 확인
    try{
        const result = await adminModel.findOne({email:email},{_id:0, email:1, auth:1})
    
        //-----email이 존재하면-----//
        if(result){
            if (result.auth){
                res.status(400).send(util.fail(400, "이미 존재하는 email입니다."))
                return;
            }
        }
    }catch (err) { 
        if(err){
            res.status(200).json({
                message:"email server error."
            })
            return;
        }
    }

    // 이메일 전송
    user.sendEmail(email);

    await user.signUp(email, pw);

    res.status(200).send(util.success(200, "이메일 전송 완료"));
});


/**
 * 이메일 인증
 */
router.get("/auth", async (req, res) =>  {
    const email = req.query.email;
    const token = req.query.token;

    if (token !== 'aqswdefr') {
        return res.status(400).send(util.fail(400, "이메일 인증을 받지 않았습니다."));
    }

    // token 일치 시 auth를 true로 변경
    const filter = { email : email };
    const update = { auth: true };
    const result = await adminModel.findOneAndUpdate(filter, update, {new:true})
    
    res.status(200).send(util.success(200, "이메일 인증에 성공하였습니다."));
});

/**
 * 로그인
 */
router.post("/signin", async(req, res) => {
    const {email, pw} = req.body;

    // auth가 true인지 확인하기
    const result = await adminModel.findOne({email:email},{_id:0, email:1, auth:1, salt:1, password:1});
    
    if (!result.auth){
        return res.status(400).send(util.fail(400, "이메일 인증을 받지 않았습니다."));
    }

    const salt = result.salt;
    const hashed = await encrypt.encryptWithSalt(pw, salt);

    if (result.password === hashed){
        const {token, _} = await jwt.sign(result)
        return res.status(200).send(util.success(200, "로그인 성공", {accessToken : token}));
    } else{
        return res.status(400).send(util.fail(400, "로그인 실패"));
    }
});

module.exports = router;