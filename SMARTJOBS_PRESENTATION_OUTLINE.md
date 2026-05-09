# SmartJobs Presentation Outline

## Core rule

We should not treat this as one presentation.

We need three versions built on the same core demo:

- General presentation
- Swarm sponsor presentation
- Umia sponsor presentation

Each version should answer a different question:

- General: Why does SmartJobs matter as a product?
- Swarm: Why does SmartJobs become stronger because of verified, trustless content access on Swarm?
- Umia: Why is SmartJobs an agentic venture with venture-scale potential?

## Shared product thesis

SmartJobs is a crypto freelance escrow app with an AI review layer.

The shared story across all three decks is:

1. Buyer creates a job and funds escrow on-chain.
2. Freelancer accepts and binds their wallet.
3. Freelancer submits work and preview evidence.
4. AI reviews the delivery against the brief.
5. Buyer releases funds or refunds.

## Sponsor split

### 1. General presentation

Primary audience:

- judges
- demo-day viewers
- early users
- general partners or ecosystem people who are not bounty-specific

Main question to answer:

- Why is this useful and why is the workflow credible?

Main emphasis:

- buyer/freelancer trust problem
- escrow + AI review as the product insight
- end-to-end working flow
- real wallet-based release/refund logic

What to show:

- `/post-job`
- `/browse-jobs`
- `/submit-work?job=...`
- `/review?job=...`
- one Sepolia explorer payout example

What not to over-emphasize:

- internal implementation details
- sponsor-specific bounty framing

Suggested deck shape:

1. Problem
2. Solution
3. Product flow
4. Demo
5. Why this matters
6. What works today
7. What comes next

### 2. Swarm sponsor presentation

Primary audience:

- Swarm bounty judges
- Swarm mentors
- technical reviewers who care about trustless data access

Main question to answer:

- Why does this project become more trustless and more valuable with Swarm?

Important context:

- Marton is handling the Swarm track
- this version should present Swarm as a sponsor-specific expansion of the product, not the full product identity

Swarm bounty angle:

- Swarm bounty 1 is about a JavaScript/TypeScript library that fetches from any Swarm gateway and verifies the content client-side, without running a full node
- the bounty expects support for immutable data and mutable feeds, a familiar API, browser and Node.js compatibility, and strong docs/tests

What SmartJobs should claim in this version:

- freelance delivery should not depend on trusting a storage gateway
- preview files, source packages, or job evidence can be fetched and verified trustlessly
- AI review becomes stronger if its inputs are verifiable and not silently tampered with by a gateway
- buyer confidence improves when delivery evidence is both AI-reviewed and content-verified

Key framing sentence:

SmartJobs verifies not only who gets paid, but also what content was actually reviewed.

Recommended slide additions for Swarm:

1. Why escrow still has a trust gap at the data layer
2. Where Swarm fits into the SmartJobs architecture
3. Verified fetch as the trustless evidence layer
4. Why this matters for AI-reviewed freelance submissions

Architecture message:

- smart contract secures payment
- Swarm secures content integrity
- AI review interprets the verified evidence

What to avoid:

- do not imply the Swarm implementation is fully finished if Marton is still building it
- do not make Swarm sound like a generic storage add-on
- do not bury the actual bounty requirement under product language

Suggested deck shape:

1. SmartJobs core product in one slide
2. The remaining trust problem: gateway trust
3. Swarm verified fetch bounty alignment
4. How verified content improves the review pipeline
5. Technical architecture
6. Progress and ownership
7. Why this is strategically valuable for Swarm

### 3. Umia sponsor presentation

Primary audience:

- Umia bounty judges
- venture-minded reviewers
- people evaluating whether this can become a scalable agentic business

Main question to answer:

- Why is SmartJobs an agentic venture, not just a freelance tool with an AI feature?

Important context:

- the Umia part is already done with agents
- this deck should lean into the operational and venture layer much harder than the general deck

