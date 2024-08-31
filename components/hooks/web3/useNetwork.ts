import { CryptoHookFactory } from "@/types/hooks";
import useSWR from "swr";

type UseNetworkResponse = {
  isLoading: boolean;
  isSupported: boolean;
  targetNetwork: string;
  isConnectedToNetwork: boolean;
};

const NERWORKS: { [k: string]: string } = {
  1: "Ethereum Mainnet Network",
  59144: "Linea Mainnet Network",
  11155111: "Sepolia Test Network",
  59141: "Linea Sepolia Test Network",
  59140: "Linea Goerli Test Network",
  1337: "Ganache"
};

const targetId = process.env.NEXT_PUBLIC_NETWORK_CHAIN_ID as string;

const targetNetwork = NERWORKS[targetId];

type NetworkHookFactory = CryptoHookFactory<string, UseNetworkResponse>;

export type UseNetworkHook = ReturnType<NetworkHookFactory>;

export const hookFactory: NetworkHookFactory =
  ({ provider, isLoading }) =>
  () => {
    const { data, isValidating, ...swr } = useSWR(
      provider ? "web3/useNetwork" : null,
      async () => {
        const chainId = (await provider!.getNetwork()).chainId;
        if (!chainId) {
          throw "Cannot retreive network. Please, refresh browser or connect to other one.";
        }
        return NERWORKS[chainId];
      },
      {
        revalidateOnFocus: false,
        shouldRetryOnError: false
      }
    );
    const isSupported = data === targetNetwork;

    return {
      ...swr,
      data,
      targetNetwork,
      isSupported: isSupported,
      isConnectedToNetwork: !isLoading && isSupported,
      isValidating,
      isLoading: isLoading as boolean
    };
  };
