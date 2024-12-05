const express = require('express');
const router = express.Router();
const reportsController = require('./report.controller');
const auth = require('../middleware/auth.middleware');

router.get('/getUsersReport',  auth([ "RestaurantAdmin", "SuperAdmin"]), reportsController.getUsersReport);
router.get('/exportReportToCSV',auth([ "RestaurantAdmin", "SuperAdmin"]), reportsController.exportReportToCSV);

module.exports = router;
