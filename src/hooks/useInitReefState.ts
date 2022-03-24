import { useEffect, useState } from 'react';
import { Provider } from '@reef-defi/evm-provider';
import { ApolloClient } from '@apollo/client';
import { useObservableState } from './useObservableState';
import { availableNetworks, Network, ReefSigner } from '../state';
import { useProvider } from './useProvider';
import {
  providerSubj,
  selectedNetworkSubj,
  setCurrentNetwork,
} from '../appState/providerState';
import { apolloClientInstance$, apolloClientSubj, setApolloUrls } from '../graphql';
import { accountsSubj } from '../appState/accountState';
import { useLoadSigners } from './useLoadSigners';

const getGQLUrls = (network: Network): { ws: string; http: string }|undefined => {
  if (!network.graphqlUrl) {
    return undefined;
  }
  const ws = network.graphqlUrl.startsWith('http')
    ? network.graphqlUrl.replace('http', 'ws')
    : network.graphqlUrl;
  const http = network.graphqlUrl.startsWith('ws')
    ? network.graphqlUrl.replace('ws', 'http')
    : network.graphqlUrl;
  return { ws, http };
};
export type UseInitReefState = [ReefSigner[] | undefined, Provider | undefined, Network | undefined, boolean, any];

export const useInitReefState = (
  applicationDisplayName: string,
  selectNetwork: Network = availableNetworks.mainnet,
  signersParam?: ReefSigner[],
  apolloClient?: ApolloClient<any>|boolean,
): UseInitReefState => {
  const apollo: ApolloClient<any>|undefined = useObservableState(apolloClientInstance$);
  const selectedNetwork: Network|undefined = useObservableState(selectedNetworkSubj);
  const [provider, isProviderLoading] = useProvider((selectedNetwork as Network)?.rpcUrl, apolloClient ? { apollo } : undefined);
  const [loadedSigners, isSignersLoading, error] = useLoadSigners(applicationDisplayName, signersParam ? undefined : provider);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectNetwork && selectNetwork !== selectedNetwork) {
      setCurrentNetwork(selectNetwork);
    }
  }, [selectNetwork]);

  useEffect(() => {
    if (selectedNetwork) {
      if (!apolloClient) {
        const gqlUrls = getGQLUrls(selectedNetwork);
        if (gqlUrls) {
          setApolloUrls(gqlUrls);
        }
      } else if (apolloClient && apolloClient !== true) {
        apolloClientSubj.next(apolloClient);
      }
    }
  }, [selectedNetwork, apolloClient]);

  useEffect(() => {
    if (provider) {
      providerSubj.next(provider);
    }
    return () => {
      provider?.api.disconnect();
    };
  }, [provider]);

  useEffect(() => {
    accountsSubj.next(signersParam || loadedSigners || []);
  }, [loadedSigners, signersParam]);

  useEffect(() => {
    setLoading(isProviderLoading || isSignersLoading);
  }, [isProviderLoading, isSignersLoading]);
  return [loadedSigners, provider, selectedNetwork, loading, error];
};
