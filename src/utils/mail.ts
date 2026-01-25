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
        <div style="background-color: #f4f7f6; padding: 40px 20px; font-family: 'Segoe UI', Arial, sans-serif; color: #333;">
          <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-top: 6px solid #008080;">
            
            <div style="padding: 30px; text-align: center;">
              <h2 style="color: #008080; margin-bottom: 10px; font-size: 24px;">Verificação de Segurança</h2>
              <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Olá! Use o código abaixo para completar sua solicitação:</p>
              
              <div style="background-color: #f0f8f7; border: 1px dashed #008080; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #008080; display: block;">
                  ${code}
                </span>
              </div>
              
              <div style="display: inline-block; background-color: #fff4e5; color: #856404; padding: 8px 15px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                ⏱ Expira em 5 minutos
              </div>
            </div>

            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                Se você não solicitou este código, pode ignorar este e-mail com segurança.
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 10px; font-weight: bold;">
                © 2026 Sua Empresa
              </p>
            </div>
            
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error("❌ Erro ao enviar OTP (SMTP):", err)
    throw err
  }
}
