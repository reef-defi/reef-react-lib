import { BigNumber } from 'ethers';

export interface BasicToken {
  name: string;
  address: string;
  iconUrl: string;
}

export interface Token extends BasicToken {
  balance: BigNumber;
  decimals: number;
}

export interface TokenWithAmount extends Token {
  amount: string;
  price: number;
  isEmpty: boolean;
}

export interface TokenState {
  index: number;
  amount: string;
  price: number;
}

export const defaultTokenState = (index = 0): TokenState => ({
  index,
  amount: '',
  price: 0,
});

export const createEmptyToken = (): Token => ({
  name: 'Select token',
  address: '',
  balance: BigNumber.from('0'),
  decimals: -1,
  iconUrl: '',
});

export const createEmptyTokenWithAmount = (): TokenWithAmount => ({
  ...createEmptyToken(),
  price: -1,
  amount: '',
  isEmpty: true,
});

export const toTokenAmount = (token: Token, state: TokenState): TokenWithAmount => ({
  ...token,
  ...state,
  isEmpty: false,
});