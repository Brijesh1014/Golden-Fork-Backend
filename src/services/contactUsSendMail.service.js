const { sendMail, renderEjsTemplate } = require("../utils/email.utils");

const contactUsSendMail = async (
  name,
  messageSubject,
  messageTitle,
  message,
  email,
  contactNo,
  receiverEmail,
  content = "",
  page = "test-template",
  text = "",
  ejsPath
) => {
  const subject = "Contact Us";

  if (!ejsPath) {
    throw new Error("ejsPath is required");
  }

  const ejsProps = {
    receiver: "",
    content,
    page,
    name,
    email,
    contactNo,
    messageSubject,
    messageTitle,
    messageContent: message,
  };

  try {
    const htmlContent = renderEjsTemplate(ejsPath, ejsProps);

    await sendMail(name, email, receiverEmail, subject, text, htmlContent);
    console.log(`Contact Us email sent to ${receiverEmail}`);
  } catch (error) {
    console.error(`Error rendering or sending Contact Us email: ${error}`);
  }
};

module.exports = contactUsSendMail;
