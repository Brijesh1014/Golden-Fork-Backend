const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Menu = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    categories: [
      {
        type: String,
      },
    ],
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const menu = mongoose.model("Menu", Menu);
module.exports = menu;
