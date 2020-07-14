const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require('moment');

const AdminSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: String,
    salt: String,
    auth: Boolean,
    authToken : String,
    name: {
        type: String,
        required: true,
    },
    birth: {
        type: String,
        required: true,
    },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'group'
    }],
    proceeds: [{
        meetingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'meeting',
            required: true
        },
        date: {
            type: String,
            required: true
        },
        startTime: {
            type: String,
            required:true
        },
        endTime: {
            type: String,
            required: true
        }
    }]
}, {
    versionKey: false
});

module.exports = mongoose.model("admin", AdminSchema);