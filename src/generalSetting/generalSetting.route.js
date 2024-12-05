const express = require('express');
const router = express.Router();
const {
    updateDateFormat,
    updateEmailTemplate,
    getGeneralSettings
} = require('./generalSetting.controller');
const auth = require('../middleware/auth.middleware');

router.put('/updateDateFormat', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),updateDateFormat);

router.put('/updateEmailTemplate', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),updateEmailTemplate);

router.get('/getGeneralSettings', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),getGeneralSettings);

module.exports = router;
