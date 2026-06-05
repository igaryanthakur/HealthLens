const canonicalMap = require("./canonicalMap.json");

function normalizeNameToken(rawName = "") {
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAliasIndex(mapData = canonicalMap) {
  const aliasIndex = new Map();

  for (const [canonicalName, entry] of Object.entries(mapData)) {
    aliasIndex.set(normalizeNameToken(canonicalName), {
      canonicalName,
      ...entry,
      matchedAlias: canonicalName,
    });

    for (const alias of entry.aliases || []) {
      aliasIndex.set(normalizeNameToken(alias), {
        canonicalName,
        ...entry,
        matchedAlias: alias,
      });
    }
  }

  return aliasIndex;
}

const aliasIndex = buildAliasIndex();

function resolveCanonical(rawName, options = {}) {
  const normalized = normalizeNameToken(rawName);
  const direct = aliasIndex.get(normalized);
  if (direct) {
    return {
      canonicalName: direct.canonicalName,
      canonicalId: direct.id,
      category: direct.category,
      priority: direct.priority,
      matchedAlias: direct.matchedAlias,
      normalizedInput: normalized,
    };
  }

  if (options.fuzzy !== false) {
    for (const [alias, value] of aliasIndex.entries()) {
      if (alias.includes(normalized) || normalized.includes(alias)) {
        return {
          canonicalName: value.canonicalName,
          canonicalId: value.id,
          category: value.category,
          priority: value.priority,
          matchedAlias: value.matchedAlias,
          normalizedInput: normalized,
        };
      }
    }
  }

  return {
    canonicalName: null,
    canonicalId: null,
    category: null,
    priority: null,
    matchedAlias: null,
    normalizedInput: normalized,
  };
}

module.exports = {
  canonicalMap,
  normalizeNameToken,
  buildAliasIndex,
  resolveCanonical,
};
