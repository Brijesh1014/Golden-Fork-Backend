const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MenuItem = new Schema(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
    },
    category: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
    },
    image: {
      type: String,
    },
    pickupAvailable: {
      type: Boolean,
    },
    dineInAvailable: {
      type: Boolean,
    },
    deliveryAvailable: {
      type: Boolean,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
  },
  { timestamps: true }
);

const menuItem = mongoose.model("MenuItem", MenuItem);
module.exports = menuItem;
