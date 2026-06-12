const groqService = require("./groqService");
const { extractPrescriptionFromImage } = require("./geminiVisionService");
const aiHelpers = require("../utils/aiHelpers");

module.exports = {
  ...groqService,
  extractPrescriptionFromImage,
  ...aiHelpers,
};
