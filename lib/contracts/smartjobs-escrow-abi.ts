export const smartJobsEscrowAbi = [
  {
    type: "function",
    name: "createEscrow",
    stateMutability: "payable",
    inputs: [
      { name: "escrowId", type: "bytes32" },
      { name: "jobId", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "lockEscrow",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId", type: "bytes32" },
      { name: "freelancer", type: "address" },
      { name: "bidAmount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "requestRelease",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "release",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "openDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrowId", type: "bytes32" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancel",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getEscrow",
    stateMutability: "view",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "client", type: "address" },
          { name: "freelancer", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "bidAmount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "jobId", type: "string" },
          { name: "disputeReason", type: "string" },
          { name: "createdAt", type: "uint64" },
          { name: "updatedAt", type: "uint64" },
        ],
      },
    ],
  },
] as const;
