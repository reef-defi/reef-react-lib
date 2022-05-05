export enum UpdateDataType {
  ACCOUNT_NATIVE_BALANCE,
  ACCOUNT_TOKENS,
  ACCOUNT_EVM_BINDING
}

export interface UpdateAction {
  address?: string;
  type: UpdateDataType;
}

export interface UpdateDataCtx<T> {
  data?: T;
  updateActions: UpdateAction[];
  ctx?: any;
}
/*

export const createUpdateActions = (updateTypes: UpdateDataType[], addresses?: string[]): UpdateAction[] => {
  const updateActions: UpdateAction[] = [];
  if (addresses) {
    addresses.forEach((address) => {
      updateTypes.forEach((updT) => updateActions.push({ type: updT, address } as UpdateAction));
    });
  } else {
    updateTypes.forEach((updT) => updateActions.push({ type: updT } as UpdateAction));
  }
  return updateActions;
};

export const getUnwrappedData$ = <T>(dataCtx$: Observable<UpdateDataCtx<T>>): Observable<T> => dataCtx$.pipe(
  map((updCtx) => updCtx.data as T),
  shareReplay(1),
);

export const getAddressUpdateActionTypes = (address?: string, updateActions?: UpdateAction[]): UpdateDataType[] => {
  if (!address || !updateActions) {
    return [];
  }
  return updateActions.filter((ua) => !ua.address || ua.address === address).map((ua) => ua.type)
    .reduce((distinctTypes, curr) => {
      if (distinctTypes.indexOf(curr) < 0) {
        distinctTypes.push(curr);
      }
      return distinctTypes;
    }, [] as UpdateDataType[]);
};
*/
