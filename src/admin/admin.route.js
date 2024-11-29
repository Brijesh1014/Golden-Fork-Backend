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



module.exports = router;
