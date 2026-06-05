function parseReferenceRange(text = "") {
  if (!text) {
    return {
      text: null,
      parsed: null,
    };
  }

  const normalized = text.replace(/\s+/g, " ").trim();

  const betweenMatch = normalized.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|to)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (betweenMatch) {
    return {
      text: betweenMatch[0],
      parsed: {
        type: "between",
        low: Number(betweenMatch[1]),
        high: Number(betweenMatch[2]),
      },
    };
  }

  const leMatch = normalized.match(/(?:<=|≤)\s*([0-9]+(?:\.[0-9]+)?)/);
  if (leMatch) {
    return {
      text: leMatch[0],
      parsed: {
        type: "lte",
        value: Number(leMatch[1]),
      },
    };
  }

  const geMatch = normalized.match(/(?:>=|≥)\s*([0-9]+(?:\.[0-9]+)?)/);
  if (geMatch) {
    return {
      text: geMatch[0],
      parsed: {
        type: "gte",
        value: Number(geMatch[1]),
      },
    };
  }

  const ltMatch = normalized.match(/<\s*([0-9]+(?:\.[0-9]+)?)/);
  if (ltMatch) {
    return {
      text: ltMatch[0],
      parsed: {
        type: "lt",
        value: Number(ltMatch[1]),
      },
    };
  }

  const gtMatch = normalized.match(/>\s*([0-9]+(?:\.[0-9]+)?)/);
  if (gtMatch) {
    return {
      text: gtMatch[0],
      parsed: {
        type: "gt",
        value: Number(gtMatch[1]),
      },
    };
  }

  return {
    text: null,
    parsed: null,
  };
}

module.exports = {
  parseReferenceRange,
};
