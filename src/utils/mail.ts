// export async function sendOTPEmail(email: string, code: string) {
//   console.log(`
//   ======================
//   OTP PARA ${email}
//   CÓDIGO: ${code}
//   ======================
//   `);

//   // 🔜 depois trocar isso por nodemailer / resend / brevo
// }
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false, // TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export async function sendOTPEmail(email: string, code: string) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Código de verificação - Aurora IA',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Verificação de acesso</h2>
          <p>Use o código abaixo para concluir seu acesso:</p>
          <div style="
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 6px;
            margin: 20px 0;
          ">
            ${code}
          </div>
          <p>Este código expira em 5 minutos.</p>
          <p style="color: #888; font-size: 12px;">
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
      `
    });

    console.log(`📧 OTP enviado para ${email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar email OTP:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendOTPexpiredEmail(email: string){
  try{
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Código de verificação expirado - Aurora IA',
    })
  }catch(error){
    console.error('❌ Erro ao enviar email OTP expirado:', error);
    throw new Error('Failed to send expired verification email');
  }
}

