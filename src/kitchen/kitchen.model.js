const mongoose = require('mongoose');

const KitchenSchema = new mongoose.Schema({
    name: { type: String },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    kitchenAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      menuId: { type: mongoose.Schema.Types.ObjectId, ref: "Menu" },
      address:{
        type:String
      }
      

}, { timestamps: true });

module.exports = mongoose.model('Kitchen', KitchenSchema);
