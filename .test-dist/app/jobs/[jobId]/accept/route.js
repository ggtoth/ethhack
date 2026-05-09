"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function POST(_request, context) {
    const { jobId } = await context.params;
    try {
        const result = (0, dummy_endpoints_1.completeDummyJob)(jobId);
        if (!result) {
            return Response.json({ error: "Job not found." }, { status: 404 });
        }
        return Response.json(result);
    }
    catch (error) {
        if (error instanceof dummy_endpoints_1.DummyWorkflowConflictError) {
            return Response.json({ error: error.message }, { status: 409 });
        }
        throw error;
    }
}
