export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export function otpExpires() {
    return new Date(Date.now() + 10 * 60 * 1000);
}
