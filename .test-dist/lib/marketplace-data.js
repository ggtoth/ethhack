"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardStats = exports.aiReview = exports.jobs = exports.freelancerWorkflow = exports.clientWorkflow = exports.workflowSteps = exports.navItems = void 0;
exports.navItems = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/browse-jobs", label: "Browse Jobs" },
    { href: "/post-job", label: "Post a Job" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/my-jobs", label: "My Jobs" },
    { href: "/messages", label: "Messages" },
    { href: "/wallet", label: "Wallet" },
    { href: "/disputes", label: "Disputes" },
    { href: "/profile", label: "Profile" },
];
exports.workflowSteps = [
    "Job Posted",
    "Escrow Funded",
    "Work Submitted",
    "AI Review",
    "Client Decision",
    "Payment Released",
];
exports.clientWorkflow = [
    "Register and connect wallet",
    "Create a job brief with requirements",
    "Deposit the budget into escrow",
    "Review the freelancer submission and AI recommendation",
    "Approve, request changes, or open a dispute",
    "Release payment after approval",
];
exports.freelancerWorkflow = [
    "Register and connect wallet",
    "Browse funded jobs by category, budget, and skills",
    "Apply or accept a matching job",
    "Submit work with links, files, and notes",
    "Use AI feedback to resolve gaps faster",
    "Receive crypto payout when approved",
];
exports.jobs = [
    {
        id: "landing-page-implementation",
        title: "Landing page implementation",
        category: "Frontend",
        budget: "0.42 ETH",
        deadline: "May 14, 2026",
        status: "Awaiting Client Decision",
        client: "Orbit Labs",
        clientRating: "4.9",
        freelancer: "Mira Chen",
        description: "Build a responsive product landing page from the approved Figma direction with polished mobile behavior and production-ready styling.",
        requirements: [
            "Responsive hero, proof section, pricing, and footer",
            "Use reusable components and clean CSS structure",
            "Match the supplied brand palette",
            "Include deployment notes and source links",
        ],
        skills: ["Next.js", "Tailwind", "Responsive UI"],
    },
    {
        id: "wallet-onboarding-copy",
        title: "Wallet onboarding copy",
        category: "Content",
        budget: "0.16 ETH",
        deadline: "May 11, 2026",
        status: "Open",
        client: "Nova Pay",
        clientRating: "4.7",
        description: "Write concise onboarding microcopy for a wallet connection flow, including empty states, errors, and confirmation screens.",
        requirements: [
            "Tone should be clear and trust-building",
            "Cover rejected signature and unsupported network states",
            "Provide final copy in a structured document",
        ],
        skills: ["UX Writing", "Crypto", "Product"],
    },
    {
        id: "escrow-dashboard-audit",
        title: "Escrow dashboard audit",
        category: "Design Review",
        budget: "0.28 ETH",
        deadline: "May 18, 2026",
        status: "Funded",
        client: "ClearChain",
        clientRating: "4.8",
        description: "Audit the current escrow dashboard and deliver prioritized UI fixes for clarity, state handling, and mobile layout.",
        requirements: [
            "Identify high-risk state clarity issues",
            "Create annotated screenshots",
            "Recommend dashboard component improvements",
        ],
        skills: ["UX Audit", "SaaS", "Fintech"],
    },
];
exports.aiReview = {
    score: 87,
    recommendation: "Approve with minor notes",
    summary: "The submission satisfies the core brief, implements the requested responsive sections, and provides source links. Minor polish remains in pricing spacing and footer contrast.",
    matched: [
        "Responsive layout is complete",
        "Reusable component structure is present",
        "Brand palette is followed",
        "Deployment notes are included",
    ],
    missing: ["Pricing section spacing needs one final pass"],
    risks: ["Footer contrast is acceptable but close to minimum on light mode"],
};
exports.dashboardStats = [
    { label: "Active jobs", value: "8", detail: "3 funded" },
    { label: "Pending AI reviews", value: "2", detail: "1 due today" },
    { label: "Escrow locked", value: "1.84 ETH", detail: "$5.7k est." },
    { label: "Payments received", value: "0.76 ETH", detail: "This month" },
    { label: "Disputes", value: "1", detail: "Needs evidence" },
];
