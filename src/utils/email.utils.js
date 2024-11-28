const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SENDER_EMAIL,
    pass: process.env.EMAIL_SENDER_PASSWORD,
  },
});

const sendMail = async (name, email, receiverEmail, subject, text, html) => {
  try {
    const response = await nodeMailerFunc(email, receiverEmail, subject, text, html);
    console.log(`Mail sent to ${receiverEmail}`);
    return response
  } catch (err) {
    console.log(`Mail error: ${err}`);
  }
};
async function nodeMailerFunc(from, to, subject, text, html) {
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  let response = await transporter.sendMail(mailOptions);
  return response;
}

const renderEjsTemplate = (ejsPath, ejsProps) => {
  const absoluteEjsPath = path.join(__dirname, ejsPath);
  const ejsContent = fs.readFileSync(absoluteEjsPath, "utf8");
  return ejs.render(ejsContent, ejsProps);
};

module.exports = {
  sendMail,
  nodeMailerFunc,
  renderEjsTemplate,
};
