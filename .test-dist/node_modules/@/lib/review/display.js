"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewDisplay = getReviewDisplay;
function getReviewDisplay(input) {
    const score = clampPercent(input.score);
    const confidence = clampPercent(input.confidence);
    const hasSuspiciousInput = input.hasSuspiciousInput === true;
    const zone = hasSuspiciousInput ? "bad" : getConfidenceZone(confidence);
    if (zone === "bad") {
        return {
            score,
            confidence,
            zone,
            rating: "Needs review",
            color: "#ef4444",
            background: "rgba(239, 68, 68, 0.14)",
            face: "sad",
            recommendation: "Review needed",
            summary: hasSuspiciousInput
                ? "Suspicious or fake data was detected. The work needs manual review."
                : "The AI confidence is too low for approval.",
            canDownload: false,
        };
    }
    if (zone === "medium") {
        return {
            score,
            confidence,
            zone,
            rating: "Good",
            color: "#eab308",
            background: "rgba(234, 179, 8, 0.16)",
            face: "neutral",
            recommendation: "Check details",
            summary: "The result is mixed. Review the delivery before approving.",
            canDownload: true,
        };
    }
    return {
        score,
        confidence,
        zone,
        rating: confidence >= 95 ? "Super" : "Excellent",
        color: "#43c084",
        background: "rgba(67, 192, 132, 0.14)",
        face: "happy",
        recommendation: "Approval",
        summary: "The work meets the requirements and is ready to download.",
        canDownload: true,
    };
}
function getConfidenceZone(confidence) {
    if (confidence < 60) {
        return "bad";
    }
    if (confidence < 80) {
        return "medium";
    }
    return "good";
}
function clampPercent(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.min(100, Math.max(0, Math.round(value)));
}
