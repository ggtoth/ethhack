"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const zod_1 = require("zod");
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function POST(request) {
    const body = await readJson(request);
    try {
        return Response.json((0, dummy_endpoints_1.confirmDummyOnChainFunding)(body), { status: 201 });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            return Response.json({
                error: "Invalid on-chain escrow funding confirmation.",
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
