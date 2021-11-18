import { Signer, Provider } from '@reef-defi/evm-provider';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { Signer as InjectedSigner } from '@polkadot/api/types';
import { DeriveBalancesAccountData } from '@polkadot/api-derive/balances/types';
import { ensure } from '../utils/utils';
import { ReefSigner } from '../state/types';

export const getReefCoinBalance = async (address: string, provider?: Provider): Promise<string> => {
  const noValStr = '- REEF';
  if (!provider) {
    return noValStr;
  }
  const balance = await provider.api.derive.balances.all(address)
    .then((res: DeriveBalancesAccountData) => res.freeBalance.toHuman() as string)
    .then((res) => (res === '0' ? noValStr : res));
  return balance;
};

export const accountToSigner = async (account: InjectedAccountWithMeta, provider: Provider, sign: InjectedSigner): Promise<ReefSigner> => {
  const signer = new Signer(provider, account.address, sign);
  const evmAddress = await signer.getAddress();
  const isEvmClaimed = await signer.isClaimed();

  const balance = await getReefCoinBalance(account.address, provider);

  return {
    signer,
    balance,
    evmAddress,
    isEvmClaimed,
    name: account.meta.name || '',
    address: account.address,
  };
};

export const accountsToSigners = async (accounts: InjectedAccountWithMeta[], provider: Provider, sign: InjectedSigner): Promise<ReefSigner[]> => Promise.all(accounts.map((account) => accountToSigner(account, provider, sign)));

export const bindSigner = async (signer: Signer): Promise<void> => {
  const hasEvmAddress = await signer.isClaimed();
  ensure(!hasEvmAddress, 'Account already has EVM address!');
  await signer.claimDefaultAccount();
};
