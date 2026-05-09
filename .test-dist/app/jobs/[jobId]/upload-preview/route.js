"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function POST(_request, context) {
    const { jobId } = await context.params;
    const result = (0, dummy_endpoints_1.uploadDummyPreview)(jobId);
    if (!result) {
        return Response.json({ error: "Job not found." }, { status: 404 });
    }
    return Response.json(result);
}
