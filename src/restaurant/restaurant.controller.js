const menu = require("../menus/menu.model");
const User_Model = require("../user/user.model");
const Restaurant = require("./restaurant.model");

const validateUser = async (userId, role) => {
  const user = await User_Model.findOne({ _id: userId, role });
  return user ? user : null;
};

const createRestaurant = async (req, res) => {
  try {
    const {
      name,
      location,
      email,
      phoneNumber,
      description,
      openingHours,
      restaurantAdminId,
      menuId,
      country,
      state,
      city,
      zipCode,
      address,
      status,
      socialLinks,
      bookingSlot,
      isActive,
      closingHours,
      locationPath,
    } = req.body;
    const userId = req.userId;

    if (!name || !email || !phoneNumber || !location) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, phoneNumber, or location.",
      });
    }

    if (restaurantAdminId) {
      const existingRestaurant = await Restaurant.findOne({ restaurantAdminId });
      if (existingRestaurant) {
        return res.status(400).json({
          success: false,
          message: `The restaurant admin is already assigned to another restaurant (${existingRestaurant.name}).`,
        });
      }

      const restaurantAdminUser = await validateUser(restaurantAdminId, "RestaurantAdmin");
      if (!restaurantAdminUser) {
        return res.status(400).json({
          success: false,
          message: "Restaurant admin not found.",
        });
      }
    }

    const newRestaurant = new Restaurant({
      name,
      location,
      email,
      phoneNumber,
      description,
      openingHours,
      restaurantAdminId,
      menuId,
      country,
      state,
      city,
      zipCode,
      address,
      createdBy: userId,
      status,
      socialLinks,
      bookingSlot,
      isActive,
      closingHours,
      locationPath,
    });

    if (restaurantAdminId) {
      await User_Model.findByIdAndUpdate(
        restaurantAdminId,
       { restaurant: newRestaurant._id },
        { new: true }
      );
    }

    await newRestaurant.save();

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully.",
      restaurant: newRestaurant,
    });
  } catch (error) {
    console.error("Error in createRestaurant:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error.",
      details: error.message,
    });
  }
};

const getAllRestaurants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      name,
      location,
      country,
      phoneNumber,
      restaurantAdminId,
      status,
      openingHours,
      withoutPagination = false,
    } = req.query;

    const filter = {};

    if (name) filter.name = { $regex: name, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (country) filter.country = { $regex: country, $options: "i" };
    if (phoneNumber) filter.phoneNumber = { $regex: phoneNumber, $options: "i" };
    if (restaurantAdminId) filter.restaurantAdminId = { $regex: restaurantAdminId, $options: "i" };
    if (status) filter.status = { $regex: status, $options: "i" };
    if (openingHours) filter.openingHours = { $gte: new Date(openingHours) };

    const query = Restaurant.find(filter)
      .populate("restaurantAdminId")
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
      .populate("createdBy")
      .populate("tables");

    if (String(withoutPagination) === "true") {
      const restaurants = await Restaurant.find({menuId:null}).populate("restaurantAdminId")
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
      .populate("createdBy")
      .populate("tables");
      return res.status(200).json({
        success: true,
        message: "All restaurants retrieved successfully (without pagination)",
        restaurants,
      });
    }

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const [restaurants, totalRestaurantCount, totalActiveRestaurantCount] = await Promise.all([
      query.skip(skip).limit(pageSize).exec(),
      Restaurant.countDocuments(filter),
      Restaurant.countDocuments({ ...filter, isActive: true }),
    ]);

    const totalPages = Math.ceil(totalRestaurantCount / pageSize);
    const remainingPages = Math.max(totalPages - pageNumber, 0);

    const totalTableCount = restaurants.reduce((total, restaurant) => {
      return total + (restaurant.tables?.length || 0);
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Restaurants retrieved successfully",
      restaurants,
      meta: {
        totalRestaurantCount,
        totalActiveRestaurantCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: restaurants.length,
        totalTableCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};


const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
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
      .populate("createdBy")
      .populate("tables");
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found" });
    }
    const totalTableCount = restaurant.tables.length;
    res.status(200).json({
      success: true,
      message: "Restaurant retrieved successfully",
      totalTableCount,
      restaurant,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const updateRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found." });
    }

    // Check if menuId is being updated
    if (updates.menuId && updates.menuId !== restaurant.menuId?.toString()) {
      await menu.findByIdAndUpdate(restaurant.menuId, {
        $unset: { restaurantId: "" },
      });
      await menu.findByIdAndUpdate(updates.menuId, {
        $set: { restaurantId: id },
      });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully.",
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Server error. Unable to update restaurant." });
  }
};

const deleteRestaurantById = async (req, res) => {
  try {
    const restaurantId = req.params.id;

    const deletedRestaurant = await Restaurant.findByIdAndDelete(restaurantId);

    if (!deletedRestaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found" });
    }

    const restaurantAdminId = deletedRestaurant.restaurantAdminId;


    if (restaurantAdminId) {
      await User_Model.findByIdAndUpdate(
        restaurantAdminId,
        { $unset: { restaurant: "" } }, 
        { new: true }
      );
    }

    await menu.deleteMany({ restaurantId });

    res.status(200).json({
      success: true,
      message: "Restaurant and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    res
      .status(500)
      .json({ success: false, error: "Internal server error", details: error.message });
  }
};



const assignRestaurantAdmin = async (req, res) => {
  try {
    const { restaurantId, restaurantAdminId } = req.body;

    if (!restaurantId || !restaurantAdminId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: restaurantId or restaurantAdminId",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const restaurantAdmin = await User_Model.findById(restaurantAdminId);
    if (!restaurantAdmin || restaurantAdmin.role !== "RestaurantAdmin") {
      return res.status(400).json({
        success: false,
        message: "Restaurant admin not found or invalid role.",
      });
    }

    if (restaurant.restaurantAdminId) {
      await User_Model.findByIdAndUpdate(
        restaurant.restaurantAdminId,
        { $unset: { restaurant: "" } },
        { new: true }
      );
    }

    restaurant.restaurantAdminId = restaurantAdminId;
    await restaurant.save();

    await User_Model.findByIdAndUpdate(
      restaurantAdminId,
      { restaurant: restaurantId },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Restaurant admin assigned successfully.",
      restaurant,
    });
  } catch (error) {
    console.error("Error assigning restaurant admin:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning restaurant admin.",
      error: error.message,
    });
  }
};






module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
  assignRestaurantAdmin
};
