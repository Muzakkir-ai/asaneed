import { toPng } from 'html-to-image';
import { PDFDocument } from 'pdf-lib';

// Renders the certificate to a high-res image and wraps it in an exact A4-landscape PDF.
// This avoids mobile Safari's print engine, which ignores @page size and scaling.
export async function exportCertificatePdf(node: HTMLElement, fileName: string) {
  await document.fonts.ready;
  // Safari's downloadable fallback is raster-based; increase capture from 3x
  // to 4x, and skip the duplicate warm-up render to reduce peak phone memory.
  const opts = { pixelRatio: 4, width: node.offsetWidth, height: node.offsetHeight, cacheBust: true, style: { transform: 'none', margin: '0', boxShadow: 'none' } };
  const png = await toPng(node, opts);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]);
  const img = await pdf.embedPng(png);
  page.drawImage(img, { x: 0, y: 0, width: 841.89, height: 595.28 });
  const bytes = await pdf.save();
  const file = new File([new Uint8Array(bytes)], fileName, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && nav.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: fileName }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
