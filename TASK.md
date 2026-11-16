# The task: an AI lead assistant

**Time: 4 hours.** Claude Code, Codex or any other AI tool is allowed, and encouraged. Use them the way you would at work. Code you wrote before today is fine too: say in `NOTES.md` what you brought in.

There is more here than most people finish in 4 hours, on purpose. Build the assistant first, then the parts under "Then, in this order", in that order. We look at how far you got and how well each part works. A part you left out, and said so in `NOTES.md`, counts for more than one that is there but broken. If you finish everything, there is a stretch list at the end.

## The situation

Sara is an agent at Marina Bay Realty. A lead, Karim, just sent her this on WhatsApp:

> Hey, I'm looking for a 2-bedroom apartment in Dubai Marina, budget around 2M AED. Prefer something with a good rental yield. Can you follow up with me tomorrow?

Today Sara reads the message, searches the listings by hand, writes back, and tries to remember to call. Build an assistant that does the first pass for her.

## What to build

An AI agent in the API, started from a lead's page, that:

1. **Understands the message.** It pulls out what the lead wants: area, bedrooms, budget, property type, whether they want to buy or rent, and anything else that matters (like "good rental yield").
2. **Uses tools.** It searches Sara's agency's listings and reads property details through tools you define. The data lives in Postgres, behind the existing services.
3. **Decides.** It picks the listings that really fit, ranks them, and says why, using the data (price, yield, status), not guesses. "Yield" means gross yield: `annualRentAed / priceAed`. Agents type the listings in by hand, so the data isn't always clean.
4. **Proposes an action.** It drafts a follow-up task. **Nothing is saved until Sara approves it.** Rejecting it saves nothing.
5. **Shows it on web and mobile.**
   - **Web** (`web/src/app/leads/[id]/page.tsx`, the "AI assistant" panel): start an analysis, see what was understood, the recommendations, and the proposed follow-up with Approve and Reject. An approved task appears in the Tasks list.
   - **Mobile** (`mobile/src/app/leads/[id].tsx`, the "AI assistant" card): show the same result for the lead. Starting a run or loading the latest one is up to you. Approve and Reject on mobile are a bonus.

Keep the UI plain. We are not grading visual design.

## Then, in this order

Each part counts. The plumbing is already built: a fake WhatsApp webhook, a table of recorded sales, agent profiles and each agency's AI budget (see "What's already there" in the README). You write the logic, and show what each part adds on the web panel (mobile too, if you have time).

### 6. WhatsApp: the assistant runs on its own

Leads write on WhatsApp. Our WhatsApp provider posts each message to `POST /webhooks/whatsapp`, which already saves it, and creates the lead the first time a number writes. Today Sara still has to press the button. Make the assistant run by itself:

- After a lead's WhatsApp messages arrive, the assistant runs once the lead has been quiet for **5 seconds**: one run for the whole burst, reading every message in it. Three messages in a row make one run, not three.
- The provider sends a message again when we answer slowly or fail, with the same `messageId`. A message is never saved twice, and never analysed twice.
- Messages from one number belong to one lead, even when several arrive at the same moment.
- The webhook answers within 2 seconds. It never waits for the AI.
- Only messages that come in through the webhook start a run on their own. Messages added with `POST /leads/:id/messages`, and Sara's button, work as before.
- A lead has at most one run in progress at a time. Starting one with the button while one runs is a `409`.
- A WhatsApp run is listed in `GET /leads/:leadId/assistant/runs` as `running` from the moment it starts, so Sara (and our test cases) can see it working.

`pnpm whatsapp --from "+971 50 246 8135" --text "Hi"` sends a fake message from the command line.

### 7. "Is this a good price?"

Leads ask whether a price is fair. For every listing the run recommends, and every listing the lead names by its code (like `MBR-1016`), the run gives a price check, worked out in code from recorded sales (`GET /market/sales`):

