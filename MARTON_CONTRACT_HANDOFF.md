# Marton Contract Handoff

## Branch to use

- Branch: `feature/all-fixes-cleanup-presentation`
- This branch contains:
  - the escrow contract fix
  - the UI/workflow cleanup
  - the current presentation outline

## Current Sepolia contract

- Contract: `SmartJobsEscrow`
- Network: Sepolia
- Active address: `0x81dfFC433dcE76dB8915726a476d97E19Af96557`
- Ignition deployment id: `chain-11155111-v2`

This is the address the app currently uses through `.env`.

Do not use the older address `0x39382cA4Ba29F40b45349faf2248a307Cc96c73f` for new tests.

## Contract behavior that matters now

### Job funding

- Buyer creates/funds escrow with `createEscrow(bytes32 escrowId, string jobId)`
- Funds are held by the contract, not by the backend

### Job acceptance

- The important fix is in `lockEscrow(...)`
- The freelancer now calls `lockEscrow(...)` from their own wallet
- The contract enforces:
  - freelancer address must not be zero
  - freelancer address must not equal the client
  - freelancer address must equal `msg.sender`

This means buyer approval is not required for acceptance anymore.

### Release

- Freelancer can request review/payout with `requestRelease(...)`
- Buyer is still the only one allowed to call `release(...)`
- On release:
  - freelancer receives `bidAmount`
  - buyer receives the remainder, if any

### Refund

- Buyer can call `refund(...)`
- Refund is allowed from `Funded`, `Locked`, `ReleaseRequested`, or `Disputed`

## Correct wallet flow

### Buyer wallet

- Funds the escrow
- Approves final release or refund

### Freelancer wallet

- Accepts the funded job with `lockEscrow(...)`
- Requests payout review with `requestRelease(...)`

## Current product flow in the app

1. Buyer opens `/post-job`
2. Buyer creates the job and funds escrow on the same page
3. Freelancer opens `/browse-jobs`
4. Freelancer accepts with `Accept + lock`
5. Freelancer submits files and requests release
6. AI review runs
7. Buyer opens `/review?job=...`
8. Buyer releases funds or refunds

## Very important repo/app facts

### 1. Restart after env changes

If `.env` changes, restart the dev server or the frontend can keep using an old contract address.

### 2. The old deployment log was stale

`contracts/DEPLOYMENT_LOG.md` now points at the active `0x81df...` deployment.

### 3. The app still has an optimistic chain-confirmation gap

The UI records local state after getting a transaction hash.
It does not yet wait for a mined receipt before confirming locally.

That means:

- a tx hash alone is not enough proof of on-chain success
- if something looks off, verify the transaction on Sepolia Explorer

## Known-good on-chain example

This escrow was verified on-chain successfully:

- Buyer wallet: `0x99105fe3b795a11136770f52356d3FDDd324B5FC`
- Freelancer wallet: `0xc8577C729F195feDC95D512aD8542Da9652e20F0`
- Escrow contract: `0x81dfFC433dcE76dB8915726a476d97E19Af96557`
- Example release tx: `0xa4b524a048b58e3c9a2f72c8e776e60937d04a50f0b8f163a0ea1bedad570d92`

That payout path was confirmed as:

- buyer funded escrow
- freelancer locked escrow
- freelancer requested release
- buyer released
- contract emitted `EscrowReleased`

## Useful commands

Compile contracts:

```powershell
npm.cmd run contracts:compile
```

Run contract tests:

```powershell
npm.cmd run contracts:test
```

Run app tests:

```powershell
npm.cmd run test
```

Deploy a new Sepolia version:

```powershell
npx.cmd hardhat ignition deploy ignition/modules/SmartJobsEscrow.ts --network sepolia --deployment-id chain-11155111-v3
```

## What Marton should verify first if something breaks

1. Is the app still pointing to `0x81dfFC433dcE76dB8915726a476d97E19Af96557`?
2. Was the dev server restarted after env changes?
3. Is the correct wallet connected for the current action?
4. Is the escrow status on-chain what the UI thinks it is?
5. Did the transaction actually succeed on Sepolia, or did the app only record the tx hash?
