module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/frontend/components/cyber-frame.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CyberFrame",
    ()=>CyberFrame
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const TABS = [
    {
        id: "graph",
        label: "ГРАФ"
    },
    {
        id: "events",
        label: "СОБЫТИЯ"
    },
    {
        id: "log",
        label: "ЛОГ"
    },
    {
        id: "agents",
        label: "АГЕНТЫ"
    },
    {
        id: "messages",
        label: "СООБЩЕНИЯ"
    }
];
const DEFAULT_SPEED = 1;
function CyberFrame({ children, activeTab = "events", onTabChange, onAddEvent, timeSpeed = 1, onTimeSpeedChange }) {
    const [time, setTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [eventText, setEventText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [speedHover, setSpeedHover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const tick = ()=>{
            const now = new Date();
            setTime(now.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return ()=>clearInterval(id);
    }, []);
    const handleSubmitEvent = ()=>{
        if (eventText.trim() && onAddEvent) {
            onAddEvent(eventText.trim());
            setEventText("");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-screen w-screen bg-background overflow-hidden flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-0 z-50",
                style: {
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(229,195,75,0.008) 2px, rgba(229,195,75,0.008) 4px)"
                }
            }, void 0, false, {
                fileName: "[project]/frontend/components/cyber-frame.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "pointer-events-none absolute inset-0 z-40 h-full w-full",
                viewBox: "0 0 1920 1080",
                preserveAspectRatio: "none",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("filter", {
                                id: "glow",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feGaussianBlur", {
                                        stdDeviation: "3",
                                        result: "blur"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feMerge", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feMergeNode", {
                                                in: "blur"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 82,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feMergeNode", {
                                                in: "SourceGraphic"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 83,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("filter", {
                                id: "glow-strong",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feGaussianBlur", {
                                        stdDeviation: "6",
                                        result: "blur"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feMerge", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feMergeNode", {
                                                in: "blur"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 89,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("feMergeNode", {
                                                in: "SourceGraphic"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 90,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: `
            M 80 20
            L 1840 20
            L 1900 80
            L 1900 1000
            L 1840 1060
            L 80 1060
            L 20 1000
            L 20 80
            Z
          `,
                        stroke: "var(--cyber-glow)",
                        strokeWidth: "2",
                        filter: "url(#glow)",
                        opacity: "0.8"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: `
            M 90 30
            L 1830 30
            L 1890 90
            L 1890 990
            L 1830 1050
            L 90 1050
            L 30 990
            L 30 90
            Z
          `,
                        stroke: "var(--cyber-glow)",
                        strokeWidth: "0.5",
                        opacity: "0.3"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M 20 130 L 20 80 L 80 20",
                        stroke: "var(--cyber-glow)",
                        strokeWidth: "3",
                        filter: "url(#glow-strong)",
                        strokeLinecap: "square"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M 1840 20 L 1900 80 L 1900 130",
                        stroke: "var(--cyber-glow)",
                        strokeWidth: "3",
                        filter: "url(#glow-strong)",
                        strokeLinecap: "square"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 134,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M 1900 950 L 1900 1000 L 1840 1060",
                        stroke: "var(--cyber-glow)",
                        strokeWidth: "3",
                        filter: "url(#glow-strong)",
                        strokeLinecap: "square"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M 80 1060 L 20 1000 L 20 950",
                        stroke: "var(--cyber-glow)",
                        strokeWidth: "3",
                        filter: "url(#glow-strong)",
                        strokeLinecap: "square"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 136,
                        columnNumber: 9
                    }, this),
                    [
                        200,
                        400,
                        600,
                        1320,
                        1520,
                        1720
                    ].map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: x,
                            y1: 20,
                            x2: x,
                            y2: 30,
                            stroke: "var(--cyber-glow)",
                            strokeWidth: "1",
                            opacity: "0.4"
                        }, x, false, {
                            fileName: "[project]/frontend/components/cyber-frame.tsx",
                            lineNumber: 140,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/cyber-frame.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute left-2.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5",
                children: [
                    0.9,
                    0.7,
                    0.5,
                    0.3
                ].map((opacity, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-5 w-1.5 rounded-sm",
                        style: {
                            backgroundColor: "var(--cyber-glow)",
                            opacity,
                            boxShadow: "0 0 4px var(--cyber-glow-dim)"
                        }
                    }, i, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 147,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/components/cyber-frame.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute right-2.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1.5",
                children: [
                    0.3,
                    0.5,
                    0.7,
                    0.9
                ].map((opacity, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-5 w-1.5 rounded-sm",
                        style: {
                            backgroundColor: "var(--cyber-glow)",
                            opacity,
                            boxShadow: "0 0 4px var(--cyber-glow-dim)"
                        }
                    }, i, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 160,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/components/cyber-frame.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex flex-col h-full px-12 pt-8 pb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "flex items-center justify-between pb-3 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "font-mono text-lg tracking-[0.2em] uppercase",
                                        style: {
                                            color: "var(--cyber-glow)"
                                        },
                                        children: "LONG LIVE MODELS"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 180,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono text-xs tabular-nums",
                                        style: {
                                            color: "var(--cyber-glow)",
                                            opacity: 0.5
                                        },
                                        children: time
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 186,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                        className: "flex items-center gap-0.5",
                                        children: TABS.map((tab)=>{
                                            const isActive = activeTab === tab.id;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>onTabChange?.(tab.id),
                                                className: "cyber-tab-btn group relative px-3.5 py-2 font-mono text-xs tracking-widest uppercase cursor-pointer",
                                                style: {
                                                    color: isActive ? "var(--cyber-glow)" : "var(--muted-foreground)",
                                                    backgroundColor: isActive ? "rgba(229,195,75,0.1)" : "transparent",
                                                    borderBottom: isActive ? "1px solid var(--cyber-glow)" : "1px solid transparent",
                                                    textShadow: isActive ? "0 0 10px rgba(229,195,75,0.4)" : "none",
                                                    transition: "all 0.2s ease"
                                                },
                                                onMouseEnter: (e)=>{
                                                    if (!isActive) {
                                                        e.currentTarget.style.color = "var(--cyber-glow)";
                                                        e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.06)";
                                                        e.currentTarget.style.textShadow = "0 0 10px rgba(229,195,75,0.3)";
                                                        e.currentTarget.style.borderBottom = "1px solid rgba(229,195,75,0.4)";
                                                    }
                                                },
                                                onMouseLeave: (e)=>{
                                                    if (!isActive) {
                                                        e.currentTarget.style.color = "var(--muted-foreground)";
                                                        e.currentTarget.style.backgroundColor = "transparent";
                                                        e.currentTarget.style.textShadow = "none";
                                                        e.currentTarget.style.borderBottom = "1px solid transparent";
                                                    }
                                                },
                                                children: tab.label
                                            }, tab.id, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 200,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 196,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative flex items-center gap-3 px-3.5 py-1.5",
                                        style: {
                                            backgroundColor: "rgba(229,195,75,0.04)",
                                            border: "1px solid rgba(229,195,75,0.1)",
                                            clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)"
                                        },
                                        onMouseEnter: ()=>setSpeedHover(true),
                                        onMouseLeave: ()=>setSpeedHover(false),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-[10px] tracking-widest uppercase select-none",
                                                style: {
                                                    color: "var(--muted-foreground)"
                                                },
                                                children: "СКОРОСТЬ"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 245,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "range",
                                                min: 0,
                                                max: 5,
                                                step: 0.1,
                                                value: timeSpeed,
                                                onChange: (e)=>onTimeSpeedChange?.(Math.round(parseFloat(e.target.value) * 10) / 10),
                                                className: "cyber-slider w-32 h-1",
                                                style: {
                                                    background: `linear-gradient(to right, var(--cyber-glow) ${timeSpeed / 5 * 100}%, var(--border) ${timeSpeed / 5 * 100}%)`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 252,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>onTimeSpeedChange?.(DEFAULT_SPEED),
                                                className: "font-mono text-sm tabular-nums text-right cursor-pointer",
                                                title: "Клик = сброс на " + DEFAULT_SPEED + "x",
                                                style: {
                                                    color: "var(--cyber-glow)",
                                                    textShadow: timeSpeed > 0 ? "0 0 8px rgba(229,195,75,0.4)" : "none",
                                                    background: "none",
                                                    border: "none",
                                                    padding: 0,
                                                    width: "3.2em",
                                                    transition: "opacity 0.2s ease, text-shadow 0.2s ease",
                                                    opacity: timeSpeed === DEFAULT_SPEED ? 0.7 : 1
                                                },
                                                onMouseEnter: (e)=>{
                                                    e.currentTarget.style.textShadow = "0 0 14px rgba(229,195,75,0.7)";
                                                },
                                                onMouseLeave: (e)=>{
                                                    e.currentTarget.style.textShadow = timeSpeed > 0 ? "0 0 8px rgba(229,195,75,0.4)" : "none";
                                                },
                                                children: [
                                                    timeSpeed.toFixed(1),
                                                    "x"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 265,
                                                columnNumber: 15
                                            }, this),
                                            speedHover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 font-mono text-[10px] tracking-wide whitespace-nowrap pointer-events-none z-50",
                                                style: {
                                                    backgroundColor: "rgba(17,17,24,0.95)",
                                                    border: "1px solid rgba(229,195,75,0.25)",
                                                    color: "var(--cyber-glow)",
                                                    clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)"
                                                },
                                                children: "Скорость течения времени мира // Клик на значение = сброс"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 291,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                                        lineNumber: 235,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 177,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative flex-1 min-h-0 overflow-hidden rounded-sm border",
                        style: {
                            borderColor: "rgba(229,195,75,0.2)"
                        },
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "shrink-0 pt-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative overflow-hidden",
                            style: {
                                clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)"
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 p-1.5",
                                    style: {
                                        border: "1px solid rgba(229,195,75,0.2)",
                                        backgroundColor: "rgba(17,17,24,0.9)",
                                        animation: "cyber-shimmer 4s ease-in-out infinite",
                                        clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)"
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "shrink-0 pl-2.5",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-2 w-2 rounded-full",
                                                style: {
                                                    backgroundColor: "var(--cyber-glow)",
                                                    boxShadow: "0 0 6px var(--cyber-glow-dim)",
                                                    animation: "cyber-pulse 2s ease-in-out infinite"
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/components/cyber-frame.tsx",
                                                lineNumber: 334,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/cyber-frame.tsx",
                                            lineNumber: 333,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            value: eventText,
                                            onChange: (e)=>setEventText(e.target.value),
                                            onKeyDown: (e)=>{
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSubmitEvent();
                                                }
                                            },
                                            placeholder: "Введите событие для мира агентов...",
                                            className: "flex-1 bg-transparent font-mono text-sm px-2 py-2.5 placeholder:opacity-30 focus:outline-none",
                                            style: {
                                                color: "var(--foreground)",
                                                caretColor: "var(--cyber-glow)"
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/cyber-frame.tsx",
                                            lineNumber: 344,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleSubmitEvent,
                                            className: "shrink-0 px-5 py-2.5 mr-1.5 font-mono text-[11px] tracking-widest uppercase cursor-pointer",
                                            style: {
                                                backgroundColor: "rgba(229,195,75,0.08)",
                                                color: "var(--cyber-glow)",
                                                border: "1px solid rgba(229,195,75,0.25)",
                                                clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
                                                transition: "all 0.25s ease"
                                            },
                                            onMouseEnter: (e)=>{
                                                e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.18)";
                                                e.currentTarget.style.borderColor = "rgba(229,195,75,0.6)";
                                                e.currentTarget.style.boxShadow = "0 0 20px rgba(229,195,75,0.15), inset 0 0 12px rgba(229,195,75,0.06)";
                                                e.currentTarget.style.textShadow = "0 0 10px rgba(229,195,75,0.5)";
                                                e.currentTarget.style.color = "#f5d96b";
                                            },
                                            onMouseLeave: (e)=>{
                                                e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.08)";
                                                e.currentTarget.style.borderColor = "rgba(229,195,75,0.25)";
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.textShadow = "none";
                                                e.currentTarget.style.color = "var(--cyber-glow)";
                                            },
                                            onMouseDown: (e)=>{
                                                e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.3)";
                                                e.currentTarget.style.transform = "scale(0.97)";
                                            },
                                            onMouseUp: (e)=>{
                                                e.currentTarget.style.backgroundColor = "rgba(229,195,75,0.18)";
                                                e.currentTarget.style.transform = "scale(1)";
                                            },
                                            children: "ДОБАВИТЬ СОБЫТИЕ"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/cyber-frame.tsx",
                                            lineNumber: 362,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/components/cyber-frame.tsx",
                                    lineNumber: 323,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-0 left-0 w-4 h-4 pointer-events-none",
                                    style: {
                                        borderTop: "1px solid var(--cyber-glow)",
                                        borderLeft: "1px solid var(--cyber-glow)",
                                        opacity: 0.5,
                                        clipPath: "polygon(0 0, 100% 0, 0 100%)"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/cyber-frame.tsx",
                                    lineNumber: 400,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-0 right-0 w-4 h-4 pointer-events-none",
                                    style: {
                                        borderTop: "1px solid var(--cyber-glow)",
                                        borderRight: "1px solid var(--cyber-glow)",
                                        opacity: 0.5,
                                        clipPath: "polygon(0 0, 100% 0, 100% 100%)"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/cyber-frame.tsx",
                                    lineNumber: 409,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/cyber-frame.tsx",
                            lineNumber: 317,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/cyber-frame.tsx",
                        lineNumber: 316,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/cyber-frame.tsx",
                lineNumber: 175,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/cyber-frame.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/components/placeholder-content.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlaceholderContent",
    ()=>PlaceholderContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
function PlaceholderContent() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex h-full w-full items-center justify-center",
        style: {
            backgroundColor: "var(--cyber-surface)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-0 opacity-10",
                style: {
                    backgroundImage: "linear-gradient(var(--cyber-glow) 1px, transparent 1px), linear-gradient(90deg, var(--cyber-glow) 1px, transparent 1px)",
                    backgroundSize: "60px 60px"
                }
            }, void 0, false, {
                fileName: "[project]/frontend/components/placeholder-content.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-24 w-24 rounded-full border-2 flex items-center justify-center",
                        style: {
                            borderColor: "var(--cyber-glow)",
                            boxShadow: "0 0 30px var(--cyber-glow-dim), inset 0 0 30px var(--cyber-glow-dim)"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            width: "40",
                            height: "40",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "var(--cyber-glow)",
                            strokeWidth: "1.5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "12",
                                    cy: "12",
                                    r: "3"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/placeholder-content.tsx",
                                    lineNumber: 30,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M12 1v4M12 19v4M1 12h4M19 12h4"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/placeholder-content.tsx",
                                    lineNumber: 31,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/placeholder-content.tsx",
                                    lineNumber: 32,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/placeholder-content.tsx",
                            lineNumber: 29,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/placeholder-content.tsx",
                        lineNumber: 22,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-mono text-sm tracking-[0.3em] uppercase",
                        style: {
                            color: "var(--cyber-glow)",
                            opacity: 0.6
                        },
                        children: "ОЖИДАНИЕ ДАННЫХ ГРАФА"
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/placeholder-content.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/placeholder-content.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/placeholder-content.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/app/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$cyber$2d$frame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/cyber-frame.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$placeholder$2d$content$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/placeholder-content.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function Home() {
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("events");
    const [timeSpeed, setTimeSpeed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const handleAddEvent = (text)=>{
        // Пока просто выводим в консоль.
        // На шаге 6 (SignalR) это будет отправляться на бэкенд.
        console.log("[v0] Новое событие:", text);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$cyber$2d$frame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CyberFrame"], {
        activeTab: activeTab,
        onTabChange: setActiveTab,
        onAddEvent: handleAddEvent,
        timeSpeed: timeSpeed,
        onTimeSpeedChange: setTimeSpeed,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$placeholder$2d$content$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaceholderContent"], {}, void 0, false, {
            fileName: "[project]/frontend/app/page.tsx",
            lineNumber: 35,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/app/page.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5c53e87a._.js.map