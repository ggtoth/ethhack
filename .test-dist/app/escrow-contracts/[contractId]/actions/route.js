"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const zod_1 = require("zod");
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function POST(request, context) {
    const { contractId } = await context.params;
    const body = await readJson(request);
    try {
        const result = (0, dummy_endpoints_1.applyDummyEscrowContractAction)(contractId, body);
        if (!result) {
            return Response.json({ error: "Escrow contract not found." }, { status: 404 });
        }
        return Response.json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return Response.json({
                error: "Invalid escrow contract action.",
                details: error.flatten(),
            }, { status: 400 });
        }
        if (error instanceof dummy_endpoints_1.DummyWorkflowConflictError) {
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
