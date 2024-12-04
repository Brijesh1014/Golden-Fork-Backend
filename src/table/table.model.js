const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Table = new Schema(
  {
   
    restaurantId : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    tableNumber:{
        type:String
    },
    capacity:{
        type:Number
    },
    availability: {
      type: [
        {
          isAvailable: { type: Boolean, default: true },
          date: { type: Date, default: null },
          startTime: { type: String, default: null },
          endTime: { type: String, default: null },
        },
      ],
      default: [],
    },
    isAvailable: { type: Boolean },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User" 
    }
  },
  { timestamps: true }
);

const table = mongoose.model("Table", Table);
module.exports = table;
