import axios from "axios";

export async function sendOTPEmail(email: string, code: string) {
  const apiKey = process.env.MAIL_PASS; 

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: "Aurora IA", email: "auroraai.marketing.co@gmail.com" },
        to: [{ email: email }],
        subject: "Seu código de verificação - Aurora",
        htmlContent: `
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
              </div>
            </div>
          </div>
        `
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("✅ E-mail enviado com sucesso via API!");
  } catch (err) {

    console.error("❌ Erro na API da Brevo:", err);
    throw err;
  }
}