const User = require('../user/user.model');
const { Parser } = require('json2csv');

const exportToCSV = (data, fields) => {
    try {
        const json2csvParser = new Parser({ fields });
        return json2csvParser.parse(data);
    } catch (error) {
        console.error('Error generating CSV:', error.message);
        throw new Error('Failed to generate CSV');
    }
};

const getUsersReport = async (req, res) => {
    try {
        const { fromDate, toDate, page = 1, limit = 10 } = req.query;

        if (!fromDate || !toDate) {
            return res.status(400).json({ success: false, message: 'Both fromDate and toDate are required.' });
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);

        if (isNaN(from) || isNaN(to)) {
            return res.status(400).json({ success: false, message: 'Invalid date format for fromDate or toDate.' });
        }

        const currentPage = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const skip = (currentPage - 1) * pageSize;

        const users = await User.find({
            role:"Customer",
            createdAt: { $gte: from, $lte: to }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .select('name email createdAt'); 

        const totalUsers = await User.countDocuments({
            role:"Customer",
            createdAt: { $gte: from, $lte: to }
        });

        const formattedUsers = users.map(user => ({
            name: user.name,
            email: user.email,
            createdAt: user.createdAt.toISOString()
        }));

        res.status(200).json({
            success: true,
            metadata: {
                totalUsers,
                currentPage,
                totalPages: Math.ceil(totalUsers / pageSize),
                pageSize
            },
            data: formattedUsers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const exportReportToCSV = async (req, res) => {
    try {
        const { reportType, fromDate, toDate } = req.query;

        if (!reportType) {
            return res.status(400).json({ success: false, message: 'Report type is required.' });
        }
        if (!fromDate || !toDate) {
            return res.status(400).json({ success: false, message: 'Both fromDate and toDate are required.' });
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);

        if (isNaN(from) || isNaN(to)) {
            return res.status(400).json({ success: false, message: 'Invalid date format for fromDate or toDate.' });
        }

        let data = [];
        let fields = [];

        switch (reportType) {
            case 'users':
                data = await User.find({
                    role: 'Customer',
                    createdAt: { $gte: from, $lte: to },
                }).select('name email createdAt');
                fields = ['name', 'email', 'createdAt'];
                break;
            
            default:
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid report type. Valid types are: users.' 
                });
        }

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No records found for the specified date range and report type.',
            });
        }

        const formattedData = data.map(item => ({
            name: item.name,
            email: item.email,
            createdAt: item.createdAt.toISOString(),
        }));
        
        const csv = exportToCSV(formattedData, fields);

        res.header('Content-Type', 'text/csv');
        res.attachment(`${reportType}-report.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while exporting the report.',
        });
    }
};


module.exports = {
    getUsersReport,
    exportReportToCSV
}