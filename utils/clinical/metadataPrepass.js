function safeTrim(value) {
  return value ? value.replace(/\s+/g, " ").trim() : null;
}

function normalizeGender(value) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "m") {
    return "Male";
  }
  if (normalized === "f") {
    return "Female";
  }
  if (normalized === "male" || normalized === "female" || normalized === "other") {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
  return value.trim();
}

function extractMetadata(text = "") {
  const patientNameMatch = text.match(/Patient\s+Name\s*[:\-]\s*([^\n\r]{1,80})/i);
  const ageGenderMatch = text.match(
    /Age\/Gender\s*[:\-]\s*([\dA-Za-z\s\-]+)\s*\/\s*(Female|Male|Other|F|M)/i
  );
  const reportDateMatch = text.match(
    /(Report\s+Generated\s+On|Sample\s+Collection\s+Date)\s*[:\-]\s*([0-9]{1,2}\/[A-Za-z]{3}\/[0-9]{4}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|[0-9]{1,2}\s*[A-Za-z]{3}\s*[0-9]{4})/i
  );
  const labNameMatch = text.match(
    /(?:Laboratory|Lab(?:oratory)?|Facility)\s*[:\-]\s*([A-Z0-9][\w\s&,'\-.]{2,120})/i
  );

  return {
    patientName:
      safeTrim(patientNameMatch?.[1])?.replace(
        /\b(Age\/Gender|Order Id|Sample Type|Barcode|Report Status)\b.*$/i,
        ""
      ) || null,
    gender: normalizeGender(ageGenderMatch?.[2]) || null,
    age: safeTrim(ageGenderMatch?.[1]) || null,
    reportDate: safeTrim(reportDateMatch?.[2]) || null,
    labName: safeTrim(labNameMatch?.[1]) || null,
  };
}

module.exports = {
  extractMetadata,
};
