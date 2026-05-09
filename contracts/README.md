# SmartJobs escrow deployment

The app expects a deployed `SmartJobsEscrow` contract on Sepolia.

Reference notes for the current deployment and verification workflow live in
`contracts/DEPLOYMENT_LOG.md`.

## Escrow model

- The client calls `createEscrow` with ETH equal to the maximum job budget.
- The selected freelancer accepts the funded job with `lockEscrow`, which binds their wallet and accepted bid amount on-chain.
- The accepted bid must be greater than zero and less than or equal to the funded amount.
- On `release`, the freelancer receives the accepted bid and the client receives any unused remainder.
- The backend never owns a wallet and never sends transactions. The UI wallet sends transactions and the backend records confirmed hashes in the in-memory ledger.

## Deploy to Sepolia

Set these variables in your shell before deploying:

```powershell
$env:SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
$env:SEPOLIA_PRIVATE_KEY="0xYOUR_FUNDED_DEPLOYER_PRIVATE_KEY"
$env:ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"
```

Compile and deploy:

```powershell
npm.cmd run contracts:compile
npm.cmd run contracts:test
npm.cmd run contracts:deploy:sepolia
```

Copy the deployed contract address into `.env.local`:

```env
NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS=0xYourDeployedSmartJobsEscrowAddress
```

Restart `npm run dev` after changing `.env.local`.

## Verify on Sepolia

Hardhat 3 in this repo supports both verifying a single address and verifying an
entire Ignition deployment.

Verify the current deployed contract address:

```powershell
npm.cmd run contracts:verify:sepolia -- 0x39382cA4Ba29F40b45349faf2248a307Cc96c73f
```

Verify every contract in the current Ignition deployment:

```powershell
npm.cmd run contracts:verify:deployment:sepolia -- chain-11155111
```

Deploy and verify in one step for future deployments:

```powershell
npm.cmd run contracts:deploy:sepolia:verify
```
