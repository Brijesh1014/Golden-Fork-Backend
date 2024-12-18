const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContactUs = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    subject: {
      type: String,
    },
    messageTitle: {
      type: String,
    },
    message: {
      type: String,
    },
    createdBy: {
      type: String,
    },
    contactNo: { type: Number },
    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReplySend",
    },
    isActive:{
      type:Boolean
    }
  },
  { timestamps: true }
);

const contactUs = mongoose.model("ContactUs", ContactUs);

module.exports = contactUs;
