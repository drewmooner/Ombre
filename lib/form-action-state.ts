/** Shared shape for useActionState — keep out of "use server" modules so client hooks stay clean. */
export type FormActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  shopOpen?: boolean;
  otpSent?: boolean;
  email?: string;
  resendCooldownSeconds?: number;
  otpResent?: boolean;
};
