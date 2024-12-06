const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Order = new Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CategoryItem",
        },
        quantity: {
          type: Number,
        },
      },
    ],
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Preparing", "Completed", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Refunded"],
      default: "Unpaid",
    },
    orderType:{
      type:String,
      enum: ["Dine-in", "Pickup", "Delivery"],
    },
    reservationId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },

    paymentMethod: {
      type: String,
      enum: ["Credit Card", "Cash", "Online Payment", "Gift Card"],
      default: "Credit Card",
    },

    shippingAddress: {
      addressLine1: {
        type: String,
      },
      addressLine2: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      zipCode: {
        type: String,
      },
      country: {
        type: String,
      },
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const order = mongoose.model("Order", Order);
module.exports = order;
