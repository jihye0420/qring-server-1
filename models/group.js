const mongoose = require("mongoose");
const schema = mongoose.Schema;

const GroupSchema = new schema({
    admin: {
        type: String,
        required: true,
    },
    meetings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'meeting'
    }],
});

module.exports = mongoose.model("group", GroupSchema);