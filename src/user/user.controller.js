const User_Model = require("../user/user.model");

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

  module.exports = {
    getById,
    updateById
  }