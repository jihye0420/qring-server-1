# qring-server
🐬 26기 솝트 앱잼: "Qring - QR코드로 만들어가는 우리의 모임" 🐬



### 라이브러리

* mongoose



<br>



## Code Convention

> 네이밍

* camel case: 단어가 합쳐진 부분마다 맨 처음 글자를 대문자로 표기하는 방법!
ex) startTime

<br>

> 프로그래밍
* 변수는 const
* 함수 위에 아래 예시처럼 써주기! 
/* 
    ✔️ update profile
    METHOD : POST
    URI : localhost:3000/user/profile
    REQUEST HEADER : JWT
    REQUEST BODY : ⭐️image file ⭐️
    RESPONSE DATA : user profile
*/




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
      <td colspan="3"><b>Server Developer<b></td>
    </tr>
    <tr align="center">
        <td>
            <I>김민지</I>
        </td>
        <td>
            <I>이현주</I>
        </td>
        <td>
            <I>이지윤</I>
        </td>
    </tr>
</table>





