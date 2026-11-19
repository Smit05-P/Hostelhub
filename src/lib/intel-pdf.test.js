import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createIntelReportPdf } from "./intel-pdf.js";

describe("Intel PDF reports", () => {
  it("preserves report headings, aligned table content, and page footers", () => {
    const pdf = createIntelReportPdf(
      "## Complaint report\n\n| Status | Count |\n| :--- | ---: |\n| Pending | 3 |",
      "Complaints"
    );
    const pageText = pdf.internal.pages.slice(1).flat().join("\n");
    const buffer = Buffer.from(pdf.output("arraybuffer"));

    assert.ok(buffer.length > 1000);
    assert.match(pageText, /Complaint report/);
    assert.match(pageText, /Pending/);
    assert.match(pageText, /\(3\) Tj/);
    assert.match(pageText, /Page 1 of 1/);
    assert.equal(pdf.lastAutoTable.body[0].cells["0"].styles.halign, "left");
    assert.equal(pdf.lastAutoTable.body[0].cells["1"].styles.halign, "right");
  });
});
