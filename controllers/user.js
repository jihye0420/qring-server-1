const nodemailer = require('nodemailer');
const emailInfo = require('../config/emailinfo.json');
const encrypt = require('../modules/crypto');
const jwt = require('../modules/jwt');
const adminModel = require('../models/admin');

module.exports = {

    sendEmail: (email) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailInfo.id, // gmail 계정 아이디
                pass: emailInfo.pw // gmail 계정 비밀번호
            }
        });

        // 난수 문자열 생성
        //const token = Math.random().toString(36).substr(2,11);

        const mailOptions = {
            from: "", // 발송 메일 주소
            to: email, // 수신 메일 주소
            subject: "안녕하세요, 큐링입니다. 이메일 인증을 해주세요.",
            html: "<p>아래의 링크를 클릭해주세요 !</p>" +
                "<a href='http://localhost:3001/user/auth?email=" +
                email +
                "&token=aqswdefr'>인증하기</a>",
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Test : " + info.response);
            }
        });
        
    },

    signUp: async (email, password) => {
        const {
            salt,
            hashed
        } = await encrypt.encrypt(password);

        console.log(hashed);

        var admin = new adminModel();
        admin.email = email;
        admin.password = hashed;
        admin.salt = salt;
        admin.auth = false;
        await admin.save();
    }

}