const User_Model = require("../user/user.model");

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
    let filter = {};
    if (role) {
      filter.role = { $regex: role, $options: "i" };
    }
    const totalUsersCount = await User_Model.countDocuments(filter);
    const users = await User_Model.find(filter).skip(skip).limit(pageSize);
    const totalPages = Math.ceil(totalUsersCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      users,
      meta: {
        totalUsersCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: users.length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User_Model.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await User_Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User_Model.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

module.exports = {
  getAllUsers,
  getById,
  updateById,
  deleteById, 
};
