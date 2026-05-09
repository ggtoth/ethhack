"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const display_1 = require("@/lib/review/display");
(0, node_test_1.describe)("review display zones", () => {
    (0, node_test_1.test)("marks suspicious fake data as a red sad state", () => {
        const display = (0, display_1.getReviewDisplay)({
            score: 22,
            confidence: 31,
            hasSuspiciousInput: true,
        });
        strict_1.default.equal(display.zone, "bad");
        strict_1.default.equal(display.rating, "Needs review");
        strict_1.default.equal(display.face, "sad");
        strict_1.default.equal(display.color, "#ef4444");
        strict_1.default.equal(display.canDownload, false);
        strict_1.default.match(display.summary, /Suspicious or fake data/);
    });
    (0, node_test_1.test)("uses yellow for medium confidence", () => {
        const display = (0, display_1.getReviewDisplay)({
            score: 68,
            confidence: 72,
        });
        strict_1.default.equal(display.zone, "medium");
        strict_1.default.equal(display.rating, "Good");
        strict_1.default.equal(display.face, "neutral");
        strict_1.default.equal(display.color, "#eab308");
        strict_1.default.equal(display.canDownload, true);
    });
    (0, node_test_1.test)("uses green for good confidence", () => {
        const display = (0, display_1.getReviewDisplay)({
            score: 87,
            confidence: 94,
        });
        strict_1.default.equal(display.zone, "good");
        strict_1.default.equal(display.rating, "Excellent");
        strict_1.default.equal(display.face, "happy");
        strict_1.default.equal(display.color, "#43c084");
        strict_1.default.equal(display.canDownload, true);
    });
});
