const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const CategoryItem = new Schema(
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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    isFixed: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const categoryItem = mongoose.model("CategoryItem", CategoryItem);
module.exports = categoryItem;
