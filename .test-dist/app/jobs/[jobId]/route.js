"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function GET(_request, context) {
    const { jobId } = await context.params;
    const record = (0, dummy_endpoints_1.getDummyJobWithContract)(jobId);
    if (!record) {
        return Response.json({ error: "Job not found." }, { status: 404 });
    }
    return Response.json(record);
}
