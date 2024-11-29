const express = require('express');
const router = express.Router();
const restaurantController = require('./restaurant.controller');
const auth = require('../middleware/auth.middleware');

router.post('/createRestaurant', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), restaurantController.createRestaurant);

router.get('/getAllRestaurants',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), restaurantController.getAllRestaurants);

router.get('/getRestaurantById/:id',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), restaurantController.getRestaurantById);

router.put('/updateRestaurantById/:id',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), restaurantController.updateRestaurantById);

router.delete('/deleteRestaurantById/:id',auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), restaurantController.deleteRestaurantById);

module.exports = router;
