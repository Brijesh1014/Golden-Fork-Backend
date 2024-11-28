const jwt = require("jsonwebtoken");
const UserToken = require("../user/user.token.model");

const generateTokens = async (
  email,
  userId,
 role
) => {
  try {
    if (!email || !userId) {
      throw new Error("Email and userId are required to generate tokens");
    }

    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;
    const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

    const payload = {
      email,
      id: userId,
      role
    };

    const [accessToken, refreshToken] = [
      jwt.sign(payload, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
        expiresIn: accessTokenExpiry,
      }),
      jwt.sign(payload, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
        expiresIn: refreshTokenExpiry,
      }),
    ];

    await UserToken.deleteMany({ userId });

    await UserToken.create({
      userId,
      refreshToken,
      accessToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    };
  } catch (error) {
    throw new Error(`Failed to generate tokens: ${error.message}`);
  }
};
module.exports = { generateTokens };
