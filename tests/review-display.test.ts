import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { getReviewDisplay } from "@/lib/review/display";

describe("review display zones", () => {
  test("marks suspicious fake data as a red sad state", () => {
    const display = getReviewDisplay({
      score: 22,
      confidence: 31,
      hasSuspiciousInput: true,
    });

    assert.equal(display.zone, "bad");
    assert.equal(display.rating, "Needs review");
    assert.equal(display.face, "sad");
    assert.equal(display.color, "#ef4444");
    assert.equal(display.canDownload, false);
    assert.match(display.summary, /Suspicious or fake data/);
  });

  test("uses yellow for medium confidence", () => {
    const display = getReviewDisplay({
      score: 68,
      confidence: 72,
    });

    assert.equal(display.zone, "medium");
    assert.equal(display.rating, "Good");
    assert.equal(display.face, "neutral");
    assert.equal(display.color, "#eab308");
    assert.equal(display.canDownload, true);
  });

  test("uses green for good confidence", () => {
    const display = getReviewDisplay({
      score: 87,
      confidence: 94,
    });

    assert.equal(display.zone, "good");
    assert.equal(display.rating, "Excellent");
    assert.equal(display.face, "happy");
    assert.equal(display.color, "#43c084");
    assert.equal(display.canDownload, true);
  });
});
