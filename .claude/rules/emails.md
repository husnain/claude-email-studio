---
paths:
  - "campaigns/**/emails/*.md"
---

Every email file in this folder must follow these rules.

**Header lines (first two lines of the file)**

The file must open with exactly these two lines, in this order:

```
Subject: <text of 50 characters or fewer>
Preview: <text of 90 characters or fewer>
```

Both lines are required. Exceeding either character limit is not allowed.

**Greeting**

The body of the email must open with a greeting that uses the merge tag `{{first_name}}`, for example:

```
Hi {{first_name}},
```

**Main link**

Each email must contain exactly one main call-to-action link. Write it as a Markdown link with descriptive button text pointing to `https://kettlebird.example/steep-club`:

```
[Button text](https://kettlebird.example/steep-club)
```

Do not include additional links. Do not change the URL.

**Sign-off and footer**

Every email must end with the warm, direct sign-off from the brand voice guide — for example "Let me know if anything needs unpacking.", "Happy to dig into this with you.", or "Talk soon." Do not use formal closings like "Best regards" or "Yours sincerely."

Immediately after the sign-off, add this two-line footer as plain text (not inside a code block, not formatted as Markdown):

```
You're getting this because you joined the Kettlebird Tea waitlist.
Kettlebird Tea, {{company_address}} · Unsubscribe: {{unsubscribe_url}}
```

Both footer lines must appear exactly as shown, using the merge tags `{{company_address}}` and `{{unsubscribe_url}}`.
