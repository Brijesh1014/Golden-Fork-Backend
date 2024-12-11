const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Menu = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    kitchenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kitchen",
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    menuName: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
    },
    isFixed: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const menu = mongoose.model("Menu", Menu);
module.exports = menu;
