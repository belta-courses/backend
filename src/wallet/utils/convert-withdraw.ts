import { Withdraw } from 'src/generated/prisma/client';

export interface NoDecimalWithdraw extends Omit<Withdraw, 'amount'> {
  amount: string;
}

export function getNoDecimalWithdraw(withdraw: Withdraw): NoDecimalWithdraw {
  return {
    ...withdraw,
    amount: withdraw.amount.toString(),
  };
}
