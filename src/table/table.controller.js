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
    const { page = 1, limit = 10, restaurantName,restaurantStatus } = req.query;


    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const query = {};

    let tablesQuery = Table_Model.find(query).populate({
      path: "restaurantId",
      match: {
        ...(restaurantName && { name: { $regex: new RegExp(restaurantName.trim(), "i") } }),
        ...(restaurantStatus && { status: { $regex: new RegExp(restaurantStatus.trim(), "i") } }),
      },
    })
    
      .populate("createdBy")
      .skip(skip)
      .limit(pageSize);

    const tables = await tablesQuery.exec();

    const filteredTables = tables.filter((table) => table.restaurantId !== null);

    const totalTableCount = await Table_Model.countDocuments(query);

    const totalPages = Math.ceil(totalTableCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    return res.status(200).json({
      success: true,
      message: "Tables retrieved successfully",
      tables: filteredTables,
      meta: {
        totalTableCount: filteredTables.length,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: filteredTables.length,
      },
    });
  } catch (error) {
    console.error("Error fetching tables:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
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
      const { restaurantId, tableNumber, capacity,isAvailable } = req.body;
  
      if (!id) {
        return res.status(400).json({ error: "Table ID is required." });
      }
  
      const table = await Table_Model.findById(id);
      
      if (!table) {
        return res.status(404).json({ error: "Table not found." });
      }

      let existingTable = await Table_Model.findOne({ restaurantId:table.restaurantId, tableNumber });

      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: `Table number ${tableNumber} already exists for this restaurant.`,
        });
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