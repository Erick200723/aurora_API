export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpires(): Date {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  return expires;
}
