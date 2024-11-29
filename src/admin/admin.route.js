const express = require("express");
const adminController = require("./admin.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

router.get("/getAllUsers",  auth(["SuperAdmin"]), adminController.getAllUsers);

router.get("/getUserById/:id",  auth(["SuperAdmin"]), adminController.getById);

router.put("/updateUser/:id", auth(["SuperAdmin"]), adminController.updateById)

router.delete("/deleteUser/:id",auth(["SuperAdmin"]), adminController.deleteById)




module.exports = router;
