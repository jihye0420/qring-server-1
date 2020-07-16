# 🐬 QRing - QR코드로 만들어가는 우리의 모임 🐬

<img style="border: 1px solid black !important; border-radius:20px;" src="https://user-images.githubusercontent.com/37949197/86798642-f6c0ea00-c0ab-11ea-92ee-56c7f83518be.png" width="250px" />


![node_badge](https://img.shields.io/badge/node-%3E%3D%2012.13.0-green)
![npm_bedge](https://img.shields.io/badge/npm-v6.14.2-blue)

* <b> SOPT 26th APPJAM
    
* 프로젝트 기간: 2020.06.27 ~ 2020.07.18

* [API 문서](https://github.com/qring-sopt/qring-server/wiki)</b>

<br>


## :information_desk_person: 프로젝트 설명

<b>모임의 시작과 끝을 함께하는, QRing입니다. 🐬</b> 
<br />
QR 코드를 통해 모임의 시작을 빠르게, 모임의 끝엔 원활한 피드백을 통해 모임이 더 성숙해지고, 구성원은 함께 성장하게 됩니다.

<br>

## :bookmark_tabs: 기능 명세서

* <b>[기능 명세서 노션 링크](https://www.notion.so/caa0852754f44797a3ecf35168023d06) </b>

<br>
<br>

## :earth_americas: Team Role 


#### 🏋 김민지

- 관리자, 그룹, 모임 DB 설계 및 구축
- 피드백 폼 생성 기능 구현
- 피드백 폼 목록 기능 구현
- 피드백 결과 실시간 통신 기능 구현
- 테스팅 자동화 환경 구축, 배포

#### 🏋 이현주

- 관리자, 그룹, 모임 DB 설계 및 구축
- 회원가입 기능 구현
- 이메일 인증 기능 구현
- 로그인 기능 구현
- qr코드 생성 및 웹 출석 폼 제출 기능 구현
- 출석 체크 실시간 통신 기능 구현

#### 🏋 이지윤

- 관리자, 그룹, 모임 DB 설계 및 구축
- 첫 모임 생성 기능 구현
- 이어서 모임 생성 기능 구현
- 모임 편집 기능 구현
- 현재 진행중/예정된 모임 List/종료된 모임 리스트 기능 구현


<br>

## :blue_book: Package

사용 패키지(모듈)은 다음과 같습니다.

- **nodemailer** - 회원 가입 시 이메일 인증을 위한 이메일 전송
- **jsonwebtoken** - JWT(Json Web Token) 생성 및 인증
- **rand-token** - 랜덤으로 Token 생성
- **pbkdf2** - 솔트를 적용한 후 해시 함수의 반복 횟수를 임의로 선택
- **mongoose** - 몽고DB ODM 문서를 DB에서 조회할 때 자바스크립트 객체로 바꿔주는 역할
- **qrcode** - QR코드 생성
- **aws-sdk** - AWS에 API를 제공
- **multer** - 이미지 업로드
- **multer-s3** - 이미지 S3에 업로드
- **moment** - 출석체크, 피드백 제출 날짜 포맷
- **socket.io** - websocket 프로토콜을 지원하는 네트워킹 라이브러리
- **connect** - RESTful Web Services를 쉽게 사용

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
  }
  ```

<br>

## :green_book: Architecture

<br>

## :orange_book: DB ERD
![ERD](https://user-images.githubusercontent.com/37949197/87669134-615adf80-c7a8-11ea-977e-25e4ae50b2a3.png)



<br>

## :bulb: 배포

* AWS EC2 - 클라우드 컴퓨팅 시스템
* AWS elastic beanstlak - 서버 배포및 관리 프로비저닝 서비스
* AWS S3 - 클라우드 데이터 저장소
* Atlas - MongoDB 클라우드 호스팅 서비스
* Docker - 컨테이너 기반 가상화 소프트웨어 플랫폼
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
<img style="border: 1px solid black !important; border-radius:20px;" src="https://user-images.githubusercontent.com/37949197/87564632-9826ec00-c6fb-11ea-839b-4cdc8490919a.png" width="300px" />

* [김민지](https://github.com/kimminji122258)
> 마, 너네랑 같이 해서 행운이다 마 <br />
> 큐링 서버파트 최고다~ :)
* [이현주](https://github.com/bokdoll)
> 마, 애더라<br />
> 고맙데이 ~ 니덜이랑 같이해서 억수로 좋았다 마
> 니들도 그렇제?
* [이지윤](https://github.com/EZYOON)
>
>
