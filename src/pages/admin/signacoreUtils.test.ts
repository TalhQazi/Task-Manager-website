// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  parseSignerLines,
  resolveSignacoreFileUrl,
  toEditableFieldDraft,
} from "@/pages/admin/signacoreUtils";

describe("signacoreUtils", () => {
  it("parses signer lines with optional names", () => {
    expect(
      parseSignerLines("Jane Doe, jane@example.com\njohn@example.com\n\n")
    ).toEqual([
      { signer_name: "Jane Doe", signer_email: "jane@example.com" },
      { signer_name: "", signer_email: "john@example.com" },
    ]);
  });

  it("resolves relative file urls against the api base url", () => {
    expect(
      resolveSignacoreFileUrl("https://api-signacore.se7eninc.com", "/media/signacore/originals/file.pdf")
    ).toBe("https://api-signacore.se7eninc.com/media/signacore/originals/file.pdf");
    expect(
      resolveSignacoreFileUrl("https://api-signacore.se7eninc.com/", "https://cdn.example.com/file.pdf")
    ).toBe("https://cdn.example.com/file.pdf");
  });

  it("creates editable field draft values from api fields", () => {
    expect(
      toEditableFieldDraft({
        id: "field-1",
        field_type: "SIGNATURE",
        label: "Employee Signature",
        page: 2,
        x: 72,
        y: 100,
        width: 180,
        height: 36,
        is_required: true,
        detection_source: "ACROFORM",
        order: 3,
      })
    ).toEqual({
      id: "field-1",
      fieldType: "SIGNATURE",
      label: "Employee Signature",
      page: 2,
      x: 72,
      y: 100,
      width: 180,
      height: 36,
      isRequired: true,
      detectionSource: "ACROFORM",
      order: 3,
    });
  });
});
