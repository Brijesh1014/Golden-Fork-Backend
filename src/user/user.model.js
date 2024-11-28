const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: Number,
    },
    username: {
      type: String,
    },
    password: {
      type: String,
    },
    gender: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    deliveryAddress: {
      type: String,
    },
    rewardPoints: {
      type: Number,
    },
    role: {
      type: String,
      enum: ["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"],
      default: "Customer",
    },

    fcmToken: {
      type: String,
    },
    resetOtp: String,
    otpExpiry: Date,
    otpVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const user = mongoose.model("User", User);
module.exports = user;
