import { jsPDF } from "jspdf";

type RGB = readonly [number, number, number];
const NAVY: RGB = [14, 10, 28];
const PURPLE: RGB = [111, 83, 245];
const MAGENTA: RGB = [224, 57, 165];
const INK: RGB = [28, 24, 42];
const MUTED: RGB = [105, 99, 123];
const LINE: RGB = [224, 220, 234];
const PAPER: RGB = [248, 247, 252];
const GREEN: RGB = [5, 150, 105];

export interface AgreementPdfInput {
  agreementId: string;
  logoData: Uint8Array;
  brandName: string;
  creatorName: string;
  title: string | null;
  platform: string | null;
  amount: number | null;
  deliverables: string | null;
  usageRights: string | null;
  paymentTerms: string | null;
  deadline: string | null;
  generatedAt: string | null;
  signedBrand: boolean;
  signedCreator: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "As agreed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(date);
}

function formatAmount(value: number | null): string {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value ?? 0)}`;
}

export function buildAgreementPdf(input: AgreementPdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 46;
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);

  function drawLetterhead() {
    fill(NAVY);
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.addImage(input.logoData, "PNG", margin, 10.5, 48, 11.56, undefined, "FAST");
    color([255, 255, 255]);
    doc.setFont("helvetica", "bold").setFontSize(9).text("CAMPAIGN AGREEMENT", pageWidth - margin, 14, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(198, 192, 218).text("zekesolution.com", pageWidth - margin, 20, { align: "right" });
    fill(PURPLE);
    doc.rect(0, 35, 140, 1.2, "F");
    fill(MAGENTA);
    doc.rect(140, 35, 70, 1.2, "F");
  }

  function ensureSpace(height: number) {
    if (y + height <= 271) return;
    doc.addPage();
    drawLetterhead();
    y = 47;
  }

  function sectionTitle(label: string) {
    ensureSpace(10);
    color(PURPLE);
    doc.setFont("helvetica", "bold").setFontSize(8).text(label.toUpperCase(), margin, y);
    stroke(PURPLE);
    doc.setLineWidth(0.5).line(margin, y + 3, pageWidth - margin, y + 3);
    y += 7;
  }

  let alternate = false;
  function termRow(label: string, value: string) {
    const wrapped = doc.splitTextToSize(value.trim() || "As agreed", 126) as string[];
    const rowHeight = Math.max(10, wrapped.length * 4.2 + 5);
    ensureSpace(rowHeight);
    if (alternate) {
      fill(PAPER);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }
    alternate = !alternate;
    color(MUTED);
    doc.setFont("helvetica", "bold").setFontSize(8).text(label.toUpperCase(), margin + 3, y + 5.8);
    color(INK);
    doc.setFont("helvetica", "normal").setFontSize(9.5).text(wrapped, margin + 41, y + 5.8);
    stroke(LINE);
    doc.setLineWidth(0.2).line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
    y += rowHeight;
  }

  function acceptanceCard(x: number, role: string, name: string, accepted: boolean) {
    fill(PAPER);
    stroke(LINE);
    doc.roundedRect(x, y, 84, 23, 2, 2, "FD");
    color(MUTED);
    doc.setFont("helvetica", "bold").setFontSize(7.5).text(role.toUpperCase(), x + 4, y + 5);
    color(INK);
    doc.setFont("helvetica", "bold").setFontSize(10.5).text((doc.splitTextToSize(name, 76) as string[]).slice(0, 2), x + 4, y + 10.5);
    color(accepted ? GREEN : MUTED);
    doc.setFont("helvetica", "bold").setFontSize(7.5).text(accepted ? "DIGITALLY ACCEPTED" : "ACCEPTANCE PENDING", x + 4, y + 20);
  }

  doc.setProperties({
    title: `Zeke Campaign Agreement - ${input.title || "Deal"}`,
    subject: "Creator and brand campaign terms accepted through Zeke",
    author: "Zeke",
    creator: "Zeke",
  });
  drawLetterhead();
  color(INK);
  doc.setFont("helvetica", "bold").setFontSize(17).text("Creator - Brand Campaign Agreement", margin, y);
  y += 7;
  color(MUTED);
  doc.setFont("helvetica", "normal").setFontSize(8.5);
  const reference = `ZK-AG-${input.agreementId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  doc.text(`Document reference: ${reference}`, margin, y);
  doc.text(`Effective date: ${formatDate(input.generatedAt)}`, pageWidth - margin, y, { align: "right" });
  y += 8;

  fill(PAPER);
  stroke(LINE);
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, "FD");
  const summary = [["AGREED VALUE", formatAmount(input.amount)], ["PLATFORM", input.platform || "As agreed"], ["RECORD STATUS", "Accepted"]];
  summary.forEach(([label, value], index) => {
    const x = margin + 6 + index * 57;
    color(MUTED);
    doc.setFont("helvetica", "bold").setFontSize(7).text(label, x, y + 6);
    color(index === 2 ? GREEN : INK);
    doc.setFont("helvetica", "bold").setFontSize(index === 0 ? 12 : 10).text((doc.splitTextToSize(value, 48) as string[]).slice(0, 2), x, y + 14.5);
  });
  y += 29;

  sectionTitle("Parties");
  ensureSpace(23);
  acceptanceCard(margin, "Brand", input.brandName, input.signedBrand);
  acceptanceCard(margin + 90, "Creator", input.creatorName, input.signedCreator);
  y += 29;

  sectionTitle("Campaign terms");
  termRow("Campaign", input.title || "As agreed");
  termRow("Deliverables", input.deliverables || "As agreed in the accepted offer and recorded conversation");
  termRow("Deadline", formatDate(input.deadline));
  termRow("Usage rights", input.usageRights || "As recorded in the accepted offer");
  termRow("Payment terms", input.paymentTerms || "On completion, subject to the accepted campaign terms");

  y += 5;
  ensureSpace(34);
  sectionTitle("Digital acceptance record");
  ensureSpace(24);
  fill([245, 252, 249]);
  stroke([185, 226, 210]);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");
  color(GREEN);
  doc.setFont("helvetica", "bold").setFontSize(9).text("TERMS LOCKED AFTER ACCEPTANCE", margin + 5, y + 6);
  color(INK);
  doc.setFont("helvetica", "normal").setFontSize(8.5);
  const acceptanceNotice = doc.splitTextToSize(`The brand and creator digitally accepted this record through Zeke on ${formatDate(input.generatedAt)}. The document reference connects this PDF to the platform agreement record.`, contentWidth - 10) as string[];
  doc.text(acceptanceNotice, margin + 5, y + 12.5);
  y += 27;

  const notice = "This PDF preserves the campaign terms accepted through Zeke. The brand and creator remain responsible for the commitments above. Zeke provides workflow records and, where eligible, Shield coordination. Zeke is not a law firm, does not provide legal advice, and does not guarantee payment, recovery, or campaign performance. Lawyer, court, filing, and related legal costs are separate and paid directly by the creator.";
  doc.setFont("helvetica", "normal").setFontSize(8.2);
  const noticeLines = doc.splitTextToSize(notice, contentWidth) as string[];
  ensureSpace(10 + noticeLines.length * 4.2);
  sectionTitle("Record notice");
  color(MUTED);
  doc.text(noticeLines, margin, y);
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    stroke(LINE);
    doc.setLineWidth(0.25).line(margin, 280, pageWidth - margin, 280);
    color(MUTED);
    doc.setFont("helvetica", "normal").setFontSize(7.5);
    doc.text("ZEKE SOLUTION | STRUCTURED CREATOR - BRAND RECORD", margin, 286);
    doc.text(`${reference} | Page ${page} of ${totalPages}`, pageWidth - margin, 286, { align: "right" });
    doc.text("Generated securely through zekesolution.com", margin, pageHeight - 6);
  }
  return Buffer.from(doc.output("arraybuffer"));
}
