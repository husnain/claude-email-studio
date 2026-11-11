#!/usr/bin/env node
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin });
let raw = '';
rl.on('line', line => (raw += line + '\n'));
rl.on('close', () => {
  let call;
  try {
    call = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const { tool_name, tool_input } = call;
  const short = tool_name.replace(/^mcp__resend__/, '');

  // These tools fan out to whole contact lists — always block.
  const bulkTools = ['send-broadcast', 'create-automation', 'send-inbox-draft', 'send-new-inbox-email'];
  if (bulkTools.includes(short)) {
    console.error(`Blocked: ${tool_name} can reach whole contact lists and is not allowed in this studio.`);
    process.exit(2);
  }

  if (short === 'send-email' || short === 'send-batch-emails') {
    const myEmail = (process.env.MY_EMAIL || '').trim();
    const allowed = addr => addr.endsWith('@resend.dev') || (myEmail && addr === myEmail);

    // Collect every address across to/cc/bcc, handling both a single
    // email object (send-email) and a batch array (send-batch-emails).
    const emails = Array.isArray(tool_input) ? tool_input : [tool_input];
    const addresses = emails.flatMap(e =>
      ['to', 'cc', 'bcc'].flatMap(field => (e[field] ? [].concat(e[field]) : []))
    );

    for (const addr of addresses) {
      if (!allowed(addr)) {
        console.error(
          `Blocked: "${addr}" is not an allowed recipient. ` +
          `Only @resend.dev addresses and ${myEmail || 'MY_EMAIL'} are permitted.`
        );
        process.exit(2);
      }
    }
  }

  process.exit(0);
});
