# qring-server
🐬 26기 솝트 앱잼: "Qring - QR코드로 만들어가는 우리의 모임" 🐬

# qring-iOS
🐬 <kbd>QR코드</kbd>로 만들어가는 우리의 모임 🐬

<div>
  <kbd>
    <img src="./READMEImg/logo.png" width="300" height="300">
  </kbd>
</div>

<br>

* 목차

  * [설계](#설계)

  * 컨벤션
    * [Code](#Code-Convention)

    * [Git](#Git-Convention)

    * [폴더구조](#폴더구조)

      ***

  * 프로젝트 소개

    * 개발환경 및 라이브러리
    * 샐행화면설명
    * 기능별 개발여부, 담당자
    * 어려운기능 소개, 새롭게알게된것
    * 팀원역할

  * 오토레이아웃 적용 여부
    * iPhone 11Pro
    * iPhone 8
    * iPhone SE2



<br>

## 설계

### 목적

* 각 구현에 있어서 서로의 의견을 통해 더 좋은 방향으로 가기위함
* 어떻게 구현해야할지 다 같이 설계해보고 중복되는 작업을 하지않도록하기 위함

* 초기 설정 및 기능구현에 필요한 라이브러리 선택
* 좋은 협업방향을 위함



<br>



### 시나리오



<br>



### 라이브러리

* mongoose



<br>



## Code Convention

> 네이밍

* camel case: 단어가 합쳐진 부분마다 맨 처음 글자를 대문자로 표기하는 방법!
ex) startTime

<br>

> 프로그래밍

* `IBOutlet` 는위에 일반 변수, 상수들은 아래에
* 함수위치 순서는 쓰는 곳과 가까이에
  * override함수는 위쪽에
  * IBAction는 아래쪽에
* 해당VC에 관련한 extension은 같은파일에 작성
  * 해당 extension에서 각 protocol에 맞는 함수만 구현하기
* 각 함수구현후 1줄 개행
* 클로저사용아닌이상 `self`사용 지양
* 



<br>



## Git Convention

>  브랜치


* <kbd>master</kbd>
  * <kbd>hyeonju</kbd>
  * <kbd>jiyun</kbd>
  * <kbd>minji</kbd>

<br>



> 커밋메시지

```
UPDATE - 기능 구현시(한글)
FIX - 버그 발견시(한글)
RELEASE - 버전 배포시(한글)
DELETE - 기능 삭제시(한글)
DOCS - 문서 편집시(한글)
```

ex) `[UPDATE] 구현내용`

<br>



## 요구사항

* 회원가입  -> 현주

  * 이메일인증
    * 이메일인증 -> 메일웹으로
  * 인증여부확인
  

![KakaoTalk_20200630_145441181](https://user-images.githubusercontent.com/37949197/86088691-c7294500-bae1-11ea-9016-664c332b7331.png)

* 모임만들기  -> 지윤

  * 모임 데이터값 받아서 저장
  
* 이어서만들기
  * 각 모임 최신것 하나씩 보여줄 데이터 가져옴
  * 모임 데이터값 받아서 저장

* 피드백 만들기  -> 민지
    * 단답/객관/평점 질문 받아오기(단답, 객관식, 평점)

 

<br>



### 개발자

<table>
    <tr align="center">
      <td colspan="3"><b>iOS Developer<b></td>
    </tr>
    <tr align="center">
        <td>
            <br>
            <a href="https://github.com/namsoo5"><I>김민지</I></a>
        </td>
        <td>
            <br>
            <a href="https://github.com/MyunDev"><I>이현주</I></a>
        </td>
        <td>
            <br>
            <a href="https://github.com/mohazi"><I>이지윤</I></a>
        </td>
    </tr>
</table>





