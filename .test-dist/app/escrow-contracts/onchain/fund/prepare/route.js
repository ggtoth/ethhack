"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const viem_1 = require("viem");
const zod_1 = require("zod");
const onchain_escrow_actions_1 = require("@/lib/contracts/onchain-escrow-actions");
const domain_schema_1 = require("@/lib/workflow/domain-schema");
async function POST(request) {
    const body = await readJson(request);
    try {
        const input = domain_schema_1.PrepareOnChainEscrowFundingInputSchema.parse(body);
        return Response.json((0, onchain_escrow_actions_1.buildOnChainEscrowFunding)(input));
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return Response.json({
                error: "Invalid on-chain escrow funding request.",
                details: error.flatten(),
            }, { status: 400 });
        }
        if (error instanceof onchain_escrow_actions_1.MissingEscrowAddressError) {
            return Response.json({ error: error.message }, { status: 503 });
        }
        if (error instanceof viem_1.BaseError) {
            return Response.json({ error: error.shortMessage }, { status: 400 });
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
