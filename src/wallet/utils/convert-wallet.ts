import { Wallet } from 'src/generated/prisma/client';

export interface NoDecimalWallet extends Omit<Wallet, 'amount'> {
  amount: string;
}

export function getNoDecimalWallet(wallet: Wallet): NoDecimalWallet {
  return {
    ...wallet,
    amount: wallet.amount.toString(),
  };
}
