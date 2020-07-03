const express = require('express');
const GroupModel = require('../models/group.js');
const AdminModel = require('../models/admin.js');
const MeetingModel = require('../models/meeting.js');
const async = require('pbkdf2/lib/async');
const util = require('../modules/util')


module.exports = {
    //피드백 질문 생성
    create: async (req, res) => {
        const meetingId = req.params.id;

        // 모든 피드백 정보들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        }, {
            _id: 1,
            name: 1,
            date: 1,
            startTime: 1,
            endTime: 1,
            headCount: 1,
            image: 1,
            user: 1,
            feedBack: 1
        });


        const {
            title,
            content,
            choice,
            form
        } = req.body;

        if (!title || !content || !form) {
            res.status(400).send(util.fail(400, "필수 정보 누락"));
            return;
        }

        // 객관식일때는, 객관식 선택지 필요
        if (form == 1) {
            if (choice === undefined) {
                res.status(400).send(util.fail(400, "객관식 선택지 누락"));
                return;
            }
        }

        // 질문 생성
        const newResult = new MeetingModel();
        //newQuestion.admin = adminId;

        newResult.name = meeting.name;
        newResult.date = meeting.date;
        newResult.startTime = meeting.startTime;
        newResult.endTime = meeting.endTime;
        newResult.headCount = meeting.headCount;
        newResult.image = meeting.image;
        newResult.user = meeting.user;


        newResult.feedBack = {
            title: req.body.title,
            content: req.body.content,
            choice: req.body.choice,
            form: req.body.form
        }

        // 데이터베이스에 저장
        await newResult.save();

        res.status(200).send(util.success(200, "피드백 질문 추가 완료", {
            data: newResult
        }));
        //res.status(200).send(util.success(200, "_id는", result));

    },

    //피드백 질문 목록
    readAll: async (req, res) => {

        const meetingId = req.params.id;

        // 모든 피드백 정보들 가져옴
        const meeting = await MeetingModel.findOne({
            _id: meetingId
        }, {
            _id: 1,
            name: 1,
            date: 1,
            startTime: 1,
            endTime: 1,
            headCount: 1,
            image: 1,
            user: 1,
            feedBack: 1
        });
        //find({}) -> feedBack 모든 데이터 다 불러오는 것
        const questions = await MeetingModel.find({
            feedBack: 1
        });
        try {
            if (!questions.length) {
                return res.status(400).send(util.fail(400, "질문 목록 조회 실패"));
            }
            res.status(200).send(util.success(200, "피드백 질문 목록 전체 조회", questions));
        } catch (err) {
            res.status(500).json({
                message: "서버 에러",
            })
        }
    }



}