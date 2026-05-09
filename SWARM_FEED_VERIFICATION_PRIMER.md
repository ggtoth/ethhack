# Swarm Feed Verification Primer

This note explains what "feed verification" would mean for the `swarm-verified-fetch` package.

It is written for a computer science graduate student who is comfortable with data structures, distributed systems, and APIs, but does not already know cryptography.

## The Big Picture

Swarm has two relevant storage modes:

- immutable content
- mutable-looking feeds

Immutable content is the easy case. You ask for bytes by content reference, recompute the reference from the bytes, and check that the two match.

Feeds are harder. A feed is Swarm's way of making immutable storage behave like a mutable pointer.

Instead of saying:

- "the content lives forever at reference `R`"

a feed says:

- "ask for the latest update published by owner `O` under topic `T`, and that update will tell you what the current content is"

So feed verification is not just "did I get some bytes?" It is closer to:

1. Did I get an update that was really published by the claimed owner?
2. Did I get the update for the topic I asked for?
3. Did I get the update for the index I intended?
4. If the update points to immutable content, does that referenced content also verify?

## Core Concepts

## 1. Hashes

You can think of a hash as a very strong fingerprint of data.

Properties that matter here:

- if the input changes, the fingerprint changes
- it is cheap to recompute
- it is infeasible to forge another input with the same fingerprint in normal use

Swarm uses hashes heavily to derive addresses from content.

For immutable content, this is what makes verification simple:

- download bytes
- recompute the expected fingerprint
- compare to the requested reference

## 2. Public and Private Keys

A private key is a secret signing key.

A public key, or derived owner address, is the public identity tied to that secret.

The mental model:

- the private key is the secret pen
- the public key is the known author identity
- a signature is the ink pattern proving that the secret pen was used

In Swarm feeds, the publisher signs updates. Readers verify those signatures using the public owner identity.

You do not need to know the private key to verify. You only need the claimed owner identity and the signed message.

## 3. Single Owner Chunks (SOCs)

Feeds are built on top of Single Owner Chunks.

A Single Owner Chunk is a chunk whose address is tied to:

- an owner
- an identifier

The Swarm docs describe the SOC address as derived from the identifier and owner. The payload is signed by the owner.

That gives two checks:

- address integrity: does this chunk live where an owner-plus-identifier chunk should live?
- authorship integrity: did the claimed owner actually sign this payload?

This is the low-level primitive that feeds use.

## 4. Topic

A topic is like a named channel inside one owner's namespace.

Examples:

- `"homepage"`
- `"release-notes"`
- `"latest-build"`

The important point is that a feed is not defined only by the owner. It is defined by:

- owner
- topic

So one owner can maintain multiple independent feeds.

## 5. Index

Feeds simulate change over time by writing updates at indices.

The simplest mental model is an append-only log:

- index 0
- index 1
- index 2
- ...

Each update is immutable once written, but later indices represent newer states.

That means a feed is not really mutable. It is a sequence of immutable records, and "latest" means "the highest valid update in the sequence that the reader resolves."

## 6. Payload Update vs Reference Update

A feed update can carry:

- a direct payload
- or a reference to immutable content

Payload update:

- the update itself contains the useful data
- good for small data

Reference update:

- the update contains a pointer to separate immutable Swarm content
- good for larger files, websites, or versioned artifacts

For SmartJobs, reference updates are the more natural use case, because a feed could point at the latest immutable proof package.

## What Feed Verification Would Actually Entail

Feed verification is more than calling `GET /feeds/{owner}/{topic}` and trusting the answer.

Conceptually, a verifier needs to do the following.

## Case A: Verifying a Specific Feed Update

This is the cleaner case.

Inputs:

- owner
- topic
- index

Verification pipeline:

1. Derive the feed-specific identifier for that topic and index.
2. Derive the expected SOC address from:
   - owner
   - identifier
