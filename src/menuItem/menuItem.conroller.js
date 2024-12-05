const menu = require("../menus/menu.model");
const MenuItem = require("./menuItem.model");

const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, menuId, restaurantId } = req.body;
    const userId = req.userId;

    if (!name || !price || !menuId) {
      return res.status(400).json({ success: false, error: "Name, price, and menuId are required." });
    }

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      isAvailable: isAvailable ?? true,
      menuId,
      restaurantId,
      createdBy: userId,
    });

    if (menuItem) {
      await menu.findByIdAndUpdate(menuId, { $push: { items: menuItem._id } });
    }

    await menuItem.save();
    return res.status(201).json({ success: true, message: "Menu item created successfully.", menuItem });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to create menu item." });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ success: false, error: "Menu item not found." });
    }

    if (updates.menuId && updates.menuId !== menuItem.menuId?.toString()) {
      if (menuItem.menuId) {
        await menu.findByIdAndUpdate(menuItem.menuId, {
          $pull: { items: menuItem._id },
        });
      }

      await menu.findByIdAndUpdate(updates.menuId, {
        $push: { items: menuItem._id },
      });
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully.",
      menuItem: updatedMenuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error. Unable to update menu item.",
      details: error.message,
    });
  }
};


const getMenuItems = async (req, res) => {
  try {
    const { menuId, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const filter = menuId ? { menuId } : {};

    const totalMenuItemsCount = await MenuItem.countDocuments(filter);

    const menuItems = await MenuItem.find(filter)
      .skip(skip)
      .limit(pageSize)
      .populate({
        path: "menuId",
        populate: {
          path: "restaurantId", 
          model: "Restaurant" 
        }
      });

    const totalPages = Math.ceil(totalMenuItemsCount / pageSize);
    const remainingPages = totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    return res.status(200).json({
      success: true,
      message: "Get menuItems successful",
      menuItems,
      meta: {
        totalMenuItemsCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: menuItems.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to fetch menu items." });
  }
};


const getMenuItemById = async (req,res)=>{
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate("menuId");
    if (!menuItem) {
      return res.status(404).json({success:false, error: "Menu item not found." });
    }
    return res.status(200).json({success:true, message: "Get menu successfully.", menuItem });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to fetch menu item." });
  }
}



const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByIdAndDelete(id);
    if (!menuItem) {
      return res.status(404).json({ success: false, error: "Menu item not found." });
    }

    await menu.findByIdAndUpdate(menuItem.menuId, {
      $pull: { items: menuItem._id },
    });

    res.status(200).json({ success: true, message: "Menu item deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to delete menu item." });
  }
};


module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem
}