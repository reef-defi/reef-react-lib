import { BigNumber } from 'ethers';
import { Dispatch, useEffect } from 'react';
import { approveTokenAmount, getReefswapRouter } from '../rpc';
import {
  Network,
  NotifyFun, ReefSigner,
  resolveSettings,
  Token,
  TokenWithAmount,
} from '../state';
import {
  AddLiquidityActions,
  SetNewPoolSupplyAction,
} from '../store/actions/addLiquidity';
import {
  clearTokenAmountsAction,
  setCompleteStatusAction,
  setLoadingAction,
  setPoolAction,
  setStatusAction,
  setToken1Action,
  setToken2Action,
} from '../store/actions/defaultActions';
import { AddLiquidityState } from '../store/reducers/addLiquidity';
import {
  ButtonStatus,
  calculateAmount,
  calculateAmountWithPercentage,
  calculateDeadline,
  calculatePoolSupply,
  ensure,
  ensureAmount,
  errorHandler,
} from '../utils';
import { useLoadPool } from './useLoadPool';
import { useTokensFinder } from './useTokensFinder';
import { useUpdateLiquidityAmount } from './useUpdateAmount';
import { useUpdateBalance } from './useUpdateBalance';
import { useUpdateTokensPrice } from './useUpdateTokensPrice';

interface UseAddLiquidityState {
  address1: string;
  address2: string;
  state: AddLiquidityState;
  tokens: Token[];
  network?: Network;
  signer?: ReefSigner;
  dispatch: Dispatch<AddLiquidityActions>;
}

const status = (
  token1: TokenWithAmount,
  token2: TokenWithAmount,
  isEvmClaimed?: boolean,
): ButtonStatus => {
  try {
    ensure(isEvmClaimed === true, 'Bind signer');
    ensure(!token1.isEmpty, 'Select token 1');
    ensure(!token2.isEmpty, 'Select token 2');
    ensure(token1.amount.length > 0, `Missing ${token1.symbol} amount`);
    ensure(token2.amount.length > 0, `Missing ${token2.symbol} amount`);
    ensure(
      BigNumber.from(calculateAmount(token1)).lte(token1.balance),
      `Insufficient ${token1.name} balance`,
    );
    ensure(
      BigNumber.from(calculateAmount(token2)).lte(token2.balance),
      `Insufficient ${token2.name} balance`,
    );
    return { isValid: true, text: 'Add liquidity' };
  } catch (e) {
    return { isValid: false, text: e.message };
  }
};

export const useAddLiquidity = ({
  address1,
  address2,
  dispatch,
  state,
  tokens,
  signer,
  network,
}: UseAddLiquidityState): void => {
  const {
    token1, token2, pool, isLoading, isValid,
  } = state;
  const [loadedPool, isPoolLoading] = useLoadPool(
    token1,
    token2,
    network?.factoryAddress || '',
    signer?.signer,
  );
  const newPoolSupply = calculatePoolSupply(token1, token2, pool);

  const setToken1 = (token: TokenWithAmount): void => dispatch(setToken1Action(token));
  const setToken2 = (token: TokenWithAmount): void => dispatch(setToken2Action(token));

  // find and set tokens based on addresses
  useTokensFinder({
    address1,
    address2,
    tokens,
    signer,
    setToken1,
    setToken2,
  });
  // update token1 balance
  useUpdateBalance(token1, tokens, setToken1);
  // update token2 balance
  useUpdateBalance(token2, tokens, setToken2);
  // update token prices
  const isPriceLoading = useUpdateTokensPrice({
    pool,
    token1,
    token2,
    tokens,
    signer: signer?.signer,
    setToken1,
    setToken2,
    factoryAddress: network?.factoryAddress || '',
  });
  // update liquidity amount based on price
  useUpdateLiquidityAmount({
    pool,
    token1,
    token2,
    setToken1,
    setToken2,
  });
  // updating pool once its loaded
  useEffect(() => {
    if (loadedPool) {
      dispatch(setPoolAction(loadedPool));
    }
  }, [loadedPool]);
  // Updating new pool supply
  useEffect(() => {
    dispatch(SetNewPoolSupplyAction(newPoolSupply.toFixed(8)));
  }, [newPoolSupply]);
  // Updating status
  useEffect(() => {
    let [currentStatus, currentIsValid, currentIsLoading] = [
      '',
      isValid,
      isLoading,
    ];
    if (isPoolLoading) {
      currentStatus = 'Loading pool';
      currentIsLoading = true;
    } else if (isPriceLoading) {
      currentStatus = 'Loading prices';
      currentIsLoading = true;
    } else {
      const { isValid, text } = status(
        token1,
        token2,
        signer?.isEvmClaimed || false,
      );
      currentStatus = text;
      currentIsValid = isValid;
      currentIsLoading = false;
    }
    dispatch(
      setCompleteStatusAction(currentStatus, currentIsValid, currentIsLoading),
    );
  }, [
    token1,
    token2,
    signer?.isEvmClaimed,
    pool,
    isPoolLoading,
    isPriceLoading,
  ]);
};

interface OnAddLiquidity {
  state: AddLiquidityState;
  network?: Network;
  signer?: ReefSigner;
  notify: NotifyFun;
  dispatch: Dispatch<AddLiquidityActions>;
  updateTokenState: () => Promise<void>;
}

export const onAddLiquidity = ({
  state,
  network,
  signer,
  notify,
  dispatch,
  updateTokenState,
}: OnAddLiquidity) => async (): Promise<void> => {
  if (!signer || !network) {
    return;
  }
  const { token1, token2, settings } = state;
  const { percentage, deadline } = resolveSettings(settings);
  try {
    dispatch(setLoadingAction(true));
    ensureAmount(token1);
    ensureAmount(token2);

    const amount1 = calculateAmount(token1);
    const amount2 = calculateAmount(token2);
    const percentage1 = calculateAmountWithPercentage(token1, percentage);
    const percentage2 = calculateAmountWithPercentage(token2, percentage);

    dispatch(setStatusAction(`Approving ${token1.name} token`));
    await approveTokenAmount(token1, network.routerAddress, signer.signer);
    dispatch(setStatusAction(`Approving ${token2.name} token`));
    await approveTokenAmount(token2, network.routerAddress, signer.signer);

    dispatch(setStatusAction('Adding supply'));
    const reefswapRouter = getReefswapRouter(
      network.routerAddress,
      signer.signer,
    );

    await reefswapRouter.addLiquidity(
      token1.address,
      token2.address,
      amount1,
      amount2,
      percentage1,
      percentage2,
      signer.evmAddress,
      calculateDeadline(deadline),
    );
    notify('Balances will reload after blocks are finalized.', 'info');
    notify('Liquidity added successfully!');
  } catch (error) {
    const message = errorHandler(error.message)
      .replace('first', token1.name)
      .replace('second', token2.name);

    notify(message, 'error');
    // toast.error(errorHandler(message));
  } finally {
    /* TODO const newTokens = await loadTokens(tokens, sgnr);
    dispatch(setAllTokensAction(newTokens)); */
    await updateTokenState().catch(() => notify(
      'Failed to reload token balances, please reload the page to see correct balances.',
      'warning',
    ));
    dispatch(setLoadingAction(false));
    dispatch(clearTokenAmountsAction());
  }
};
