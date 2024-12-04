const express = require("express");
const userController = require("./user.controller");
const auth = require("../middleware/auth.middleware");
const router = express.Router();


router.get("/getUserById/:id",   auth(["Customer","KitchenStaff"]), userController.getById);

router.put("/updateUser/:id",   auth(["Customer", "KitchenStaff"]), userController.updateById)



module.exports = router;
