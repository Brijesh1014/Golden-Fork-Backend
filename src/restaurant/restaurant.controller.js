const menu = require("../menus/menu.model");
const User_Model = require("../user/user.model");
const Restaurant = require("./restaurant.model");

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
        error: "Missing required fields",
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

      const restaurantAdminUser = await User_Model.findById(restaurantAdminId);
      if (!restaurantAdminUser) {
        return res.status(400).json({
          success: false,
          message: "Restaurant admin not found",
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
        { $push: { restaurants: newRestaurant._id } },
        { new: true }
      );
    }

    await newRestaurant.save();

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      restaurant: newRestaurant,
    });
  } catch (error) {
    console.error("Error in createRestaurant:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
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
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }
    if (country) {
      filter.country = { $regex: country, $options: "i" };
    }
    if (phoneNumber) {
      filter.phoneNumber = { $regex: phoneNumber, $options: "i" };
    }
    if (restaurantAdminId) {
      filter.restaurantAdminId = { $regex: restaurantAdminId, $options: "i" };
    }
    if (status) {
      filter.status = { $regex: status, $options: "i" };
    }
    if (openingHours) {
      const date = new Date(openingHours);
      filter.openingHours = { $gte: date };
    }

    const totalRestaurantCount = await Restaurant.countDocuments(filter);
    const totalActiveRestaurantCount = await Restaurant.find({
      isActive: true,
    }).countDocuments(filter);

    const restaurants = await Restaurant.find(filter)
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
      .populate("tables")
      .skip(skip)
      .limit(pageSize);

    const totalPages = Math.ceil(totalRestaurantCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    const totalTableCount = restaurants.reduce((total, restaurant) => {
      return total + (restaurant.tables ? restaurant.tables.length : 0);
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Restaurants retrieved successfully",
      restaurants,
      meta: {
        totalRestaurantCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: restaurants.length,
        totalTableCount,
        totalActiveRestaurantCount,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
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

    const user = await User_Model.findById(restaurantAdminId);

    if (user) {
      user.restaurants = user.restaurants.filter(
        (restaurant) => restaurant.toString() !== restaurantId
      );

      await user.save();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    await menu.findOneAndDelete({ restaurantId: restaurantId });

    res.status(200).json({
      success: true,
      message: "Restaurant and associated data deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
};
