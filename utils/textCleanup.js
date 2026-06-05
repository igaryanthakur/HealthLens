const { removeBoilerplate } = require("./clinical/boilerplateRemoval");
const { filterClinicalCandidates } = require("./clinical/candidateFilter");

function cleanupTextFull(rawText = "") {
  return removeBoilerplate(rawText).text;
}

function cleanupTextClinical(cleanedTextFull = "") {
  const lines = cleanedTextFull
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const clinicalCandidates = filterClinicalCandidates(lines);
  return clinicalCandidates.lines.join("\n").trim();
}

function cleanupText(rawText = "") {
  return cleanupTextFull(rawText);
}

module.exports = {
  cleanupText,
  cleanupTextFull,
  cleanupTextClinical,
};
