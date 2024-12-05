const express = require('express');
const router = express.Router();
const cmsController = require('./cms.controller');
const auth = require('../middleware/auth.middleware');

router.get('/getAllCMSPages', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), cmsController.getAllCMSPages);
router.get('/getCMSPageById/:id', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  cmsController.getCMSPageById);
router.post('/createCMSPage/', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  cmsController.createCMSPage);
router.put('/updateCMSPage/:id', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  cmsController.updateCMSPage);
router.delete('/deleteCMSPage/:id', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  cmsController.deleteCMSPage);

module.exports = router;
