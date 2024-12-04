const express = require("express");
const router = express.Router();
const menuController = require("./menu.controller");
const auth = require("../middleware/auth.middleware");

router.post("/createMenu",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuController.createMenu);
router.get("/getMenus", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),menuController.getMenus);
router.get("/getMenuById/:id", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),menuController.getMenuById);
router.put("/updateMenu/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuController.updateMenu);
router.delete("/deleteMenu/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuController.deleteMenu);
router.post("/addCategoriesToMenu/:menuId",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuController.addCategoriesToMenu);
router.post("/removeCategoriesFromMenu/:menuId",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuController.removeCategoriesFromMenu);
router.get("/getMenuByRestaurantId/:restaurantId", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),menuController.getMenuByRestaurantId);
module.exports = router;
