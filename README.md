# qring-server
🐬 26기 솝트 앱잼: "Qring - QR코드로 만들어가는 우리의 모임" 🐬
<img style="border: 1px solid black !important; border-radius:20px;" src="https://flood-master.s3.ap-northeast-2.amazonaws.com/KakaoTalk_Photo_2020-01-02-03-54-55-1.png" width="200px" />

![node_badge](https://img.shields.io/badge/node-%3E%3D%208.0.0-green)
![npm_bedge](https://img.shields.io/badge/npm-v6.14.2-blue)

* <b> SOPT 26th APPJAM
    
* 프로젝트 기간: 2019.06.27 ~ 2019.07.18

* [API 문서](https://github.com/qring-sopt/qring-server/wiki)</b>

<br>


## :bookmark_tabs: 프로젝트 설명

<b>모임의 시작과 끝을 함께하는, QRing입니다. 🐬</b> 
</ br>
QR 코드를 통해 모임의 시작을 빠르게, 모임의 끝엔 원활한 피드백을 통해 모임이 더 성숙해지고, 구성원은 함께 성장하게 됩니다.

<br>

## :earth_americas: Team Role 


#### :surfing_woman: 김민지

- 게시물, 북마크, 댓글 관련 DB 설계및 구축
- 북마크 기능 구현
- 게시물 업로드, 수정 기능 구현
- 댓글 및 대댓글 기능 구현
- 프록시 서버 및 메인 서버 설정, 배포
- 테스팅 자동화 환경 구축

#### :surfing_woman: 이현주

- 회원가입 기능 구현
- 로그인 기능 구현
- 마이페이지 프로필 설정 변경 기능 구현
- 이미지 및 비밀번호 변경 기능 구현
- 조직설정, 계정관리 기능 구현
- 테스팅 자동화 환경 구축

#### :surfing_woman: 이지윤

- user, group 관련 DB 설계및 구축
- 회원가입 기능 구현
- 로그인 기능 구현
- 조직 생성 기능 구현
- 비밀번호 찾기 구현
- 아이디 찾기 구현

<br>

## :heavy_check_mark: Features

- url로 해당 게시물의 썸네일, 제목, 소개 크롤링.
- 공유하기 버튼을 사용하여, 쉽게 공유하기 가능.
- 그룹 내 사용자들의 조회수 및 북마크수를 기반으로 Top3 게시물 추천.
- 회사 내에 게시물들을 정리하여 통계적 그래프로 시각화.
- 중복되지 않는 조직 코드 생성

<br>

## :blue_book: Package

사용 패키지(모듈)은 다음과 같습니다.

- ** nodemailer ** : 회원 가입 시 이메일 인증을 위한 이메일 전송
- ** jsonwebtoken **
- ** rand-token **
- ** pbkdf2 **
- ** mongoose **
- ** qrcode-with-logos **
- ** aws-sdk **
- ** multer-s3 **
- ** multer **

```json
"dependencies": {
    "aws-sdk": "^2.709.0",
    "body-parser": "^1.19.0",
    "connect": "^3.7.0",
    "cookie-parser": "~1.4.4",
    "debug": "~2.6.9",
    "ejs": "~2.6.1",
    "express": "~4.16.1",
    "http-errors": "~1.6.3",
    "jsonwebtoken": "^8.5.1",
    "moment": "^2.27.0",
    "mongoose": "^5.9.21",
    "mongoose-moment": "^0.1.3",
    "morgan": "~1.9.1",
    "multer": "^1.4.2",
    "multer-s3": "^2.9.0",
    "nodemailer": "^6.4.10",
    "nodemailer-smtp-transport": "^2.7.4",
    "pbkdf2": "^3.1.1",
    "qrcode": "^1.4.4",
    "qrcode-with-logos": "^1.0.2",
    "rand-token": "^1.0.1",
    "socket.io": "^2.3.0"
  }```

<br>

## :orange_book: DB ERD

![ERD](https://flood-master.s3.ap-northeast-2.amazonaws.com/Untitled+Diagram.png)

<br>

## :closed_book: 배포

* AWS EC2 - 클라우드 컴퓨팅 시스템
* AWS elastic beanstlak - 서버 배포및 관리 프로비저닝 서비스
* AWS S3 - 클라우드 데이터 저장소
* Nginx - 프록시 서버 (보안 향상 및 캐시를 활용한 전송 속도 향상)

<br>

## :books: 사용된 도구 

* [Node.js](https://nodejs.org/ko/)
* [Express.js](http://expressjs.com/ko/) 
* [NPM](https://rometools.github.io/rome/) - 자바 스크립트 패키지 관리자
* [PM2](http://pm2.keymetrics.io/) - 프로세스 관리자
* [MongoDB](https://www.mongodb.com/) - NoSQL DB
* [Nginx](https://www.nginx.com/) - 웹 서버 소프트웨어(프록시 서버용)

<br>


## :computer: 개발자

* [김민지](https://github.com/kimminji122258)
* [이현주](https://github.com/bokdoll)
* [이지윤](https://github.com/EZYOON)
