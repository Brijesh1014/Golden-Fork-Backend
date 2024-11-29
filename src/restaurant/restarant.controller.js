const menuItem = require("../menuItem/menuItem.model");
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
      socialLinks
    } = req.body;
    const userId = req.userId;

    if (!name || !email || !phoneNumber || !location) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
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
      socialLinks
    });

    if (newRestaurant) {
      const user = await User_Model.findById(restaurantAdminId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Restaurant Admin not found",
        });
      }

      user.restaurants.push(newRestaurant._id);

      await user.save();
    }
    await newRestaurant.save();

    // // Handle menuId linking
    // if (menuId) {
    //   await newRestaurant.save();
    //   const menu = await menu.findById(menuId);
    //   if (menu) {
    //     menu.restaurantId = newRestaurant._id;
    //     await menu.save();
    //   }
    // }

    await newRestaurant.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Restaurant created successfully",
        restaurant: newRestaurant,
      });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
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
      filter.phoneNumber = phoneNumber;
    }
    if (restaurantAdminId) {
      filter.restaurantAdminId = restaurantAdminId;
    }
    if (openingHours) {
      const date = new Date(openingHours);
      filter.openingHours = { $gte: date };
    }

    const totalRestaurantCount = await Restaurant.countDocuments(filter);
    const restaurants = await Restaurant.find(filter)
      .populate("restaurantAdminId")
      .populate({
        path: "menuId",
        populate: {
          path: "items",
          model: "MenuItem",
        },
      })
      .populate("createdBy")
      .skip(skip)
      .limit(pageSize);

    const totalPages = Math.ceil(totalRestaurantCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

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
          path: "items",
          model: "MenuItem",
        },
      })
      .populate("createdBy");
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, error: "Restaurant not found" });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Restaurant retrieved successfully",
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
      return res.status(404).json({ success: false, error: "Restaurant not found" });
    }

    const restaurantAdminId = deletedRestaurant.restaurantAdminId;

    const user = await User_Model.findById(restaurantAdminId);

    if (user) {
      user.restaurants = user.restaurants.filter(
        (restaurant) => restaurant.toString() !== restaurantId
      );

      await user.save();
    } else {
      return res.status(400).json({ success: false, message: "User not found" });
    }

   let menuId= await menu.findOneAndDelete({ restaurantId: restaurantId });

    await menuItem.deleteMany({menuId});
    res.status(200).json({ success: true, message: "Restaurant and associated data deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};



module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurantById,
  deleteRestaurantById,
};
