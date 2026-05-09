"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function GET(_request, context) {
    const { jobId } = await context.params;
    const job = (0, dummy_endpoints_1.getDummyJob)(jobId);
    if (!job) {
        return Response.json({ error: "Job not found." }, { status: 404 });
    }
    return Response.json(job);
}
