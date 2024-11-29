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
    isAvailable :{
        type:Boolean
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User" 
    }
  },
  { timestamps: true }
);

const table = mongoose.model("Table", Table);
module.exports = table;
