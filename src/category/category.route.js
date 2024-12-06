const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const auth = require('../middleware/auth.middleware');

router.get('/getAllCategories', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), categoryController.getAllCategories);
router.get('/getCategoryById/:id', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  categoryController.getCategoryById);
router.post('/createCategory', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  categoryController.createCategory);
router.put('/updateCategory/:id', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  categoryController.updateCategory);
router.delete('/deleteCategory/:id', auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),  categoryController.deleteCategory);
router.put("/addMultipleCategoryItems",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),categoryController.addMultipleCategoryItems)
router.put("/removeMultipleCategoryItems",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),categoryController.removeMultipleCategoryItems)
module.exports = router