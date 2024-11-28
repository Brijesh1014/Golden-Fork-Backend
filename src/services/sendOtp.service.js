const { sendMail, renderEjsTemplate } = require("../utils/email.utils");

const sendOtp = async (otp, email, receiverEmail, ejsPath) => {
  const subject = "Your OTP for Password Reset";
  const ejsProps = {
    otp,
  };

  if (!ejsPath) {
    throw new Error("EJS path is required for OTP email.");
  }

  try {
    const htmlContent = renderEjsTemplate(ejsPath, ejsProps);
    await sendMail(
      "Golden-Fork",
      email,
      receiverEmail,
      subject,
      "",
      htmlContent
    );
    console.log(`OTP email sent to ${receiverEmail}`);
  } catch (error) {
    console.error(`Error sending OTP email: ${error}`);
  }
};

module.exports = sendOtp;
