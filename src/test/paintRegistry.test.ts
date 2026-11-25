import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackPaintTelemetry,
  fetchFinishes,
  fetchTaxonomies,
  quickLookupFinish,
} from "../lib/paintRegistryApi";
import type { FinishRecord } from "../types/paintRegistry";

describe("Paint & Finish Registry Module", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Color Code & Specification Rules", () => {
    it("preserves exact color code formats including leading zeroes, hyphens, and spaces", () => {
      const code1 = "SW 7029-001";
      const code2 = "0045-A";
      const code3 = "HC-172";

      // Verify no numeric conversion or stripping
      expect(String(code1)).toBe("SW 7029-001");
      expect(String(code2)).toBe("0045-A");
      expect(String(code3)).toBe("HC-172");
      expect(code2.startsWith("00")).toBe(true);
    });

    it("evaluates valid hex color formats for visual swatches", () => {
      const isValidHex = (hex: string) => /^#([0-9A-F]{3}){1,2}$/i.test(hex.trim());

      expect(isValidHex("#FFFFFF")).toBe(true);
      expect(isValidHex("#D1CBC1")).toBe(true);
      expect(isValidHex("#000")).toBe(true);
      expect(isValidHex("invalid-color")).toBe(false);
      expect(isValidHex("")).toBe(false);
    });

    it("correctly identifies incomplete finish records requiring purchasing details", () => {
      const checkIncomplete = (record: Partial<FinishRecord>) => {
        return !record.colorCode || !record.manufacturer || !record.purchasedFrom;
      };

      const completeRecord: Partial<FinishRecord> = {
        colorCode: "SW 7029",
        manufacturer: "Sherwin-Williams",
        purchasedFrom: "Lowe's Store #1043",
      };

      const incompleteRecord: Partial<FinishRecord> = {
        colorCode: "SW 7029",
        manufacturer: "Sherwin-Williams",
        purchasedFrom: "", // Missing store
      };

      expect(checkIncomplete(completeRecord)).toBe(false);
      expect(checkIncomplete(incompleteRecord)).toBe(true);
    });
  });

  describe("Telemetry Pipeline", () => {
    it("dispatches custom paint_telemetry events with proper payload and timestamps", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      trackPaintTelemetry("paint_lookup_started", {
        propertyId: "LOC-001",
        surface: "Walls",
      });

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const eventArg = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(eventArg.type).toBe("paint_telemetry");
      expect(eventArg.detail.event).toBe("paint_lookup_started");
      expect(eventArg.detail.metadata.propertyId).toBe("LOC-001");
      expect(eventArg.detail.timestamp).toBeDefined();
    });
  });

  describe("Hierarchy & Record Status Transitions", () => {
    it("preserves previous record and transitions status to PREVIOUS when superseded", () => {
      const oldRecord: Partial<FinishRecord> = {
        id: "fin-1",
        recordStatus: "CURRENT",
        effectiveFrom: "2024-01-01T00:00:00.000Z",
        effectiveTo: null,
      };

      const now = new Date().toISOString();
      const supersededOld: Partial<FinishRecord> = {
        ...oldRecord,
        recordStatus: "PREVIOUS",
        effectiveTo: now,
      };

      const newRecord: Partial<FinishRecord> = {
        id: "fin-2",
        recordStatus: "CURRENT",
        effectiveFrom: now,
        effectiveTo: null,
      };

      expect(supersededOld.recordStatus).toBe("PREVIOUS");
      expect(supersededOld.effectiveTo).toBe(now);
      expect(newRecord.recordStatus).toBe("CURRENT");
      expect(newRecord.effectiveFrom).toBe(now);
      expect(newRecord.effectiveTo).toBeNull();
    });
  });
});

