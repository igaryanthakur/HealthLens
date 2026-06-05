function buildCleanedTextClinical(patientInfo, measurements) {
  const metadataLines = [];
  if (patientInfo.patientName) {
    metadataLines.push(`Patient Name: ${patientInfo.patientName}`);
  }
  if (patientInfo.age || patientInfo.gender) {
    metadataLines.push(`Age/Gender: ${patientInfo.age || "Unknown"} / ${patientInfo.gender || "Unknown"}`);
  }
  if (patientInfo.reportDate) {
    metadataLines.push(`Report Date: ${patientInfo.reportDate}`);
  }
  if (patientInfo.labName) {
    metadataLines.push(`Lab Name: ${patientInfo.labName}`);
  }

  const measurementLines = measurements.map((item) => {
    const unitPart = item.unit ? ` ${item.unit}` : "";
    const rangePart = item.reference_range ? ` | Ref: ${item.reference_range}` : "";
    const statusPart = item.status ? ` | Status: ${item.status}` : "";
    return `${item.name}: ${item.normalizedValue}${unitPart}${rangePart}${statusPart}`;
  });

  return [...metadataLines, ...measurementLines].join("\n").trim();
}

module.exports = {
  buildCleanedTextClinical,
};
