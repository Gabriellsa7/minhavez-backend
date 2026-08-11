export function buildPasswordResetEmail(code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Seu código para redefinir sua senha';

  const text = `Seu código de verificação é: ${code}\n\nEle expira em 10 minutos. Se você não solicitou a redefinição de senha, ignore este e-mail.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Redefinição de senha</h2>
      <p>Use o código abaixo para continuar a redefinição da sua senha no Minha Vez:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 24px 0;">${code}</p>
      <p>Esse código expira em 10 minutos.</p>
      <p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
    </div>
  `;

  return { subject, html, text };
}
