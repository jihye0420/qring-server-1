const express = require('express');
const GroupModel = require('../models/group.js');
const AdminModel = require('../models/admin.js');
const MeetingModel = require('../models/meeting.js');
const async = require('pbkdf2/lib/async');
const util = require('../modules/util');


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

        res.status(200).send(util.success(200, "피드백 질문 목록 완료", meeting.feedBack));
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

        var latestArray = [];

        // 제일 답한 갯수가 많은 순서대로 choice가 들어있는 배열
        var resultArray = [];
        // 제일 답한 갯수가 많은 그 갯수가 들어있는 배열
        var countArray = [];

        // 폼이 0(단답형) 일때, 
        for (var i in feedbackArray) {
            if (feedbackArray[i].form == 0) {
                for (var item of feedbackArray[i].result) {
                    latestArray.unshift(item);
                }

            }
            // 폼이 1(객관식) 일때,
            // 보기와 사용자들이 해당 보기와 보기에 답한 갯수를 보내줘야 함 
            else if (feedbackArray[i].form == 1) {
                for (var item of feedbackArray[i].result) {

                }


                for (var idx in resultArray) {
                    response.push({
                        "choice": resultArray[idx],
                        "count": countArray[idx]
                    });
                }
            }
            if (feedbackArray[i].form == 2) {

            }
        }




        // 폼이 2(평점형) 일때, 평점 평균내고, 5점 몇개 4점 몇개 갯수 보내줘야 함


        // 이 전체 결과를 result배열에 정돈된 데이터로 배열 추가하고 그 배열 리스트 보내기


        res.status(200).send(util.success(200, "피드백 결과 목록 완료", meeting));

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
                "data": dateArray[idx]
            });
        }

        res.status(200).send(util.success(200, "단답형 더보기 완료", response));
    }


}