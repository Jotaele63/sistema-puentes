import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SIMULADO] Para: ${to} | Asunto: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Error enviando email:', err);
  }
}

export function emailNuevoPuente(destinatario: string, numeroPuente: string, elemento: string): string {
  return `
    <h2>Nuevo Puente Pendiente de Aprobación</h2>
    <p>Se ha creado el puente <strong>${numeroPuente}</strong> que requiere su aprobación.</p>
    <p><strong>Elemento a forzar:</strong> ${elemento}</p>
    <p>Ingrese al sistema para revisar y aprobar.</p>
  `;
}

export function emailAprobado(numeroPuente: string, nivel: number): string {
  return `
    <h2>Puente Aprobado - Nivel ${nivel}</h2>
    <p>El puente <strong>${numeroPuente}</strong> fue aprobado en el Nivel ${nivel}.</p>
  `;
}

export function emailRechazado(numeroPuente: string, motivo: string): string {
  return `
    <h2>Puente Rechazado</h2>
    <p>El puente <strong>${numeroPuente}</strong> fue rechazado.</p>
    <p><strong>Motivo:</strong> ${motivo}</p>
  `;
}

export function emailPorExpirar(numeroPuente: string, horas: number): string {
  return `
    <h2>⚠️ Puente Por Expirar</h2>
    <p>El puente <strong>${numeroPuente}</strong> expira en <strong>${horas} horas</strong>.</p>
    <p>Debe renovarlo o cerrarlo antes de que expire.</p>
  `;
}
