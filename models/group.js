const mongoose = require("mongoose");
const schema = mongoose.Schema;

const GroupSchema = new schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    meetings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'meeting'
    }],
}, {
    versionKey: false
});

module.exports = mongoose.model("group", GroupSchema);