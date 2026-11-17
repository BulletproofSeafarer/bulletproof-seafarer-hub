import { jsPDF } from 'jspdf';
import { formatDate, type MaritimeCV } from './cv';

export async function downloadCV(cv: MaritimeCV) {
  const response = await fetch(new URL('fonts/DejaVuSans.ttf', document.baseURI));
  if (!response.ok) throw new Error('CV font unavailable');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let font = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    font += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  pdf.addFileToVFS('DejaVuSans.ttf', btoa(font));
  pdf.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  pdf.setFont('DejaVuSans');
  pdf.setProperties({ title: 'Maritime CV' });
  const left = 50;
  const bottom = pdf.internal.pageSize.height - 50;
  const width = pdf.internal.pageSize.width - (left * 2);
  let y = 62;

  function write(value: string, size: number, accent = false, spaceAfter = 7) {
    if (!value) return;
    pdf.setFontSize(size);
    if (accent) pdf.setTextColor(12, 99, 86);
    else pdf.setTextColor(27, 42, 45);
    const lines: string[] = pdf.splitTextToSize(value, width);
    for (const line of lines) {
      if (y > bottom) { pdf.addPage(); y = 62; }
      pdf.text(line, left, y);
      y += size * 1.36;
    }
    y += spaceAfter;
  }

  function section(title: string) {
    if (y + 40 > bottom) { pdf.addPage(); y = 62; }
    write(title, 13, true);
  }

  write(cv.profile.name || 'Maritime CV', 26, true, 4);
  write([cv.profile.rank, cv.profile.email].filter(Boolean).join(' · '), 11);
  write(cv.profile.summary, 11, false, 14);
  section('Sea Service');
  if (!cv.services.length) write('No sea-service records', 11);
  for (const item of cv.services) {
    write([item.vessel, item.role, `${formatDate(item.start)} – ${item.end ? formatDate(item.end) : 'Present'}`].filter(Boolean).join(' · '), 11);
  }
  y += 8;
  section('Certificates');
  if (!cv.certificates.length) write('No certificates selected', 11);
  for (const item of cv.certificates) {
    write([item.title, item.issuer, item.verification, item.expiry && 'Expires ' + formatDate(item.expiry)].filter(Boolean).join(' · '), 11);
  }
  pdf.save('Toolbox-Maritime-CV.pdf');
}
