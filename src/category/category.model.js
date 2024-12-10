const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Category = new Schema(
  {
    categoryName: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CategoryItem",
      },
    ],
    isActive: {
      type: Boolean,
    },
    description:{
      type:String
    },
    mainImage:{
      type:String
    }
  },
  { timestamps: true }
);

const category = mongoose.model("Category", Category);
module.exports = category;
