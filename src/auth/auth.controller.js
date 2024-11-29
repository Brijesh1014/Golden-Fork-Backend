const User_Model = require("../user/user.model");
const Token_Model = require("../user/user.token.model");
const bcrypt = require("bcrypt");
const { generateTokens } = require("../utils/generate.token");
const jwt = require("jsonwebtoken");
const sendOtp = require("../services/sendOtp.service");
const sentEmail = require("../services/sentEmail.service")
const dotenv = require("dotenv");
dotenv.config();

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      username,
      password,
      country,
      state,
      city,
      zipCode,
      deliveryAddress,
      rewardPoints,
      role,
    } = req.body;

    if (!firstName || !lastName || !email ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    const existingUser = await User_Model.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User_Model({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      country,
      state,
      city,
      zipCode,
      role,
      phoneNumber,
      deliveryAddress,
      rewardPoints,
    });

    await newUser.save();

    if ( role === "Customer") {
      const otp = generateOTP();
      newUser.resetOtp = otp;
      newUser.otpExpiry = Date.now() + 10 * 60 * 1000;
      await newUser.save();
      await sendOtp(
        otp,
        "Golden-Fork",
        email,
        "Your OTP for Email Verification",
        "../views/emailVerification.ejs"
      );
    }

    res.status(201).json({
      success: true,
      data: newUser,
      message: "User registered successfully. Please verify your email.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User_Model.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.resetOtp !== otp || Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
          let name  = `${user?.firstName} ${user?.lastName}`

    user.isEmailVerified = true;
    user.otpExpiry = undefined;
    user.resetOtp = undefined;
    await user.save();
    if(user.isEmailVerified){
      await sentEmail(
        "https://golden-fork-backend.vercel.app/api/auth/login",
        "Golden-Fork",       
        name,          
        user.email,
        "Register successfully",
        "../views/registerSuccessfully.ejs"
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User_Model.findOne({ email: email ,isEmailVerified:true});

    if (!user) {
      return res
        .status(400)
        .json({ status: -1, message: "You have to register or please verify your email", success: false });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ success: false, message: "Password Does Not Match" });
    }

    const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } =
      await generateTokens(email, user?._id, user?.role);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
      accessToken,
      accessTokenExpiry,
      refreshToken,
      refreshTokenExpiry,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User_Model.findOne({ email: email ,isEmailVerified:true});

    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }

    const otp = generateOTP();

    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOtp(otp, "Golden-Fork", email,"OTP for Password Reset", "../views/sendOtp.ejs");

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to email successfully" });
  } catch (error) {
    console.error("Error in forgetPassword:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User_Model.findOne({ email: email ,isEmailVerified:true});
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.resetOtp !== otp || Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otpVerified = true;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User_Model.findOne({ email: email ,isEmailVerified:true});
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.otpVerified) {
      return res.status(400).json({
        message:
          "OTP not verified. Please verify the OTP before resetting password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.otpExpiry = undefined;
    user.otpVerified = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User_Model.findOne({ email: email ,isEmailVerified:true});
    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }

    const otp = generateOTP();

    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOtp(otp, "Golden-Fork", email,"OTP for Password Reset", "../views/resendOtp.ejs");
    return res
      .status(200)
      .json({ success: true, message: "OTP resend successfully" });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User_Model.findOne({_id:userId,isEmailVerified:true});
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};
const logout = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User_Model.findOne({ _id: userId, isEmailVerified:true });
    if (!user) {
      return res
        .status(400)
        .json({ status: -1, message: "You have to register", success: false });
    }

    await Token_Model.findOneAndUpdate(
      { userId: user._id },
      { accessToken: "", refreshToken: "" }
    );

    return res.status(200).json({
      success: true,
      message: "Logout successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required." });
    }
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      async (err, user) => {
        if (err) {
          return res
            .status(403)
            .json({ success: false, message: "Invalid refresh token." });
        }

        const userToken = await Token_Model.findOne({
          userId: user.id,
          refreshToken,
        });
        if (!userToken) {
          return res
            .status(403)
            .json({ success: false, message: "Refresh token not found." });
        }

        const newAccessToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user?.role,
          },
          process.env.ACCESS_TOKEN_PRIVATE_KEY,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );
        if (!newAccessToken) {
          return res.status(400).json({
            success: false,
            message: "Something went wrong",
          });
        }
        await Token_Model.findOneAndUpdate(
          { userId: user?.id },
          { accessToken: newAccessToken }
        );

        return res
          .status(200)
          .json({ success: true, accessToken: newAccessToken });
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const saveFcmToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    const updateUserToken = await User_Model.findOneAndUpdate(
      { _id: userId },
      { fcmToken: fcmToken },
      { new: true }
    );
    if (!updateUserToken) {
      return res.status(400).json({
        success: false,
        message: "Something went wrong",
      });
    }
    return res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  forgetPassword,
  verifyOtp,
  resetPassword,
  resendOtp,
  changePassword,
  logout,
  refreshToken,
  saveFcmToken,
};
