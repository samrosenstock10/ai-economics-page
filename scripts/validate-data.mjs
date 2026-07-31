import { readFile } from "node:fs/promises";

const fileUrl = new URL("../data/ledger.json", import.meta.url);
const data = JSON.parse(await readFile(fileUrl, "utf8"));

const requiredArrays = ["evidence", "perceptions", "outcomes", "runs"];
for (const key of requiredArrays) {
  if (!Array.isArray(data[key])) {
    throw new Error("Expected " + key + " to be an array.");
  }
}

const unique = (rows, field) => {
  const values = rows.map((row) => row[field]).filter(Boolean);
  if (new Set(values).size !== values.length) {
    throw new Error("Duplicate values found in " + field + ".");
  }
};

unique(data.evidence, "Evidence ID");
unique(data.perceptions, "Perception ID");
unique(data.outcomes, "Outcome ID");
unique(data.runs, "Run Date");

for (const row of data.evidence) {
  if (!row["Source URL"] || !row["Claim / Evidence Summary"]) {
    throw new Error("Evidence row " + row["Evidence ID"] + " is missing a source URL or summary.");
  }
  const strength = Number(row["Evidence Strength (1-5)"]);
  if (!Number.isInteger(strength) || strength < 1 || strength > 5) {
    throw new Error("Evidence row " + row["Evidence ID"] + " has an invalid strength score.");
  }
}

for (const row of data.perceptions) {
  const stance = Number(row["Stance Score (-2 to +2)"]);
  if (!Number.isInteger(stance) || stance < -2 || stance > 2) {
    throw new Error("Perception row " + row["Perception ID"] + " has an invalid stance score.");
  }
}

const counts = data.meta?.counts || {};
for (const key of requiredArrays) {
  if (counts[key] !== data[key].length) {
    throw new Error("Meta count for " + key + " does not match the dataset.");
  }
}

console.log(
  "Validated " +
    data.evidence.length +
    " evidence rows, " +
    data.perceptions.length +
    " perception rows, " +
    data.outcomes.length +
    " outcomes, and " +
    data.runs.length +
    " collection runs."
);

