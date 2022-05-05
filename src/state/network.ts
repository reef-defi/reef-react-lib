export type AvailableNetworks = 'mainnet' | 'testnet';

export interface Network {
  rpcUrl: string;
  reefscanUrl: string;
  routerAddress: string;
  factoryAddress: string;
  name: AvailableNetworks;
  graphqlUrl: string;
  genesisHash: string;
}

export type Networks = Record<AvailableNetworks, Network>;

export const availableNetworks: Networks = {
  testnet: {
    name: 'testnet',
    rpcUrl: 'wss://rpc-testnet.reefscan.com/ws',
    reefscanUrl: 'https://testnet.reefscan.com',
    factoryAddress: '0xcA36bA38f2776184242d3652b17bA4A77842707e',
    routerAddress: '0x0A2906130B1EcBffbE1Edb63D5417002956dFd41',
    graphqlUrl: 'wss://testnet.reefscan.com/graphql',
    genesisHash: '0x0f89efd7bf650f2d521afef7456ed98dff138f54b5b7915cc9bce437ab728660',
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: 'wss://rpc.reefscan.com/ws',
    reefscanUrl: 'https://reefscan.com',
    routerAddress: '0x641e34931C03751BFED14C4087bA395303bEd1A5',
    factoryAddress: '0x380a9033500154872813F6E1120a81ed6c0760a8',
    graphqlUrl: 'wss://reefscan.com/graphql',
    genesisHash: '0x7834781d38e4798d548e34ec947d19deea29df148a7bf32484b7b24dacf8d4b7',
  },
};
