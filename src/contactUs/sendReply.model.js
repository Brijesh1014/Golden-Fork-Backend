const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReplySend = new Schema(
  {
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactUs",
    },
    sendReply: {
      type: String,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true }
);

const replySend = mongoose.model("ReplySend", ReplySend);

module.exports = replySend;
