# Claude Email Studio

A Claude Code workspace for planning, writing, and reviewing email campaigns. It is built around three ideas:

1. **Brand voice is the source of truth.** Every email is checked against `brand/voice.md` before it ships.
2. **Reviews are headless and unbiased.** A separate Claude subprocess reads only the files and the rules — it has no memory of the session that wrote the emails.
3. **Structured output over plain text.** The reviewer returns JSON that matches a schema, so the script can count findings, filter by severity, and set a CI-friendly exit code.

---

## Prerequisites

- [Claude Code](https://claude.ai/code) installed and authenticated
- Node.js 18 or later (for the review script)

---

## Folder structure

```
brand/
  voice.md              — your brand voice guide (tone, words to avoid, sign-off style)

campaigns/
  <campaign-name>/
    plan.md             — brief, audience, content calendar, success metrics
    emails/
      01-*.md           — email drafts in order
    groups/             — personalised copies per audience segment (optional)
      <segment>/emails/

leads/
  leads.csv             — audience segments (practice data only — no real people)

notes/                  — research, angle comparisons, handoff notes

review/
  findings.schema.json  — JSON schema every review output must match
  findings.json         — written by the review script after each run

scripts/
  review.mjs            — headless brand review runner

.claude/
  rules/emails.md       — structural rules every email file must follow
```

---

## Adapting this to your brand

1. **Replace `brand/voice.md`** with your own voice guide. At minimum, include:
   - Three words that describe your tone
   - Words and phrases you avoid
   - Claims you must never make
   - How you sign off

2. **Update `.claude/rules/emails.md`** with your own structural rules — subject line length, required merge tags, CTA link format, footer copy.

3. **Replace the `campaigns/` content** with your own campaign folders. The MezbanPOS example shows a complete four-email launch sequence with per-segment personalisation.

4. **Update `CLAUDE.md`** to point to your brand guide and add any project-level rules.

---

## Writing emails

Every email file lives at `campaigns/<name>/emails/<nn>-<slug>.md` and must open with:

```
Subject: <50 characters or fewer>
Preview: <90 characters or fewer>
```

The body must include:
- A greeting with a `{{first_name}}` merge tag
- Exactly one CTA link
- A warm, direct sign-off (see your voice guide)
- A two-line footer with `{{company_address}}` and `{{unsubscribe_url}}` merge tags

Full rules are in `.claude/rules/emails.md`.

---

## Running the brand review

```bash
node scripts/review.mjs campaigns/<campaign-folder>
```

The script:
1. Launches a fresh Claude subprocess with only `Read`, `Glob`, and `Grep` available
2. Asks it to review every email against `brand/voice.md` and `.claude/rules/emails.md`
3. Returns a JSON object matching `review/findings.schema.json` — each finding has `file`, `line`, `severity` (`high`/`medium`/`low`), `problem`, and `fix`
4. Writes the result to `review/findings.json`
5. Exits with code `1` if any finding is `high`, `0` otherwise

**Why a separate subprocess?** The reviewer has no memory of the session that wrote the emails. That removes the "I helped write this so it's probably fine" bias and makes the review genuinely cold.

**Why JSON with a schema?** Plain text is for humans. Structured output lets the script count findings, filter by severity, and set a machine-readable exit code. The schema acts as a contract — if the model drifts and omits a field, the script fails loudly.

### Example output

```
campaigns/my-launch: 3 finding(s) — 1 high, 2 medium, 0 low. Saved to review/findings.json
```

```json
{
  "folder": "campaigns/my-launch",
  "findings": [
    {
      "file": "campaigns/my-launch/emails/01-announcement.md",
      "line": 4,
      "severity": "high",
      "problem": "Greeting is 'Hi there,' — missing the required {{first_name}} merge tag.",
      "fix": "Change to 'Hi {{first_name}},'"
    }
  ]
}
```

The script skips findings from the previous run that have already been fixed, so re-running after edits only reports what is still open.

---

## Personalising emails per segment

If your audience has distinct segments, use the `/personalize` skill in Claude Code. It reads `leads/leads.csv` and writes one copy of each email per segment into `campaigns/<name>/groups/<segment>/emails/`.

---

## Sending (Resend integration)

This studio connects to [Resend](https://resend.com) for practice sends. Sending is restricted by a guard hook:

- Safe to send: addresses ending in `@resend.dev`, or your own confirmed address
- Everything else is blocked before it leaves your machine

To set up your own guard, see `.claude/settings.json` and the `PreToolUse` hook for Resend tools.

---

## Test campaign

`campaigns/test-bad/emails/01-bad.md` is an intentionally broken email. Run the reviewer against it to see the script in action:

```bash
node scripts/review.mjs campaigns/test-bad
echo $?   # should be 1
```

It contains banned words, a missing merge tag, two links, a forbidden claim, and a formal sign-off — enough to exercise every rule at once.
