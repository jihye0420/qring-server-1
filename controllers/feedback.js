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
            res.status(400).send(util(fail(400, "meetingId가 없습니다.")));
        }

        // 모든 피드백 정보들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        });


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

        res.status(200).send(util.success(200, "피드백 질문 추가 완료", meeting));

    },

    newReadAll: async (req, res) => {
        const meetingId = req.params.nowId;

        if (!meetingId) {
            res.status(400).send(util.fail(400, "meetingId가 없습니다."));
        }

        // 모든 피드백 질문들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        });

        res.status(200).send(util.success(200, "피드백 질문 목록 완료", meeting));

    },

    // 이어서 모임 생성 시, 이전 회차에서 만들어져있던 피드백 목록 가져옴
    beforeReadAll: async (req, res) => {
        const nowMeetingId = req.params.nowId;
        const beforeMeetingId = req.params.beforeId;

        if (!nowMeetingId || !beforeMeetingId) {
            res.status(400).send(util.fail(400, "meetingId가 없습니다."));
        }

        // 이전 미팅 가져옴
        const beforeMeeting = await MeetingModel.findOne({
            _id: beforeMeetingId
        });

        if (!beforeMeeting) {
            res.status(400).send(util.fail(400, "이전 회차 meeting ID를 찾을 수 없습니다."));
        }

        // 지금 미팅 가져옴
        const nowMeeting = await MeetingModel.findOne({
            _id: nowMeetingId
        });

        if (!nowMeeting) {
            res.status(400).send(util.fail(400, "현재 회차 meeting ID를 찾을 수 없습니다."));
        }

        nowMeeting.feedBack = beforeMeeting.feedBack;

        // 데이터베이스에 저장
        await nowMeeting.save();

        res.status(200).send(util.success(200, "피드백 질문 목록 완료", nowMeeting));
    },

    result: async (req, res) => {
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
            res.status(400).send(util.fail(400, "결과 누락"));
            return;
        }

        // 피드백 배열 중, 한 피드백 문항씩 꺼내 array에 넣는다.
        for (var i in meeting.feedBack) {
            meeting.feedBack[i].result.push(list[i]);
        }

        // 데이터베이스에 저장
        await meeting.save();

        res.status(200).send(util.success(200, "피드백 결과 목록 완료", meeting));


        // 총 피드백 현황(피드백 전체 갯수도 보내야함), 타이틀, 내용 리스트도 보내야함

        // 폼이 0(단답형) 일때, 배열 데이터들을 보내면 됨

        // 폼이 1(객관식) 일때,
        // color와 보기와 사용자들이 해당 보기와 보기에 답한 갯수를 보내줘야 함

        // 폼이 2(평점형) 일때, 평점 평균내고, 5점 몇개 4점 몇개 갯수 보내줘야 함


        // 이 전체 결과를 result배열에 정돈된 데이터로 배열 추가하고 그 배열 리스트 보내기

    }

}