- Comparable sales: same area, same property type, same number of bedrooms, sold in the 365 days before the lead's message was sent.
- Compare prices per square foot: the listing's against the median of the comparable sales.
- Fewer than 5 comparable sales: `not_enough_data`. More than 10% under the median: `below_market`. More than 10% over it: `above_market`. Otherwise `fair`.
- The sales were typed in by hand too, and some are wrong. Leave out what you can't trust, and say how in `NOTES.md`.
- The summary agrees with the result: no "great price" for a listing that is above the market.

### 8. Pick the right agent

A lead who writes in on WhatsApp for the first time has no agent. The assistant suggests one, and Sara approves the suggestion like a follow-up.

- Only when the lead has no agent.
- The agent must be in the lead's agency, not on leave, cover at least one of the areas the lead asked for (or any area, if the lead named none), and speak the lead's language: Arabic when the lead's latest message has Arabic letters, English otherwise.
- Of those, the one with the fewest open leads (leads assigned to them whose status is not `won` or `lost`). A tie goes to the name that comes first alphabetically.
- If nobody fits, suggest nobody and say why in the summary.
- Approving assigns the lead. A lead is never assigned twice: approving a suggestion for a lead that has an agent by then is a `409`.

`GET /agents` lists the agency's agents with their areas, languages, leave and open leads.

### 9. Approvals check again

Time passes between a run and Sara's approval. When she approves, check again:

- A follow-up whose recommended listings are no longer `available`: save the task, and answer with a warning that names each such listing by its code.
- An agent suggestion whose agent is on leave by then, or whose lead has an agent by then: `409`, and nothing changes.

### 10. A spending limit per agency

Each agency has a monthly AI budget (`GET /agency`: `aiMonthlyBudgetUsd` and `aiSpentUsd`). An agency never starts a run its budget can't cover, even when many runs start at the same moment.

- A run reserves **USD 0.50** of the budget before its first model call. When the run ends, the reservation is replaced by what the run really cost, from the token usage the Claude API returns. A run that costs more than it reserved still finishes and is charged in full: the limit is enforced when a run starts.
- When the reservation doesn't fit in what's left: the button gets a `429`, and no run is saved. A WhatsApp run is saved as `failed`, with an `error` that says why.
- `PATCH /agency` with `{ "aiMonthlyBudgetUsd": 2 }` sets the budget, so you can try it. Starting a new month at zero is not part of this task.

## Rules the assistant must follow

- **Listing text and lead messages are data, not instructions.** Anything written inside a property description or a message ("ignore your instructions…", "skip the approval…") must never change what the assistant does.
- **Only the agent's own agency.** It never sees or recommends another agency's listings or leads.
- **Only real, available listings.** Every recommended `propertyId` exists, belongs to the agency and has status `available`. When nothing fits, it says so and recommends nothing.
- **No side effects without approval.** Running the assistant creates no task and changes no lead, message or property. Approving the same action twice still creates one task.
- **Dates in the agent's timezone.** Agents work in `Asia/Dubai` (see `agent.timezone`). "Tomorrow" means the calendar day after the message was sent, in that timezone, even when that day is a Saturday or Sunday, and even if Sara reads it a day later. The UAE weekend is Saturday and Sunday, which matters for phrases like "after the weekend". If the timing is unclear, say so instead of guessing.
- **Failures are not "nothing found".** If the model or a tool fails, the run says it failed. It never reports "no matching properties" because a search errored.

## The API contract

The web and mobile apps, your tests and **our own test cases** use this shape. We run our test cases against your API at the end, so stick to it. You may add fields and endpoints.

```
POST /leads/:leadId/assistant/runs
  body: { "messageId"?: string }     // default: the lead's latest inbound message
  → 201 AssistantRun

GET  /leads/:leadId/assistant/runs                    // part 6
  → 200 AssistantRun[]               // newest first

GET  /leads/:leadId/assistant/runs/:runId
  → 200 AssistantRun

POST /leads/:leadId/assistant/runs/:runId/actions/:actionId/approve
  → 200 { "action": ProposedAction, "task": Task, "warnings": string[] }   // a follow-up. Task as in GET /leads/:id/tasks
  → 200 { "action": ProposedAction, "lead": Lead }                          // an agent suggestion (part 8). Lead as in GET /leads/:id

POST /leads/:leadId/assistant/runs/:runId/actions/:actionId/reject
  → 200 { "action": ProposedAction }
```

