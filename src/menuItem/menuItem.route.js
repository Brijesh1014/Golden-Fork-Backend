const express = require("express");
const router = express.Router();
const menuItemController = require("./menuItem.conroller");
const auth = require("../middleware/auth.middleware");

router.post("/createMenuItem", auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]),menuItemController.createMenuItem);
router.get("/getMenuItems",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuItemController.getMenuItems);
router.get("/getMenuItemById/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuItemController.getMenuItemById);
router.put("/updateMenuItem/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuItemController.updateMenuItem);
router.delete("/deleteMenuItem/:id",auth(["Customer", "RestaurantAdmin", "SuperAdmin", "KitchenStaff"]), menuItemController.deleteMenuItem);

module.exports = router;
