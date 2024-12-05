const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
    templateName: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
}, { timestamps: true });

const GeneralSettingSchema = new mongoose.Schema({
    dateFormat: {
        type: String,
        default: 'YYYY-MM-DD', 
        enum: ['YYYY-MM-DD', 'MM-DD-YYYY', 'DD-MM-YYYY'], 
    },
    emailTemplates: [EmailTemplateSchema],
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
}, { timestamps: true });

module.exports = mongoose.model('GeneralSetting', GeneralSettingSchema);
