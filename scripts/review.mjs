#!/usr/bin/env node
import { execFileSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
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

const outPath = resolve(projectRoot, "review/findings.json");

// Load prior findings for the same folder so the reviewer doesn't repeat fixed problems
let priorBlock = "";
if (existsSync(outPath)) {
  try {
    const prior = JSON.parse(readFileSync(outPath, "utf8"));
    if (prior.folder === folder && Array.isArray(prior.findings) && prior.findings.length > 0) {
      priorBlock =
        "\n\nThese are findings from the last review:\n" +
        JSON.stringify(prior.findings, null, 2) +
        "\nReport only problems that are new or still not fixed. Don't repeat ones that have been fixed.";
    }
  } catch {
    // malformed or missing — ignore and do a fresh review
  }
}

const prompt =
  `Review every email in ${folder} against brand/voice.md and .claude/rules/emails.md. ` +
  `Report only real problems.` +
  priorBlock;

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

writeFileSync(outPath, JSON.stringify({ folder, ...structured }, null, 2));

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
