import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

export async function sendOTPEmail(email: string, code: string) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Seu código de verificação - Aurora",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5">
          <h2>🔐 Código de verificação</h2>
          <p>Use o código abaixo para continuar:</p>
          <h1 style="letter-spacing: 6px">${code}</h1>
          <p>⏱ Este código expira em 5 minutos.</p>
          <p style="font-size: 12px; color: #666">
            Se você não solicitou este código, ignore este email.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error("❌ Erro ao enviar OTP (SMTP):", err)
    throw new Error("Failed to send verification email")
  }
}
