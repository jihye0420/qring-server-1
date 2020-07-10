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
}, {
    versionKey: false
});

module.exports = mongoose.model("admin", AdminSchema);