const express = require('express');
const GroupModel = require('../models/group.js');
const async = require('pbkdf2/lib/async');


module.exports = {
    //피드백 질문 생성
    create: async (req, res) => {
        //user Id 가져옴
        const userId = req.email;
        console.log(userId);
        // // 파라미터 확인
        // if (!title || !content || !form) {
        //     res.status(400).send(util.fail(400, "필수 정보 누락"));
        //     return;
        // }

        // // 질문 생성
        // const newQuestion = new GroupModel();
        // newQuestion.feedback.title = req.body.title;
        // newQuestion.feedback.content = req.body.content;
        // newQuestion.feedback.form = req.body.form;

        // // 데이터베이스에 저장
        // await newQuestion.save()

        //res.status(200).send(util.success(200, "피드백 질문 추가 완료", newQuestion));
        res.status(200).send(util.success(200, "_id는", userId));

    },

    //피드백 질문 목록
    readAll: async (req, res) => {
        const questions = await GroupModel.findAll();
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

    // //피드백 질문 수정
    // update: async (req, res) => {
    //     const questionId = req.params.id;

    //     const question = await GroupModel.findOne({
    //         _id: questionId
    //     }, {
    //         _id: 0,
    //         title: 1,
    //         content: 1,
    //         form: 1
    //     });

    //     if (question.length === 0)
    //         return res.status(404).send(util.fail(404, "id에 매칭되는 것을 찾을 수 없음"));



    // },

    // //피드백 질문 삭제
    // remove: async (req, res) => {

    // }





}