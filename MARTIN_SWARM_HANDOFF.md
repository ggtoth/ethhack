# Martin Swarm Handoff

## Branch

- Target branch: `feature/swarm-bounty-1-verified-fetch`
- Base: latest `origin/master`

## What is working now

- Immutable Swarm verification package exists in `packages/swarm-verified-fetch`
- Backend upload route exists at `app/api/swarm/upload/route.ts`
- Backend Swarm-backed AI review route exists at `app/api/review/swarm/route.ts`
- Active `/submit-work` flow now uploads files to Swarm first and submits immutable references
- Debug ledger now shows stored Swarm references and verification metadata
- Live smoke test against `https://bzz.limo` succeeded for:
  - upload
  - immutable reference match
  - review from Swarm
  - ledger update

## Current user-facing flow

1. Freelancer selects project files and preview files on `/submit-work`
2. Frontend computes Swarm-style references locally
3. Frontend uploads files to `/api/swarm/upload`
4. Backend uploads with `bee-js`
5. Backend compares local reference vs gateway reference
6. Frontend submits Swarm-backed file records into `/jobs/[jobId]/submit`
7. Frontend calls `/api/review/swarm`
8. Backend downloads verified bytes from Swarm and sends them into the AI review pipeline

## Important files

- `components/developer-submit-workspace.tsx`
  Active Swarm-backed submit flow
- `lib/swarm/server.ts`
  `bee-js` upload + Swarm download/verification bridge
- `app/api/swarm/upload/route.ts`
  Multipart upload entrypoint
- `app/api/review/swarm/route.ts`
  Swarm-backed AI review route
- `app/debug/ledger/page.tsx`
  Swarm reference inspection surface
- `packages/swarm-verified-fetch/src/verify.ts`
  Immutable verification path
- `packages/swarm-verified-fetch/src/feed.ts`
  Feed stub, still incomplete

## What is still missing for Bounty 1

- Feed verification is still a stub
- Manifest/path verification still throws unsupported
- Feed/manifests are not yet the main app workflow; they belong in package + demo next

## Next implementation order

1. Implement manifest/path verification in `swarm-verified-fetch`
2. Implement feed verification with:
   - exact-index verification internally
   - latest-resolution UX externally
3. Extend the Swarm demo page to show:
   - immutable success
   - manifest/path success
   - feed success
   - failure case
4. Extend the review route/demo inputs so feed-backed and manifest-backed resources can be reviewed

## Testing

- Local package/app tests:
  - `npm.cmd run test`
  - `npm.cmd run test:swarm`
- Live gateway quickstart env:

```env
SWARM_BEE_API_URL=https://bzz.limo
SWARM_POSTAGE_BATCH_ID=NULL_STAMP
SWARM_GATEWAY_URL=https://bzz.limo
NEXT_PUBLIC_SWARM_GATEWAY_URL=https://bzz.limo
SWARM_UPLOAD_PIN=true
SWARM_UPLOAD_DEFERRED=false
SWARM_ACT=false
```

## Notes

- Keep the main submit path immutable-first for now
- Feeds should be package + demo first, not forced into freelancer submission yet
- The debug ledger is the easiest place to inspect the exact stored Swarm references
