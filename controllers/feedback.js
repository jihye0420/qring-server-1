const express = require('express');
const GroupModel = require('../models/group.js');
const AdminModel = require('../models/admin.js');
const MeetingModel = require('../models/meeting.js');
const async = require('pbkdf2/lib/async');
const util = require('../modules/util');


module.exports = {
    //피드백 질문 생성
    create: async (req, res) => {
        const meetingId = req.params.id;

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

    readAll: async (req, res) => {
        const meetingId = req.params.id;

        // 모든 피드백 정보들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        });

        res.status(200).send(util.success(200, "피드백 질문 목록 완료", meeting));

    },

    result: async (req, res) => {


        let feedBack = [];
        cnt = 1;
        for (let item of meeting.feedBack) {
            if (cnt > 3) break;
            feedBack.push(item);
            cnt++;
        }

        const data = {
            meeting: {
                user: user,
                feedBack: feedBack,
                name: meeting.name,
                date: meeting.date,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                headCount: meeting.headCount,
                image: meeting.image,
                qrImg: meeting.qrImg
            }
        }

        return res.status(200).send(util.success(200, '모임 회차 조회 성공', data));

        res.status(200).send(util.success(200, "피드백 결과 조회 완료", meeting));
    }

}