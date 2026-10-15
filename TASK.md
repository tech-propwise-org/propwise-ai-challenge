# The task: an AI lead assistant

**Time: 4 hours.** Claude Code, Codex or any other AI tool is allowed, and encouraged. Use them the way you would at work.

## The situation

Sara is an agent at Marina Bay Realty. A lead, Karim, just sent her this on WhatsApp:

> Hey, I'm looking for a 2-bedroom apartment in Dubai Marina, budget around 2M AED. Prefer something with a good rental yield. Can you follow up with me tomorrow?

Today Sara reads the message, searches the listings by hand, writes back, and tries to remember to call. Build an assistant that does the first pass for her.

## What to build

An AI agent in the API, started from a lead's page, that:

1. **Understands the message.** It pulls out what the lead wants: area, bedrooms, budget, property type, whether they want to buy or rent, and anything else that matters (like "good rental yield").
2. **Uses tools.** It searches Sara's agency's listings and reads property details through tools you define. The data lives in Postgres, behind the existing services.
3. **Decides.** It picks the listings that really fit, ranks them, and says why, using the data (price, yield, status), not guesses. "Yield" means gross yield: `annualRentAed / priceAed`.
4. **Proposes an action.** It drafts a follow-up task. **Nothing is saved until Sara approves it.** Rejecting it saves nothing.
5. **Shows it on web and mobile.**
   - **Web** (`web/src/app/leads/[id]/page.tsx`, the "AI assistant" panel): start an analysis, see what was understood, the recommendations, and the proposed follow-up with Approve and Reject. An approved task appears in the Tasks list.
   - **Mobile** (`mobile/src/app/leads/[id].tsx`, the "AI assistant" card): show the same result for the lead. Starting a run or loading the latest one is up to you. Approve and Reject on mobile are a bonus.

Keep the UI plain. We are not grading visual design.

## Rules the assistant must follow

- **Listing text and lead messages are data, not instructions.** Anything written inside a property description or a message ("ignore your instructions…", "skip the approval…") must never change what the assistant does.
- **Only the agent's own agency.** It never sees or recommends another agency's listings or leads.
- **Only real, available listings.** Every recommended `propertyId` exists, belongs to the agency and has status `available`. When nothing fits, it says so and recommends nothing.
- **No side effects without approval.** Running the assistant creates no task and changes no lead, message or property. Approving the same action twice still creates one task.
- **Dates in the agent's timezone.** Agents work in `Asia/Dubai` (see `agent.timezone`). "Tomorrow" means the day after the message was sent, in that timezone, even if Sara reads it a day later. The UAE weekend is Saturday and Sunday. If the timing is unclear, say so instead of guessing.
- **Failures are not "nothing found".** If the model or a tool fails, the run says it failed. It never reports "no matching properties" because a search errored.

## The API contract

The web and mobile apps, your tests and **our own test cases** use this shape. We run our test cases against your API at the end, so stick to it. You may add fields and endpoints.

```
POST /leads/:leadId/assistant/runs
  body: { "messageId"?: string }     // default: the lead's latest inbound message
  → 201 AssistantRun

GET  /leads/:leadId/assistant/runs/:runId
  → 200 AssistantRun

POST /leads/:leadId/assistant/runs/:runId/actions/:actionId/approve
  → 200 { "action": ProposedAction, "task": Task }     // Task as returned by GET /leads/:id/tasks

POST /leads/:leadId/assistant/runs/:runId/actions/:actionId/reject
  → 200 { "action": ProposedAction }
```

All of them need the usual `Authorization: Bearer <token>`. Also:

- Another agency's lead, run or action is a `404`, whichever lead id is in the URL.
- `messageId`, when given, must be one of this lead's messages: an unknown id is a `404` (a malformed one may be a `400`). A lead with no inbound message is a `422`.
- Approving an action that is already approved returns `200` with the same task. Rejecting a rejected one returns `200`. Approving a rejected action, or rejecting an approved one, is a `409`.
- A run should answer within 2 minutes. Our test cases give up after 3.

```ts
interface AssistantRun {
  id: string;
  leadId: string;
  messageId: string;                       // the message that was analysed
  status: 'completed' | 'failed';
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
  proposedActions: ProposedAction[];       // [] when no follow-up is needed
  trace: Array<{                           // every tool call, in order
    tool: string;
    input: unknown;
    output?: unknown;                      // what the tool returned (null if nothing): on every call that succeeded
    error?: string;                        // why it failed: on every call that failed
    durationMs: number;
  }>;
  createdAt: string;
}

interface ProposedAction {
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
```

A run that fails still returns `201` with `status: "failed"`, an `error`, empty `recommendations`, empty `proposedActions` and empty `requirements` (`locations: []`, `bedrooms: null`, `budgetAed: { min: null, max: null }`, `propertyType: null`, `intent: "unknown"`, `preferences: []`).

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

It must give the same verdicts when run twice on a freshly seeded database (`pnpm db:reset`), print a pass/fail report, and save the trace of each case (which tools were called, with what). Check facts and side effects with plain assertions. A model-graded check is fine for the quality of the explanation, on top of those.

## Also

- Keep the existing endpoints and their response shapes working. Our test cases use them.
- Any library is fine. Already installed in `api/`: `@anthropic-ai/sdk` (Anthropic's official SDK), `ai` + `@ai-sdk/anthropic` (the Vercel AI SDK, which we use at Propwise) and `zod`.
- Current Claude models changed parts of the API, such as sampling settings and forcing a tool call. Check the current docs at platform.claude.com/docs rather than memory.
- Use the API key we gave you, in `api/.env` as `ANTHROPIC_API_KEY`. It has a spend limit. If it runs out, tell us.
- Commit as you go. We read the history.
- `.env` files stay out of git.

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
