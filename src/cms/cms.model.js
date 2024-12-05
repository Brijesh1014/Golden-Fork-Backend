const mongoose = require('mongoose');

const CMSPageSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
});

CMSPageSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('CMSPage', CMSPageSchema);
