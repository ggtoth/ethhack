"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
const zod_1 = require("zod");
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function GET(_request, context) {
    const { contractId } = await context.params;
    const contract = (0, dummy_endpoints_1.getDummyEscrowContract)(contractId);
    if (!contract) {
        return Response.json({ error: "Escrow contract not found." }, { status: 404 });
    }
    return Response.json(contract);
}
async function PATCH(request, context) {
    const { contractId } = await context.params;
    const body = await readJson(request);
    try {
        const contract = (0, dummy_endpoints_1.updateDummyEscrowContract)(contractId, body);
        if (!contract) {
            return Response.json({ error: "Escrow contract not found." }, { status: 404 });
        }
        return Response.json(contract);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return Response.json({
                error: "Invalid escrow contract payload.",
                details: error.flatten(),
            }, { status: 400 });
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
