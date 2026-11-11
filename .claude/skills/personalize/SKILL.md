---
name: personalize
description: Write a version of each MezbanPOS campaign email for every lead group in leads/leads.csv (pos-explorers, restaurant-owners, managers). Use when a campaign's emails are final and you want one copy per group.
argument-hint: "[campaign folder]"
context: fork
allowed-tools: Read, Glob, Grep, Write
---

You are running the **personalize** skill. Work through the steps below, then stop with a short summary. Do not explain what you are doing as you go.

## Step 1 — Check for a campaign folder

The argument passed to this skill is: `$ARGUMENTS`

If `$ARGUMENTS` is empty or blank:
- Use Glob to list all folders matching `campaigns/*/`
- Print them as a plain list
- Stop. Do not proceed further.

## Step 2 — Read the groups

Read `leads/leads.csv`. The `group` column contains the group names. Treat these three groups as fixed:

| Group | Who they are |
|---|---|
| `pos-explorers` | Evaluating POS options, not yet decided. Lead with what makes MezbanPOS easy to try — low commitment, no lock-in. |
| `restaurant-owners` | Own the business and control the buying decision. Lead with business impact — cost, control, and what it frees them up to do. |
| `managers` | Run day-to-day operations but don't own the buying decision. Lead with how MezbanPOS makes their shift easier and their team faster. |

## Step 3 — Find the source emails

Use Glob to find all files matching `$ARGUMENTS/emails/*.md`. Read every file you find.

## Step 4 — Write personalized versions

For each source email, write one version per group. Save each version to:

```
$ARGUMENTS/groups/<group>/emails/<original-filename>
```

The Write tool creates parent directories automatically.

**Keep these identical to the source:**
- `Subject:` line
- `Preview:` line
- `Hi {{first_name}},` greeting
- The main CTA link — both the text and the URL `https://mezbanpos.com/`
- The sign-off line
- Both footer lines:
  - `You're getting this because you joined the MezbanPOS waiting list.`
  - `MezbanPOS, {{company_address}} · Unsubscribe: {{unsubscribe_url}}`
- The `---` separator and everything below it (Production notes)

**Change only these two things:**
1. **Opening line** — the first sentence of the body after `Hi {{first_name}},`. Replace it with one sentence that speaks directly to why that group is on the list.
2. **One example** — if the body contains a specific example (a restaurant scenario, a workflow pain point, a feature use case), swap it for one that fits the group better. For `pos-explorers` lean toward comparison and evaluation scenarios; for `restaurant-owners` lean toward cost, control, and business outcomes; for `managers` lean toward shift speed, table turns, and staff ease. If there is no clear example to swap, leave the rest of the body unchanged.

Write in the brand voice: plain, direct, warm. No jargon. Short sentences.

## Step 5 — Reply with a short summary only

When every file is written, reply with exactly this:

1. Total files written, in the form: `N files written — X emails × 3 groups`
2. One example opening line per group, labelled with the group name

Nothing else. No file paths, no explanations, no next steps.
