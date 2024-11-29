const menuItem = require("../menuItem/menuItem.model");
const restaurant = require("../restaurant/restaurant.model");
const Menu = require("./menu.model");

const createMenu = async (req, res) => {
  try {
    const { restaurantId, categories, items } = req.body;
    const userId = req.userId;

    if (!restaurantId || !categories) {
      return res
        .status(400)
        .json({ error: "Restaurant ID and categories are required." });
    }

    const menu = new Menu({
      restaurantId,
      categories,
      createdBy: userId,
      items,
    });
    if (menu) {
      await restaurant.findByIdAndUpdate(restaurantId, { menuId: menu._id });
    }

    await menu.save();
    return res
      .status(201)
      .json({ success: true, message: "Menu created successfully.", menu });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to create menu." });
  }
};

const getMenus = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const totalMenuCount = await Menu.countDocuments();

    const menus = await Menu.find()
      .skip(skip)
      .limit(pageSize)
      .populate("restaurantId items");

    const totalPages = Math.ceil(totalMenuCount / pageSize);
    const remainingPages = totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    res.status(200).json({
      success: true,
      message: "Get all menus successful",
      menus,
      meta: {
        totalMenuCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: menus.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to fetch menus." });
  }
};


const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate(
      "restaurantId items"
    );
    if (!menu) {
      return res.status(404).json({ success: false, error: "Menu not found." });
    }
    return res
      .status(200)
      .json({ success: true, message: "Get all menus successful", menu });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to fetch menu." });
  }
};

const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(404).json({ success: false, error: "Menu not found." });
    }

    if (updates.restaurantId && updates.restaurantId !== menu.restaurantId.toString()) {
      await restaurant.findOneAndUpdate(
        { _id: menu.restaurantId },
        { $unset: { menuId: "" } }
      );

      await restaurant.findByIdAndUpdate(updates.restaurantId, {
        menuId: menu._id,
      });
    }

    const updatedMenu = await Menu.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({
      success: true,
      message: "Menu updated successfully.",
      menu: updatedMenu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error. Unable to update menu.",
      details: error.message,
    });
  }
};


const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findByIdAndDelete(id);
    if (!menu) {
      return res.status(404).json({ error: "Menu not found." });
    }
    await restaurant.findOneAndUpdate(
      { menuId: id },
      { $unset: { menuId: "" } },
      { new: true }
    );
    await menuItem.deleteMany(menu._id)

    return res
      .status(200)
      .json({ success: true, message: "Menu deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to delete menu." });
  }
};

const addCategoriesToMenu = async (req, res) => {
  try {
    const { menuId } = req.params;  
    const { categories } = req.body;  

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ success: false, error: "Categories should be an array." });
    }

    const menu = await Menu.findById(menuId);
    if (!menu) {
      return res.status(404).json({ success: false, error: "Menu not found." });
    }

    const newCategories = categories.filter(category => !menu.categories.includes(category));

    if (newCategories.length === 0) {
      return res.status(400).json({ success: false, error: "All categories already exist in the menu." });
    }

    menu.categories.push(...newCategories);
    await menu.save();

    return res.status(200).json({
      success: true,
      message: "Categories added to the menu successfully.",
      categories: menu.categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error. Unable to add categories to menu.",
      details: error.message,
    });
  }
};



const removeCategoriesFromMenu = async (req, res) => {
  try {
    const { menuId } = req.params; 
    const { categories } = req.body;  

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ success: false, error: "Categories should be an array." });
    }

    const menu = await Menu.findById(menuId);
    if (!menu) {
      return res.status(404).json({ success: false, error: "Menu not found." });
    }

    const categoriesToRemove = categories.filter(category => menu.categories.includes(category));

    if (categoriesToRemove.length === 0) {
      return res.status(400).json({ success: false, error: "None of the categories are present in the menu." });
    }

    menu.categories = menu.categories.filter(category => !categoriesToRemove.includes(category));
    await menu.save();

    return res.status(200).json({
      success: true,
      message: "Categories removed from the menu successfully.",
      categories: menu.categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error. Unable to remove categories from menu.",
      details: error.message,
    });
  }
};



module.exports = {
  createMenu,
  getMenus,
  updateMenu,
  deleteMenu,
  getMenuById,
  addCategoriesToMenu,
  removeCategoriesFromMenu
};
