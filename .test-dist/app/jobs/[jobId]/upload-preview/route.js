"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
const domain_schema_1 = require("@/lib/workflow/domain-schema");
async function POST(request, context) {
    const { jobId } = await context.params;
    const body = await readJson(request);
    const previewFile = body.previewFile
        ? domain_schema_1.StoredFileSchema.parse(body.previewFile)
        : undefined;
    const result = (0, dummy_endpoints_1.uploadDummyPreview)(jobId, previewFile);
    if (!result) {
        return Response.json({ error: "Job not found." }, { status: 404 });
    }
    return Response.json(result);
}
async function readJson(request) {
    try {
        return (await request.json());
    }
    catch {
        return {};
    }
}