All of them need the usual `Authorization: Bearer <token>`. Also:

- Another agency's lead, run or action is a `404`, whichever lead id is in the URL.
- `messageId`, when given, must be one of this lead's messages: an unknown id is a `404` (a malformed one may be a `400`). A lead with no inbound message is a `422`.
- Approving an action that is already approved returns `200` with the same task. Rejecting a rejected one returns `200`. Approving a rejected action, or rejecting an approved one, is a `409`.
- A run should answer within 2 minutes. Our test cases give up after 3.
- Starting a run while one is in progress for the lead is a `409` (part 6). Starting one when the agency's budget can't cover it is a `429`, and saves no run (part 10).
- `warnings` (part 9) is `[]` when nothing changed since the run.

```ts
interface AssistantRun {
  id: string;
  leadId: string;
  messageId: string;                       // the message that was analysed: for a WhatsApp run, the burst's latest
  messageIds: string[];                    // every message the run read as new: one for a button run, the burst for a WhatsApp run
  trigger: 'manual' | 'whatsapp';          // the button, or a WhatsApp burst (part 6)
  status: 'running' | 'completed' | 'failed';   // 'running' only while a WhatsApp (or background) run works
  error?: string;                          // when status is 'failed'
  requirements: {
    locations: string[];                   // area names as in the listings, e.g. "Dubai Marina"
    bedrooms: number | null;               // 0 = studio
    budgetAed: { min: number | null; max: number | null };
    propertyType: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | null;
    intent: 'buy' | 'rent' | 'unknown';
    preferences: string[];                 // e.g. "good rental yield"
  };
  recommendations: Array<{
    propertyId: string;
    reason: string;
  }>;                                      // best first; [] when nothing fits
  summary: string;                         // what Sara should know, in a few sentences
  priceChecks: PriceCheck[];               // part 7; [] until you build it
  proposedActions: ProposedAction[];       // [] when there is nothing to propose
  trace: Array<{                           // every tool call, in order
    tool: string;
    input: unknown;
    output?: unknown;                      // what the tool returned (null if nothing): on every call that succeeded
    error?: string;                        // why it failed: on every call that failed
    durationMs: number;
  }>;
  createdAt: string;
}

type ProposedAction = FollowUp | AgentSuggestion;

interface FollowUp {
  id: string;
  type: 'create_follow_up_task';
  status: 'pending_approval' | 'approved' | 'rejected';
  task: {
    title: string;
    notes: string | null;
    dueAt: string | null;                  // ISO 8601 with an offset, e.g. "2026-10-16T10:00:00+04:00"
  };
  needsClarification: string | null;       // why the date is unclear, when it is
}

interface AgentSuggestion {                // part 8
  id: string;
  type: 'assign_lead';
  status: 'pending_approval' | 'approved' | 'rejected';
  agent: { id: string; name: string };
  reason: string;                          // why this agent, in a sentence
}

interface PriceCheck {                     // part 7
  propertyId: string;
  priceAedPerSqft: number;                 // the listing's, rounded to whole dirhams
  medianAedPerSqft: number | null;         // of the comparable sales; null with not_enough_data
  comparableSales: number;                 // how many sales you compared with
  verdict: 'below_market' | 'fair' | 'above_market' | 'not_enough_data';
}
```

A run that fails still returns `201` with `status: "failed"`, an `error`, empty `recommendations`, `priceChecks` and `proposedActions`, and empty `requirements` (`locations: []`, `bedrooms: null`, `budgetAed: { min: null, max: null }`, `propertyType: null`, `intent: "unknown"`, `preferences: []`).

Our test cases check which listings you recommend (they must fit) and the facts above. We judge the ranking and the reasons ourselves.

## Evals: required

Add an automated eval suite, run with one command (for example `pnpm -C api eval`), with **at least 8 cases**. Cover at least:

