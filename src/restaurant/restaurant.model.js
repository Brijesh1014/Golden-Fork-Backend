const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Restaurant = new Schema(
  {
    name: {
      type: String,
    },
    location: {
      type: String,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: Number,
    },
    description: {
      type: String,
    },
    openingHours: {
      type: String,
    },
    restaurantAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
    },
    country: {
      type: String,
    },
    image:{
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
    address: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    socialLinks: {
      facebook: {
        type: String,
      },
      twitter: {
        type: String,
      },
      instagram: {
        type: String,
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Temporarily Closed", "Under Maintenance"],
      default: "Open",
    },
  },
  { timestamps: true }
);

const restaurant = mongoose.model("Restaurant", Restaurant);
module.exports = restaurant;
