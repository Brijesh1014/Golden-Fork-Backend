const express = require("express");
const adminController = require("./admin.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

router.get("/getAllUsers",  auth(["SuperAdmin","RestaurantAdmin"]), adminController.getAllUsers);

router.get("/getUserById/:id",  auth(["SuperAdmin","RestaurantAdmin"]), adminController.getById);

router.put("/updateUser/:id", auth(["SuperAdmin","RestaurantAdmin"]), adminController.updateById)

router.delete("/deleteUser/:id",auth(["SuperAdmin","RestaurantAdmin"]), adminController.deleteById)

router.put("/confirmTableReservation/:id",auth(["SuperAdmin","RestaurantAdmin"]),adminController.confirmTableReservation)

router.put("/cancelTableReservation/:id",auth(["SuperAdmin","RestaurantAdmin"]),adminController.cancelTableReservation)

router.get("/searchOrders",auth(["SuperAdmin","RestaurantAdmin"]),adminController.searchOrders)

router.get("/getDailyRevenue",auth(["SuperAdmin"]),adminController.getDailyRevenue)

router.get("/getOrdersByStatus",auth(["SuperAdmin","RestaurantAdmin"]),adminController.getOrdersByStatus)

router.put("/updateOrderStatus",auth(["SuperAdmin","RestaurantAdmin"]),adminController.updateOrderStatus)

router.post("/createUser",auth(["SuperAdmin","RestaurantAdmin"]),adminController.createUser)

router.get("/getAvailableTableAndSlotsForAllRestaurants",auth(["SuperAdmin","RestaurantAdmin"]),adminController.getAvailableTableAndSlotsForAllRestaurants)

router.get("/getAvailableTableAndSlots",auth([ "RestaurantAdmin", "SuperAdmin"]),adminController.getAvailableTableAndSlots);

router.get("/availableRestaurantAdmin",auth([ "RestaurantAdmin", "SuperAdmin"]),adminController.availableRestaurantAdmin);

router.get("/availableKitchenAdmin",auth([ "RestaurantAdmin", "SuperAdmin"]),adminController.availableKitchenAdmin);


module.exports = router;
