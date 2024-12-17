const Kitchen = require("./kitchen.model");
const User_Model = require("../user/user.model");
const restaurant = require("../restaurant/restaurant.model");
const menu = require("../menus/menu.model");

const validateUser = async (userId, role) => {
  const user = await User_Model.findOne({ _id: userId, role });
  return user ? user : null;
};

const createKitchen = async (req, res) => {
  try {
    const { name, restaurantId, status, kitchenAdminId } = req.body;
    const userId = req.userId;

    if (!name || !restaurantId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const existingRestaurant = await restaurant.findById(restaurantId);
    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    if (existingRestaurant.kitchenId) {
      return res.status(400).json({
        success: false,
        message: "This restaurant already has a kitchen assigned.",
      });
    }

    if (kitchenAdminId) {
      const kitchenAdminUser = await validateUser(
        kitchenAdminId,
        "KitchenAdmin"
      );
      if (!kitchenAdminUser) {
        return res.status(400).json({
          success: false,
          message: "Kitchen admin not found.",
        });
      }
      const adminAssignedKitchen = await Kitchen.findOne({ kitchenAdminId });

      if (adminAssignedKitchen) {
        return res.status(400).json({
          success: false,
          message: "This kitchen admin is already assigned to another kitchen.",
        });
      }
    }

    const kitchen = new Kitchen({
      name,
      restaurantId,
      createdBy: userId,
      status,
      kitchenAdminId,
    });

    await kitchen.save();

    existingRestaurant.kitchenId = kitchen._id;
    await existingRestaurant.save();

    if (kitchenAdminId) {
      await User_Model.findByIdAndUpdate(
        kitchenAdminId,
        { kitchen: kitchen._id },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: "Kitchen created successfully",
      kitchen,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating kitchen",
      error: error.message,
    });
  }
};

const getKitchens = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, withoutPagination = false } = req.query;

    const filter = {};

    if (name) filter.name = { $regex: name, $options: "i" };

    const query = Kitchen.find(filter)
      .populate("restaurantId")
      .populate("orders")
      .populate("kitchenAdminId")
      .populate({
        path: "menuId",
        populate: {
          path: "categories",
          model: "Category",
          populate: {
            path: "items",
            model: "CategoryItem",
          },
        },
      })
      .populate("createdBy");

    if (String(withoutPagination) === "true") {
      const kitchensWithoutMenu = await Kitchen.find({
        $or: [{ menuId: null }, { menuId: { $exists: false } }],
      })
        .populate("restaurantId")
        .populate("orders")
        .populate("kitchenAdminId")
        .populate({
          path: "menuId",
          populate: {
            path: "categories",
            model: "Category",
            populate: {
              path: "items",
              model: "CategoryItem",
            },
          },
        })
        .populate("createdBy");

      return res.status(200).json({
        success: true,
        message: "All kitchens retrieved successfully (without pagination)",
        kitchens: kitchensWithoutMenu,
      });
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const [kitchens, totalKitchenCount, totalActiveKitchenCount] =
      await Promise.all([
        query.skip(skip).limit(pageSize).exec(),
        Kitchen.countDocuments(filter),
        Kitchen.countDocuments({ ...filter, status: "Active" }),
      ]);

    const totalPages = Math.ceil(totalKitchenCount / pageSize);
    const remainingPages = Math.max(totalPages - pageNumber, 0);

    return res.status(200).json({
      success: true,
      message: "Kitchens retrieved successfully",
      kitchens,
      meta: {
        totalKitchenCount,
        totalActiveKitchenCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: kitchens.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching kitchens",
      error: error.message,
    });
  }
};

const getKitchenById = async (req, res) => {
  try {
    const kitchen = await Kitchen.findById(req.params.id)
      .populate("restaurantId")
      .populate("orders")
      .populate("kitchenAdminId")
      .populate({
        path: "menuId",
        populate: {
          path: "categories",
          model: "Category",
          populate: {
            path: "items",
            model: "CategoryItem",
          },
        },
      })
      .populate("createdBy");
    if (!kitchen) {
      return res
        .status(404)
        .json({ success: false, error: "Kitchen not found" });
    }
    res.status(200).json({
      success: true,
      message: "Kitchen retrieved successfully",
      kitchen,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const updateKitchen = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const kitchen = await Kitchen.findById(id);
    if (!kitchen)
      return res
        .status(404)
        .json({ success: false, message: "Kitchen not found" });
    if (updates.menuId && updates.menuId !== kitchen.menuId?.toString()) {
      await menu.findByIdAndUpdate(kitchen.menuId, {
        $unset: { kitchenId: "" },
      });
      await menu.findByIdAndUpdate(updates.menuId, {
        $set: { kitchenId: id },
      });
    }

    const updatedKitchen = await Kitchen.findByIdAndUpdate(id, updates, {
      new: true,
    });
    res.status(200).json({
      success: true,
      message: "Kitchen updated successfully",
      updatedKitchen,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating kitchen",
      error: error.message,
    });
  }
};

const deleteKitchen = async (req, res) => {
  try {
    const { id } = req.params;

    const kitchen = await Kitchen.findById(id);
    if (!kitchen) {
      return res
        .status(404)
        .json({ success: false, message: "Kitchen not found" });
    }

    const kitchenAdminId = kitchen.kitchenAdminId;

    if (kitchenAdminId) {
      await User_Model.findByIdAndUpdate(
        kitchenAdminId,
        { $unset: { kitchen: "" } },
        { new: true }
      );
    }

    await menu.deleteMany({ kitchenId: id });

    await restaurant.findOneAndUpdate(
      { kitchenId: id },
      { $unset: { kitchenId: 1 } }
    );

    await Kitchen.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Kitchen and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting kitchen:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting kitchen",
      error: error.message,
    });
  }
};

const assignKitchenAdmin = async (req, res) => {
  try {
    const { kitchenId, kitchenAdminId } = req.body;

    if (!kitchenId || !kitchenAdminId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: kitchenId or kitchenAdminId",
      });
    }

    const kitchen = await Kitchen.findById(kitchenId);
    if (!kitchen) {
      return res.status(404).json({
        success: false,
        message: "Kitchen not found.",
      });
    }

    const kitchenAdmin = await User_Model.findById(kitchenAdminId);
    if (!kitchenAdmin || kitchenAdmin.role !== "KitchenAdmin") {
      return res.status(400).json({
        success: false,
        message: "Kitchen admin not found or invalid role.",
      });
    }

    if (kitchen.kitchenAdminId) {
      await User_Model.findByIdAndUpdate(
        kitchen.kitchenAdminId,
        { $unset: { kitchen: "" } },
        { new: true }
      );
    }

    kitchen.kitchenAdminId = kitchenAdminId;
    await kitchen.save();

    await User_Model.findByIdAndUpdate(
      kitchenAdminId,
      { kitchen: kitchenId },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Kitchen admin assigned successfully.",
      kitchen,
    });
  } catch (error) {
    console.error("Error assigning kitchen admin:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning kitchen admin.",
      error: error.message,
    });
  }
};

module.exports = {
  createKitchen,
  getKitchens,
  assignKitchenAdmin,
  updateKitchen,
  deleteKitchen,
  getKitchenById,
};
