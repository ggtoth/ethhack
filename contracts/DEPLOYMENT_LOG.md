# SmartJobs Contract Deployment Log

Last updated: 2026-05-09

## Current deployment

- Network: Sepolia
- Contract: `SmartJobsEscrow`
- Address: `0x39382cA4Ba29F40b45349faf2248a307Cc96c73f`
- Ignition deployment ID: `chain-11155111`
- Deployment tx hash: `0x8f0f16ce5b7f3387144409131c8cb0577ce87256da8c0154db923c07f11a6c37`
- Recorded deployer: `0x99105fe3b795a11136770f52356d3fddd324b5fc`

## Local proof of deployment

- `ignition/deployments/chain-11155111/deployed_addresses.json` maps `SmartJobsEscrowModule#SmartJobsEscrow` to `0x39382cA4Ba29F40b45349faf2248a307Cc96c73f`.
- `ignition/deployments/chain-11155111/journal.jsonl` records the deployment receipt with `status: SUCCESS`.

## Hardhat commands

Compile:

```powershell
npm.cmd run contracts:compile
```

Run contract tests:

```powershell
npm.cmd run contracts:test
```

Deploy to Sepolia:

```powershell
npm.cmd run contracts:deploy:sepolia
```

Deploy and verify in one step:

```powershell
npm.cmd run contracts:deploy:sepolia:verify
```

Verify the current deployed address:

```powershell
npm.cmd run contracts:verify:sepolia -- 0x39382cA4Ba29F40b45349faf2248a307Cc96c73f
```

Verify the full Ignition deployment:

```powershell
npm.cmd run contracts:verify:deployment:sepolia -- chain-11155111
```

## Required environment variables

Set these in `.env` or `.env.local`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_FUNDED_DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS=0x39382cA4Ba29F40b45349faf2248a307Cc96c73f
```

## Important notes

- On this Windows machine, use `npm.cmd` instead of `npm` in PowerShell to avoid the `npm.ps1` execution-policy issue.
- Hardhat in this repo now reads `.env` and `.env.local` directly from `hardhat.config.ts`.
- Etherscan verification stays disabled until `ETHERSCAN_API_KEY` is set.
- If Hardhat compile/test fails with `MultiProcessMutexTimeoutError`, another Hardhat process may still hold the compiler-download lock. Run Hardhat commands one at a time.

## Verification blockers seen during setup

- Hardhat 3 initially prompted for the Hardhat keystore password because `configVariable(...)` was checking the keystore before falling back elsewhere.
- That was fixed by switching the Sepolia network config to plain `process.env` values in `hardhat.config.ts`.
- Live explorer verification could not be completed from this environment because outbound access to external services is restricted here.
- A live Etherscan verification also requires `ETHERSCAN_API_KEY`, which was not configured at the time of testing.
