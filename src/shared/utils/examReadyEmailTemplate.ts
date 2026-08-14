interface IExamReadyEmailParams {
  patientName: string;
  patientCpf: string;
  examType: string;
  healthUnitName: string;
  uploaderName: string;
}

export function buildExamReadyForAdminEmail({
  patientName,
  patientCpf,
  examType,
  healthUnitName,
  uploaderName,
}: IExamReadyEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Novo resultado de exame disponível — ${patientName}`;

  const text = `O profissional ${uploaderName} enviou o resultado de um exame pela unidade ${healthUnitName}.\n\nPaciente: ${patientName}\nCPF: ${patientCpf}\nExame: ${examType}\n\nO PDF do exame está anexado a este e-mail. Encaminhe ao médico responsável e ao paciente conforme o processo atual.`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Novo resultado de exame disponível</h2>
      <p>O profissional <strong>${uploaderName}</strong> enviou o resultado de um exame pela unidade <strong>${healthUnitName}</strong>.</p>
      <p>
        <strong>Paciente:</strong> ${patientName}<br />
        <strong>CPF:</strong> ${patientCpf}<br />
        <strong>Exame:</strong> ${examType}
      </p>
      <p>O PDF do exame está anexado a este e-mail. Encaminhe ao médico responsável e ao paciente conforme o processo atual.</p>
    </div>
  `;

  return { subject, html, text };
}