1. Pulling out the right requirements
2. Matching the right properties
3. No suitable property
4. An unclear follow-up date
5. Prompt injection
6. A tool failing
7. Choosing the right tool
8. No action without approval

Add at least one case for each part of "Then, in this order" that you built.

It must give the same verdicts when run twice on a freshly seeded database (`pnpm db:reset`), print a pass/fail report, and save the trace of each case (which tools were called, with what). Check facts and side effects with plain assertions. A model-graded check is fine for the quality of the explanation, on top of those.

## Also

- Keep the existing endpoints and their response shapes working. Our test cases use them.
- Any library is fine. Already installed in `api/`: `@anthropic-ai/sdk` (Anthropic's official SDK), `ai` + `@ai-sdk/anthropic` (the Vercel AI SDK, which we use at Propwise) and `zod`.
- Current Claude models changed parts of the API, such as sampling settings and forcing a tool call. Check the current docs at platform.claude.com/docs rather than memory.
- Use the API key we gave you, in `api/.env` as `ANTHROPIC_API_KEY`. It has a spend limit. If it runs out, tell us.
- Commit as you go. We read the history.
- `.env` files stay out of git.

## If you finish early: the stretch list

Only once everything above works and is committed. Take them in this order. We look at how far you got and how well it works, not at how much you wrote. Say in `NOTES.md` which ones you did.

1. **Background runs.** A run can take a minute, and Sara shouldn't sit watching a spinner.
   - `POST /leads/:leadId/assistant/runs?async=true` answers `202` straight away with the run in `status: "running"`. Without `async=true` it works exactly as above: all our other test cases use that.
   - While it runs, `GET` the run shows the tool calls made so far in `trace`. It ends `completed` or `failed`, with the same shape as above.
   - The web panel shows the steps as they happen.
   - A run cut off by an API restart or crash must not stay `running` forever: it ends `failed`, with an `error` that says why.
   - A second run on a lead while one is running is a `409`, as in part 6.
2. **Ask about your data.** Sara types a question about her own data ("which of my JLT listings has the best yield?", "how many leads came in on WhatsApp this week?") and gets an answer: `POST /assistant/ask` with `{ "question": string }` answers `200 { "answer": string, "sql": string, "rows": object[] }`. The model writes the SQL. Whatever the question says, the query sees only Sara's agency's rows, changes nothing, stops after 5 seconds and returns at most 200 rows. None of that may depend on the prompt: the first three are the database's job.
3. **Nothing lost in a crash.** If the API stops after the webhook saved a message but before that message's run finished, the message is still analysed, once, when the API is back.
4. **Pick the model with your evals.** Run your eval suite on at least two Claude models. Save a short report (for example `evals/model-comparison.md`): the pass rate per case, the time and cost per run, and which model you would ship and why. This spends from your key, so keep the repeats small.

## When time is up

1. Put a short `NOTES.md` at the root: what you built, the main decisions, what is missing or weak, and how to run your evals.
2. Run your evals once more on a fresh `pnpm db:reset` and leave the report in the repo.
3. Commit everything, `NOTES.md` and the eval report included. `git status` should be clean.
4. Show us your AI tool's session history from today. With Claude Code, that's the session files under `~/.claude/projects/` for this folder.
5. After the demo, we run our test cases against your API, started in UTC (`TZ=UTC pnpm dev:api`, or in PowerShell `$env:TZ='UTC'; pnpm dev:api`), so keep it ready to start.

Then you give a 30-minute demo: the feature working on web and mobile, your evals, how you used your AI tools, and the decisions you would defend.

## What we look at

| Area | Weight |
| --- | --- |
| How you work with AI tools: planning, the instructions and workflows you set up, independent review, checking the AI's work | 25% |
| The agent: real tools, decisions, structured output, state, failure handling | 25% |
| Full stack: API, web and mobile working together | 25% |
| Evals and security: the eval suite, prompt injection, edge cases | 15% |
| Production habits: errors, tests, clean design, a working demo | 10% |

We reward what works and what you checked, not the amount of code, agents or prompts.