3. Fetch the corresponding SOC or feed update from a gateway or Bee endpoint.
4. Verify the chunk structure is well-formed.
5. Verify the SOC address really matches the expected owner-plus-identifier derivation.
6. Verify the owner's signature over the chunk payload.
7. Decode the payload:
   - if it is direct payload data, return that
   - if it is a Swarm reference, optionally fetch that immutable content and verify it too

If all of those checks pass, you know:

- the update is authentic
- it belongs to the right owner
- it belongs to the intended feed slot
- and any referenced immutable content is also authentic

## Case B: Verifying "the Latest" Feed Update

This is the subtle case.

There are really two different claims:

1. "This update is valid."
2. "This update is the latest valid one."

Claim 1 is local cryptographic verification.

Claim 2 is a freshness or index-resolution problem.

Why this matters:

- a malicious or buggy gateway could return an older but still correctly signed update
- that update would pass signature verification
- but it would not actually be the latest state of the feed

So "latest" verification needs an answer to:

- how do we know there is not a newer valid index?

That is harder than authenticating one update.

In practice, a verifier usually needs one of these strategies:

- trust Bee or the gateway for latest-index resolution
- explicitly request a known index instead of "latest"
- walk the feed index frontier itself according to the feed scheme

For a first implementation, the most honest split is:

- exact-index verification: strongly verifiable
- latest-update verification: partly cryptographic, partly index-resolution logic

This distinction is important enough that the package API should expose it clearly.

## Why Feed Verification Is Harder Than Immutable Verification

Immutable verification asks:

- do these bytes hash to the requested reference?

Feed verification asks:

- did the right owner sign this update?
- does it belong to the right topic?
- does it belong to the right index?
- is the chunk address derivation correct?
- if it points elsewhere, does that target verify?
- and if the request was for "latest," is this actually the newest valid update?

So immutable verification is mostly a content-integrity problem.
Feed verification is a content-integrity problem plus an authenticated-pointer problem plus, sometimes, a freshness problem.

## What This Means for `swarm-verified-fetch`

If we implement feed verification in this package, the clean feature set would look like this:

- parse feed-shaped URLs and owner/topic inputs
- verify a feed update for an exact index
- verify direct payload updates
- verify reference updates
- recursively verify referenced immutable content
- return structured metadata:
  - owner
  - topic
  - resolved index
  - update type
  - signature verification result
  - referenced immutable verification result

And then separately:

- support a "latest" mode with clearly documented limits

The package should avoid claiming stronger guarantees than it actually provides.

## What a Good API Boundary Looks Like

A good package API should distinguish:

- immutable content verification
- exact feed update verification
- latest feed resolution

For example, conceptually:

```ts
verifySwarmResource("bzz://...")
resolveSwarmFeed({ owner, topic })              // latest-oriented
verifySwarmFeedUpdate({ owner, topic, index })  // exact-index oriented
```

That keeps the hard part visible instead of hiding everything behind one misleadingly simple call.

## SmartJobs-Specific Use Case

For SmartJobs, feeds are not the first natural fit.

The cleanest product use case today is immutable proof verification:

- freelancer submits immutable Swarm proof URL
- app verifies immutable reference
- app stores verification metadata
- client can trust that the proof bytes were not silently changed

Feeds become useful only if SmartJobs wants a moving pointer such as:

- latest portfolio snapshot
- latest build artifact
- latest project handoff bundle

That is valid, but it is a second-step feature, not the easiest first milestone.

## Practical Recommendation

If we continue this implementation, the right order is:

1. keep immutable verification as the production-quality path
2. add exact-index feed verification first
3. add latest-update resolution only after its guarantees are clearly defined
4. only then expose feeds in the main app flow

That sequence matches the technical difficulty curve and avoids making claims the verifier cannot justify.

## Sources

- Swarm feed overview: https://docs.ethswarm.org/docs/develop/tools-and-features/feeds/
- bee-js SOC and feeds guide: https://bee-js.ethswarm.org/docs/soc-and-feeds/
- Swarm Bee API: https://docs.ethswarm.org/api/
