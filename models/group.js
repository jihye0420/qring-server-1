const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupSchema = new Schema({
    admin: {
        type: mongoose.SchemaTypes.ObjectId,
        required: true,
    },
    meeting: [{
        name: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        headCount: {
            type: Number,
            required: true,
        },
        image: {
            data: Buffer,
            contentsType: String,
        },
    }],
    user: [{
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        health: {
            type: Boolean,

        },
    }],
    feedback: [{
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        //0이 단답형, 1이 객관식, 2는 평점
        form: {
            type: Number,
            required: true,
        },
        result: [{
            type: String,
        }]
    }]
})

module.exports = mongoose.model("group", GroupSchema);