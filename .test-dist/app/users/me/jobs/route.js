"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
async function GET() {
    return Response.json((0, dummy_endpoints_1.listCurrentUserDummyJobs)().map(dummy_endpoints_1.toJobListItem));
}
