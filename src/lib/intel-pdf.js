import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function sanitizeText(text) {
  if (!text) return "";
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/₹/g, "Rs.")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}

function parseTableRow(line) {
  return line.trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => sanitizeText(cell.trim()));
}

function getTableAlignment(line) {
  return parseTableRow(line).map((cell) => {
    const marker = cell.replace(/\s/g, "");
    if (marker.startsWith(":") && marker.endsWith(":")) return "center";
    if (marker.endsWith(":")) return "right";
    return "left";
  });
}

export function createIntelReportPdf(content, title = "Intel Intelligence Report") {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let cursorY = 50;
  let tableLines = [];

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("HOSTELHUB INTEL", margin, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${timestamp}`, margin, 29);
  doc.text(`Subject: ${title}`, margin, 35);

  const flushTable = () => {
    if (tableLines.length < 2) {
      tableLines = [];
      return;
    }

    if (cursorY > pageHeight - 45) {
      doc.addPage();
      cursorY = margin;
    }

    const header = parseTableRow(tableLines[0]);
    const columnStyles = Object.fromEntries(
      getTableAlignment(tableLines[1]).map((halign, index) => [index, { halign }])
    );
    const body = tableLines
      .slice(2)
      .map(parseTableRow)
      .filter((row) => row.some(Boolean));

    autoTable(doc, {
      startY: cursorY,
      head: [header],
      body,
      margin: { left: margin, right: margin, bottom: 16 },
      styles: { fontSize: 9, font: "helvetica", cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles,
      rowPageBreak: "avoid",
    });

    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;
    tableLines = [];
  };

  const renderText = (text, fontSize = 11, bold = false) => {
    const cleanText = sanitizeText(text);
    if (!cleanText) return;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const splitLines = doc.splitTextToSize(cleanText, pageWidth - margin * 2);
    splitLines.forEach((line) => {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(line, margin, cursorY);
      cursorY += fontSize >= 14 ? 8 : 6;
    });
    cursorY += 2;
  };

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
      tableLines.push(trimmed);
      return;
    }

    if (tableLines.length) flushTable();
    if (!trimmed || /^([-*_])\1{2,}$/.test(trimmed)) {
      cursorY += 3;
      return;
    }

    if (trimmed.startsWith("#")) {
      const heading = trimmed.replace(/^#+\s*/, "");
      renderText(heading, trimmed.startsWith("# ") ? 16 : 13, true);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      renderText(`- ${trimmed.slice(2)}`);
    } else if (/^\d+[.)]\s/.test(trimmed)) {
      renderText(trimmed);
    } else {
      renderText(trimmed.replace(/\*\*/g, "").replace(/^>\s?/, "").replace(/`/g, ""));
    }
  });

  if (tableLines.length) flushTable();

  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${page} of ${pageCount} | HostelHub Intel | ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  return doc;
}
