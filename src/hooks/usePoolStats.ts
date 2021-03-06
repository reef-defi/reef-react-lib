import {useQuery} from '@apollo/client';
import {BigNumber} from 'bignumber.js';
import {useMemo} from 'react';
import {
  Pool24HVolume,
  POOL_24H_VOLUME,
  POOL_INFO_GQL,
  PoolInfoQuery,
  PoolInfoVar,
  POOLS_TOTAL_VALUE_LOCKED,
  PoolsTotalSupply,
  PoolsTotalValueLockedVar,
  PoolVolume24HVar,
} from '../graphql/pools';
import {getTokenPrice, TokenPrices} from '../state';
import {getIconUrl, normalize} from '../utils';
import {usePoolCount} from './poolHooks';

export const useTotalSupply = (tokenPrices: TokenPrices, previous=false): string => {
  const toTime = useMemo(() => {
    const tm = new Date();
    if (previous) {
      tm.setDate(tm.getDate() - 1);
    }
    return tm;
  }, []);
  const { data } = useQuery<PoolsTotalSupply, PoolsTotalValueLockedVar>(
    POOLS_TOTAL_VALUE_LOCKED,
    { variables: {
      toTime: toTime.toISOString()
    }}
  );
  if (!data || data.pool_event.length === 0) {
    return '0';
  }

  return data.pool_event.reduce((acc, { reserved_1, reserved_2, pool: { token_1, token_2 } }) => {
    const tokenPrice1 = getTokenPrice(token_1, tokenPrices);
    const tokenPrice2 = getTokenPrice(token_2, tokenPrices);
    const r1 = tokenPrice1.multipliedBy(new BigNumber(reserved_1).div(new BigNumber(10).pow(18)));
    const r2 = tokenPrice2.multipliedBy(new BigNumber(reserved_2).div(new BigNumber(10).pow(18)));
    return acc.plus(r1).plus(r2);
  }, new BigNumber(0)).toString();
};

export const usePoolVolume = (tokenPrices: TokenPrices): string => {
  const fromTime = useMemo(
    () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    [],
  );
  const { data } = useQuery<Pool24HVolume, PoolVolume24HVar>(
    POOL_24H_VOLUME,
    {
      variables: { fromTime },
    },
  );
  if (!data || data.pool_hour_volume.length === 0) {
    return '0';
  }

  return data.pool_hour_volume.reduce((acc, { amount_1, amount_2, pool: { token_1, token_2 } }) => {
    const tokenPrice1 = getTokenPrice(token_1, tokenPrices);
    const tokenPrice2 = getTokenPrice(token_2, tokenPrices);

    return acc
      .plus(tokenPrice1.multipliedBy(new BigNumber(amount_1).div(new BigNumber(10).pow(18))))
      .plus(tokenPrice2.multipliedBy(new BigNumber(amount_2).div(new BigNumber(10).pow(18))));
  }, new BigNumber(0)).toString();
};

export interface TokenStats {
  address: string;
  name: string;
  icon: string;
  symbol: string;
  fees24h: string;
  mySupply: string;
  amountLocked: string;

  percentage: string;
  ratio: {
    name: string;
    symbol: string;
    amount: string;
  }
}

export interface PoolStats {
  firstToken: TokenStats;
  secondToken: TokenStats;
  tvlUSD: string;
  mySupplyUSD: string;
  volume24hUSD: string;
  volumeChange24h: number;
}


export const usePoolInfo = (address: string, signerAddress: string, tokenPrices: TokenPrices): [PoolStats|undefined, boolean] => {
  const fromTime = useMemo(() => {
    let date = new Date()
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  }, [address, signerAddress])

  const {data, loading} = useQuery<PoolInfoQuery, PoolInfoVar>(
    POOL_INFO_GQL,
    {
      variables: {
        address,
        fromTime,
        signerAddress,
      }
    }
  )

  usePoolCount

  const info = useMemo<PoolStats|undefined>(() => {
    if (!data || data.pool.length === 0) {
      return undefined;
    }
    console.log(data)
    const pool = data.pool[0]
    const {decimals: decimal1, name: name1, symbol: symbol1} = pool.token_contract_1.verified_contract!.contract_data;
    const {decimals: decimal2, name: name2, symbol: symbol2} = pool.token_contract_2.verified_contract!.contract_data;

    const amountLocked1 = normalize(pool.pool_event[0].reserved_1, decimal1);
    const amountLocked2 = normalize(pool.pool_event[0].reserved_2, decimal2);
    const fee1 =  normalize(pool.fee_aggregate.aggregate.sum.fee_1, decimal1);
    const fee2 =  normalize(pool.fee_aggregate.aggregate.sum.fee_2, decimal2);
    const volume1 = normalize(pool.volume_aggregate.aggregate.sum.amount_1, decimal1);
    const volume2 = normalize(pool.volume_aggregate.aggregate.sum.amount_2, decimal2);
    const mySupply1 = normalize(pool.pool_event_aggregate.aggregate.sum.amount_1, decimal1);
    const mySupply2 = normalize(pool.pool_event_aggregate.aggregate.sum.amount_2, decimal2);

    const mySupplyUSD = mySupply1
      .multipliedBy(tokenPrices[pool.token_1])
      .plus(mySupply2.multipliedBy(tokenPrices[pool.token_2]))
      .toFormat(2);
    const tvlUSD = amountLocked1
      .multipliedBy(tokenPrices[pool.token_1])
      .plus(amountLocked2.multipliedBy(tokenPrices[pool.token_2]))
      .toFormat(2);
    const volume24hUSD = volume1
      .multipliedBy(tokenPrices[pool.token_1])
      .plus(volume2.multipliedBy(tokenPrices[pool.token_2]))
      .toFormat(2);

    const all = amountLocked1.plus(amountLocked2)

    return {
      firstToken: {
        address: pool.token_1,
        icon: getIconUrl(pool.token_1),
        name: name1,
        symbol: symbol1,
        amountLocked: amountLocked1.toFormat(0),
        fees24h: fee1.toFormat(2),
        mySupply: mySupply1.toFormat(2),
        percentage: amountLocked1.div(all).multipliedBy(100).toFormat(2),
        ratio: {
          amount: amountLocked1.div(amountLocked2).toFormat(4),
          name: name2,
          symbol: symbol2,
        },
      },
      secondToken: {
        address: pool.token_2,
        icon: getIconUrl(pool.token_2),
        name: name2,
        symbol: symbol2,
        amountLocked: amountLocked2.toFormat(0),
        fees24h: fee2.toFormat(2),
        mySupply: mySupply2.toFormat(2),
        percentage: amountLocked2.div(all).multipliedBy(100).toFormat(2),
        ratio: {
          amount: amountLocked2.div(amountLocked1).toFormat(4),
          name: name1,
          symbol: symbol1,
        },
      },
      mySupplyUSD,
      tvlUSD,
      volume24hUSD,
      volumeChange24h: 10,
    };
  }, [data, tokenPrices])

  return [info, loading]
}
