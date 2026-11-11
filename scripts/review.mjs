#!/usr/bin/env node
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const folder = process.argv[2];
if (!folder) {
  console.error("Usage: node scripts/review.mjs <campaign-folder>");
  process.exit(2);
}

const schemaPath = resolve(projectRoot, "review/findings.schema.json");
const schema = readFileSync(schemaPath, "utf8");

const prompt =
  `Review every email in ${folder} against brand/voice.md and .claude/rules/emails.md. ` +
  `Report only real problems.`;

const args = [
  "-p", prompt,
  "--output-format", "json",
  "--json-schema", schema,
  "--allowedTools", "Read,Glob,Grep",
];

let raw;
try {
  raw = execFileSync("claude", args, { cwd: projectRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
} catch (err) {
  // claude may exit non-zero; still capture stdout
  raw = err.stdout || "";
  if (!raw) {
    console.error("claude failed with no output:", err.stderr);
    process.exit(2);
  }
}

// Output may be a single JSON object or a JSON array whose last item is the result
let parsed;
try {
  parsed = JSON.parse(raw.trim());
} catch {
  console.error("Could not parse claude output as JSON:\n", raw);
  process.exit(2);
}

// If it's an array, the last item with type "result" holds structured_output
let result;
if (Array.isArray(parsed)) {
  const last = parsed.findLast((item) => item.type === "result") ?? parsed[parsed.length - 1];
  result = last;
} else {
  result = parsed;
}

const structured = result?.structured_output ?? result;

const outPath = resolve(projectRoot, "review/findings.json");
writeFileSync(outPath, JSON.stringify(structured, null, 2));

const findings = structured?.findings ?? [];
const highs = findings.filter((f) => f.severity === "high");
const meds  = findings.filter((f) => f.severity === "medium");
const lows  = findings.filter((f) => f.severity === "low");

console.log(
  `${folder}: ${findings.length} finding(s) — ` +
  `${highs.length} high, ${meds.length} medium, ${lows.length} low. ` +
  `Saved to review/findings.json`
);

if (highs.length > 0) {
  process.exit(1);
}
