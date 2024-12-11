const express = require('express');
const router = express.Router();
const kitchenController = require('./kitchen.controller');
const auth = require('../middleware/auth.middleware');

router.post('/createKitchen',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), kitchenController.createKitchen);
router.get('/getKitchens',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), kitchenController.getKitchens);
router.get('/getKitchenById/:id',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), kitchenController.getKitchenById);
router.put('/updateKitchen/:id', kitchenController.updateKitchen);
router.delete('/deleteKitchen/:id',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), kitchenController.deleteKitchen);
router.post('/assignKitchenAdmin',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), kitchenController.assignKitchenAdmin);

module.exports = router;
