const GeneralSetting = require('./generalSetting.model');

const updateDateFormat = async (req, res) => {
    try {
        const { dateFormat } = req.body;
        const userId = req.userId; 

        if (!['YYYY-MM-DD', 'MM-DD-YYYY', 'DD-MM-YYYY'].includes(dateFormat)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Supported formats: YYYY-MM-DD, MM-DD-YYYY, DD-MM-YYYY.',
            });
        }

        const setting = await GeneralSetting.findOneAndUpdate(
            {},
            { 
                $set: { dateFormat }, 
                $setOnInsert: { createdBy: userId } 
            },
            { new: true, upsert: true } 
        );

        res.status(200).json({
            success: true,
            message: 'Date format updated successfully.',
            data: setting,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



const updateEmailTemplate = async (req, res) => {
    try {
        const { templateName, subject, body } = req.body;
        const userId = req.userId; 

        if (!templateName || !subject || !body) {
            return res.status(400).json({
                success: false,
                message: 'Template name, subject, and body are required.',
            });
        }

        let setting = await GeneralSetting.findOne();
        if (!setting) {
            setting = new GeneralSetting();
        }

        const existingTemplate = setting.emailTemplates.find(
            (template) => template.templateName === templateName
        );

        if (existingTemplate) {
            existingTemplate.subject = subject;
            existingTemplate.body = body;
        } else {
            // Add new template with the createdBy field
            setting.emailTemplates.push({
                templateName,
                subject,
                body,
            });
        }

        setting.createdBy = userId; 

        await setting.save();

        res.status(200).json({
            success: true,
            message: `Email template "${templateName}" updated successfully.`,
            data: setting.emailTemplates,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the email template.',
            error: error.message,
        });
    }
};

const getGeneralSettings = async (req, res) => {
    try {
        const setting = await GeneralSetting.findOne()
            .populate('createdBy', 'name email') 
            .lean();

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'General settings not found.',
            });
        }

        res.status(200).json({
            success: true,
            data: setting,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



module.exports = {
    updateDateFormat,
    updateEmailTemplate,
    getGeneralSettings
}