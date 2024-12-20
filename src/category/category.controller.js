const Category = require("../category/category.model");
const categoryItem = require("../categoryItem/categoryItem.model");
const menu = require("../menus/menu.model");

const createCategory = async (req, res) => {
  try {
    const { categoryName, isActive, description, mainImage } = req.body;
    const userId = req.userId;

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required." });
    }

    let categoryIsExits = await Category.findOne({ categoryName });
    if (categoryIsExits) {
      return res.status(400).json({
        success: false,
        message: "Category name is already exits",
      });
    }

    const newCategory = new Category({
      categoryName,
      createdBy: userId,
      isActive: isActive || true,
      description,
      mainImage,
    });

    await newCategory.save();
    return res
      .status(201)
      .json({
        success: true,
        message: "Category created successfully.",
        category: newCategory,
      });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Server error. Unable to create category." });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryName, isActive } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
    let filter = {};

    if (categoryName) {
      filter.categoryName = { $regex: categoryName, $options: "i" };
    }
    if (isActive) {
      filter.isActive = isActive;
    }

    const totalCategoryCount = await Category.countDocuments(filter);
    const totalActiveCategoriesCount = await Category.find({
      isActive: true,
    }).countDocuments(filter);
    const totalDeActiveCategoriesCount = await Category.find({
      isActive: false,
    }).countDocuments(filter);

    const categories = await Category.find(filter)
      .populate("createdBy", "name email")
      .populate("items")
      .skip(skip)
      .limit(pageSize);
    const categoriesWithItemCount = categories.map((category) => ({
      ...category.toObject(),
      totalItemCount: category.items ? category.items.length : 0,
    }));

    const totalPages = Math.ceil(totalCategoryCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    res.status(200).json({
      success: true,
      message: "Fetch all categories successfully",
      categories: categoriesWithItemCount,
      meta: {
        totalCategoryCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: categoriesWithItemCount.length,
        totalActiveCategoriesCount,
        totalDeActiveCategoriesCount,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({ error: "Server error. Unable to fetch categories." });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate("createdBy", "name email")
      .populate("items");

    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Server error. Unable to fetch category." });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params; 
    const { categoryName, description, removeItems } = req.body; 

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Category ID is required.",
      });
    }

    if (removeItems && removeItems.length > 0) {
      const removeItemsCount = await categoryItem.countDocuments({
        _id: { $in: removeItems },
      });

      if (removeItemsCount !== removeItems.length) {
        return res.status(400).json({
          success: false,
          error: "One or more items to be removed do not exist.",
        });
      }
    }

    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return res.status(404).json({
        success: false,
        error: "Category not found.",
      });
    }

    if (categoryName) currentCategory.categoryName = categoryName;
    if (description) currentCategory.description = description;


    if (removeItems && removeItems.length > 0) {
      currentCategory.items = currentCategory.items.filter(
        (item) => !removeItems.includes(item.toString())
      );

      await categoryItem.updateMany(
        { _id: { $in: removeItems } },
        { $unset: { categoryId: "" } }
      );
    }

    await currentCategory.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category: currentCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Unable to update category.",
    });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCategory = await Category.findById(id);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Category not found." });
    }

    await Category.deleteOne(deletedCategory._id);
    await menu.updateMany({}, { $pull: { categories: deletedCategory._id } });
    await categoryItem.deleteMany({ categoryId: deletedCategory._id });

    res
      .status(200)
      .json({
        success: true,
        message: "Category deleted successfully.",
        category: deletedCategory,
      });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Server error. Unable to delete category." });
  }
};

const addMultipleCategoryItems = async (req, res) => {
  try {
    const { categoryId, itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res
        .status(400)
        .json({ error: "itemIds must be a non-empty array." });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    const categoryItems = await categoryItem.find({ _id: { $in: itemIds } });
    if (categoryItems.length !== itemIds.length) {
      return res
        .status(404)
        .json({ error: "One or more CategoryItems not found." });
    }

    category.items.push(...itemIds);
    await category.save();

    res.status(200).json({
      success: true,
      message: "CategoryItems added to Category successfully.",
      category,
    });
  } catch (error) {
    console.error("Error adding category items:", error);
    res
      .status(500)
      .json({ error: "Server error. Unable to add category items." });
  }
};

const removeMultipleCategoryItems = async (req, res) => {
  try {
    const { categoryId, itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res
        .status(400)
        .json({ error: "itemIds must be a non-empty array." });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found." });
    }

    const itemsNotInCategory = itemIds.filter(
      (itemId) => !category.items.includes(itemId)
    );
    if (itemsNotInCategory.length > 0) {
      return res
        .status(404)
        .json({
          error: `Items not found in category: ${itemsNotInCategory.join(
            ", "
          )}`,
        });
    }

    category.items = category.items.filter(
      (itemId) => !itemIds.includes(itemId)
    );
    await category.save();

    res.status(200).json({
      success: true,
      message: "CategoryItems removed from Category successfully.",
      category,
    });
  } catch (error) {
    console.error("Error removing category items:", error);
    res
      .status(500)
      .json({ error: "Server error. Unable to remove category items." });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  addMultipleCategoryItems,
  removeMultipleCategoryItems,
};
