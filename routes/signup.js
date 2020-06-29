const express = require('express');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const emailInfo = require('../config/emailinfo.json');
const router = express.Router();

router.post('/', async(req, res) => {
    const email = req.body.email;
    
    const transporter = nodemailer.createTransport(smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
            user: emailInfo.id, // gmail 계정 아이디
            pass: emailInfo.pw   // gmail 계정 비밀번호
        }
    }));

    const mailOptions = {
        from : "", // 발송 메일 주소
        to : email,   // 수신 메일 주소
        subject : "안녕하세요, 큐링입니다. 이메일 인증을 해주세요.",
        html:
        "<p>아래의 링크를 클릭해주세요 !</p>" +
        "<a href='http://localhost:3000/auth/?email=" +
        email +
        "&token=abcdefg'>인증하기</a>",
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else{
            console.log("Email Test : " + info.response);
        }
    });

    res.status(200).send(200, "이메일 전송 완료");
});

router.get("/auth", function (req, res, next) {
  let email = req.query.email;
  let token = req.query.token;
  console.log(email);
  console.log(token);
  // token이 일치하면 테이블에서 email을 찾아 회원가입 승인 로직 구현
});

module.exports = router;