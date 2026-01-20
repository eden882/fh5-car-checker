// tools/make_cars_json.js
// Convert a saved fh5cars.html file into cars.json

const fs = require("fs");

const html = fs.readFileSync("fh5cars.html", "utf8");

// Grab table rows
const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const cars = [];
let match;

while ((match = rowRegex.exec(html))) {
  const rowHtml = match[1];
  const cells = [];

  let cm;
  while ((cm = cellRegex.exec(rowHtml))) {
    cells.push(stripTags(cm[1]));
  }

  // Skip if not enough columns
  if (cells.length < 6) continue;

  const first = cells[0];
  const id = cells[5];

  // Skip header row
  if (!id || id === "ID") continue;

  const parts = first.split(" ");
  const year = parseInt(parts[0], 10);
  if (!year) continue;

  const make = parts[1] || "";
  const model = parts.slice(2).join(" ").trim();

  cars.push({
    year,
    make,
    model,
    alias: [],
    sourceId: Number(id),
    carType: cells[1] || "",
    collect: cells[2] || "",
    added: cells[3] || "",
    nickname: cells[4] || ""
  });
}

// Write cars.json
fs.writeFileSync("cars.json", JSON.stringify(cars, null, 2), "utf8");
console.log(`✅ Wrote cars.json with ${cars.length} cars`);
