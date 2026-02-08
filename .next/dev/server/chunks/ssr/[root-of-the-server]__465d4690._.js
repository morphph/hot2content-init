module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/components/MermaidRenderer.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MermaidRenderer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mermaid$2f$dist$2f$mermaid$2e$core$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/mermaid/dist/mermaid.core.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
function MermaidRenderer({ content }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mermaid$2f$dist$2f$mermaid$2e$core$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].initialize({
            startOnLoad: false,
            theme: 'neutral',
            fontFamily: 'inherit',
            fontSize: 14,
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            timeline: {
                useMaxWidth: true
            }
        });
        const renderDiagrams = async ()=>{
            if (!containerRef.current) return;
            // Find all mermaid code blocks
            const codeBlocks = containerRef.current.querySelectorAll('pre code.language-mermaid, pre code');
            for(let i = 0; i < codeBlocks.length; i++){
                const block = codeBlocks[i];
                const pre = block.parentElement;
                const code = block.textContent || '';
                // Check if it's mermaid content
                if (code.trim().startsWith('graph') || code.trim().startsWith('flowchart') || code.trim().startsWith('timeline') || code.trim().startsWith('sequenceDiagram') || code.trim().startsWith('classDiagram') || code.trim().startsWith('stateDiagram') || code.trim().startsWith('erDiagram') || code.trim().startsWith('gantt') || code.trim().startsWith('pie') || code.trim().startsWith('mindmap')) {
                    try {
                        const id = `mermaid-${i}-${Date.now()}`;
                        const { svg } = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$mermaid$2f$dist$2f$mermaid$2e$core$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].render(id, code.trim());
                        // Create wrapper div
                        const wrapper = document.createElement('div');
                        wrapper.className = 'mermaid-diagram';
                        wrapper.innerHTML = svg;
                        // Replace the pre block
                        pre?.replaceWith(wrapper);
                    } catch (err) {
                        console.error('Mermaid render error:', err);
                    }
                }
            }
        };
        renderDiagrams();
    }, [
        content
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "article-content",
        dangerouslySetInnerHTML: {
            __html: content
        }
    }, void 0, false, {
        fileName: "[project]/src/components/MermaidRenderer.tsx",
        lineNumber: 74,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__465d4690._.js.map