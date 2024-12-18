const contactUsModel = require("./contactUs.model");
const contactUsSendMail = require("../services/contactUsSendMail.service");
const sendReplyModel = require("./sendReply.model");
const createContactUs = async (req, res) => {
  try {
    const createdBy = req.userId;
    const { name, email, subject, messageTitle, message, contactNo,isActive } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Please enter required details",
      });
    }
    const newContactUs = await contactUsModel.create({
      name,
      email,
      subject,
      messageTitle,
      message,
      createdBy,
      contactNo,
      isActive
    });

    await contactUsSendMail(
      name,
      (messageSubject = subject),
      messageTitle,
      message,
      email,
      contactNo,
      (receiverEmail = "brijeshl.brainerhub@gmail.com"),
      "",
      "",
      "",
      "../views/contactUs.ejs",
      {
        messageContent: message,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Contact US sent successfully",
      data: newContactUs,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const getAllContactUs = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, email, subject,isActive,messageTitle } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;
    let filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }
    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }
    if (subject) {
      filter.subject = { $regex: subject, $options: "i" };
    }
    if (isActive) {
      filter.isActive = isActive
    }
    if (messageTitle) {
      filter.messageTitle = { $regex: messageTitle, $options: "i" };
    }

    const contactUs = await contactUsModel
      .find(filter)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate('reply');
    if (!contactUs) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
      });
    }

    const totalReplied = await contactUsModel.countDocuments({
      ...filter,
      reply: { $ne: null },  
    });

    const totalPending = await contactUsModel.countDocuments({
      ...filter,
      reply: { $eq: null }, 
    });

    const totalContactUs = await contactUsModel.countDocuments(filter);
    const totalPages = Math.ceil(totalContactUs / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    res.status(200).json({
      success: true,
      message: "Get all contact us successfully",
      contactUs,
      meta: {
        totalContactUs,
        totalReplied,
        totalPending,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: contactUs.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getContactUsById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await contactUsModel.findById({ _id: id });

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact entry not found" });
    }
    res.status(200).json({
      success: true,
      message: "Get  contact us by id successfully",
      contact,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteContactUs = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedContact = await contactUsModel.findByIdAndDelete({ _id: id });

    if (!deletedContact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact entry not found" });
    }
    res.status(200).json({
      success: true,
      message: "Contact entry deleted successfully",
      deletedContact,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
const sendReply = async (req, res) => {
  try {
    const { sendReply, id } = req.body;
    if (!sendReply) {
      return res.status(400).json({
        success: false,
        message: "Please enter required details",
      });
    }
    const inquiry = await contactUsModel.findById({ _id: id });
    if (!inquiry) {
      return res
        .status(400)
        .json({ success: false, message: "Inquiry not found" });
    }
    if (inquiry.reply) {
      return res.status(400).json({
        success: false,
        message: "A reply has already been sent for this inquiry",
      });
    }
    const sendedReply = await sendReplyModel.create({
      sendReply,
      inquiryId: id,
    });
    await contactUsSendMail(
      (name = inquiry.name),
      "",
      "",
      sendReply,
      (email = inquiry.email),
      "",
      (receiverEmail = inquiry.email),
      "",
      "",
      "",
      "../views/sendReply.ejs",
      {
        messageContent: sendReply,
      }
    );
    await contactUsModel.findByIdAndUpdate(id, { reply: sendedReply,isActive:false });
    return res.status(200).json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getInquiriesWithoutReply = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const inquiriesWithoutReply = await contactUsModel
      .find({ reply: { $exists: false } })
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    if (!inquiriesWithoutReply || inquiriesWithoutReply.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No inquiries without replies found",
      });
    }

    const totalInquiries = await contactUsModel.countDocuments({
      reply: { $exists: false },
    });
    const totalPages = Math.ceil(totalInquiries / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    res.status(200).json({
      success: true,
      message: "Inquiries without replies retrieved successfully",
      inquiries: inquiriesWithoutReply,
      meta: {
        totalInquiries,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: inquiriesWithoutReply.length,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getSentReplyById = async (req, res) => {
  try {
    const { id } = req.params;

    const sentReply = await sendReplyModel
      .findById(id)
      .populate("inquiryId", "name email subject message");

    if (!sentReply) {
      return res.status(404).json({
        success: false,
        message: "Sent reply not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sent reply retrieved successfully",
      sentReply,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllSentReplies = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const sentReplies = await sendReplyModel
      .find()
      .populate("inquiryId", "name email subject message")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    if (!sentReplies || sentReplies.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No sent replies found",
      });
    }

    const totalReplies = await sendReplyModel.countDocuments();
    const totalPages = Math.ceil(totalReplies / pageSize);
    const remainingPages =
      totalPages - pageNumber > 0 ? totalPages - pageNumber : 0;

    res.status(200).json({
      success: true,
      message: "Sent replies retrieved successfully",
      sentReplies,
      meta: {
        totalReplies,
        currentPage: pageNumber,
        totalPages,
        remainingPages,
        pageSize: sentReplies.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createContactUs,
  getAllContactUs,
  deleteContactUs,
  getContactUsById,
  sendReply,
  getAllSentReplies,
  getSentReplyById,
  getInquiriesWithoutReply,
};