Umia bounty angle:

- Umia is looking for an Agentic Venture suitable to launch on Umia
- the project must incorporate agents in product execution or venture operations
- judging emphasizes long-term viability, venture scale, possible token/crowdfunding appeal, and standout use of agentic execution

What SmartJobs should claim in this version:

- agents are part of the execution model, not just an add-on
- AI agents support review, verification, workflow acceleration, and possibly dispute triage / operational scaling
- SmartJobs has a plausible path to becoming a formal venture with recurring usage
- the escrow marketplace plus agentic operations creates room for long-term monetization

Key framing sentence:

SmartJobs is not only an app that uses AI. It is a workflow-native agentic venture for digital labor coordination and payment release.

Recommended Umia slides:

1. Why freelance coordination is still operationally expensive
2. Where agents are already used in SmartJobs
3. How agents reduce review, ops, and trust friction
4. Why this can scale into a real venture
5. Revenue and network expansion logic
6. Why this belongs in an on-chain venture structure

What to emphasize:

- agentic execution in the venture itself
- ability to scale with fewer manual checks
- path to monetization
- path to organization / tokenization if relevant later

What to avoid:

- do not pitch a token too early or too aggressively
- do not present the project as fully autonomous
- do not reduce the Umia angle to “we used AI in one feature”

Suggested deck shape:

1. SmartJobs core product in one slide
2. Why this is agentic
3. Agent roles in the product and operations
4. Venture-scale potential
5. Monetization path
6. Why Umia is the right ecosystem fit

## Recommended presentation strategy

### Shared opening

All three decks can begin with the same one-slide setup:

SmartJobs helps buyers and freelancers transact with more trust by combining on-chain escrow with AI-assisted delivery review.

After that, the deck should branch immediately:

- General deck branches to user value
- Swarm deck branches to data verifiability
- Umia deck branches to agentic venture scalability

## Recommended slide bank

Instead of building three decks from scratch, prepare one slide bank with:

- 4 shared core slides
- 3 Swarm-only slides
- 3 Umia-only slides

### Shared core slides

1. Problem
2. Product flow
3. Live demo / screenshots
4. Current working status

### Swarm-only slides

1. Gateway trust problem
2. Verified fetch architecture
3. Why verified inputs matter for AI review

### Umia-only slides

1. Agentic execution model
2. Venture scalability and monetization
3. Why SmartJobs fits an on-chain venture path

## Suggested speaker posture by sponsor

### General

Tone:

- simple
- product-focused
- low jargon

### Swarm

Tone:

- technical
- trustless systems oriented
- explicit about integrity guarantees and architecture

### Umia

Tone:

- venture-focused
- strategic
- explicit about scale, agent leverage, and long-term business shape

## Talking points to reuse

### One-line general pitch

SmartJobs is freelance escrow with an AI review layer, so payment is locked before work starts and released only after delivery is reviewed.

### One-line Swarm pitch

SmartJobs plus Swarm turns AI-reviewed freelance delivery into a trustless evidence pipeline, where payment and the reviewed content can both be verified.

### One-line Umia pitch

SmartJobs is an agentic venture for digital labor coordination, where agents help scale review, operations, and trust-sensitive workflows around on-chain payments.

## Current project ownership notes

- Swarm track: being worked on by Marton
- Umia track: done with agents

These should appear in internal prep notes, not necessarily on the public slides.

## Concrete next deliverables

1. Build a 6-slide general deck
2. Build a 6-slide Swarm deck
3. Build a 6-slide Umia deck
4. Prepare one shared live demo path
5. Prepare sponsor-specific closing slides

## Sources to keep in mind

- Umia bounty focuses on agentic venture fit, long-term viability, token/crowdfunding palatability, and standout use of agentic execution
- Swarm bounty 1 focuses on verified fetch from any Swarm gateway, client-side verification, support for immutable and mutable content, familiar API, and browser/Node compatibility
