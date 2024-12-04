const Restaurant_Model = require("../restaurant/restaurant.model");
const Table_Model = require("./table.model");

const createTable = async (req, res) => {
  try {
    const { restaurantId, tableNumber, capacity,isAvailable } = req.body;
    let userId = req.userId;

    if (!restaurantId || !tableNumber) {
      return res.status(400).json({ error: "Restaurant ID and tableNumber are required." });
    }

    let existingTable = await Table_Model.findOne({ restaurantId, tableNumber });

    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: `Table number ${tableNumber} already exists for this restaurant.`,
      });
    }

    const table = new Table_Model({
      restaurantId,
      tableNumber,
      capacity,
      isAvailable,
      createdBy: userId,
    });

    const restaurant = await Restaurant_Model.findById(restaurantId);
    if (!restaurant) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.tables.push(table._id);
    await restaurant.save();

    await table.save();

    return res.status(201).json({
      success: true,
      message: "Table created successfully",
      restaurant: table,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


const getAllTables = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
    const totalTableCount = await Table_Model.countDocuments();
    const tables = await Table_Model.find()
    .populate("createdBy restaurantId")
    .skip(skip)
    .limit(pageSize);

    const totalPages = Math.ceil(totalTableCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    return res.status(200).json({
      success: true,
      message: "Tables retrieved successfully",
      tables,
      meta: {
        totalTableCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: tables.length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};
const getTableById = async (req, res) => {
    try {
      const { id } = req.params; 
  
      if (!id) {
        return res.status(400).json({ error: "Table ID is required." });
      }
  
      const table = await Table_Model.findById(id).populate("createdBy");
      if (!table) {
        return res.status(404).json({ error: "Table not found." });
      }
  
      return res.status(200).json({
        success: true,
        message: "Table retrieved successfully.",
        table,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  };

  const updateTable = async (req, res) => {
    try {
      const { id } = req.params; 
      const { restaurantId, tableNumber, capacity } = req.body;
  
      if (!id) {
        return res.status(400).json({ error: "Table ID is required." });
      }
  
      const table = await Table_Model.findById(id);
      if (!table) {
        return res.status(404).json({ error: "Table not found." });
      }
  
      if (restaurantId) table.restaurantId = restaurantId;
      if (tableNumber) table.tableNumber = tableNumber;
      if (capacity) table.capacity = capacity;
      if (isAvailable !== undefined) table.isAvailable = isAvailable;
  
      await table.save();
      return res.status(200).json({
        success: true,
        message: "Table updated successfully.",
        table,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  };

  const deleteTable = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ error: "Table ID is required." });
      }
  
      const table = await Table_Model.findByIdAndDelete(id);
      if (!table) {
        return res.status(404).json({ error: "Table not found." });
      }
  
      const restaurant = await Restaurant_Model.findById(table.restaurantId);
      if (restaurant) {
        restaurant.tables = restaurant.tables.filter(
          (tableId) => tableId.toString() !== id
        );
        await restaurant.save();
      }
  
      return res.status(200).json({
        success: true,
        message: "Table deleted successfully.",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  };
    
module.exports = {
    createTable,
    getAllTables,
    getTableById,
    updateTable,
    deleteTable,

}