import { listDummyEscrowContracts } from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(listDummyEscrowContracts());
}
