const Category = require("../category/category.model");
const CategoryItem = require("./categoryItem.model");

const createCategoryItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      isAvailable,
      image,
      pickupAvailable,
      dineInAvailable,
      deliveryAvailable,
      restaurantId,
      categoryId,
    } = req.body;
    const userId = req.userId;

    if (!name || !price || !categoryId) {
      return res
        .status(400)
        .json({ success: false, error: "Name, price, and categoryId are required." });
    }
    const categoryIsExits = await Category.findById((categoryId))
    
    if(!categoryIsExits){
      return res.status(400).json({
        success:false,
        message:"Category not found"
      })
    }

    const categoryItem = new CategoryItem({
      name,
      description,
      price,
      category,
      isAvailable: isAvailable ?? true,
      image,
      pickupAvailable,
      dineInAvailable,
      deliveryAvailable,
      restaurantId,
      categoryId,
      createdBy: userId,
    });

    if (categoryItem) {
      await Category.findByIdAndUpdate(categoryId, {
        $push: { items: categoryItem._id },
      });
    }

    await categoryItem.save();
    return res
      .status(201)
      .json({ success: true, message: "Category item created successfully.", categoryItem });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to create category item." });
  }
};

const updateCategoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const categoryItem = await CategoryItem.findById(id);
    if (!categoryItem) {
      return res
        .status(404)
        .json({ success: false, error: "Category item not found." });
    }

    if (updates.categoryId && updates.categoryId !== categoryItem.categoryId?.toString()) {
      if (categoryItem.categoryId) {
        await Category.findByIdAndUpdate(categoryItem.categoryId, {
          $pull: { items: categoryItem._id },
        });
      }

      await Category.findByIdAndUpdate(updates.categoryId, {
        $push: { items: categoryItem._id },
      });
    }

    const updatedCategoryItem = await CategoryItem.findByIdAndUpdate(id, updates, { new: true });

    res.status(200).json({
      success: true,
      message: "Category item updated successfully.",
      categoryItem: updatedCategoryItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error. Unable to update category item.",
      details: error.message,
    });
  }
};

const getCategoryItems = async (req, res) => {
  try {
    const { categoryId, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const filter = categoryId ? { categoryId } : {};

    const totalCategoryItemsCount = await CategoryItem.countDocuments(filter);

    const categoryItems = await CategoryItem.find(filter)
      .skip(skip)
      .limit(pageSize)
      .populate("categoryId restaurantId createdBy");

      const totalAvailableItemsCount = await CategoryItem.find({isAvailable:true}).countDocuments();

      const totalUnAvailableItemsCount = await CategoryItem.find({isAvailable:false}).countDocuments();


    const totalPages = Math.ceil(totalCategoryItemsCount / pageSize);
    const remainingPages = totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    return res.status(200).json({
      success: true,
      message: "Get category items successful",
      categoryItems,
      meta: {
        totalCategoryItemsCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: categoryItems.length,
        totalAvailableItemsCount,
        totalUnAvailableItemsCount
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to fetch category items." });
  }
};

const getCategoryItemById = async (req, res) => {
  try {
    const categoryItem = await CategoryItem.findById(req.params.id)
      .populate("categoryId restaurantId createdBy");
    if (!categoryItem) {
      return res.status(404).json({ success: false, error: "Category item not found." });
    }
    return res
      .status(200)
      .json({ success: true, message: "Get category item successfully.", categoryItem });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to fetch category item." });
  }
};

const deleteCategoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const categoryItem = await CategoryItem.findByIdAndDelete(id);
    if (!categoryItem) {
      return res
        .status(404)
        .json({ success: false, error: "Category item not found." });
    }

    await Category.findByIdAndUpdate(categoryItem.categoryId, {
      $pull: { items: categoryItem._id },
    });

    res.status(200).json({ success: true, message: "Category item deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Server error. Unable to delete category item." });
  }
};

module.exports = {
  createCategoryItem,
  getCategoryItems,
  getCategoryItemById,
  updateCategoryItem,
  deleteCategoryItem,
};
