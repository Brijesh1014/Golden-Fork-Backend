const jwt = require("jsonwebtoken");
const UserModel = require("../user/user.model");
const UserToken = require("../user/user.token.model");

const auth = (roles, isPublic) => async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized user", success: false });
    }
    let decoded;
    if (isPublic) {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_PUBLIC_KEY);
    } else {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY);
    }

    const user = await UserModel.findOne({ _id: decoded.id });
    const userToken = await UserToken.findOne({
      $and: [{ userId: decoded.id }, { accessToken: token }],
    });
    if (!user) {
      return res.status(401).json({
        message: "Authentication failed",
        success: false,
      });
    } else if (roles) {
      if (!roles.includes(user.role)) {
        return res.status(401).json({
          message: "Authentication failed",
          success: false,
        });
      }
    }
    if (!userToken) {
      return res.status(401).json({
        message: "Authentication failed",
        success: false,
      });
    }

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: err.message || "Unauthorized user", success: false });
  }
};

module.exports = auth;
