export type SwarmKvEntry = {
  key: string;
  reference: string;
  url: string;
  storedAt: string;
};

export type SwarmUploadResult = {
  reference: string;
  url: string;
};

export type SwarmVerifyResult = {
  reference: string;
  verified: boolean;
  fetchedFromNode: boolean;
  data: unknown;
  verifiedAt: string;
};
