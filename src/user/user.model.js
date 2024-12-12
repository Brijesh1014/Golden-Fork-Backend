const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = new Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
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
      enum: [
        "Customer",
        "RestaurantAdmin",
        "SuperAdmin",
        "KitchenStaff",
        "KitchenAdmin",
      ],
      default: "Customer",
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },

    kitchen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyCode: {
      type: Number,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Activate", "Deactivate"],
      default: "Activate",
    },
  },
  { timestamps: true }
);

const user = mongoose.model("User", User);
module.exports = user;
