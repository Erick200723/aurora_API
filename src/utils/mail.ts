import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendOTPEmail(email: string, code: string) {
  try {
    await resend.emails.send({
      from: process.env.MAIL_FROM!,
      to: email,
      subject: "Seu código de verificação - Aurora",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>🔐 Código de verificação</h2>
          <p>Seu código é:</p>
          <h1 style="letter-spacing: 4px">${code}</h1>
          <p>Este código expira em 5 minutos.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("❌ Erro ao enviar OTP (Resend):", err)
    throw new Error("Failed to send verification email")
  }
}
