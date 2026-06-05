const test = require("node:test");
const assert = require("node:assert/strict");
const { extractMeasurements } = require("../utils/clinical/parameterRegexMap");

function candidate(line, index = 0) {
  return {
    line,
    index,
    sourceLines: [index],
    nextLine: "",
    lookaheadLines: [],
  };
}

const hemoglobinDef = {
  id: "cbc_hemoglobin",
  name: "hemoglobin",
  category: "CBC",
  priority: "critical",
  section: "CBC",
  aliases: ["hemoglobin", "haemoglobin", "hb"],
};

test("extracts value after ref-before-value Indian table layout", () => {
  const results = extractMeasurements(
    [candidate("HAEMOGLOBIN (Hb) g/dl 11 - 16 : L 10.0 10.0")],
    { definitions: [hemoglobinDef] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].value, 10);
  assert.equal(results[0].method, "generalized_stripper");
});

test("extracts value when result precedes reference range", () => {
  const results = extractMeasurements(
    [candidate("Haemoglobin (HB) : 8.6 g/dL 12-15")],
    { definitions: [hemoglobinDef] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].value, 8.6);
  assert.equal(results[0].rawUnit, "g/dL");
});

test("extracts value with upper-bound reference only", () => {
  const glucoseDef = {
    id: "diabetes_glucose",
    name: "glucose",
    category: "Diabetes",
    priority: "critical",
    section: "DIABETES",
    aliases: ["glucose", "random glucose"],
  };

  const results = extractMeasurements(
    [candidate("Glucose Random mg/dl < 140 : 110")],
    { definitions: [glucoseDef] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].value, 110);
});

test("skips hemoglobin on hba1c lines", () => {
  const results = extractMeasurements(
    [candidate("HbA1c Glycosylated Hemoglobin 6.8 % 4.2-5.7")],
    { definitions: [hemoglobinDef] },
  );

  assert.equal(results.length, 0);
});

const vitaminB12Def = {
  id: "vitamin_b12",
  name: "vitamin b12",
  category: "Vitamins",
  priority: "high",
  section: "VITAMINS",
  aliases: ["vitamin b12", "b12", "vit b12"],
};

const vitaminDDef = {
  id: "vitamin_d",
  name: "vitamin d",
  category: "Vitamins",
  priority: "critical",
  section: "VITAMINS",
  aliases: ["vitamin d", "25-oh vitamin d", "25 oh vitamin d", "25-oh", "25 oh"],
};

test("extracts vitamin b12 result without grabbing digit from label", () => {
  const results = extractMeasurements(
    [candidate("Vitamin B12 pg/ml 200 - 900 : 515")],
    { definitions: [vitaminB12Def] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].value, 515);
});

test("extracts vitamin d result without grabbing 25 from 25-OH label", () => {
  const results = extractMeasurements(
    [candidate("25-OH Vitamin D ng/ml 30 - 100 : 11.29")],
    { definitions: [vitaminDDef] },
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].value, 11.29);
});
