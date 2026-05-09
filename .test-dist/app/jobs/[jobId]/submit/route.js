"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
const domain_schema_1 = require("@/lib/workflow/domain-schema");
async function POST(request, context) {
    const { jobId } = await context.params;
    const body = await readJson(request);
    const result = (0, dummy_endpoints_1.submitDummyJob)(jobId, {
        previewFile: body.previewFile
            ? domain_schema_1.StoredFileSchema.parse(body.previewFile)
            : undefined,
        finalFile: body.finalFile ? domain_schema_1.StoredFileSchema.parse(body.finalFile) : undefined,
        submittedSourceFiles: Array.isArray(body.submittedSourceFiles)
            ? body.submittedSourceFiles.map((file) => domain_schema_1.StoredFileSchema.parse(file))
            : undefined,
        submissionNotes: typeof body.submissionNotes === "string"
            ? body.submissionNotes.trim() || null
            : undefined,
    });
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
