const mongoose = require("mongoose");
const schema = mongoose.Schema;
const moment = require('moment');
require('mongoose-moment');

const MeetingSchema = new schema({
    name: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    late : {
        type: Number,
        required:true,
    },
    headCount: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    qrImg: {
        type: String,
    },
    user: [{
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        abroad: {
            type: Boolean,
        },
        health: {
            type: Boolean,
        },
        attendance: String,
        createdAt: {
            type: String, 
            default: moment().format('YYYY-MM-DD HH:mm:ss')
        }
    }],
    feedBack: [{
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        choice: [{
            type: String,
        }],
        //0이 단답형, 1이 객관식, 2는 평점
        form: {
            type: Number,
            required: true,
        },
        result: [{
            type: String,
        }]
    }]
}, {
    versionKey: false
});

module.exports = mongoose.model("meeting", MeetingSchema);