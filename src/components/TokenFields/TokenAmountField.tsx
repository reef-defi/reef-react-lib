import React, { ReactElement } from 'react';
import {
  Color, ReefSigner, Token, TokenWithAmount,
} from '../../state';
import { showBalance, toUnits } from '../../utils/math';
import { SubCard } from '../common/Card';
import {
  CenterColumn, ContentBetween, FlexRow, MT,
} from '../common/Display';
import { InputAmount } from '../common/Input';
import { ColorText, MiniText } from '../common/Text';
import SelectToken from '../SelectToken';

interface TokenAmountFieldProps {
  id?: string;
  tokens: Token[];
  placeholder?: string;
  token: TokenWithAmount;
  onTokenSelect: (newToken: Token) => void;
  onAmountChange: (amount: string) => void;
  onAddressChange?: (address: string) => Promise<void>;
  hideSelectTokenCommonBaseView?: boolean;
  signer: ReefSigner;
}

const TokenAmountFieldBase: React.FC<TokenAmountFieldProps> = ({
  id = 'exampleModal',
  token,
  tokens,
  signer,
  onTokenSelect,
  onAmountChange,
  placeholder = '0.0',
  children,
  onAddressChange = async () => {},
  hideSelectTokenCommonBaseView,
}): JSX.Element => {
  const {
    name, isEmpty, amount, iconUrl,
  } = token;

  return (
    <SubCard>
      <FlexRow>
        <SelectToken
          id={id}
          tokens={tokens}
          signer={signer}
          iconUrl={iconUrl}
          selectedTokenName={name}
          onTokenSelect={onTokenSelect}
          onAddressChange={onAddressChange}
          hideCommonBaseView={hideSelectTokenCommonBaseView}
        />
        <InputAmount
          amount={amount}
          disabled={isEmpty}
          placeholder={placeholder}
          onAmountChange={onAmountChange}
        />
      </FlexRow>
      <CenterColumn>
        <MT size="2" />
        <ContentBetween>{children}</ContentBetween>
      </CenterColumn>
    </SubCard>
  );
};

export const TokenAmountField = ({
  id,
  token,
  tokens,
  signer,
  placeholder,
  onTokenSelect,
  onAmountChange,
  onAddressChange,
}: TokenAmountFieldProps): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);
  return (
    <TokenAmountFieldBase
      id={id}
      token={token}
      tokens={tokens}
      signer={signer}
      placeholder={placeholder}
      onTokenSelect={onTokenSelect}
      onAmountChange={onAmountChange}
      onAddressChange={onAddressChange}
    >
      <MiniText>{!isEmpty && `Balance: ${showBalance(token)}`}</MiniText>
      <MiniText>
        {!isEmpty
          && price !== 0
          && amount !== ''
          && `~$ ${(amo * price).toFixed(2)}`}
      </MiniText>
    </TokenAmountFieldBase>
  );
};

interface TokenAmountFieldMax extends TokenAmountFieldProps {
  afterBalanceEl?: ReactElement;
  hideSelectTokenCommonBaseView?: boolean;
}
export const TokenAmountFieldMax = ({
  id,
  token,
  tokens,
  signer,
  placeholder,
  onTokenSelect,
  onAmountChange,
  onAddressChange,
  afterBalanceEl,
  hideSelectTokenCommonBaseView,
}: TokenAmountFieldMax): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amountFl = parseFloat(amount);
  const canCalcValue = (amt:number, prc:number): boolean => {
    console.log('VVVVV=', amt, prc);
    return !Number.isNaN(amt) && !Number.isNaN(prc) && !!amt && !!prc;
  };

  return (
    <TokenAmountFieldBase
      id={id}
      token={token}
      tokens={tokens}
      signer={signer}
      placeholder={placeholder}
      onTokenSelect={onTokenSelect}
      onAmountChange={onAmountChange}
      onAddressChange={onAddressChange}
      hideSelectTokenCommonBaseView={hideSelectTokenCommonBaseView}
    >
      <MiniText>
        {!isEmpty && `Balance: ${showBalance(token)}`}

        {!isEmpty
          && (afterBalanceEl || (
            <span
              className="text-primary text-decoration-none"
              role="button"
              onClick={() => onAmountChange(`${toUnits(token)}`)}
            >
              (Max)
            </span>
          ))}
      </MiniText>
      <MiniText>
        {!isEmpty
          && !!price
          && !!amountFl
          && canCalcValue(amountFl, price)
          && `~$ ${(amountFl * price).toFixed(4)}`}
      </MiniText>
    </TokenAmountFieldBase>
  );
};

interface TokenAmountFieldImpactPriceProps extends TokenAmountFieldProps {
  percentage: number;
}

const PercentageView = ({
  percentage,
}: {
  percentage: number;
}): JSX.Element => {
  let color: Color = 'success';
  if (percentage > 0) {
    color = 'success';
  } else if (percentage < -0.05) {
    color = 'danger';
  } else {
    color = 'warning';
  }
  return (
    <ColorText color={color}>
      (
      {`${(percentage * 100).toFixed(2)} %`}
      )
    </ColorText>
  );
};

export const TokenAmountFieldImpactPrice = ({
  id,
  token,
  tokens,
  signer,
  placeholder,
  percentage,
  onTokenSelect,
  onAmountChange,
  onAddressChange,
}: TokenAmountFieldImpactPriceProps): JSX.Element => {
  const { amount, price, isEmpty } = token;
  const amo = parseFloat(amount);

  const showUsd = !isEmpty && price !== 0 && amount !== '';

  return (
    <TokenAmountFieldBase
      id={id}
      token={token}
      tokens={tokens}
      signer={signer}
      placeholder={placeholder}
      onTokenSelect={onTokenSelect}
      onAmountChange={onAmountChange}
      onAddressChange={onAddressChange}
    >
      <MiniText>{!isEmpty && `Balance: ${showBalance(token)}`}</MiniText>
      <MiniText>
        {showUsd && `~$ ${(amo * price).toFixed(4)} `}
        {showUsd && <PercentageView percentage={percentage} />}
      </MiniText>
    </TokenAmountFieldBase>
  );
};
