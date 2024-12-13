const CMS = require("./cms.model");

const getAllCMSPages = async (req, res) => {
  try {
    const { page = 1, limit = 10, title } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    let filter = {};

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }
    
    const totalCmsPageCount = await CMS.countDocuments(filter);

    const pages = await CMS.find(filter).skip(skip).limit(pageSize);

    const totalPages = Math.ceil(totalCmsPageCount / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    res.status(200).json({
      success: true,
      message: "CMS page retrieved successfully",
      data: pages,
      meta: {
        totalCmsPageCount,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: pages.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCMSPageById = async (req, res) => {
  try {
    const page = await CMS.findById(req.params.id);
    if (!page) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }
    res.status(200).json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCMSPage = async (req, res) => {
  try {
    const { title, content, slug } = req.body;
    const userId = req.userId;
    const newPage = new CMS({ title, content, slug, createdBy: userId });
    await newPage.save();
    res.status(201).json({
      success: true,
      message: "CMS page created successfully ",
      data: newPage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCMSPage = async (req, res) => {
  try {
    const { title, content, slug } = req.body;
    const updatedPage = await CMS.findByIdAndUpdate(
      req.params.id,
      { title, content, slug },
      { new: true, runValidators: true }
    );

    if (!updatedPage) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    res.status(200).json({
      success: true,
      message: "CMS page updated successfully ",
      data: updatedPage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCMSPage = async (req, res) => {
  try {
    const deletedPage = await CMS.findByIdAndDelete(req.params.id);
    if (!deletedPage) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Page deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCMSPages,
  getCMSPageById,
  createCMSPage,
  updateCMSPage,
  deleteCMSPage,
};
