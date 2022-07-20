import { useSubscription } from '@apollo/client';
import { AllPoolSubscription, ALL_POOL_SUBSCRITION } from '../graphql/pools';
import { LastPoolReserves } from '../state';

export const useAllPools = (): LastPoolReserves[] => {
  const { data } = useSubscription<AllPoolSubscription>(ALL_POOL_SUBSCRITION);
  return data
    ? data.pool_event.map(({ reserved_1, pool: { token_1, token_2, address }, reserved_2 }) => ({
      token_1,
      token_2,
      reserved_1,
      reserved_2,
      address,
    }))
    : [];
};
