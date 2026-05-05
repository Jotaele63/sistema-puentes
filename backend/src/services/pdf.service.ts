import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface PuentePDFData {
  numeroRegistro: string;
  tipo: string;
  elementoAForzar: string;
  equipo: string;
  necesidadMotivo: string;
  descripcionDetallada?: string | null;
  riesgosIdentificados?: string | null;
  variablesControl?: string | null;
  medidasContencion?: string | null;
  estado: string;
  creadoEn: Date;
  creadoPor: { nombre: string; apellido: string; area: string };
  aprobaciones: Array<{
    nivel: number;
    estado: string;
    fecha: Date;
    aprobador: { nombre: string; apellido: string };
    comentarios?: string | null;
  }>;
}

export async function generarPDFPuente(puente: PuentePDFData): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `puente-${puente.numeroRegistro}-${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).fillColor('#1e40af').text('SISTEMA DE GESTIÓN DE PUENTES', { align: 'center' });
    doc.fontSize(14).fillColor('#374151').text('Tarjeta de Solicitud de Puente', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#1e40af').text(`Registro: ${puente.numeroRegistro}`, { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d1d5db').stroke();
    doc.moveDown(0.5);

    const campo = (label: string, valor: string) => {
      doc.fontSize(10).fillColor('#6b7280').text(label + ':', { continued: false });
      doc.fontSize(11).fillColor('#111827').text(valor || '-');
      doc.moveDown(0.3);
    };

    // Información básica
    doc.fontSize(13).fillColor('#1e40af').text('INFORMACIÓN BÁSICA');
    doc.moveDown(0.3);
    campo('Tipo', puente.tipo);
    campo('Elemento a Forzar', puente.elementoAForzar);
    campo('Equipo', puente.equipo);
    campo('Estado', puente.estado);
    campo('Fecha de Creación', new Date(puente.creadoEn).toLocaleDateString('es-AR'));
    campo('Solicitante', `${puente.creadoPor.nombre} ${puente.creadoPor.apellido} (${puente.creadoPor.area})`);
    doc.moveDown(0.5);

    // Necesidad
    doc.fontSize(13).fillColor('#1e40af').text('NECESIDAD / MOTIVO');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#111827').text(puente.necesidadMotivo || '-');
    doc.moveDown(0.5);

    if (puente.riesgosIdentificados) {
      doc.fontSize(13).fillColor('#1e40af').text('RIESGOS IDENTIFICADOS');
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#111827').text(puente.riesgosIdentificados);
      doc.moveDown(0.5);
    }

    if (puente.variablesControl) {
      doc.fontSize(13).fillColor('#1e40af').text('VARIABLES DE CONTROL ALTERNATIVO');
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#111827').text(puente.variablesControl);
      doc.moveDown(0.5);
    }

    if (puente.medidasContencion) {
      doc.fontSize(13).fillColor('#1e40af').text('MEDIDAS DE CONTENCIÓN');
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#111827').text(puente.medidasContencion);
      doc.moveDown(0.5);
    }

    // Aprobaciones
    if (puente.aprobaciones.length > 0) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d1d5db').stroke();
      doc.moveDown(0.5);
      doc.fontSize(13).fillColor('#1e40af').text('HISTORIAL DE APROBACIONES');
      doc.moveDown(0.3);
      puente.aprobaciones.forEach(ap => {
        doc.fontSize(10).fillColor('#6b7280').text(`Nivel ${ap.nivel}: ${ap.aprobador.nombre} ${ap.aprobador.apellido}`, { continued: true });
        doc.fillColor(ap.estado === 'APROBADO' ? '#16a34a' : '#dc2626').text(`  [${ap.estado}]`);
        doc.fontSize(10).fillColor('#374151').text(`Fecha: ${new Date(ap.fecha).toLocaleDateString('es-AR')}${ap.comentarios ? ' | ' + ap.comentarios : ''}`);
        doc.moveDown(0.3);
      });
    }

    // Firma
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#d1d5db').stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#9ca3af').text('Documento generado automáticamente por el Sistema de Gestión de Puentes | MANT-309', { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(`/uploads/pdfs/${filename}`));
    stream.on('error', reject);
  });
}
