import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

function parseInline(text, style = {}) {
  const runs = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(pattern).filter(Boolean);

  for (const part of parts) {
    const bold = (part.startsWith("**") && part.endsWith("**"))
      || (part.startsWith("__") && part.endsWith("__"));
    const code = part.startsWith("`") && part.endsWith("`");
    const italic = !bold && !code
      && ((part.startsWith("*") && part.endsWith("*"))
        || (part.startsWith("_") && part.endsWith("_")));
    const content = bold || italic || code ? part.slice(bold ? 2 : 1, -(bold ? 2 : 1)) : part;

    runs.push(new TextRun({
      text: content,
      font: code ? "Consolas" : "Aptos",
      bold: style.bold || bold,
      italics: style.italics || italic,
      color: style.color || (code ? "4338CA" : "334155"),
      size: style.size || (code ? 19 : 22),
    }));
  }

  return runs;
}

function parseTableRow(line) {
  return line.trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function getColumnAlignment(separator) {
  return parseTableRow(separator).map((cell) => {
    const trimmed = cell.replace(/\s/g, "");
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return AlignmentType.CENTER;
    if (trimmed.endsWith(":")) return AlignmentType.RIGHT;
    return AlignmentType.LEFT;
  });
}

function buildTable(lines) {
  const header = parseTableRow(lines[0]);
  const separator = lines[1] || "";
  const alignment = getColumnAlignment(separator);
  const columnCount = Math.max(1, header.length);
  const columnWidths = Array.from({ length: columnCount }, () => Math.floor(9360 / columnCount));
  columnWidths[columnCount - 1] = 9360 - columnWidths.slice(0, -1).reduce((sum, width) => sum + width, 0);
  const bodyRows = lines.slice(2).filter((line) => line.trim().startsWith("|"));

  const createRow = (cells, isHeader = false) => new TableRow({
    tableHeader: isHeader,
    cantSplit: true,
    children: Array.from({ length: columnCount }, (_, columnIndex) => {
      const cellText = cells[columnIndex] || "";
      return new TableCell({
        shading: isHeader ? { fill: "4F46E5", type: ShadingType.CLEAR } : undefined,
        children: [
          new Paragraph({
            children: parseInline(cellText, {
              bold: isHeader,
              color: isHeader ? "FFFFFF" : "334155",
              size: 20,
            }),
            alignment: alignment[columnIndex] || AlignmentType.LEFT,
            spacing: { after: 40 },
          }),
        ],
      });
    }),
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths,
    rows: [
      createRow(header, true),
      ...bodyRows.map((line) => createRow(parseTableRow(line))),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    alignment: AlignmentType.CENTER,
  });
}

function markdownToDocx(content, title) {
  const children = [
    new Paragraph({
      children: [new TextRun({
        text: "HOSTELHUB INTEL",
        bold: true,
        font: "Aptos Display",
        size: 32,
        color: "4F46E5",
      })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: title,
        bold: true,
        font: "Aptos Display",
        size: 28,
        color: "0F172A",
      })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Generated ${new Date().toLocaleString()}`,
        font: "Aptos",
        size: 18,
        color: "64748B",
      })],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1", space: 8 },
      },
      spacing: { after: 300 },
    }),
  ];

  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|") && index + 1 < lines.length) {
      const separator = parseTableRow(lines[index + 1]);
      if (separator.length && separator.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) {
        const tableLines = [trimmed, lines[index + 1]];
        index += 2;
        while (index < lines.length && lines[index].trim().startsWith("|")) {
          tableLines.push(lines[index]);
          index += 1;
        }
        children.push(buildTable(tableLines));
        children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
        continue;
      }
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      children.push(new Paragraph({
        text: "",
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1", space: 4 },
        },
        spacing: { after: 160 },
      }));
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      children.push(new Paragraph({
        heading: level === 1
          ? HeadingLevel.HEADING_1
          : level === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3,
        children: parseInline(heading[2], {
          bold: true,
          color: level === 1 ? "0F172A" : "3730A3",
          size: level === 1 ? 30 : level === 2 ? 26 : 23,
        }),
        spacing: { before: level === 1 ? 300 : 220, after: 120 },
        keepNext: true,
      }));
      index += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      children.push(new Paragraph({
        children: parseInline(bullet[1]),
        bullet: { level: 0 },
        spacing: { after: 80, line: 300 },
      }));
      index += 1;
      continue;
    }

    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${numbered[1]}. `, bold: true, font: "Aptos", size: 22 }),
          ...parseInline(numbered[2]),
        ],
        indent: { left: 360, hanging: 240 },
        spacing: { after: 80, line: 300 },
      }));
      index += 1;
      continue;
    }

    const quote = trimmed.match(/^>\s?(.*)$/);
    children.push(new Paragraph({
      children: parseInline(quote ? quote[1] : trimmed, { italics: Boolean(quote), color: quote ? "475569" : "334155" }),
      indent: quote ? { left: 360 } : undefined,
      border: quote ? {
        left: { style: BorderStyle.SINGLE, size: 12, color: "6366F1", space: 8 },
      } : undefined,
      spacing: { after: 160, line: 320 },
    }));
    index += 1;
  }

  return children;
}

export async function createIntelReportDocxBlob(content, title = "Intel Report") {
  const document = new Document({
    creator: "HostelHub Intel",
    title,
    description: "HostelHub Intel report",
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 22, color: "334155" },
          paragraph: { spacing: { after: 160, line: 320 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 850, right: 850, bottom: 850, left: 850 } },
      },
      children: markdownToDocx(content, title),
    }],
  });

  return Packer.toBlob(document);
}
