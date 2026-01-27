import { Withdraw, WithdrawStatus } from 'src/generated/prisma/client';

export interface NoDecimalWithdraw extends Omit<Withdraw, 'amount'> {
  amount: string;
  errorMessage?: string;
}

export function getNoDecimalWithdraw(withdraw: Withdraw): NoDecimalWithdraw {
  return {
    ...withdraw,
    amount: withdraw.amount.toString(),
    // Include errorMessage for unclaimed status (from failureReason)
    errorMessage:
      withdraw.status === WithdrawStatus.unclaimed
        ? withdraw.failureReason || undefined
        : undefined,
  };
}
