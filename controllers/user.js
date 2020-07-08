const nodemailer = require("nodemailer");
const emailInfo = require("../config/emailinfo.json");
const encrypt = require("../modules/crypto");
const jwt = require("../modules/jwt");
const adminModel = require("../models/admin");
const util = require("../modules/util");
const ejs = require("ejs");

const userController = {
  /**
   * 회원 가입
   */
  signUp: async (req, res) => {
    const { email, pw, name, birth } = req.body;

    // 파라미터 확인
    if (!email || !pw || !name || !birth) {
      res.status(402).send(util.fail(402, "필수 정보를 입력하세요."));
      return;
    }

    // id 중복 확인
    try {
      const result = await adminModel.findOne(
        {
          email: email,
        },
        {
          _id: 0,
          email: 1,
          auth: 1,
        }
      );

      // email이 존재하면
      if (result) {
        // 이메일 인증을 한 경우
        if (result.auth) {
          res.status(401).send(util.fail(401, "이미 등록된 이메일입니다."));
          return;
        }
        // 이메일 인증을 하지 않은 경우
        else {
          const token = await userController.sendEmail(email);
          await userController.changeAuthToken(email, token);
          res
            .status(201)
            .send(
              util.success(
                201,
                "이미 회원가입을 하셨습니다. 이메일 인증을 해주세요."
              )
            );
          return;
        }
      }
    } catch (err) {
      if (err) {
        res.status(500).send(util.fail(500, "이메일 서버 에러"));
        return;
      }
    }

    const token = await userController.sendEmail(email); // 이메일 전송

    userController.saveUserInfo(email, pw, token, name, birth); // 회원 정보 저장

    return res.status(200).send(util.success(200, "이메일 전송 완료"));
  },

  /**
   * 이메일 전송
   */
  sendEmail: async (email) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailInfo.id, // gmail 계정 아이디
        pass: emailInfo.pw, // gmail 계정 비밀번호
      },
    });

    // 난수 문자열 생성
    const token = Math.random().toString(36).substr(2, 11);

    ejs.renderFile(
      __dirname + "/../views/mail.ejs",
      { to: email, token: token },
      function (err, data) {
        if (err) {
          console.log(err);
        } else {
          let mailOptions = {
            from: "", // 발송 메일 주소
            to: email, // 수신 메일 주소
            subject: "안녕하세요, 큐링입니다. 이메일 인증을 해주세요.",
            html: data,
          };
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              console.log(err);
            } else {
              console.log("Message sent: " + info.response);
            }
          });
        }
      }
    );

    return token;
  },

  /**
   * 회원 정보 저장
   */
  saveUserInfo: async (email, password, token, name, birth) => {
    const { salt, hashed } = await encrypt.encrypt(password);

    var admin = new adminModel();
    admin.email = email;
    admin.password = hashed;
    admin.salt = salt;
    admin.name = name;
    admin.birth = birth;
    admin.auth = false;
    admin.authToken = token;
    await admin.save();
  },

  /**
   * 이메일 인증 토큰 변경
   */
  changeAuthToken: async (email, token) => {
    const filter = {
      email: email,
    };
    const update = {
      authToken: token,
    };
    await adminModel.findOneAndUpdate(filter, update, {
      new: true,
    });
  },

  /**
   * 이메일 인증
   */
  authenticate: async (req, res) => {
    const email = req.query.email;
    const token = req.query.token;

    // token 일치 시 auth를 true로 변경
    const filter = {
      email: email,
    };
    const update = {
      auth: true,
    };
    const result = await adminModel.findOneAndUpdate(filter, update, {
      new: true,
    });

    if (result.authToken === undefined) {
      res.status(400).send(util.fail(400, "이미 인증된 회원입니다."));
    }
    if (result.authToken === token) {
      await adminModel.update(filter, {
        $unset: {
          authToken: 1,
        },
      }); // authToken 필드 삭제
      res.status(200).send(util.success(200, "이메일 인증에 성공하였습니다."));
    } else {
      res.status(400).send(util.fail(400, "이메일 인증에 실패하였습니다."));
    }
  },

  /**
   * 로그인
   */
  signIn: async (req, res) => {
    const { email, pw } = req.body;

    const result = await adminModel.findOne(
      {
        email: email,
      },
      {
        _id: 0,
        email: 1,
        auth: 1,
        salt: 1,
        password: 1,
      }
    );

    if (result === null) {
      return res.status(401).send(util.fail(401, "이메일을 확인해주세요."));
    }

    // auth가 true인지 확인하기
    if (!result.auth) {
      return res
        .status(402)
        .send(util.fail(402, "이메일 인증을 받지 않았습니다."));
    }

    const salt = result.salt;
    const hashed = await encrypt.encryptWithSalt(pw, salt);

    if (result.password === hashed) {
      const { token, _ } = await jwt.sign(result);
      return res.status(200).send(
        util.success(200, "로그인 성공", {
          accessToken: token,
        })
      );
    } else {
      return res
        .status(400)
        .send(util.fail(400, "비밀번호가 일치하지 않습니다."));
    }
  },

  /**
   * 프로필 수정
   */
  editProfile: async (req, res) => {
    const userEmail = req.email;
    const { name, birth } = req.body;

    // 파라미터 확인
    if (!name || !birth) {
      return res.status(400).send(util.fail(400, "필수 정보를 입력하세요."));
    }

    const filter = {
      email: userEmail,
    };
    const update = {
      name: name,
      birth: birth,
    };
    await adminModel.findOneAndUpdate(filter, update, {
      new: true,
    });

    return res.status(200).send(util.success(200, "프로필 수정 성공"));
  },

  /**
   * 프로필 읽기
   */
  readProfile: async (req, res) => {
    const userEmail = req.email;

    const filter = {
      email: userEmail,
    };
    const result = await adminModel.find(filter, {
      _id: 0,
      email: 1,
      name: 1,
      birth: 1,
    });

    return res
      .status(200)
      .send(util.success(200, "프로필 불러오기 성공", result));
  },
};

module.exports = userController;
