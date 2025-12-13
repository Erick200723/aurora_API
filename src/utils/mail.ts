export async function sendOTPEmail(email: string, code: string) {
  console.log(`
  ======================
  OTP PARA ${email}
  CÓDIGO: ${code}
  ======================
  `);

  // 🔜 depois trocar isso por nodemailer / resend / brevo
}
