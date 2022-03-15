import { useState } from 'react';
import { Provider, ApolloReefscanProvider } from '@reef-defi/evm-provider';
import { WsProvider } from '@polkadot/api';
import { ApolloClient } from '@apollo/client';
import { useAsyncEffect } from './useAsyncEffect';

export type UseProvider = [Provider | undefined, boolean, string];
let initProviderUrl: string;
// should be used only once per url in app
export const useProvider = (providerUrl?: string | undefined, graphql?: { apollo?: ApolloClient<any> } | undefined): UseProvider => {
  const [provider, setProvider] = useState<Provider>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useAsyncEffect(async () => {
    if (initProviderUrl === providerUrl || !providerUrl || (graphql && !graphql.apollo)) {
      return;
    }
    initProviderUrl = providerUrl;
    Promise.resolve()
      .then(() => setError(''))
      .then(() => setIsLoading(true))
      .then(async () => {
        const newProvider = new ApolloReefscanProvider({
          provider: new WsProvider(providerUrl),
        }, undefined, graphql?.apollo);
        await newProvider.api.isReadyOrError;
        return newProvider;
      })
      .then(setProvider)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [providerUrl, graphql]);

  return [provider, isLoading, error];
};
