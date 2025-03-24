export interface AuthFormData {
  email: string;
  password: string;
}

export interface OTPFormData {
  otp: string;
}

export interface AuthState {
  email: string;
  isVerified: boolean;
  otpSent: boolean;
}