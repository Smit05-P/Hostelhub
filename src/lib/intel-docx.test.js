import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { describe, it } from "node:test";
import { createIntelReportDocxBlob } from "./intel-docx.js";

function readZipEntry(bytes, entryName) {
  let endOffset = -1;
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  assert.notEqual(endOffset, -1, "DOCX ZIP directory should exist");

  const entryCount = bytes.readUInt16LE(endOffset + 10);
  let offset = bytes.readUInt32LE(endOffset + 16);
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const compression = bytes.readUInt16LE(offset + 10);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const fileNameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const localHeaderOffset = bytes.readUInt32LE(offset + 42);
    const fileName = bytes.toString("utf8", offset + 46, offset + 46 + fileNameLength);

    if (fileName === entryName) {
      const localFileNameLength = bytes.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = bytes.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
      const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
      return compression === 0
        ? compressed.toString("utf8")
        : inflateRawSync(compressed).toString("utf8");
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`Missing DOCX entry: ${entryName}`);
}

describe("Intel DOCX reports", () => {
  it("exports Markdown headings and aligned tables into a valid Word document", async () => {
    const blob = await createIntelReportDocxBlob(
      "## Complaint report\n\n| Status | Count |\n| :--- | ---: |\n| Pending | 3 |",
      "Complaints"
    );
    const bytes = Buffer.from(await blob.arrayBuffer());
    const documentXml = readZipEntry(bytes, "word/document.xml");

    assert.equal(bytes.subarray(0, 2).toString("hex"), "504b");
    assert.match(documentXml, /Complaints/);
    assert.match(documentXml, /Complaint report/);
    assert.match(documentXml, /<w:tbl>/);
    assert.match(documentXml, /Pending/);
    assert.match(documentXml, />3</);
  });
});
