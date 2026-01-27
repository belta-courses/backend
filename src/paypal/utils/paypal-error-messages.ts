/**
 * Maps PayPal error codes to user-friendly error messages
 */
export const paypalErrorMessages: Record<string, string> = {
  RECEIVER_UNREGISTERED:
    'The PayPal email address does not have a PayPal account. Please create a PayPal account with this email or use a different email address.',
  RECEIVER_UNCONFIRMED:
    'The PayPal email address is not confirmed. Please confirm your PayPal account.',
  INSUFFICIENT_FUNDS:
    'Insufficient funds in your account. Please try again later.',
  INVALID_ACCOUNT_NUMBER:
    'The PayPal account information is invalid. Please check your email address.',
  TRANSACTION_LIMIT_EXCEEDED:
    'Transaction limit exceeded. Please contact support.',
  BLOCKED:
    'The payout was blocked. Please contact PayPal support or use a different email address.',
  CANCELED: 'The payout was canceled. Please try again.',
  RETURNED:
    'The payout was returned. The funds have been refunded to your wallet.',
  FAILED: 'The payout failed. Please try again or contact support.',
};

/**
 * Gets user-friendly error message from PayPal error
 */
export function getPayPalErrorMessage(
  errorName?: string,
  defaultMessage?: string,
): string {
  if (errorName && paypalErrorMessages[errorName]) {
    return paypalErrorMessages[errorName];
  }
  return (
    defaultMessage ||
    'An error occurred with your withdrawal. Please try again or contact support.'
  );
}

/**
 * Gets instructions for unclaimed payouts based on error
 */
export function getUnclaimedInstructions(errorName?: string): string {
  if (errorName === 'RECEIVER_UNREGISTERED') {
    return 'To claim this payment, you need to create a PayPal account using the email address you provided. PayPal will send you an email with instructions on how to claim the payment. Once you create and confirm your PayPal account, you can claim the payment within 30 days.';
  }
  if (errorName === 'RECEIVER_UNCONFIRMED') {
    return 'Please confirm your PayPal account email address. Check your email inbox for a confirmation email from PayPal, then try claiming the payment again.';
  }
  return 'Please check your PayPal account and email for instructions on how to claim this payment. You have 30 days to claim it before it is automatically returned to your wallet.';
}
