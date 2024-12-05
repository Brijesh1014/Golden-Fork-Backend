const { sendMail, renderEjsTemplate } = require("../utils/email.utils");

const shareCredential = async (name,email,password, receiverEmail, subject, ejsPath) => {
  const ejsProps = {
    email,
    password,
    name
  };

  if (!ejsPath) {
    throw new Error("EJS path is required for OTP email.");
  }

  try {
    const htmlContent = renderEjsTemplate(ejsPath, ejsProps);
    await sendMail(
      "Golden-Fork",       
      "no-reply@goldenfork.com", 
      receiverEmail,         
      subject,
      "", 
      htmlContent
    );
    console.log(`Email sent to ${receiverEmail}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
  }
};


module.exports = shareCredential;
