import { BrowserProvider, Contract, type ContractRunner } from "ethers";
import jobPortalExport from "@/lib/contracts/jobPortal.json";

export enum Role {
  None = 0,
  JobSeeker = 1,
  Employer = 2,
  Validator = 3,
}

export enum ApplicationStatus {
  None = 0,
  Applied = 1,
  Shortlisted = 2,
  Accepted = 3,
  Rejected = 4,
}

type JobPortalExport = {
  chainId: number;
  address: string;
  abi: any[];
};

export function getJobPortalExport(): JobPortalExport {
  return jobPortalExport as JobPortalExport;
}

export function getBrowserProvider(): BrowserProvider {
  if (typeof window === "undefined") {
    throw new Error("BrowserProvider can only be used in the browser");
  }

  if (!window.ethereum) {
    throw new Error("MetaMask not detected (window.ethereum missing)");
  }

  return new BrowserProvider(window.ethereum);
}

export async function requestAccounts(): Promise<string[]> {
  const provider = getBrowserProvider();
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];
  return accounts;
}

export function getJobPortalContract(runner: ContractRunner): Contract {
  const { address, abi } = getJobPortalExport();
  if (!address) {
    throw new Error(
      "Contract address missing. Start the local chain and run `npm run contracts:deploy`."
    );
  }

  return new Contract(address, abi, runner);
}
