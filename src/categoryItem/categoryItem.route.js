const express = require("express");
const router = express.Router();
const categoryItemController = require("./categoryItem.controller");
const auth = require("../middleware/auth.middleware");

router.post("/createCategoryItem", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),categoryItemController.createCategoryItem);
router.get("/getCategoryItems",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), categoryItemController.getCategoryItems);
router.get("/getCategoryItemById/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), categoryItemController.getCategoryItemById);
router.put("/updateCategoryItem/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), categoryItemController.updateCategoryItem);
router.delete("/deleteCategoryItem/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), categoryItemController.deleteCategoryItem);
module.exports = router;
