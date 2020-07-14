const express = require('express');
const GroupModel = require('../models/group.js');
const AdminModel = require('../models/admin.js');
const MeetingModel = require('../models/meeting.js');
const async = require('pbkdf2/lib/async');
const util = require('../modules/util');
const {
    response
} = require('express');


module.exports = {
    //피드백 질문 생성
    create: async (req, res) => {
        const meetingId = req.params.meetingId;

        if (!meetingId) {
            res.status(400).send(util.fail(400, "meetingId가 없습니다."));
        }

        // 모든 피드백 정보들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        });

        if (!meeting) {
            res.status(400).send(util.fail(400, "해당 meetingId에 해당하는 meeting이 없습니다."));
        }

        const {
            list
        } = req.body;

        if (!list) {
            res.status(400).send(util.fail(400, "필수 정보 누락"));
            return;
        }

        var array = [];

        for (var item of list) {
            array.push(item);
        }

        // 객관식일때는, 객관식 선택지 필요
        for (var idx in array) {
            if (array[idx].form == 1) {
                if (array[idx].choice === undefined) {
                    res.status(400).send(util.fail(400, "객관식 선택지 누락"));
                    return;
                }
            }
        }

        meeting.feedBack = array;

        // 데이터베이스에 저장
        await meeting.save();

        res.status(200).send(util.success(200, "피드백 질문 추가 완료"));
    },

    readAll: async (req, res) => {
        const meetingId = req.params.meetingId;

        if (!meetingId) {
            res.status(400).send(util.fail(400, "meetingId가 없습니다."));
        }

        // 모든 피드백 질문들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        }, {
            _id: 0,
            feedBack: 1
        });

        if (meeting === undefined || !meeting) {
            res.status(400).send(util.fail(400, "해당 meetingId에 해당하는 meeting이 없습니다."));
        }

        let rating = [];
        let multiChoice = [];
        let shortAnswer = [];

        for (var idx in meeting.feedBack) {

            // 폼이 0(단답형) 일때, 
            if (meeting.feedBack[idx].form == 0) {
                shortAnswer.push({
                    "_id": meeting.feedBack[idx]._id,
                    "title": meeting.feedBack[idx].title,
                    "content": meeting.feedBack[idx].content,
                    "form": meeting.feedBack[idx].form
                });
            }
            // 폼이 1(객관식) 일때,
            else if (meeting.feedBack[idx].form == 1) {
                multiChoice.push({
                    "_id": meeting.feedBack[idx]._id,
                    "title": meeting.feedBack[idx].title,
                    "content": meeting.feedBack[idx].content,
                    "form": meeting.feedBack[idx].form
                });
            }
            // 평점형일 때 
            else if (meeting.feedBack[idx].form == 2) {
                rating.push({
                    "_id": meeting.feedBack[idx]._id,
                    "title": meeting.feedBack[idx].title,
                    "content": meeting.feedBack[idx].content,
                    "form": meeting.feedBack[idx].form
                });
            }
        }


        res.status(200).send(util.success(200, "피드백 질문 목록 완료", {
            "rating": rating,
            "multiChoice": multiChoice,
            "shortAnswer": shortAnswer
        }));
    },


    postResult: async (req, res) => {
        //0이 단답형, 1이 객관식, 2는 평점
        const meetingId = req.params.meetingId;

        if (!meetingId) {
            res.status(400).send(util.fail(400, "meetingId가 없습니다."));
        }

        const meeting = await MeetingModel.findOne({
            _id: meetingId
        });

        // 피드백 결과 배열
        const {
            list
        } = req.body;

        if (!list) {
            res.status(400).send(util.fail(400, "피드백 결과 누락"));
            return;
        }

        // 피드백 배열 중, 한 피드백 문항씩 꺼내 array에 넣는다.
        for (var i in meeting.feedBack) {
            meeting.feedBack[i].result.push(list[i]);
        }

        // 데이터베이스에 저장
        await meeting.save();

        const data = {
            meetingId: meetingId,
            name: meeting.name,
            data: meeting.date,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            late: meeting.late,
            headCount: meeting.headCount,
            image: meeting.image,
            qrImg: meeting.qrImg
        }

        res.status(200).send(util.success(200, "피드백 결과 제출 완료", data));
    },
    getResult: async (req, res) => {
        //0이 단답형, 1이 객관식, 2는 평점
        const meetingId = req.params.meetingId;

        if (!meetingId) {
            res.status(400).send(util.fail(400, "meetingId param이 없습니다."));
        }

        const meeting = await MeetingModel.findOne({
            _id: meetingId
        }, {
            _id: 0,
            feedBack: 1
        })

        if (!meeting) {
            res.status(400).send(util.fail(400, "meeting ID를 DB에서 찾을 수 없습니다."));
        }

        var feedbackArray = [];
        for (var item of meeting.feedBack) {
            feedbackArray.push(item);
        }

        let rating = [];
        let multiChoice = [];
        let shortAnswer = [];

        // 폼이 0(단답형) 일때, // 결과를 받는 배열 -> resultArray에는 단답형일 때 최신순으로 답 7개만 [ , , , ,] push. 
        for (var idx in feedbackArray) {

            if (feedbackArray[idx].form == 0) {
                var resultArray = [];
                for (var item of feedbackArray[idx].result) {
                    resultArray.unshift(item);
                }

                resultArray = resultArray.slice(0, 7);
                shortAnswer.push(resultArray);

            }
            // 폼이 1(객관식) 일때,
            // 객관식일 때 {chocie: , count: }가 push.
            else if (feedbackArray[idx].form == 1) {
                var resultArray = [];
                resultArray.length = feedbackArray[idx].choice.length;
                for (var item of feedbackArray[idx].result) {

                    var countArray = [0, 0, 0, 0, 0, 0, 0];
                    countArray.length = feedbackArray[idx].choice.length;

                    for (var i in feedbackArray[idx].result) {
                        // 보기 순서대로, count도 들어감
                        // 질문이 들어가는게 resultArray배열
                        resultArray[i] = feedbackArray[idx].choice[i];
                        if (feedbackArray[idx].result[i] === "1") {
                            countArray[0] = ++countArray[0];
                        } else if (feedbackArray[idx].result[i] === "2") {
                            countArray[1] = ++countArray[1];
                        } else if (feedbackArray[idx].result[i] === "3") {
                            countArray[2] = ++countArray[2];
                        } else if (feedbackArray[idx].result[i] === "4") {
                            countArray[3] = ++countArray[3];
                        } else if (feedbackArray[idx].result[i] === "5") {
                            countArray[4] = ++countArray[4];
                        } else if (feedbackArray[idx].result[i] === "6") {
                            countArray[5] = ++countArray[5];
                        } else if (feedbackArray[idx].result[i] === "7") {
                            countArray[6] = ++countArray[6];
                        }
                    }

                    //아무것도 체크한 답이 없다면 0을 push
                }

                resultArray = resultArray.slice(0, feedbackArray[idx].choice.length);

                var sortData = [];
                for (var idx in resultArray) {
                    sortData.push({
                        "choice": resultArray[idx],
                        "count": countArray[idx]
                    });
                }

                sortData = sortData.sort((a, b) => {
                    return Number(b.count) - Number(a.count);
                })

                multiChoice.push(sortData);



            }
            // 평점형일 때 {count: [5점,4점,3점,2점,1점] }가 push
            else if (feedbackArray[idx].form == 2) {

                var countArray = [0, 0, 0, 0, 0];
                countArray.length = 5;

                var c1 = 0;
                var c2 = 0;
                var c3 = 0;
                var c4 = 0;
                var c5 = 0;
                for (var i in feedbackArray[idx].result) {
                    {
                        if (feedbackArray[idx].result[i] == 1) {
                            countArray[4] = ++c1;
                            //console.log(countArray);
                        }
                        if (feedbackArray[idx].result[i] == 2) {
                            countArray[3] = ++c2;
                            //console.log(countArray);
                        }
                        if (feedbackArray[idx].result[i] == 3) {
                            countArray[2] = ++c3;
                            //console.log(countArray);
                        }
                        if (feedbackArray[idx].result[i] == 4) {
                            countArray[1] = ++c4;
                            // console.log(countArray);
                        }
                        if (feedbackArray[idx].result[i] == 5) {
                            countArray[0] = ++c5;
                            //console.log(countArray);
                        }
                    }
                }

                rating.push(countArray);

            }
        }

        // 이 전체 결과를 result배열에 정돈된 데이터로 배열 추가하고 그 배열 리스트 보내기
        res.status(200).send(util.success(200, "피드백 결과 목록 완료", {
            "rating": rating,
            "multiChoice": multiChoice,
            "shortAnswer": shortAnswer
        }));

    },

    submitResult: async (req, res) => {
        //날짜를 받아와서 db에 넣어주기
        const meetingId = req.params.meetingId;

        const {
            list
        } = req.body;

        const meeting = await meetingModel.findById({
            _id: meetingId
        }, {
            _id: 0,
            feedBack: 1
        });

        //list에 있는 값들을 하나씩 빼서 feedback.result[i]에 각각 push
        for (var item of list) {
            meeting.feedBack[i].result.push(item);
        }


        await meeting.save();

        res.status(200).send(util.success(200, "사용자 피드백 제출 완료"));

    },

    shortAnswer: async (req, res) => {
        //날짜랑 결과 내용 더보기 뷰
        const feedbackId = req.params.feedbackId;

        if (!feedbackId) {
            res.status(400).send(util.fail(400, "feedbackId가 없습니다."));
        }

        const feedbacks = await MeetingModel.findOne({
            'feedBack._id': feedbackId
        }, {
            _id: 0,
            feedBack: 1
        });

        //결과 배열
        var resultArray = [];
        // 날짜 제출 배열
        var dateArray = [];

        let feedBackArray = [];
        //검색해서 찾으면 true
        const flag = feedbacks.feedBack.some((element) => {
            feedBackArray = element;
            return element._id.toString() === feedbackId;
        });

        if (flag) {
            for (var item of feedBackArray.result) {
                resultArray.unshift(item);
            }
            for (var item of feedBackArray.submitDate) {
                dateArray.unshift(item);
            }
        }

        let response = [];
        for (var idx in resultArray) {
            response.push({
                "result": resultArray[idx],
                "date": dateArray[idx]
            });
        }

        res.status(200).send(util.success(200, "단답형 더보기 완료", response));
    }


}