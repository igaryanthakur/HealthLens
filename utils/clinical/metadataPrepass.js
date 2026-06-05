function extractMetadata(cleanedTextFull = "") {
  const patientInfo = { reportDate: null };

  const dateMatch = cleanedTextFull.match(
    /(?:date|collected on|generated on|report generated on|sample collection date|reg\.?\s*date|customer since).*?(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{4}[/\-]\d{1,2}[/\-]\d{1,2}|\d{1,2}[/\-\s]+[a-zA-Z]{3}[/\-\s]+\d{4})/i,
  );
  if (dateMatch) {
    patientInfo.reportDate = dateMatch[1].trim();
    return patientInfo;
  }

  const leadingDate = cleanedTextFull.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/m);
  if (leadingDate) {
    patientInfo.reportDate = leadingDate[1];
  }

  return patientInfo;
}

module.exports = {
  extractMetadata,
};
