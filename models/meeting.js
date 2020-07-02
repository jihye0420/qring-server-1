const mongoose = require("mongoose");
const schema = mongoose.Schema;

const MeetingSchema = new schema({
    name: {
        type: String,
        required : true,
    },
    date :{
        type: Date,
        required : true,
    },
    startTime :{
        type: String,
        required : true,
    },
    endTime :{
        type: String,
        required : true,
    },
    headCount :{
        type: Number,
        required : true,
    },
    image :{
        data: Buffer,
        contentsType : String,
    },
    user : [{
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
    feedBack:[{
        title :{
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        choice : [{
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
});

module.exports = mongoose.model("meeting", MeetingSchema);