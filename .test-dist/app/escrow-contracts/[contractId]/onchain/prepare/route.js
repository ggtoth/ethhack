"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const viem_1 = require("viem");
const zod_1 = require("zod");
const onchain_escrow_actions_1 = require("@/lib/contracts/onchain-escrow-actions");
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
const domain_schema_1 = require("@/lib/workflow/domain-schema");
async function POST(request, context) {
    const { contractId } = await context.params;
    const contract = (0, dummy_endpoints_1.getDummyEscrowContract)(contractId);
    if (!contract) {
        return Response.json({ error: "Escrow contract not found." }, { status: 404 });
    }
    const body = await readJson(request);
    try {
        const input = domain_schema_1.PrepareOnChainEscrowActionInputSchema.parse(body);
        return Response.json((0, onchain_escrow_actions_1.buildOnChainEscrowAction)({ contract, input }));
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return Response.json({
                error: "Invalid on-chain escrow action.",
                details: error.flatten(),
            }, { status: 400 });
        }
        if (error instanceof onchain_escrow_actions_1.MissingEscrowAddressError) {
            return Response.json({ error: error.message }, { status: 503 });
        }
        if (error instanceof onchain_escrow_actions_1.MissingOnChainActionDetailError ||
            error instanceof viem_1.InvalidAddressError) {
            return Response.json({ error: error.message }, { status: 400 });
        }
        if (error instanceof onchain_escrow_actions_1.OnChainEscrowActionConflictError) {
            return Response.json({ error: error.message }, { status: 409 });
        }
        throw error;
    }
}
async function readJson(request) {
    try {
        return (await request.json());
    }
    catch {
        return {};
    }
}
