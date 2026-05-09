import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SmartJobsEscrowModule", (m) => {
  const smartJobsEscrow = m.contract("SmartJobsEscrow");

  return { smartJobsEscrow };
});
