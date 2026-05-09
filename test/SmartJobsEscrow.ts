import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { parseEther, stringToHex } from "viem";

describe("SmartJobsEscrow", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  async function deployFixture() {
    const [client, freelancer, outsider] = await viem.getWalletClients();
    const escrow = await viem.deployContract("SmartJobsEscrow");

    return { escrow, client, freelancer, outsider };
  }

  it("stores the accepted bid and releases the remainder back to the client", async function () {
    const { escrow, client, freelancer } = await deployFixture();
    const escrowId = stringToHex("contract_job_release", { size: 32 });
    const fundedAmount = parseEther("1");
    const bidAmount = parseEther("0.4");

    await escrow.write.createEscrow([escrowId, "job_release"], {
      value: fundedAmount,
    });
    await escrow.write.lockEscrow([escrowId, freelancer.account.address, bidAmount]);

    const escrowAsFreelancer = await viem.getContractAt(
      "SmartJobsEscrow",
      escrow.address,
      { client: { wallet: freelancer } },
    );
    await escrowAsFreelancer.write.requestRelease([escrowId]);

    const freelancerBalanceBefore = await publicClient.getBalance({
      address: freelancer.account.address,
    });

    await viem.assertions.emitWithArgs(
      escrow.write.release([escrowId]),
      escrow,
      "EscrowReleased",
      [escrowId, freelancer.account.address, bidAmount, fundedAmount - bidAmount],
    );

    const stored = await escrow.read.getEscrow([escrowId]);
    const freelancerBalanceAfter = await publicClient.getBalance({
      address: freelancer.account.address,
    });
    const contractBalance = await publicClient.getBalance({
      address: escrow.address,
    });

    assert.equal(stored.amount, fundedAmount);
    assert.equal(stored.bidAmount, bidAmount);
    assert.equal(stored.status, 4);
    assert.equal(stored.jobId, "job_release");
    assert.equal(freelancerBalanceAfter - freelancerBalanceBefore, bidAmount);
    assert.equal(contractBalance, 0n);
    assert.equal(stored.disputeReason, "");
    assert.equal(stored.createdAt <= stored.updatedAt, true);
    assert.equal(client.account.address.length > 0, true);
  });

  it("rejects bids above the funded escrow amount", async function () {
    const { escrow, freelancer } = await deployFixture();
    const escrowId = stringToHex("contract_job_invalid_bid", { size: 32 });

    await escrow.write.createEscrow([escrowId, "job_invalid_bid"], {
      value: parseEther("0.2"),
    });

    await assert.rejects(
      escrow.write.lockEscrow([
        escrowId,
        freelancer.account.address,
        parseEther("0.25"),
      ]),
    );
  });

  it("allows either participant to open a dispute once work is locked", async function () {
    const { escrow, freelancer, outsider } = await deployFixture();
    const escrowId = stringToHex("contract_job_dispute", { size: 32 });

    await escrow.write.createEscrow([escrowId, "job_dispute"], {
      value: parseEther("0.3"),
    });
    await escrow.write.lockEscrow([
      escrowId,
      freelancer.account.address,
      parseEther("0.25"),
    ]);

    const escrowAsOutsider = await viem.getContractAt(
      "SmartJobsEscrow",
      escrow.address,
      { client: { wallet: outsider } },
    );
    await assert.rejects(
      escrowAsOutsider.write.openDispute([escrowId, "Not my contract."]),
    );

    const escrowAsFreelancer = await viem.getContractAt(
      "SmartJobsEscrow",
      escrow.address,
      { client: { wallet: freelancer } },
    );
    await escrowAsFreelancer.write.openDispute([escrowId, "Scope changed mid-job."]);

    const stored = await escrow.read.getEscrow([escrowId]);

    assert.equal(stored.status, 6);
    assert.equal(stored.disputeReason, "Scope changed mid-job.");
  });
});
