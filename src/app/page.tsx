// "use client";
// import { useState } from "react";

// type RunStatus = "idle" | "running" | "done" | "error";
// type CodeReviewMode = "paste" | "github-pr" | "github-url" | "git-diff";

// interface Issue {
//   id: string;
//   severity: "critical" | "serious" | "warning" | "info";
//   issue: string;
//   line?: number;
//   fix: string;
//   codePreview?: string;
//   codeFixed?: string;
// }

// interface ScanResult {
//   score: number;
//   summary: string;
//   passed: number;
//   scannedUrl?: string;
//   issues?: Issue[];
//   violations?: Issue[];
//   fixed_code?: string;
//   original_code?: string;
//   inputMode?: CodeReviewMode;
//   sourceLabel?: string;
// }

// const agents = [
//   {
//     id: "wcag", icon: "♿", title: "WCAG Audit",
//     desc: "Scans for accessibility violations, generates AI fixes, and opens a review diff before pushing.",
//     color: "#EEEDFE", badge: "Active", badgeColor: "#EAF3DE", badgeText: "#27500A",
//     mockResult: {
//       score: 67, summary: "4 accessibility violations across 3 elements.", passed: 18, scannedUrl: "",
//       violations: [
//         { id: "img-alt", severity: "critical" as const, issue: "3 images missing alt text", fix: 'Add alt="..." to each <img>', codePreview: '<img src="hero.jpg" class="hero">', codeFixed: '<img src="hero.jpg" class="hero" alt="Hero banner image">' },
//         { id: "contrast", severity: "serious" as const, issue: "Button contrast ratio 2.8:1 (min 4.5:1)", fix: "Change color from #aaa to #595959", codePreview: '.btn { color: #aaa; }', codeFixed: '.btn { color: #595959; }' },
//         { id: "label", severity: "warning" as const, issue: "Email input has no associated label", fix: "Add aria-label attribute", codePreview: '<input type="email" placeholder="Email">', codeFixed: '<input type="email" placeholder="Email" aria-label="Email address">' },
//         { id: "skip", severity: "info" as const, issue: "No skip navigation link found", fix: "Add skip-to-main link as first element", codePreview: '<body>\n  <header>...</header>', codeFixed: '<body>\n  <a href="#main" class="skip">Skip to content</a>\n  <header>...</header>' },
//       ],
//     },
//   },
//   {
//     id: "seo", icon: "🔍", title: "SEO Check",
//     desc: "Audits meta tags, headings, structured data. Proposes fixes and submits a PR on approval.",
//     color: "#E1F5EE", badge: "Active", badgeColor: "#EAF3DE", badgeText: "#27500A",
//     mockResult: {
//       score: 74, summary: "3 SEO issues. Page indexable but missing key metadata.", passed: 11, scannedUrl: "",
//       issues: [
//         { id: "meta", severity: "critical" as const, issue: "Meta description missing", fix: "Add <meta name='description'>", codePreview: '<head>\n  <title>App</title>', codeFixed: '<head>\n  <title>App</title>\n  <meta name="description" content="...">' },
//         { id: "h1", severity: "critical" as const, issue: "No H1 tag on page", fix: "Add one <h1> as primary heading", codePreview: '<main>\n  <h2>Welcome</h2>', codeFixed: '<main>\n  <h1>AI Super Agents</h1>\n  <h2>Welcome</h2>' },
//         { id: "og", severity: "warning" as const, issue: "Open Graph tags missing", fix: "Add og:title, og:image in <head>", codePreview: '<!-- no og tags -->', codeFixed: '<meta property="og:title" content="AI Super Agents">' },
//       ],
//     },
//   },
//   {
//     id: "codereview", icon: "🧠", title: "Code Review",
//     desc: "Review from GitHub PR, file path, git diff, or pasted code. Claude finds issues and fixes them.",
//     color: "#E6F1FB", badge: "Beta", badgeColor: "#EEEDFE", badgeText: "#3C3489",
//     mockResult: null,
//   },
// ];

// const sevLight: Record<string, { bg: string; text: string; border: string }> = {
//   critical: { bg: "#FCEBEB", text: "#A32D2D", border: "#F7C1C1" },
//   serious:  { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
//   warning:  { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
//   info:     { bg: "#F1EFE8", text: "#444441", border: "#D3D1C7" },
// };

// const sevTerminal: Record<string, { color: string; bg: string; prefix: string }> = {
//   critical: { color: "#A32D2D", bg: "rgba(255,78,78,0.12)", prefix: "[CRIT]" },
//   serious:  { color: "#BA7517", bg: "rgba(255,224,51,0.12)", prefix: "[WARN]" },
//   warning:  { color: "#BA7517", bg: "rgba(255,224,51,0.12)", prefix: "[WARN]" },
//   info:     { color: "#aaa",    bg: "rgba(255,255,255,0.06)", prefix: "[INFO]" },
// };

// const inputModes: { id: CodeReviewMode; icon: string; label: string; desc: string }[] = [
//   { id: "github-pr",  icon: "🔀", label: "GitHub PR",      desc: "Paste a PR URL — agent fetches the diff and reviews all changed files" },
//   { id: "github-url", icon: "🔗", label: "GitHub file URL", desc: "Paste a GitHub file URL — agent fetches content directly" },
//   { id: "git-diff",   icon: "📋", label: "Git diff",        desc: "Paste output of git diff — agent reviews only what changed" },
//   { id: "paste",      icon: "📝", label: "Paste code",      desc: "Paste any file manually — full file review" },
// ];

// const modeMockResults: Record<CodeReviewMode, { issues: Issue[]; score: number; summary: string; passed: number; sourceLabel: string }> = {
//   "github-pr": {
//     score: 68, passed: 14, sourceLabel: "PR #42 — feat/new-dashboard",
//     summary: "5 issues found across 3 changed files in this PR.",
//     issues: [
//       { id: "pr-1", severity: "critical", issue: "fetchData() called without await in Dashboard.tsx line 34", line: 34, fix: "Add await — missing it causes race condition on mount", codePreview: "const data = fetchData()\nsetData(data)", codeFixed: "const data = await fetchData()\nsetData(data)" },
//       { id: "pr-2", severity: "serious", issue: "useEffect dependency array missing 'userId'", line: 58, fix: "Add userId to deps array to prevent stale closure", codePreview: "useEffect(() => {\n  loadUser(userId)\n}, [])", codeFixed: "useEffect(() => {\n  loadUser(userId)\n}, [userId])" },
//       { id: "pr-3", severity: "warning", issue: "console.log left in api/route.ts line 12", line: 12, fix: "Remove before merging — leaks request data", codePreview: "console.log('req body:', body)", codeFixed: "// removed debug log" },
//       { id: "pr-4", severity: "warning", issue: "Unused import React in components/Card.tsx", fix: "Remove unused import — not needed in React 17+", codePreview: "import React from 'react'", codeFixed: "// removed — not needed" },
//       { id: "pr-5", severity: "info", issue: "Function name 'getData' is too generic", fix: "Rename to describe what data — e.g. fetchUserProfile()", codePreview: "async function getData(id)", codeFixed: "async function fetchUserProfile(id)" },
//     ],
//   },
//   "github-url": {
//     score: 74, passed: 11, sourceLabel: "github.com/Shubham23061989/super-ai-agents/src/app/page.tsx",
//     summary: "3 issues found in this file.",
//     issues: [
//       { id: "gu-1", severity: "warning", issue: "var used instead of const/let (line 8)", line: 8, fix: "Replace var with const for block scoping", codePreview: "var agents = []", codeFixed: "const agents = []" },
//       { id: "gu-2", severity: "warning", issue: "Missing return type on handleRun function", fix: "Add explicit return type: Promise<void>", codePreview: "const handleRun = async (id: string) => {", codeFixed: "const handleRun = async (id: string): Promise<void> => {" },
//       { id: "gu-3", severity: "info", issue: "Magic number 3000 — no label for what it means", line: 42, fix: "Extract to named constant: SCAN_DELAY_MS = 3000", codePreview: "await new Promise(r => setTimeout(r, 3000))", codeFixed: "const SCAN_DELAY_MS = 3000\nawait new Promise(r => setTimeout(r, SCAN_DELAY_MS))" },
//     ],
//   },
//   "git-diff": {
//     score: 81, passed: 16, sourceLabel: "git diff main..feat/new-agents (4 files changed)",
//     summary: "2 minor issues in the diff. Overall quality is good.",
//     issues: [
//       { id: "gd-1", severity: "warning", issue: "New function fetchAgentData missing error handling", fix: "Wrap fetch call in try/catch", codePreview: "+const fetchAgentData = async (id) => {\n+  const res = await fetch(`/api/${id}`)\n+  return res.json()\n+}", codeFixed: "+const fetchAgentData = async (id) => {\n+  try {\n+    const res = await fetch(`/api/${id}`)\n+    return res.json()\n+  } catch (err) {\n+    console.error('fetch failed:', err)\n+  }\n+}" },
//       { id: "gd-2", severity: "info", issue: "Added TODO comment — should be a GitHub issue", fix: "Create a GitHub issue and replace TODO with issue link", codePreview: "+// TODO: add pagination later", codeFixed: "+// See: github.com/repo/issues/45" },
//     ],
//   },
//   "paste": {
//     score: 72, passed: 11, sourceLabel: "Pasted file",
//     summary: "3 issues found. AI has generated fixes for each one.",
//     issues: [
//       { id: "p-1", severity: "warning", issue: "console.log() in production code", fix: "Remove console.log before deploying", codePreview: "console.log('debug', data)", codeFixed: "// debug log removed" },
//       { id: "p-2", severity: "warning", issue: "var used instead of const/let", fix: "Replace var with const for block scoping", codePreview: "var data = fetch('/api')", codeFixed: "const data = fetch('/api')" },
//       { id: "p-3", severity: "critical", issue: "API call has no error handling", fix: "Wrap fetch() in try/catch and handle error state", codePreview: "const res = await fetch('/api/data')\nconst json = await res.json()", codeFixed: "try {\n  const res = await fetch('/api/data')\n  const json = await res.json()\n} catch (err) {\n  console.error(err)\n}" },
//     ],
//   },
// };

// function stripUrl(url: string) { return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

// function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
//   return (
//     <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
//       <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#1a1a1a" : "#ddd", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
//         <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
//       </div>
//       <span style={{ fontSize: 13, color: "#555" }}>{label}</span>
//     </label>
//   );
// }

// // ── Code Review Input Panel ────────────────────────────────────────────────────
// function CodeReviewInput({ onResult }: { onResult: (r: ScanResult) => void }) {
//   const [mode, setMode] = useState<CodeReviewMode>("github-pr");
//   const [prUrl, setPrUrl] = useState("");
//   const [fileUrl, setFileUrl] = useState("");
//   const [diff, setDiff] = useState("");
//   const [filePath, setFilePath] = useState("src/app/page.tsx");
//   const [code, setCode] = useState("");
//   const [scanning, setScanning] = useState(false);
//   const [error, setError] = useState("");

//   const canScan = () => {
//     if (mode === "github-pr") return prUrl.trim().length > 0;
//     if (mode === "github-url") return fileUrl.trim().length > 0;
//     if (mode === "git-diff") return diff.trim().length > 0;
//     if (mode === "paste") return code.trim().length > 0;
//     return false;
//   };

//   const handleScan = async () => {
//     if (!canScan()) return;
//     setError(""); setScanning(true);
//     await new Promise(r => setTimeout(r, 2400));
//     const mock = modeMockResults[mode];
//     const sourceLabel = mode === "github-pr" ? prUrl || mock.sourceLabel
//       : mode === "github-url" ? fileUrl || mock.sourceLabel
//       : mode === "git-diff" ? mock.sourceLabel
//       : filePath || mock.sourceLabel;
//     onResult({ ...mock, scannedUrl: sourceLabel, inputMode: mode, sourceLabel });
//     setScanning(false);
//   };

//   const inputStyle = { width: "100%", fontSize: 13, padding: "9px 12px", border: "0.5px solid #eee", borderRadius: 8, outline: "none", color: "#1a1a1a", background: "#fff", marginBottom: 14 };
//   const areaStyle = { ...inputStyle, fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace", fontSize: 12, resize: "none" as const, background: "#f9f9f8", lineHeight: 1.65, marginBottom: 14 };

//   return (
//     <div>
//       {/* Mode selector */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
//         {inputModes.map(m => (
//           <div key={m.id} onClick={() => setMode(m.id)}
//             style={{ padding: "10px 12px", border: `${mode === m.id ? "2px" : "0.5px"} solid ${mode === m.id ? "#1a1a1a" : "#eee"}`, borderRadius: 10, cursor: "pointer", background: mode === m.id ? "#f9f9f8" : "#fff", transition: "all .15s" }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
//               <span style={{ fontSize: 16 }}>{m.icon}</span>
//               <span style={{ fontSize: 13, fontWeight: mode === m.id ? 500 : 400, color: "#1a1a1a" }}>{m.label}</span>
//             </div>
//             <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{m.desc}</div>
//           </div>
//         ))}
//       </div>

//       {/* Mode-specific input */}
//       {mode === "github-pr" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>GitHub PR URL</label>
//           <input value={prUrl} onChange={e => setPrUrl(e.target.value)} style={inputStyle} placeholder="https://github.com/Shubham23061989/super-ai-agents/pull/42" />
//           <div style={{ padding: "10px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
//             <strong style={{ fontWeight: 500 }}>What happens:</strong> Agent fetches the PR diff via GitHub API, reviews all changed files, finds issues, and posts inline comments directly on the PR.
//             <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
//               {["Requires GITHUB_TOKEN in .env", "Reviews all changed files", "Posts inline PR comments"].map(t => (
//                 <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#EAF3DE", color: "#27500A" }}>{t}</span>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {mode === "github-url" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>GitHub file URL</label>
//           <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputStyle} placeholder="https://github.com/Shubham23061989/super-ai-agents/blob/main/src/app/page.tsx" />
//           <div style={{ padding: "10px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
//             <strong style={{ fontWeight: 500 }}>What happens:</strong> Agent fetches raw file content from GitHub and reviews the full file. Works on public repos without a token.
//           </div>
//         </div>
//       )}

//       {mode === "git-diff" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>Git diff output</label>
//           <div style={{ fontSize: 12, color: "#888", marginBottom: 8, padding: "6px 10px", background: "#f9f9f8", borderRadius: 6, fontFamily: "monospace" }}>
//             Run: <code style={{ color: "#1a1a1a" }}>git diff main</code> or <code style={{ color: "#1a1a1a" }}>git diff --staged</code> → copy output → paste below
//           </div>
//           <textarea value={diff} onChange={e => setDiff(e.target.value)} rows={10} style={{ ...areaStyle, marginBottom: 14 }} placeholder={"diff --git a/src/app/page.tsx b/src/app/page.tsx\n--- a/src/app/page.tsx\n+++ b/src/app/page.tsx\n@@ -1,5 +1,6 @@\n+const newFeature = true\n const agents = [..."} />
//           <div style={{ padding: "10px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
//             <strong style={{ fontWeight: 500 }}>What happens:</strong> Agent reviews only what changed — not the whole file. Ideal for reviewing before committing.
//           </div>
//         </div>
//       )}

//       {mode === "paste" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>File path</label>
//           <input value={filePath} onChange={e => setFilePath(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} placeholder="src/app/page.tsx" />
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>Paste code</label>
//           <textarea value={code} onChange={e => setCode(e.target.value)} rows={12} style={areaStyle} placeholder={"// paste your code here...\nfunction App() {\n  var data = null\n  console.log('debug')\n  fetch('/api/data')\n  return <div>{data}</div>\n}"} />
//         </div>
//       )}

//       {error && <div style={{ fontSize: 12, color: "#A32D2D", marginBottom: 12, padding: "8px 12px", background: "#FCEBEB", borderRadius: 8 }}>{error}</div>}

//       <button onClick={handleScan} disabled={!canScan() || scanning}
//         style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 500, border: `0.5px solid ${canScan() ? "#1D9E75" : "#ddd"}`, borderRadius: 10, background: scanning ? "#f9f9f8" : canScan() ? "#E1F5EE" : "#f9f9f8", color: scanning ? "#888" : canScan() ? "#0F6E56" : "#bbb", cursor: canScan() && !scanning ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
//         {scanning ? (
//           <><span style={{ width: 12, height: 12, border: "2px solid #ddd", borderTop: "2px solid #0F6E56", borderRadius: "50%", animation: "tSpin 0.8s linear infinite", flexShrink: 0 }} />Scanning...</>
//         ) : `▶ Review ${inputModes.find(m => m.id === mode)?.label}`}
//       </button>
//     </div>
//   );
// }

// // ── Terminal Side Panel ────────────────────────────────────────────────────────
// type PanelStep = "input" | "score" | "suggestions" | "diff" | "pushing" | "pushed";

// function TerminalSidePanel({ agentId, scanUrl, myCode, gitConnected, onClose, onPRPushed }: {
//   agentId: string; scanUrl: string; myCode: boolean; gitConnected: boolean;
//   onClose: () => void; onPRPushed: (count: number) => void;
// }) {
//   const agent = agents.find(a => a.id === agentId)!;
//   const isCodeReview = agentId === "codereview";
//   const canPush = myCode && gitConnected;

//   const [step, setStep] = useState<PanelStep>(isCodeReview ? "input" : "score");
//   const [result, setResult] = useState<ScanResult | null>(null);
//   const [approved, setApproved] = useState<Set<string>>(new Set());
//   const [prUrl, setPrUrl] = useState("");
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [logLines, setLogLines] = useState<string[]>([]);
//   const [pushing, setPushing] = useState(false);

//   const issues = result ? (result.issues || result.violations || []) : [];

//   // Auto-run for WCAG/SEO
//   useState(() => {
//     if (!isCodeReview) {
//       const logs: Record<string, string[]> = {
//         wcag: ["initialising wcag scanner...", "fetching page: " + stripUrl(scanUrl), "injecting axe-core...", "running accessibility audit...", "analysing violations...", "generating AI fixes..."],
//         seo:  ["initialising seo scanner...", "fetching page: " + stripUrl(scanUrl), "parsing meta tags...", "checking headings + og tags...", "running lighthouse checks...", "generating suggestions..."],
//       };
//       let scanning = true;
//       setStep("input");
//       const ls = logs[agentId] || ["scanning..."];
//       let i = 0;
//       const iv = setInterval(() => {
//         if (i < ls.length) { setLogLines(p => [...p, ls[i]]); i++; }
//         else {
//           clearInterval(iv);
//           const agent = agents.find(a => a.id === agentId);
//           if (agent?.mockResult) setResult({ ...agent.mockResult as ScanResult, scannedUrl: scanUrl });
//           setStep("score"); scanning = false;
//         }
//       }, 340);
//       return () => { if (scanning) clearInterval(iv); };
//     }
//   });

//   const handleCodeReviewResult = (r: ScanResult) => {
//     setResult(r);
//     setStep("score");
//   };

//   const handlePush = async () => {
//     setPushing(true);
//     setLogLines(["creating branch: fix/ai-review-" + Date.now(), "committing approved fixes...", "opening pull request...", "notifying vercel preview build..."]);
//     await new Promise(r => setTimeout(r, 2200));
//     try {
//       const res = await fetch("/api/agents/codereview", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filePath: result?.sourceLabel || "src/app/page.tsx", fixedContent: "// fixed", summary: result?.summary || "AI fixes" }) });
//       const data = await res.json();
//       setPrUrl(data.pr_url || "https://github.com/Shubham23061989/super-ai-agents/pulls");
//     } catch { setPrUrl("https://github.com/Shubham23061989/super-ai-agents/pulls"); }
//     setPushing(false);
//     setStep("pushed");
//     onPRPushed(approved.size);
//   };

//   const scoreColor = result ? (result.score >= 80 ? "#1D9E75" : result.score >= 60 ? "#BA7517" : "#E24B4A") : "#888";
//   const scoreBg    = result ? (result.score >= 80 ? "#E1F5EE" : result.score >= 60 ? "#FAEEDA" : "#FCEBEB") : "#f9f9f8";
//   const scoreBorder= result ? (result.score >= 80 ? "#9FE1CB" : result.score >= 60 ? "#FAC775" : "#F7C1C1") : "#eee";
//   const scoreLabel = result ? (result.score >= 80 ? "Good" : result.score >= 60 ? "Needs work" : "Poor") : "";

//   const modeLabels: Record<CodeReviewMode, string> = {
//     "github-pr": "PR review", "github-url": "File URL", "git-diff": "Git diff", "paste": "Paste"
//   };

//   const steps = [
//     { key: "score",       label: "Score" },
//     { key: "suggestions", label: "Fixes" },
//     ...(result?.inputMode === "paste" ? [{ key: "diff", label: "Diff" }] : []),
//   ];
//   const currentStepIdx = steps.findIndex(s => s.key === step);

//   return (
//     <>
//       <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 40 }} />
//       <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 620, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif", boxShadow: "-6px 0 40px rgba(0,0,0,0.1)", borderLeft: "0.5px solid #e5e5e3", animation: "tSlideIn 0.22s ease-out" }}>
//         <style>{`
//           @keyframes tSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
//           @keyframes tSpin{to{transform:rotate(360deg)}}
//           .tpscroll::-webkit-scrollbar{width:4px}.tpscroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
//           .tfix{border:0.5px solid #eee;border-radius:10px;overflow:hidden;background:#fff;margin-bottom:10px;transition:border-color .15s}
//           .tfix.tapproved{border-color:#9FE1CB;background:#FDFFFE}
//           .tfbtn{font-family:system-ui,-apple-system,sans-serif;font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #ddd;background:#fff;color:#555;cursor:pointer;transition:all .15s}
//           .tfbtn:hover{border-color:#999;color:#333}
//           .tfbtn.ton{border-color:#1D9E75;color:#0F6E56;background:#E1F5EE}
//           .tfbtn.tgreen{border-color:#1D9E75;color:#0F6E56;background:#E1F5EE}
//           .tfbtn.tgreen:hover{background:#C6F6D5}
//           .mode-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:2px 8px;border-radius:20px;background:#EEEDFE;color:#3C3489;font-weight:500}
//         `}</style>

//         {/* Header */}
//         <div style={{ padding: "13px 18px", borderBottom: "0.5px solid #eee", flexShrink: 0, background: "#f9f9f8" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{ display: "flex", gap: 5 }}>
//               <div onClick={onClose} style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF4E4E", cursor: "pointer" }} title="Close" />
//               <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFE033" }} />
//               <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#00FF88" }} />
//             </div>
//             <span style={{ fontSize: 13, color: "#555", marginLeft: 2 }}>AI Super Agents</span>
//             <span style={{ fontSize: 13, color: "#ccc" }}>›</span>
//             <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{agent.title}</span>
//             {result?.inputMode && <span className="mode-chip">{result.inputMode === "github-pr" ? "🔀" : result.inputMode === "github-url" ? "🔗" : result.inputMode === "git-diff" ? "📋" : "📝"} {modeLabels[result.inputMode]}</span>}
//             <span style={{ marginLeft: "auto", fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
//               {result?.sourceLabel ? stripUrl(result.sourceLabel) : stripUrl(scanUrl)}
//             </span>
//           </div>
//         </div>

//         {/* Mode line */}
//         {!["input"].includes(step) && (
//           <div style={{ padding: "7px 18px", borderBottom: "0.5px solid #f0f0ee", background: "#f5f5f3", display: "flex", alignItems: "center", gap: 8 }}>
//             <span style={{ fontSize: 12, color: canPush ? "#1D9E75" : myCode ? "#BA7517" : "#888" }}>
//               {canPush ? "Full mode — fixes + git push enabled" : myCode ? "Fixes mode — git push disabled" : "Read-only — scores & suggestions only"}
//             </span>
//           </div>
//         )}

//         {/* Step nav */}
//         {result && !["pushing","pushed","input"].includes(step) && (
//           <div style={{ padding: "8px 18px", borderBottom: "0.5px solid #f0f0ee", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, background: "#f5f5f3" }}>
//             {isCodeReview && (
//               <button className="tfbtn" onClick={() => { setStep("input"); setResult(null); setApproved(new Set()); }} style={{ fontSize: 11, marginRight: 8 }}>← Change input</button>
//             )}
//             {steps.map((s, i) => {
//               const isDone = currentStepIdx > i, isActive = step === s.key;
//               return (
//                 <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
//                   <button className={`tfbtn ${isActive ? "ton" : ""}`} onClick={() => { if (isDone || isActive) setStep(s.key as PanelStep); }} style={{ opacity: !isDone && !isActive ? 0.35 : 1 }}>
//                     {isDone ? "✓ " : ""}{s.label}
//                   </button>
//                   {i < steps.length - 1 && <span style={{ color: "#ccc", fontSize: 14 }}>›</span>}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Body */}
//         <div className="tpscroll" style={{ flex: 1, overflowY: "auto", padding: "18px" }}>

//           {/* INPUT — WCAG/SEO scanning log */}
//           {step === "input" && !isCodeReview && (
//             <div>
//               <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
//                 <div style={{ width: 10, height: 10, border: "2px solid #1a1a1a", borderTop: "2px solid transparent", borderRadius: "50%", animation: "tSpin 0.8s linear infinite" }} />
//                 <span style={{ fontSize: 13, color: "#1a1a1a" }}>Scanning {stripUrl(scanUrl)}...</span>
//               </div>
//               <div style={{ background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, padding: "12px 14px", minHeight: 160 }}>
//                 {logLines.map((line, i) => (
//                   <div key={i} style={{ fontSize: 12, color: i === logLines.length - 1 ? "#444" : "#aaa", lineHeight: 2, fontFamily: "monospace" }}>
//                     <span style={{ color: "#888" }}>$ </span>{line}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* INPUT — Code Review mode selector */}
//           {step === "input" && isCodeReview && (
//             <CodeReviewInput onResult={handleCodeReviewResult} />
//           )}

//           {/* SCORE */}
//           {step === "score" && result && (
//             <div>
//               <div style={{ background: scoreBg, border: `1.5px solid ${scoreBorder}`, borderRadius: 12, padding: "20px 18px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
//                 <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 12px 0 80px", background: `${scoreColor}18` }} />
//                 {result.sourceLabel && (
//                   <div style={{ fontSize: 11, color: scoreColor, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                     {result.inputMode === "github-pr" ? "🔀 " : result.inputMode === "github-url" ? "🔗 " : result.inputMode === "git-diff" ? "📋 " : "📝 "}
//                     {result.sourceLabel}
//                   </div>
//                 )}
//                 <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 12 }}>
//                   <div style={{ fontSize: 48, fontWeight: 500, color: scoreColor, lineHeight: 1 }}>{result.score}</div>
//                   <div style={{ paddingBottom: 6 }}>
//                     <div style={{ fontSize: 14, color: scoreColor, fontWeight: 500 }}>/100</div>
//                     <div style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${scoreColor}22`, color: scoreColor, marginTop: 3 }}>{scoreLabel}</div>
//                   </div>
//                 </div>
//                 <div style={{ height: 6, background: `${scoreColor}25`, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
//                   <div style={{ width: `${result.score}%`, height: "100%", background: scoreColor, borderRadius: 3, transition: "width 1s ease" }} />
//                 </div>
//                 <div style={{ fontSize: 12, color: scoreColor }}>{result.summary}</div>
//               </div>

//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
//                 {[
//                   { label: "Issues", value: issues.length, bg: issues.length > 0 ? "#FCEBEB" : "#EAF3DE", color: issues.length > 0 ? "#A32D2D" : "#27500A", border: issues.length > 0 ? "#F7C1C1" : "#C0DD97" },
//                   { label: "Critical", value: issues.filter(i => i.severity === "critical" || i.severity === "serious").length, bg: "#FCEBEB", color: "#A32D2D", border: "#F7C1C1" },
//                   { label: "Passed", value: result.passed, bg: "#EAF3DE", color: "#27500A", border: "#C0DD97" },
//                 ].map(m => (
//                   <div key={m.label} style={{ background: m.bg, border: `0.5px solid ${m.border}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
//                     <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
//                     <div style={{ fontSize: 10, color: m.color, marginTop: 2 }}>{m.label}</div>
//                   </div>
//                 ))}
//               </div>

//               <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 10 }}>Issues found</div>
//               <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
//                 {issues.map((item: Issue) => {
//                   const sl = sevLight[item.severity] || sevLight.info;
//                   const tc = sevTerminal[item.severity] || sevTerminal.info;
//                   return (
//                     <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#fff", border: `0.5px solid ${sl.border}`, borderRadius: 8, borderLeft: `3px solid ${sl.text}` }}>
//                       <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: tc.bg, color: tc.color, flexShrink: 0 }}>{tc.prefix}</span>
//                       <span style={{ fontSize: 12, color: "#1a1a1a", flex: 1 }}>{item.issue}</span>
//                       {item.line && <span style={{ fontSize: 10, color: "#bbb" }}>L{item.line}</span>}
//                     </div>
//                   );
//                 })}
//               </div>

//               {myCode ? (
//                 <button className="tfbtn tgreen" onClick={() => setStep("suggestions")} style={{ width: "100%", padding: "10px", fontSize: 13 }}>View AI fixes →</button>
//               ) : (
//                 <div style={{ padding: "12px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#888" }}>
//                   Enable "I own this code" in the dashboard to unlock AI fixes
//                 </div>
//               )}
//             </div>
//           )}

//           {/* SUGGESTIONS */}
//           {step === "suggestions" && result && (
//             <div>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
//                 <span style={{ fontSize: 12, color: "#666" }}>{approved.size} of {issues.length} fixes approved</span>
//                 {canPush && (
//                   <div style={{ display: "flex", gap: 6 }}>
//                     <button className="tfbtn" onClick={() => setApproved(new Set(issues.map(i => i.id)))}>Approve all</button>
//                     <button className="tfbtn" onClick={() => setApproved(new Set())}>Clear</button>
//                   </div>
//                 )}
//               </div>

//               {issues.map((item: Issue) => {
//                 const tc = sevTerminal[item.severity] || sevTerminal.info;
//                 const isApproved = approved.has(item.id);
//                 const isExpanded = expandedId === item.id;
//                 const beforeLines = item.codePreview?.split("\n") || [];
//                 const afterLines = (item.codeFixed || "").split("\n");
//                 const maxLen = Math.max(beforeLines.length, afterLines.length);

//                 return (
//                   <div key={item.id} className={`tfix ${isApproved ? "tapproved" : ""}`}>
//                     <div style={{ padding: "12px 14px" }}>
//                       <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
//                         <div style={{ flex: 1 }}>
//                           <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
//                             <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: tc.bg, color: tc.color, fontWeight: 500 }}>{tc.prefix}</span>
//                             {item.line && <span style={{ fontSize: 10, color: "#bbb" }}>line {item.line}</span>}
//                             <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{item.issue}</span>
//                           </div>
//                           <div style={{ fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.5 }}>
//                             <span style={{ color: "#1D9E75", fontWeight: 500 }}>Fix: </span>{item.fix}
//                           </div>
//                           {item.codePreview && (
//                             <button className="tfbtn" onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{ fontSize: 11 }}>
//                               {isExpanded ? "▲ Hide diff" : "▼ Show diff"}
//                             </button>
//                           )}
//                         </div>
//                         {myCode && (
//                           <button className={`tfbtn ${isApproved ? "ton" : ""}`}
//                             onClick={() => { const n = new Set(approved); n.has(item.id) ? n.delete(item.id) : n.add(item.id); setApproved(n); }}
//                             style={{ minWidth: 88, textAlign: "center", flexShrink: 0 }}>
//                             {isApproved ? "✓ Approved" : "Approve"}
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     {isExpanded && item.codePreview && (
//                       <div style={{ borderTop: "0.5px solid #eee" }}>
//                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f9f9f8", borderBottom: "0.5px solid #eee" }}>
//                           <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, borderRight: "0.5px solid #eee" }}>
//                             <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E24B4A" }} />
//                             <span style={{ fontSize: 11, fontWeight: 500, color: "#A32D2D" }}>Before</span>
//                           </div>
//                           <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
//                             <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75" }} />
//                             <span style={{ fontSize: 11, fontWeight: 500, color: "#1D9E75" }}>After</span>
//                           </div>
//                         </div>
//                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
//                           <div style={{ borderRight: "0.5px solid #eee" }}>
//                             {Array.from({ length: maxLen }).map((_, i) => {
//                               const line = beforeLines[i] ?? ""; const changed = line !== (afterLines[i] ?? "");
//                               return <div key={i} style={{ display: "flex", gap: 8, padding: "3px 14px", background: changed ? "#FFF5F5" : "transparent", minHeight: 22 }}>
//                                 <span style={{ fontSize: 10, color: "#ccc", minWidth: 16, textAlign: "right", userSelect: "none", flexShrink: 0 }}>{i + 1}</span>
//                                 <span style={{ fontSize: 10, color: changed ? "#E24B4A" : "#ccc", minWidth: 10, flexShrink: 0 }}>{changed ? "−" : " "}</span>
//                                 <code style={{ fontSize: 11, fontFamily: "monospace", color: changed ? "#A32D2D" : "#888", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.5 }}>{line}</code>
//                               </div>;
//                             })}
//                           </div>
//                           <div>
//                             {Array.from({ length: maxLen }).map((_, i) => {
//                               const line = afterLines[i] ?? ""; const changed = line !== (beforeLines[i] ?? "");
//                               return <div key={i} style={{ display: "flex", gap: 8, padding: "3px 14px", background: changed ? "#F0FFF4" : "transparent", minHeight: 22 }}>
//                                 <span style={{ fontSize: 10, color: "#ccc", minWidth: 16, textAlign: "right", userSelect: "none", flexShrink: 0 }}>{i + 1}</span>
//                                 <span style={{ fontSize: 10, color: changed ? "#1D9E75" : "#ccc", minWidth: 10, flexShrink: 0 }}>{changed ? "+" : " "}</span>
//                                 <code style={{ fontSize: 11, fontFamily: "monospace", color: changed ? "#27500A" : "#888", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.5 }}>{line}</code>
//                               </div>;
//                             })}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}

//               {canPush ? (
//                 approved.size > 0 ? (
//                   <button className="tfbtn tgreen" onClick={handlePush} disabled={pushing}
//                     style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 500 }}>
//                     {pushing ? "Pushing..." : `Push PR with ${approved.size} fix${approved.size > 1 ? "es" : ""} to GitHub →`}
//                   </button>
//                 ) : (
//                   <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "#bbb", background: "#f9f9f8", borderRadius: 8 }}>Approve at least one fix to push a PR</div>
//                 )
//               ) : (
//                 <div style={{ padding: "11px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#888" }}>
//                   {myCode ? "Enable Git integration in dashboard to push PR" : 'Enable "I own this code" to approve and stage fixes'}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* PUSHED */}
//           {step === "pushed" && (
//             <div style={{ textAlign: "center", padding: "30px 10px" }}>
//               <div style={{ width: 60, height: 60, background: "#E1F5EE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>✓</div>
//               <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>PR created on GitHub!</div>
//               <div style={{ fontSize: 13, color: "#666", lineHeight: 1.75, marginBottom: 24 }}>Branch <code style={{ background: "#f5f5f3", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>fix/ai-review</code> pushed. Vercel is building a preview URL.</div>
//               {[{ n: "1", text: "Open PR on GitHub", done: true }, { n: "2", text: "Check Vercel preview URL (in PR description)", done: false }, { n: "3", text: "Merge PR → auto-deploy to production", done: false }].map((s, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "0.5px solid #eee" : "none", textAlign: "left" }}>
//                   <div style={{ width: 24, height: 24, borderRadius: "50%", background: s.done ? "#E1F5EE" : "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: s.done ? "#0F6E56" : "#888", flexShrink: 0 }}>{s.n}</div>
//                   <span style={{ fontSize: 13, color: s.done ? "#1a1a1a" : "#888" }}>{s.text}</span>
//                 </div>
//               ))}
//               <a href={prUrl} target="_blank" style={{ display: "block", marginTop: 16, padding: "11px", fontSize: 14, fontWeight: 500, background: "#1a1a1a", color: "#fff", borderRadius: 10, textDecoration: "none" }}>Open PR on GitHub →</a>
//               <button onClick={onClose} style={{ width: "100%", marginTop: 8, padding: "9px", fontSize: 13, border: "0.5px solid #eee", borderRadius: 8, background: "#fff", color: "#666", cursor: "pointer" }}>Close panel</button>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// // ── Agent Tile ─────────────────────────────────────────────────────────────────
// function AgentTile({ agent, status, result, onRun }: {
//   agent: typeof agents[0]; status: RunStatus; result?: ScanResult; onRun: () => void;
// }) {
//   const items = result ? (result.violations || result.issues || []) : [];
//   const critCount = items.filter((i: any) => i.severity === "critical" || i.severity === "serious").length;
//   const isCodeReview = agent.id === "codereview";
//   const scoreColor = result ? (result.score >= 80 ? "#1D9E75" : result.score >= 60 ? "#BA7517" : "#E24B4A") : "#aaa";

//   return (
//     <div style={{ background: "#fff", border: agent.badge === "Active" ? "2px solid #b5d4f4" : "0.5px solid #e5e5e3", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10 }}
//       onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.07)"}
//       onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
//       <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
//         <div style={{ width: 38, height: 38, borderRadius: 8, background: agent.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{agent.icon}</div>
//         <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: agent.badgeColor, color: agent.badgeText }}>{agent.badge}</span>
//       </div>
//       <div style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>{agent.title}</div>
//       <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, flex: 1 }}>{agent.desc}</div>

//       {isCodeReview && !result && (
//         <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//           {[{ icon: "🔀", label: "GitHub PR" }, { icon: "🔗", label: "File URL" }, { icon: "📋", label: "Git diff" }, { icon: "📝", label: "Paste" }].map(m => (
//             <span key={m.label} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f1f1ee", color: "#666", border: "0.5px solid #eee" }}>{m.icon} {m.label}</span>
//           ))}
//         </div>
//       )}

//       {result && (
//         <div style={{ background: "#f9f9f8", borderRadius: 8, padding: "10px 12px" }}>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
//             <span style={{ fontSize: 13, fontWeight: 500, color: scoreColor }}>Score: {result.score}/100</span>
//             <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: critCount > 0 ? "#FCEBEB" : "#EAF3DE", color: critCount > 0 ? "#A32D2D" : "#27500A" }}>
//               {critCount > 0 ? `${critCount} critical` : "All clear"}
//             </span>
//           </div>
//           <div style={{ height: 3, background: "#eee", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
//             <div style={{ width: `${result.score}%`, height: "100%", background: scoreColor, borderRadius: 2 }} />
//           </div>
//           {result.sourceLabel && (
//             <div style={{ fontSize: 11, color: "#bbb", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//               {result.inputMode === "github-pr" ? "🔀" : result.inputMode === "github-url" ? "🔗" : result.inputMode === "git-diff" ? "📋" : "📝"} {result.sourceLabel}
//             </div>
//           )}
//           {!result.sourceLabel && result.scannedUrl && <div style={{ fontSize: 11, color: "#bbb", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🌐 {stripUrl(result.scannedUrl)}</div>}
//           <div style={{ fontSize: 12, color: "#888" }}>{result.summary}</div>
//         </div>
//       )}

//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "0.5px solid #f0f0ee" }}>
//         <span style={{ fontSize: 11, color: "#bbb" }}>{status === "running" ? "Scanning..." : status === "done" ? "Just now" : "Not yet run"}</span>
//         <button onClick={onRun} disabled={status === "running"}
//           style={{ fontSize: 12, fontWeight: 500, padding: "5px 16px", border: "0.5px solid #ddd", borderRadius: 8, background: status === "running" ? "#f5f5f3" : "#fff", color: status === "running" ? "#aaa" : "#1a1a1a", cursor: status === "running" ? "not-allowed" : "pointer" }}>
//           {status === "running" ? "⏳ Scanning..." : isCodeReview ? "▶ Open reviewer" : result ? "▶ Re-run" : "▶ Run"}
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Main ───────────────────────────────────────────────────────────────────────
// export default function Dashboard() {
//   const [statuses, setStatuses] = useState<Record<string, RunStatus>>({});
//   const [results, setResults] = useState<Record<string, ScanResult>>({});
//   const [panelAgent, setPanelAgent] = useState<string | null>(null);
//   const [totalPRs, setTotalPRs] = useState(0);
//   const [prBanner, setPrBanner] = useState<string | null>(null);
//   const [url, setUrl] = useState("https://super-ai-agents-zr2x.vercel.app");
//   const [myCode, setMyCode] = useState(false);
//   const [gitConnected, setGitConnected] = useState(false);

//   const totalIssues = Object.values(results).reduce((acc, r) => acc + (r.violations || r.issues || []).length, 0);

//   const handleRun = async (id: string) => {
//     setPanelAgent(id);
//     if (id !== "codereview") {
//       setStatuses(s => ({ ...s, [id]: "running" }));
//       await new Promise(r => setTimeout(r, 3200));
//       setStatuses(s => ({ ...s, [id]: "done" }));
//       const agent = agents.find(a => a.id === id);
//       if (agent?.mockResult) setResults(r => ({ ...r, [id]: { ...agent.mockResult as ScanResult, scannedUrl: url } }));
//     }
//   };

//   const handlePRPushed = (count: number) => {
//     setTotalPRs(p => p + 1);
//     setStatuses(s => ({ ...s, codereview: "done" }));
//     setPrBanner(`PR pushed with ${count} fix${count > 1 ? "es" : ""}! Merge on GitHub → Vercel auto-deploys.`);
//     setTimeout(() => setPrBanner(null), 7000);
//   };

//   return (
//     <div style={{ minHeight: "100vh", background: "#f9f9f8", fontFamily: "system-ui,-apple-system,sans-serif" }}>
//       <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e5e3" }}>
//         <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 2rem" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{ width: 28, height: 28, background: "#EEEDFE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙</div>
//             <span style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>AI Super Agents</span>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yoursite.com"
//               style={{ fontSize: 13, padding: "6px 12px", border: "0.5px solid #ddd", borderRadius: 8, width: 300, outline: "none", color: "#1a1a1a", background: "#fff" }} />
//             <div style={{ fontSize: 12, color: "#888", background: "#f1f1ee", padding: "4px 10px", borderRadius: 20 }}>3 agents</div>
//           </div>
//         </div>
//       </div>

//       {prBanner && (
//         <div style={{ background: "#E1F5EE", borderBottom: "0.5px solid #9FE1CB", padding: "10px 2rem", textAlign: "center", fontSize: 13, color: "#085041", fontWeight: 500 }}>
//           ✓ {prBanner}
//         </div>
//       )}

//       <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
//         <div style={{ background: "#fff", border: "0.5px solid #e5e5e3", borderRadius: 12, padding: "14px 18px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
//           <Toggle checked={myCode} onChange={v => { setMyCode(v); if (!v) setGitConnected(false); }} label="I own this code" />
//           {myCode && <><div style={{ width: 1, height: 20, background: "#eee" }} /><Toggle checked={gitConnected} onChange={setGitConnected} label="Git integration enabled" /></>}
//           <div style={{ marginLeft: "auto" }}>
//             {!myCode && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#f5f5f3", color: "#888", border: "0.5px solid #eee" }}>View-only — scores & suggestions</span>}
//             {myCode && !gitConnected && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#FAEEDA", color: "#633806", border: "0.5px solid #FAC775" }}>Fixes enabled — PR push disabled</span>}
//             {myCode && gitConnected && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#EAF3DE", color: "#27500A", border: "0.5px solid #C0DD97" }}>✓ Full mode — fixes + GitHub PR</span>}
//           </div>
//         </div>

//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "2rem" }}>
//           {[{ label: "Total agents", value: 3 }, { label: "Active", value: 2 }, { label: "Issues found", value: totalIssues }, { label: "PRs opened", value: totalPRs }].map(m => (
//             <div key={m.label} style={{ background: "#fff", border: "0.5px solid #e5e5e3", borderRadius: 12, padding: "1rem 1.25rem" }}>
//               <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{m.label}</div>
//               <div style={{ fontSize: 24, fontWeight: 500, color: "#1a1a1a" }}>{m.value}</div>
//             </div>
//           ))}
//         </div>

//         <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", color: "#aaa", textTransform: "uppercase", marginBottom: 12 }}>Agents</div>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
//           {agents.map(agent => (
//             <AgentTile key={agent.id} agent={agent} status={statuses[agent.id] || "idle"} result={results[agent.id]} onRun={() => handleRun(agent.id)} />
//           ))}
//         </div>
//       </div>

//       {panelAgent && (
//         <TerminalSidePanel agentId={panelAgent} scanUrl={url} myCode={myCode} gitConnected={gitConnected} onClose={() => setPanelAgent(null)} onPRPushed={handlePRPushed} />
//       )}
//     </div>
//   );
// }

// "use client";
// import { useState } from "react";

// type RunStatus = "idle" | "running" | "done" | "error";
// type CodeReviewMode = "github-pr" | "github-url" | "git-diff" | "paste";

// interface Issue {
//   id: string;
//   severity: "critical" | "serious" | "warning" | "info";
//   issue: string;
//   line?: number;
//   fix: string;
//   codePreview?: string;
//   codeFixed?: string;
// }

// interface ScanResult {
//   score: number;
//   summary: string;
//   passed: number;
//   scannedUrl?: string;
//   sourceLabel?: string;
//   inputMode?: CodeReviewMode;
//   issues?: Issue[];
//   violations?: Issue[];
//   fixed_code?: string;
//   original_code?: string;
//   error?: string;
// }

// const agents = [
//   {
//     id: "wcag", icon: "♿", title: "WCAG Audit",
//     desc: "Scans for real accessibility violations using AI — generates exact code fixes before you push.",
//     color: "#EEEDFE", badge: "Active", badgeColor: "#EAF3DE", badgeText: "#27500A",
//   },
//   {
//     id: "seo", icon: "🔍", title: "SEO Check",
//     desc: "Audits meta tags, headings, structured data — AI-powered fixes submitted as a PR on approval.",
//     color: "#E1F5EE", badge: "Active", badgeColor: "#EAF3DE", badgeText: "#27500A",
//   },
//   {
//     id: "codereview", icon: "🧠", title: "Code Review",
//     desc: "Review from GitHub PR, file URL, git diff, or pasted code. Claude finds real issues and fixes them.",
//     color: "#E6F1FB", badge: "Beta", badgeColor: "#EEEDFE", badgeText: "#3C3489",
//   },
// ];

// const sevLight: Record<string, { bg: string; text: string; border: string }> = {
//   critical: { bg: "#FCEBEB", text: "#A32D2D", border: "#F7C1C1" },
//   serious:  { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
//   warning:  { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
//   info:     { bg: "#F1EFE8", text: "#444441", border: "#D3D1C7" },
// };
// const sevTerminal: Record<string, { color: string; bg: string; prefix: string }> = {
//   critical: { color: "#A32D2D", bg: "rgba(255,78,78,0.12)", prefix: "[CRIT]" },
//   serious:  { color: "#BA7517", bg: "rgba(255,224,51,0.12)", prefix: "[WARN]" },
//   warning:  { color: "#BA7517", bg: "rgba(255,224,51,0.12)", prefix: "[WARN]" },
//   info:     { color: "#888",    bg: "rgba(0,0,0,0.04)",      prefix: "[INFO]" },
// };

// const inputModes: { id: CodeReviewMode; icon: string; label: string; desc: string }[] = [
//   { id: "github-pr",  icon: "🔀", label: "GitHub PR",       desc: "Paste a PR URL — fetches diff, reviews all changed files" },
//   { id: "github-url", icon: "🔗", label: "GitHub file URL",  desc: "Paste a file URL — fetches raw content directly from GitHub" },
//   { id: "git-diff",   icon: "📋", label: "Git diff",         desc: "Paste git diff output — reviews only what changed" },
//   { id: "paste",      icon: "📝", label: "Paste code",       desc: "Paste any file manually for a full file review" },
// ];

// function stripUrl(url: string) { return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

// function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
//   return (
//     <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
//       <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#1a1a1a" : "#ddd", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
//         <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
//       </div>
//       <span style={{ fontSize: 13, color: "#555" }}>{label}</span>
//     </label>
//   );
// }

// // ── Code Review Input ─────────────────────────────────────────────────────────
// function CodeReviewInput({ onResult, onLoading }: {
//   onResult: (r: ScanResult) => void;
//   onLoading: (v: boolean) => void;
// }) {
//   const [mode, setMode] = useState<CodeReviewMode>("github-pr");
//   const [prUrl, setPrUrl] = useState("");
//   const [fileUrl, setFileUrl] = useState("");
//   const [diff, setDiff] = useState("");
//   const [filePath, setFilePath] = useState("src/app/page.tsx");
//   const [code, setCode] = useState("");
//   const [error, setError] = useState("");

//   const canScan = () => {
//     if (mode === "github-pr")  return prUrl.trim().length > 0;
//     if (mode === "github-url") return fileUrl.trim().length > 0;
//     if (mode === "git-diff")   return diff.trim().length > 0;
//     return code.trim().length > 0;
//   };

//   const handleScan = async () => {
//     if (!canScan()) return;
//     setError(""); onLoading(true);
//     try {
//       const res = await fetch("/api/agents/codereview", {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ mode, prUrl, fileUrl, diff, code, filePath }),
//       });
//       const data: ScanResult = await res.json();
//       if (data.error) { setError(data.error); onLoading(false); return; }
//       onResult(data);
//     } catch (e: any) {
//       setError(e.message); onLoading(false);
//     }
//   };

//   const inputSt = { width: "100%", fontSize: 13, padding: "9px 12px", border: "0.5px solid #eee", borderRadius: 8, outline: "none", color: "#1a1a1a", background: "#fff", marginBottom: 14 };
//   const areaSt  = { ...inputSt, fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace", fontSize: 12, resize: "none" as const, background: "#f9f9f8", lineHeight: 1.65 };

//   return (
//     <div>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
//         {inputModes.map(m => (
//           <div key={m.id} onClick={() => setMode(m.id)}
//             style={{ padding: "10px 12px", border: `${mode === m.id ? "2px" : "0.5px"} solid ${mode === m.id ? "#1a1a1a" : "#eee"}`, borderRadius: 10, cursor: "pointer", background: mode === m.id ? "#f9f9f8" : "#fff", transition: "all .15s" }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
//               <span style={{ fontSize: 16 }}>{m.icon}</span>
//               <span style={{ fontSize: 13, fontWeight: mode === m.id ? 500 : 400, color: "#1a1a1a" }}>{m.label}</span>
//             </div>
//             <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{m.desc}</div>
//           </div>
//         ))}
//       </div>

//       {mode === "github-pr" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>GitHub PR URL</label>
//           <input value={prUrl} onChange={e => setPrUrl(e.target.value)} style={inputSt} placeholder="https://github.com/Shubham23061989/super-ai-agents/pull/42" />
//           <div style={{ padding: "10px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
//             <strong style={{ fontWeight: 500 }}>What happens:</strong> Fetches the PR diff via GitHub API → Claude reviews all changed files → posts inline comments on the PR.
//             <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
//               {["Uses GITHUB_TOKEN", "Reviews all changed files", "Real AI analysis"].map(t => (
//                 <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#EAF3DE", color: "#27500A" }}>{t}</span>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {mode === "github-url" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>GitHub file URL</label>
//           <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputSt} placeholder="https://github.com/Shubham23061989/super-ai-agents/blob/main/src/app/page.tsx" />
//           <div style={{ padding: "10px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
//             <strong style={{ fontWeight: 500 }}>What happens:</strong> Fetches raw file content from GitHub → Claude reviews the full file → real issues with exact fixes.
//           </div>
//         </div>
//       )}

//       {mode === "git-diff" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>Git diff output</label>
//           <div style={{ fontSize: 12, color: "#888", marginBottom: 8, padding: "6px 10px", background: "#f9f9f8", borderRadius: 6, fontFamily: "monospace" }}>
//             Run: <code style={{ color: "#1a1a1a" }}>git diff main</code> or <code style={{ color: "#1a1a1a" }}>git diff --staged</code> → copy output → paste below
//           </div>
//           <textarea value={diff} onChange={e => setDiff(e.target.value)} rows={10} style={areaSt}
//             placeholder={"diff --git a/src/app/page.tsx b/src/app/page.tsx\n--- a/src/app/page.tsx\n+++ b/src/app/page.tsx\n@@ -1,5 +1,6 @@\n+const x = true\n const agents = [..."} />
//           <div style={{ padding: "10px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
//             <strong style={{ fontWeight: 500 }}>What happens:</strong> Claude reviews only what changed — ideal for pre-commit checks.
//           </div>
//         </div>
//       )}

//       {mode === "paste" && (
//         <div>
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>File path</label>
//           <input value={filePath} onChange={e => setFilePath(e.target.value)} style={{ ...inputSt, marginBottom: 10 }} placeholder="src/app/page.tsx" />
//           <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 5 }}>Paste code</label>
//           <textarea value={code} onChange={e => setCode(e.target.value)} rows={12} style={areaSt} placeholder={"// paste your code here..."} />
//         </div>
//       )}

//       {error && (
//         <div style={{ fontSize: 12, color: "#A32D2D", marginBottom: 12, padding: "10px 14px", background: "#FCEBEB", border: "0.5px solid #F7C1C1", borderRadius: 8 }}>
//           ⚠ {error}
//         </div>
//       )}

//       <button onClick={handleScan} disabled={!canScan()}
//         style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 500, border: `0.5px solid ${canScan() ? "#1D9E75" : "#ddd"}`, borderRadius: 10, background: canScan() ? "#E1F5EE" : "#f9f9f8", color: canScan() ? "#0F6E56" : "#bbb", cursor: canScan() ? "pointer" : "not-allowed" }}>
//         ▶ Review with Claude AI
//       </button>
//     </div>
//   );
// }

// // ── Side Panel ─────────────────────────────────────────────────────────────────
// type PanelStep = "input" | "scanning" | "score" | "suggestions" | "pushing" | "pushed";

// function SidePanel({ agentId, scanUrl, myCode, gitConnected, onClose, onPRPushed }: {
//   agentId: string; scanUrl: string; myCode: boolean; gitConnected: boolean;
//   onClose: () => void; onPRPushed: (count: number, result: ScanResult) => void;
// }) {
//   const agent = agents.find(a => a.id === agentId)!;
//   const isCodeReview = agentId === "codereview";
//   const canPush = myCode && gitConnected;

//   const [step, setStep] = useState<PanelStep>(isCodeReview ? "input" : "scanning");
//   const [result, setResult] = useState<ScanResult | null>(null);
//   const [approved, setApproved] = useState<Set<string>>(new Set());
//   const [prUrl, setPrUrl] = useState("");
//   const [expandedId, setExpandedId] = useState<string | null>(null);
//   const [logLines, setLogLines] = useState<string[]>([]);
//   const [errorMsg, setErrorMsg] = useState("");

//   const issues = result ? (result.issues || result.violations || []) : [];

//   // WCAG / SEO — real API scan with log animation
//   useState(() => {
//     if (!isCodeReview) {
//       const logs: Record<string, string[]> = {
//         wcag: ["Fetching page content...", "Analysing HTML structure...", "Running accessibility checks...", "Detecting WCAG violations...", "Generating AI fixes..."],
//         seo:  ["Fetching page content...", "Parsing meta tags...", "Checking heading structure...", "Analysing Open Graph tags...", "Generating AI suggestions..."],
//       };
//       const ls = logs[agentId] || ["Scanning..."];
//       let i = 0;
//       const iv = setInterval(() => {
//         if (i < ls.length) { setLogLines(p => [...p, ls[i]]); i++; }
//         else { clearInterval(iv); }
//       }, 400);

//       fetch(`/api/agents/${agentId}`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ url: scanUrl }),
//       })
//         .then(r => r.json())
//         .then((data: ScanResult) => {
//           clearInterval(iv);
//           if (data.error) { setErrorMsg(data.error); setStep("input"); }
//           else { setResult(data); setStep("score"); }
//         })
//         .catch(e => { clearInterval(iv); setErrorMsg(e.message); setStep("input"); });
//     }
//   });

//   const handleCodeReviewResult = (r: ScanResult) => {
//     setResult(r);
//     setStep("score");
//   };

//   const handlePush = async () => {
//     if (approved.size === 0) return;
//     setStep("pushing");
//     setLogLines(["Creating branch fix/ai-review-" + Date.now(), "Committing approved fixes...", "Opening pull request...", "Notifying Vercel preview build..."]);
//     try {
//       const res = await fetch("/api/agents/codereview", {
//         method: "PUT", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           filePath: result?.sourceLabel?.includes("/") ? result.sourceLabel.split("/").slice(-1)[0] : "src/app/page.tsx",
//           fixedContent: result?.fixed_code || "// fixed",
//           summary: result?.summary || "AI code review fixes",
//         }),
//       });
//       const data = await res.json();
//       if (data.error) setErrorMsg(data.error);
//       else setPrUrl(data.pr_url);
//     } catch (e: any) { setErrorMsg(e.message); }
//     setStep("pushed");
//     onPRPushed(approved.size, result!);
//   };

//   const scoreColor = result ? (result.score >= 80 ? "#1D9E75" : result.score >= 60 ? "#BA7517" : "#E24B4A") : "#888";
//   const scoreBg    = result ? (result.score >= 80 ? "#E1F5EE" : result.score >= 60 ? "#FAEEDA" : "#FCEBEB") : "#f9f9f8";
//   const scoreBorder= result ? (result.score >= 80 ? "#9FE1CB" : result.score >= 60 ? "#FAC775" : "#F7C1C1") : "#eee";
//   const scoreLabel = result ? (result.score >= 80 ? "Good" : result.score >= 60 ? "Needs work" : "Poor") : "";

//   const modeIcon: Record<string, string> = { "github-pr": "🔀", "github-url": "🔗", "git-diff": "📋", "paste": "📝" };
//   const modeLabel: Record<string, string> = { "github-pr": "PR review", "github-url": "File URL", "git-diff": "Git diff", "paste": "Paste" };

//   const steps = [
//     { key: "score",       label: "Score" },
//     { key: "suggestions", label: "Fixes" },
//   ];
//   const currentStepIdx = steps.findIndex(s => s.key === step);

//   return (
//     <>
//       <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.15)", zIndex: 40 }} />
//       <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 620, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif", boxShadow: "-6px 0 40px rgba(0,0,0,0.1)", borderLeft: "0.5px solid #e5e5e3", animation: "tSlideIn 0.22s ease-out" }}>
//         <style>{`
//           @keyframes tSlideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
//           @keyframes tSpin{to{transform:rotate(360deg)}}
//           .tps::-webkit-scrollbar{width:4px}.tps::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
//           .tfix{border:0.5px solid #eee;border-radius:10px;overflow:hidden;background:#fff;margin-bottom:10px;transition:border-color .15s}
//           .tfix.ok{border-color:#9FE1CB;background:#FDFFFE}
//           .tfb{font-family:system-ui,-apple-system,sans-serif;font-size:12px;padding:5px 14px;border-radius:6px;border:0.5px solid #ddd;background:#fff;color:#555;cursor:pointer;transition:all .15s}
//           .tfb:hover{border-color:#999;color:#333}
//           .tfb.on{border-color:#1D9E75;color:#0F6E56;background:#E1F5EE}
//           .tfb.gr{border-color:#1D9E75;color:#0F6E56;background:#E1F5EE}
//           .tfb.gr:hover{background:#C6F6D5}
//         `}</style>

//         {/* Header */}
//         <div style={{ padding: "13px 18px", borderBottom: "0.5px solid #eee", flexShrink: 0, background: "#f9f9f8" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{ display: "flex", gap: 5 }}>
//               <div onClick={onClose} style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF4E4E", cursor: "pointer" }} title="Close" />
//               <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFE033" }} />
//               <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#00FF88" }} />
//             </div>
//             <span style={{ fontSize: 13, color: "#555", marginLeft: 2 }}>AI Super Agents</span>
//             <span style={{ fontSize: 13, color: "#ccc" }}>›</span>
//             <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{agent.title}</span>
//             {result?.inputMode && (
//               <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#EEEDFE", color: "#3C3489", fontWeight: 500 }}>
//                 {modeIcon[result.inputMode]} {modeLabel[result.inputMode]}
//               </span>
//             )}
//             <span style={{ marginLeft: "auto", fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
//               {result?.sourceLabel ? stripUrl(result.sourceLabel) : stripUrl(scanUrl)}
//             </span>
//           </div>
//         </div>

//         {/* Mode line */}
//         {!["input","scanning","pushing","pushed"].includes(step) && (
//           <div style={{ padding: "7px 18px", borderBottom: "0.5px solid #f0f0ee", background: "#f5f5f3", display: "flex", alignItems: "center" }}>
//             <span style={{ fontSize: 12, color: canPush ? "#1D9E75" : myCode ? "#BA7517" : "#888" }}>
//               {canPush ? "Full mode — fixes + git push enabled" : myCode ? "Fixes mode — git push disabled" : "Read-only — scores & suggestions only"}
//             </span>
//           </div>
//         )}

//         {/* Step nav */}
//         {result && !["scanning","pushing","pushed","input"].includes(step) && (
//           <div style={{ padding: "8px 18px", borderBottom: "0.5px solid #f0f0ee", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, background: "#f5f5f3" }}>
//             {isCodeReview && (
//               <button className="tfb" onClick={() => { setStep("input"); setResult(null); setApproved(new Set()); setErrorMsg(""); }} style={{ fontSize: 11, marginRight: 8 }}>← Change input</button>
//             )}
//             {steps.map((s, i) => {
//               const isDone = currentStepIdx > i, isActive = step === s.key;
//               return (
//                 <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
//                   <button className={`tfb ${isActive ? "on" : ""}`} onClick={() => { if (isDone || isActive) setStep(s.key as PanelStep); }} style={{ opacity: !isDone && !isActive ? 0.35 : 1 }}>
//                     {isDone ? "✓ " : ""}{s.label}
//                   </button>
//                   {i < steps.length - 1 && <span style={{ color: "#ccc", fontSize: 14 }}>›</span>}
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Body */}
//         <div className="tps" style={{ flex: 1, overflowY: "auto", padding: "18px" }}>

//           {/* Error state */}
//           {errorMsg && step === "input" && (
//             <div style={{ padding: "12px 14px", background: "#FCEBEB", border: "0.5px solid #F7C1C1", borderRadius: 8, fontSize: 12, color: "#A32D2D", marginBottom: 16 }}>
//               <strong style={{ fontWeight: 500 }}>Error: </strong>{errorMsg}
//               <div style={{ marginTop: 6, fontSize: 11, color: "#A32D2D" }}>
//                 {errorMsg.includes("credit") && "→ Add credits at console.anthropic.com/billing"}
//                 {errorMsg.includes("401") && "→ Check ANTHROPIC_API_KEY in .env.local"}
//                 {errorMsg.includes("fetch") && "→ Make sure the URL is accessible"}
//               </div>
//             </div>
//           )}

//           {/* WCAG/SEO scanning log */}
//           {step === "scanning" && (
//             <div>
//               <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
//                 <div style={{ width: 10, height: 10, border: "2px solid #1a1a1a", borderTop: "2px solid transparent", borderRadius: "50%", animation: "tSpin 0.8s linear infinite" }} />
//                 <span style={{ fontSize: 13, color: "#1a1a1a" }}>Scanning {stripUrl(scanUrl)} with Claude AI...</span>
//               </div>
//               <div style={{ background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, padding: "12px 14px", minHeight: 160 }}>
//                 {logLines.map((line, i) => (
//                   <div key={i} style={{ fontSize: 12, color: i === logLines.length - 1 ? "#444" : "#aaa", lineHeight: 2, fontFamily: "monospace" }}>
//                     <span style={{ color: "#888" }}>$ </span>{line}
//                   </div>
//                 ))}
//                 <span style={{ fontSize: 12, color: "#ccc" }}>█</span>
//               </div>
//             </div>
//           )}

//           {/* Code Review input */}
//           {step === "input" && isCodeReview && (
//             <CodeReviewInput
//               onResult={handleCodeReviewResult}
//               onLoading={(v) => { if (v) setStep("scanning"); }}
//             />
//           )}

//           {/* SCORE */}
//           {step === "score" && result && (
//             <div>
//               <div style={{ background: scoreBg, border: `1.5px solid ${scoreBorder}`, borderRadius: 12, padding: "20px 18px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
//                 <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 12px 0 80px", background: `${scoreColor}18` }} />
//                 <div style={{ fontSize: 11, color: scoreColor, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                   {result.inputMode ? `${modeIcon[result.inputMode]} ` : "🌐 "}{result.sourceLabel || result.scannedUrl}
//                 </div>
//                 <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 12 }}>
//                   <div style={{ fontSize: 48, fontWeight: 500, color: scoreColor, lineHeight: 1 }}>{result.score}</div>
//                   <div style={{ paddingBottom: 6 }}>
//                     <div style={{ fontSize: 14, color: scoreColor, fontWeight: 500 }}>/100</div>
//                     <div style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${scoreColor}22`, color: scoreColor, marginTop: 3 }}>{scoreLabel}</div>
//                   </div>
//                 </div>
//                 <div style={{ height: 6, background: `${scoreColor}25`, borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
//                   <div style={{ width: `${result.score}%`, height: "100%", background: scoreColor, borderRadius: 3, transition: "width 1s ease" }} />
//                 </div>
//                 <div style={{ fontSize: 12, color: scoreColor }}>{result.summary}</div>
//               </div>

//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
//                 {[
//                   { label: "Issues", value: issues.length, bg: issues.length > 0 ? "#FCEBEB" : "#EAF3DE", color: issues.length > 0 ? "#A32D2D" : "#27500A", border: issues.length > 0 ? "#F7C1C1" : "#C0DD97" },
//                   { label: "Critical", value: issues.filter(i => i.severity === "critical" || i.severity === "serious").length, bg: "#FCEBEB", color: "#A32D2D", border: "#F7C1C1" },
//                   { label: "Passed", value: result.passed, bg: "#EAF3DE", color: "#27500A", border: "#C0DD97" },
//                 ].map(m => (
//                   <div key={m.label} style={{ background: m.bg, border: `0.5px solid ${m.border}`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
//                     <div style={{ fontSize: 22, fontWeight: 500, color: m.color }}>{m.value}</div>
//                     <div style={{ fontSize: 10, color: m.color, marginTop: 2 }}>{m.label}</div>
//                   </div>
//                 ))}
//               </div>

//               <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 10 }}>Issues found</div>
//               <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
//                 {issues.map((item: Issue) => {
//                   const sl = sevLight[item.severity] || sevLight.info;
//                   const tc = sevTerminal[item.severity] || sevTerminal.info;
//                   return (
//                     <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#fff", border: `0.5px solid ${sl.border}`, borderRadius: 8, borderLeft: `3px solid ${sl.text}` }}>
//                       <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: tc.bg, color: tc.color, flexShrink: 0 }}>{tc.prefix}</span>
//                       <span style={{ fontSize: 12, color: "#1a1a1a", flex: 1 }}>{item.issue}</span>
//                       {item.line && <span style={{ fontSize: 10, color: "#bbb" }}>L{item.line}</span>}
//                     </div>
//                   );
//                 })}
//               </div>

//               {issues.length === 0 && (
//                 <div style={{ padding: "14px", background: "#EAF3DE", border: "0.5px solid #C0DD97", borderRadius: 8, fontSize: 13, color: "#27500A", textAlign: "center" }}>
//                   ✓ No issues found — looks good!
//                 </div>
//               )}

//               {myCode && issues.length > 0 ? (
//                 <button className="tfb gr" onClick={() => setStep("suggestions")} style={{ width: "100%", padding: "10px", fontSize: 13 }}>View AI fixes →</button>
//               ) : !myCode && issues.length > 0 ? (
//                 <div style={{ padding: "12px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#888" }}>
//                   Enable "I own this code" in the dashboard to unlock AI fixes
//                 </div>
//               ) : null}
//             </div>
//           )}

//           {/* SUGGESTIONS */}
//           {step === "suggestions" && result && (
//             <div>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
//                 <span style={{ fontSize: 12, color: "#666" }}>{approved.size} of {issues.length} fixes approved</span>
//                 {canPush && (
//                   <div style={{ display: "flex", gap: 6 }}>
//                     <button className="tfb" onClick={() => setApproved(new Set(issues.map(i => i.id)))}>Approve all</button>
//                     <button className="tfb" onClick={() => setApproved(new Set())}>Clear</button>
//                   </div>
//                 )}
//               </div>

//               {issues.map((item: Issue) => {
//                 const tc = sevTerminal[item.severity] || sevTerminal.info;
//                 const isApproved = approved.has(item.id);
//                 const isExpanded = expandedId === item.id;
//                 const beforeLines = (item.codePreview || "").split("\n");
//                 const afterLines  = (item.codeFixed  || "").split("\n");
//                 const maxLen = Math.max(beforeLines.length, afterLines.length);

//                 return (
//                   <div key={item.id} className={`tfix ${isApproved ? "ok" : ""}`}>
//                     <div style={{ padding: "12px 14px" }}>
//                       <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
//                         <div style={{ flex: 1 }}>
//                           <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
//                             <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: tc.bg, color: tc.color, fontWeight: 500 }}>{tc.prefix}</span>
//                             {item.line && <span style={{ fontSize: 10, color: "#bbb" }}>line {item.line}</span>}
//                             <span style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a" }}>{item.issue}</span>
//                           </div>
//                           <div style={{ fontSize: 12, color: "#555", marginBottom: 8, lineHeight: 1.5 }}>
//                             <span style={{ color: "#1D9E75", fontWeight: 500 }}>Fix: </span>{item.fix}
//                           </div>
//                           {(item.codePreview || item.codeFixed) && (
//                             <button className="tfb" onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{ fontSize: 11 }}>
//                               {isExpanded ? "▲ Hide diff" : "▼ Show diff"}
//                             </button>
//                           )}
//                         </div>
//                         {myCode && (
//                           <button className={`tfb ${isApproved ? "on" : ""}`}
//                             onClick={() => { const n = new Set(approved); n.has(item.id) ? n.delete(item.id) : n.add(item.id); setApproved(n); }}
//                             style={{ minWidth: 88, textAlign: "center", flexShrink: 0 }}>
//                             {isApproved ? "✓ Approved" : "Approve"}
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     {isExpanded && (item.codePreview || item.codeFixed) && (
//                       <div style={{ borderTop: "0.5px solid #eee" }}>
//                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f9f9f8", borderBottom: "0.5px solid #eee" }}>
//                           <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, borderRight: "0.5px solid #eee" }}>
//                             <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E24B4A" }} />
//                             <span style={{ fontSize: 11, fontWeight: 500, color: "#A32D2D" }}>Before</span>
//                           </div>
//                           <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
//                             <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75" }} />
//                             <span style={{ fontSize: 11, fontWeight: 500, color: "#1D9E75" }}>After</span>
//                           </div>
//                         </div>
//                         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
//                           {[beforeLines, afterLines].map((lines, idx) => (
//                             <div key={idx} style={{ borderRight: idx === 0 ? "0.5px solid #eee" : "none" }}>
//                               {Array.from({ length: maxLen }).map((_, i) => {
//                                 const line = lines[i] ?? "";
//                                 const other = (idx === 0 ? afterLines : beforeLines)[i] ?? "";
//                                 const changed = line !== other;
//                                 return (
//                                   <div key={i} style={{ display: "flex", gap: 8, padding: "3px 14px", background: changed ? (idx === 0 ? "#FFF5F5" : "#F0FFF4") : "transparent", minHeight: 22 }}>
//                                     <span style={{ fontSize: 10, color: "#ccc", minWidth: 16, textAlign: "right", userSelect: "none", flexShrink: 0 }}>{i + 1}</span>
//                                     <span style={{ fontSize: 10, color: changed ? (idx === 0 ? "#E24B4A" : "#1D9E75") : "#ccc", minWidth: 10, flexShrink: 0 }}>{changed ? (idx === 0 ? "−" : "+") : " "}</span>
//                                     <code style={{ fontSize: 11, fontFamily: "monospace", color: changed ? (idx === 0 ? "#A32D2D" : "#27500A") : "#888", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.5 }}>{line}</code>
//                                   </div>
//                                 );
//                               })}
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}

//               {canPush ? (
//                 approved.size > 0 ? (
//                   <button className="tfb gr" onClick={handlePush} style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 500 }}>
//                     Push PR with {approved.size} fix{approved.size > 1 ? "es" : ""} to GitHub →
//                   </button>
//                 ) : (
//                   <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "#bbb", background: "#f9f9f8", borderRadius: 8 }}>
//                     Approve at least one fix to push a PR
//                   </div>
//                 )
//               ) : (
//                 <div style={{ padding: "11px 14px", background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, fontSize: 12, color: "#888" }}>
//                   {myCode ? "Enable Git integration in dashboard to push PR" : 'Enable "I own this code" to approve fixes'}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* PUSHING */}
//           {step === "pushing" && (
//             <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
//               <div style={{ width: 44, height: 44, border: "3px solid #f0f0ee", borderTop: "3px solid #0F6E56", borderRadius: "50%", animation: "tSpin 0.75s linear infinite" }} />
//               <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>Creating GitHub PR</div>
//               <div style={{ background: "#f9f9f8", border: "0.5px solid #eee", borderRadius: 8, padding: "12px 14px", width: "100%" }}>
//                 {logLines.map((line, i) => (
//                   <div key={i} style={{ fontSize: 12, color: i === logLines.length - 1 ? "#444" : "#aaa", lineHeight: 1.9, fontFamily: "monospace" }}>
//                     <span style={{ color: "#888" }}>$ </span>{line}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* PUSHED */}
//           {step === "pushed" && (
//             <div style={{ textAlign: "center", padding: "30px 10px" }}>
//               <div style={{ width: 60, height: 60, background: "#E1F5EE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>✓</div>
//               <div style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>PR created on GitHub!</div>
//               <div style={{ fontSize: 13, color: "#666", lineHeight: 1.75, marginBottom: 24 }}>
//                 Branch <code style={{ background: "#f5f5f3", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>fix/ai-review</code> pushed.<br />
//                 Vercel is building a preview URL — merge to deploy to production.
//               </div>
//               {errorMsg && <div style={{ fontSize: 12, color: "#A32D2D", marginBottom: 16, padding: "8px 12px", background: "#FCEBEB", borderRadius: 8 }}>{errorMsg}</div>}
//               {[
//                 { n: "1", text: "Open PR on GitHub", done: true },
//                 { n: "2", text: "Check Vercel preview URL (in PR description)", done: false },
//                 { n: "3", text: "Merge PR → auto-deploy to production", done: false },
//               ].map((s, i) => (
//                 <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "0.5px solid #eee" : "none", textAlign: "left" }}>
//                   <div style={{ width: 24, height: 24, borderRadius: "50%", background: s.done ? "#E1F5EE" : "#f0f0ee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: s.done ? "#0F6E56" : "#888", flexShrink: 0 }}>{s.n}</div>
//                   <span style={{ fontSize: 13, color: s.done ? "#1a1a1a" : "#888" }}>{s.text}</span>
//                 </div>
//               ))}
//               {prUrl && (
//                 <a href={prUrl} target="_blank" style={{ display: "block", marginTop: 16, padding: "11px", fontSize: 14, fontWeight: 500, background: "#1a1a1a", color: "#fff", borderRadius: 10, textDecoration: "none" }}>
//                   Open PR on GitHub →
//                 </a>
//               )}
//               <button onClick={onClose} style={{ width: "100%", marginTop: 8, padding: "9px", fontSize: 13, border: "0.5px solid #eee", borderRadius: 8, background: "#fff", color: "#666", cursor: "pointer" }}>Close panel</button>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// // ── Agent Tile ─────────────────────────────────────────────────────────────────
// function AgentTile({ agent, status, result, onRun }: {
//   agent: typeof agents[0]; status: RunStatus; result?: ScanResult; onRun: () => void;
// }) {
//   const items = result ? (result.violations || result.issues || []) : [];
//   const critCount = items.filter((i: any) => i.severity === "critical" || i.severity === "serious").length;
//   const isCodeReview = agent.id === "codereview";
//   const scoreColor = result ? (result.score >= 80 ? "#1D9E75" : result.score >= 60 ? "#BA7517" : "#E24B4A") : "#aaa";
//   const modeIcon: Record<string, string> = { "github-pr": "🔀", "github-url": "🔗", "git-diff": "📋", "paste": "📝" };

//   return (
//     <div style={{ background: "#fff", border: agent.badge === "Active" ? "2px solid #b5d4f4" : "0.5px solid #e5e5e3", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10 }}
//       onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 14px rgba(0,0,0,0.07)"}
//       onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>
//       <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
//         <div style={{ width: 38, height: 38, borderRadius: 8, background: agent.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{agent.icon}</div>
//         <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: agent.badgeColor, color: agent.badgeText }}>{agent.badge}</span>
//       </div>
//       <div style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>{agent.title}</div>
//       <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, flex: 1 }}>{agent.desc}</div>

//       {isCodeReview && !result && (
//         <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//           {[{ icon: "🔀", label: "GitHub PR" }, { icon: "🔗", label: "File URL" }, { icon: "📋", label: "Git diff" }, { icon: "📝", label: "Paste" }].map(m => (
//             <span key={m.label} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f1f1ee", color: "#666", border: "0.5px solid #eee" }}>{m.icon} {m.label}</span>
//           ))}
//         </div>
//       )}

//       {result && (
//         <div style={{ background: "#f9f9f8", borderRadius: 8, padding: "10px 12px" }}>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
//             <span style={{ fontSize: 13, fontWeight: 500, color: scoreColor }}>Score: {result.score}/100</span>
//             <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: critCount > 0 ? "#FCEBEB" : "#EAF3DE", color: critCount > 0 ? "#A32D2D" : "#27500A" }}>
//               {critCount > 0 ? `${critCount} critical` : "All clear"}
//             </span>
//           </div>
//           <div style={{ height: 3, background: "#eee", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
//             <div style={{ width: `${result.score}%`, height: "100%", background: scoreColor, borderRadius: 2 }} />
//           </div>
//           <div style={{ fontSize: 11, color: "#bbb", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//             {result.inputMode ? modeIcon[result.inputMode] : "🌐"} {result.sourceLabel || result.scannedUrl}
//           </div>
//           <div style={{ fontSize: 12, color: "#888" }}>{result.summary}</div>
//         </div>
//       )}

//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "0.5px solid #f0f0ee" }}>
//         <span style={{ fontSize: 11, color: "#bbb" }}>{status === "running" ? "Scanning with AI..." : status === "done" ? "Just now" : "Not yet run"}</span>
//         <button onClick={onRun} disabled={status === "running"}
//           style={{ fontSize: 12, fontWeight: 500, padding: "5px 16px", border: "0.5px solid #ddd", borderRadius: 8, background: status === "running" ? "#f5f5f3" : "#fff", color: status === "running" ? "#aaa" : "#1a1a1a", cursor: status === "running" ? "not-allowed" : "pointer" }}>
//           {status === "running" ? "⏳ Scanning..." : isCodeReview ? "▶ Open reviewer" : result ? "▶ Re-scan" : "▶ Run"}
//         </button>
//       </div>
//     </div>
//   );
// }

// // ── Main ───────────────────────────────────────────────────────────────────────
// export default function Dashboard() {
//   const [statuses, setStatuses] = useState<Record<string, RunStatus>>({});
//   const [results, setResults] = useState<Record<string, ScanResult>>({});
//   const [panelAgent, setPanelAgent] = useState<string | null>(null);
//   const [totalPRs, setTotalPRs] = useState(0);
//   const [prBanner, setPrBanner] = useState<string | null>(null);
//   const [url, setUrl] = useState("https://super-ai-agents-zr2x.vercel.app");
//   const [myCode, setMyCode] = useState(false);
//   const [gitConnected, setGitConnected] = useState(false);

//   const totalIssues = Object.values(results).reduce((acc, r) => acc + (r.violations || r.issues || []).length, 0);

//   const handleRun = (id: string) => {
//     setPanelAgent(id);
//     if (id !== "codereview") setStatuses(s => ({ ...s, [id]: "running" }));
//   };

//   const handlePRPushed = (count: number, result: ScanResult) => {
//     setTotalPRs(p => p + 1);
//     setStatuses(s => ({ ...s, codereview: "done" }));
//     setResults(r => ({ ...r, codereview: result }));
//     setPrBanner(`PR pushed with ${count} fix${count > 1 ? "es" : ""}! Merge on GitHub → Vercel auto-deploys.`);
//     setTimeout(() => setPrBanner(null), 7000);
//   };

//   // When side panel closes, save result to tile
//   const handleClose = () => {
//     setPanelAgent(null);
//     // mark non-codereview agent as done
//     if (panelAgent && panelAgent !== "codereview") {
//       setStatuses(s => ({ ...s, [panelAgent]: "done" }));
//     }
//   };

//   return (
//     <div style={{ minHeight: "100vh", background: "#f9f9f8", fontFamily: "system-ui,-apple-system,sans-serif" }}>
//       <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e5e3" }}>
//         <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 2rem" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <div style={{ width: 28, height: 28, background: "#EEEDFE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙</div>
//             <span style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>AI Super Agents</span>
//           </div>
//           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//             <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yoursite.com"
//               style={{ fontSize: 13, padding: "6px 12px", border: "0.5px solid #ddd", borderRadius: 8, width: 300, outline: "none", color: "#1a1a1a", background: "#fff" }} />
//             <div style={{ fontSize: 12, color: "#888", background: "#f1f1ee", padding: "4px 10px", borderRadius: 20 }}>3 agents</div>
//           </div>
//         </div>
//       </div>

//       {prBanner && (
//         <div style={{ background: "#E1F5EE", borderBottom: "0.5px solid #9FE1CB", padding: "10px 2rem", textAlign: "center", fontSize: 13, color: "#085041", fontWeight: 500 }}>
//           ✓ {prBanner}
//         </div>
//       )}

//       <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
//         <div style={{ background: "#fff", border: "0.5px solid #e5e5e3", borderRadius: 12, padding: "14px 18px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
//           <Toggle checked={myCode} onChange={v => { setMyCode(v); if (!v) setGitConnected(false); }} label="I own this code" />
//           {myCode && <><div style={{ width: 1, height: 20, background: "#eee" }} /><Toggle checked={gitConnected} onChange={setGitConnected} label="Git integration enabled" /></>}
//           <div style={{ marginLeft: "auto" }}>
//             {!myCode && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#f5f5f3", color: "#888", border: "0.5px solid #eee" }}>View-only — scores & suggestions</span>}
//             {myCode && !gitConnected && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#FAEEDA", color: "#633806", border: "0.5px solid #FAC775" }}>Fixes enabled — PR push disabled</span>}
//             {myCode && gitConnected && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#EAF3DE", color: "#27500A", border: "0.5px solid #C0DD97" }}>✓ Full mode — fixes + GitHub PR</span>}
//           </div>
//         </div>

//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "2rem" }}>
//           {[{ label: "Total agents", value: 3 }, { label: "Active", value: 2 }, { label: "Issues found", value: totalIssues }, { label: "PRs opened", value: totalPRs }].map(m => (
//             <div key={m.label} style={{ background: "#fff", border: "0.5px solid #e5e5e3", borderRadius: 12, padding: "1rem 1.25rem" }}>
//               <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{m.label}</div>
//               <div style={{ fontSize: 24, fontWeight: 500, color: "#1a1a1a" }}>{m.value}</div>
//             </div>
//           ))}
//         </div>

//         <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", color: "#aaa", textTransform: "uppercase", marginBottom: 12 }}>Agents</div>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
//           {agents.map(agent => (
//             <AgentTile key={agent.id} agent={agent} status={statuses[agent.id] || "idle"} result={results[agent.id]} onRun={() => handleRun(agent.id)} />
//           ))}
//         </div>
//       </div>

//       {panelAgent && (
//         <SidePanel
//           agentId={panelAgent} scanUrl={url} myCode={myCode} gitConnected={gitConnected}
//           onClose={handleClose}
//           onPRPushed={handlePRPushed}
//         />
//       )}
//     </div>
//   );
// }

"use client";
import { useState } from "react";

type RunStatus = "idle" | "running" | "done" | "error";
type CodeReviewMode = "github-pr" | "github-url" | "git-diff" | "paste";
type DataMode = "mock" | "api";

interface Issue {
  id: string;
  severity: "critical" | "serious" | "warning" | "info";
  issue: string;
  line?: number;
  fix: string;
  codePreview?: string;
  codeFixed?: string;
}

interface ScanResult {
  score: number;
  summary: string;
  passed: number;
  scannedUrl?: string;
  sourceLabel?: string;
  inputMode?: CodeReviewMode;
  issues?: Issue[];
  violations?: Issue[];
  fixed_code?: string;
  original_code?: string;
  error?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK: Record<string, ScanResult> = {
  wcag: {
    score: 67, summary: "4 accessibility violations across 3 elements.", passed: 18,
    violations: [
      { id: "img-alt", severity: "critical", issue: "3 images missing alt text", fix: 'Add alt="..." to each <img>', codePreview: '<img src="hero.jpg" class="hero">', codeFixed: '<img src="hero.jpg" class="hero" alt="Hero banner image">' },
      { id: "contrast", severity: "serious", issue: "Button contrast ratio 2.8:1 (min 4.5:1)", fix: "Change color from #aaa to #595959", codePreview: '.btn { color: #aaa; }', codeFixed: '.btn { color: #595959; }' },
      { id: "label", severity: "warning", issue: "Email input has no associated label", fix: "Add aria-label attribute", codePreview: '<input type="email" placeholder="Email">', codeFixed: '<input type="email" aria-label="Email address" placeholder="Email">' },
      { id: "skip", severity: "info", issue: "No skip navigation link found", fix: "Add skip-to-main link as first element", codePreview: '<body>\n  <header>...</header>', codeFixed: '<body>\n  <a href="#main" class="skip">Skip to content</a>\n  <header>...</header>' },
    ],
  },
  seo: {
    score: 74, summary: "3 SEO issues. Page indexable but missing key metadata.", passed: 11,
    issues: [
      { id: "meta", severity: "critical", issue: "Meta description missing on homepage", fix: "Add <meta name='description' content='...'>", codePreview: '<head>\n  <title>App</title>', codeFixed: '<head>\n  <title>App</title>\n  <meta name="description" content="...">' },
      { id: "h1", severity: "critical", issue: "No H1 tag found on page", fix: "Add exactly one <h1> as primary heading", codePreview: '<main>\n  <h2>Welcome</h2>', codeFixed: '<main>\n  <h1>AI Super Agents</h1>\n  <h2>Welcome</h2>' },
      { id: "og", severity: "warning", issue: "Open Graph tags missing (og:title, og:image)", fix: "Add og:title, og:image in <head>", codePreview: '<!-- no og tags -->', codeFixed: '<meta property="og:title" content="AI Super Agents">' },
    ],
  },
  codereview: {
    score: 72, summary: "3 code issues found. AI has generated fixes for each one.", passed: 11,
    sourceLabel: "Mock — src/app/page.tsx",
    issues: [
      { id: "clog", severity: "warning", issue: "console.log() left in production code", line: 12, fix: "Remove console.log before deploying", codePreview: "console.log('debug', data)", codeFixed: "// debug log removed" },
      { id: "var", severity: "warning", issue: "var used instead of const/let", line: 8, fix: "Replace var with const for block scoping", codePreview: "var data = fetch('/api')", codeFixed: "const data = fetch('/api')" },
      { id: "err", severity: "critical", issue: "API call has no error handling", line: 24, fix: "Wrap fetch() in try/catch", codePreview: "const res = await fetch('/api/data')\nconst json = await res.json()", codeFixed: "try {\n  const res = await fetch('/api/data')\n  const json = await res.json()\n} catch (err) {\n  console.error(err)\n}" },
    ],
  },
};

const agents = [
  { id: "wcag", icon: "♿", title: "WCAG Audit", desc: "Scans for accessibility violations, generates AI fixes, and opens a review diff before pushing.", badge: "Active", badgeColor: "#27500A", badgeBg: "#EAF3DE", accent: "#7C3AED", accentBg: "#EDE9FE" },
  { id: "seo",  icon: "🔍", title: "SEO Check",  desc: "Audits meta tags, headings, structured data. Proposes fixes and submits a PR on approval.",      badge: "Active", badgeColor: "#27500A", badgeBg: "#EAF3DE", accent: "#0891B2", accentBg: "#E0F2FE" },
  { id: "codereview", icon: "🧠", title: "Code Review", desc: "Review from GitHub PR, file URL, git diff, or pasted code. Claude finds real issues and fixes them.", badge: "Beta", badgeColor: "#3C3489", badgeBg: "#EEEDFE", accent: "#0F6E56", accentBg: "#E1F5EE" },
];

const inputModes: { id: CodeReviewMode; icon: string; label: string; desc: string }[] = [
  { id: "github-pr",  icon: "🔀", label: "GitHub PR",      desc: "Paste a PR URL — fetches diff, reviews all changed files" },
  { id: "github-url", icon: "🔗", label: "GitHub file URL", desc: "Paste a file URL — fetches raw content from GitHub" },
  { id: "git-diff",   icon: "📋", label: "Git diff",        desc: "Paste git diff output — reviews only what changed" },
  { id: "paste",      icon: "📝", label: "Paste code",      desc: "Paste any file manually for a full file review" },
];

const sevLight: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "#FCEBEB", text: "#A32D2D", border: "#F7C1C1" },
  serious:  { bg: "#FFF3E0", text: "#B45309", border: "#FCD34D" },
  warning:  { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  info:     { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
};
const sevPrefix: Record<string, string> = { critical: "CRIT", serious: "WARN", warning: "WARN", info: "INFO" };

function stripUrl(url: string) { return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 10, background: checked ? "#6366F1" : "#D1D5DB", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
    </label>
  );
}

// ── Code Review Input ─────────────────────────────────────────────────────────
function CodeReviewInput({ dataMode, onResult, onLoading }: {
  dataMode: DataMode;
  onResult: (r: ScanResult) => void;
  onLoading: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<CodeReviewMode>("github-pr");
  const [prUrl, setPrUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [diff, setDiff] = useState("");
  const [filePath, setFilePath] = useState("src/app/page.tsx");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const canScan = () => {
    if (dataMode === "mock") return true;
    if (mode === "github-pr")  return prUrl.trim().length > 0;
    if (mode === "github-url") return fileUrl.trim().length > 0;
    if (mode === "git-diff")   return diff.trim().length > 0;
    return code.trim().length > 0;
  };

  const handleScan = async () => {
    setError(""); onLoading(true);
    if (dataMode === "mock") {
      await new Promise(r => setTimeout(r, 2000));
      onResult({ ...MOCK.codereview, inputMode: mode, sourceLabel: `Mock — ${mode}` });
      return;
    }
    try {
      const res = await fetch("/api/agents/codereview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prUrl, fileUrl, diff, code, filePath }),
      });
      const data: ScanResult = await res.json();
      if (data.error) { setError(data.error); onLoading(false); return; }
      onResult(data);
    } catch (e: any) { setError(e.message); onLoading(false); }
  };

  const inputSt: React.CSSProperties = { width: "100%", fontSize: 13, padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", color: "#111827", background: "#fff", marginBottom: 14, fontFamily: "inherit" };
  const areaSt: React.CSSProperties  = { ...inputSt, fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace", fontSize: 12, resize: "none", background: "#F9FAFB", lineHeight: 1.65 };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {inputModes.map(m => (
          <div key={m.id} onClick={() => setMode(m.id)}
            style={{ padding: "10px 12px", border: `${mode === m.id ? "2px" : "1px"} solid ${mode === m.id ? "#6366F1" : "#E5E7EB"}`, borderRadius: 10, cursor: "pointer", background: mode === m.id ? "#EEF2FF" : "#fff", transition: "all .15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span style={{ fontSize: 13, fontWeight: mode === m.id ? 600 : 400, color: mode === m.id ? "#4338CA" : "#111827" }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {dataMode === "mock" && (
        <div style={{ padding: "10px 14px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, fontSize: 12, color: "#92400E", marginBottom: 14 }}>
          🎭 <strong style={{ fontWeight: 600 }}>Mock mode</strong> — showing simulated results. Switch to API mode for real Claude analysis.
        </div>
      )}

      {dataMode === "api" && (
        <>
          {mode === "github-pr" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>GitHub PR URL</label>
              <input value={prUrl} onChange={e => setPrUrl(e.target.value)} style={inputSt} placeholder="https://github.com/Shubham23061989/super-ai-agents/pull/42" />
            </div>
          )}
          {mode === "github-url" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>GitHub file URL</label>
              <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inputSt} placeholder="https://github.com/Shubham23061989/super-ai-agents/blob/main/src/app/page.tsx" />
            </div>
          )}
          {mode === "git-diff" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Git diff output</label>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, padding: "5px 10px", background: "#F3F4F6", borderRadius: 6, fontFamily: "monospace" }}>
                Run: <code style={{ color: "#111827" }}>git diff main</code> → copy output → paste below
              </div>
              <textarea value={diff} onChange={e => setDiff(e.target.value)} rows={8} style={areaSt} placeholder={"diff --git a/src/app/page.tsx b/src/app/page.tsx\n..."} />
            </div>
          )}
          {mode === "paste" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>File path</label>
              <input value={filePath} onChange={e => setFilePath(e.target.value)} style={{ ...inputSt, marginBottom: 10 }} placeholder="src/app/page.tsx" />
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Paste code</label>
              <textarea value={code} onChange={e => setCode(e.target.value)} rows={10} style={areaSt} placeholder={"// paste your code here..."} />
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#991B1B", marginBottom: 12, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8 }}>
          ⚠ {error}
          {error.includes("credit") && <div style={{ marginTop: 4, fontWeight: 500 }}>→ Add credits at console.anthropic.com/billing</div>}
        </div>
      )}

      <button onClick={handleScan} disabled={!canScan()}
        style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, background: canScan() ? "linear-gradient(135deg,#6366F1,#8B5CF6)" : "#E5E7EB", color: canScan() ? "#fff" : "#9CA3AF", cursor: canScan() ? "pointer" : "not-allowed", boxShadow: canScan() ? "0 4px 14px rgba(99,102,241,0.35)" : "none" }}>
        ▶ {dataMode === "mock" ? "Run mock review" : `Review with Claude AI`}
      </button>
    </div>
  );
}

// ── Side Panel ─────────────────────────────────────────────────────────────────
type PanelStep = "input" | "scanning" | "score" | "suggestions" | "pushing" | "pushed";

function SidePanel({ agentId, scanUrl, myCode, gitConnected, dataMode, onClose, onPRPushed }: {
  agentId: string; scanUrl: string; myCode: boolean; gitConnected: boolean; dataMode: DataMode;
  onClose: () => void; onPRPushed: (count: number, result: ScanResult) => void;
}) {
  const agent = agents.find(a => a.id === agentId)!;
  const isCodeReview = agentId === "codereview";
  const canPush = myCode && gitConnected;

  const [step, setStep] = useState<PanelStep>(isCodeReview ? "input" : "scanning");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [prUrl, setPrUrl] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const issues = result ? (result.issues || result.violations || []) : [];

  useState(() => {
    if (!isCodeReview) {
      const logs: Record<string, string[]> = {
        wcag: ["Fetching page content...", "Analysing HTML structure...", "Running accessibility checks...", "Detecting WCAG violations...", "Generating AI fixes..."],
        seo:  ["Fetching page content...", "Parsing meta tags...", "Checking heading structure...", "Analysing Open Graph tags...", "Generating suggestions..."],
      };
      const ls = logs[agentId] || ["Scanning..."];
      let i = 0;
      const iv = setInterval(() => {
        if (i < ls.length) { setLogLines(p => [...p, ls[i]]); i++; }
        else clearInterval(iv);
      }, 400);

      if (dataMode === "mock") {
        setTimeout(() => {
          clearInterval(iv);
          setResult({ ...MOCK[agentId], scannedUrl: scanUrl });
          setStep("score");
        }, 2200);
      } else {
        fetch(`/api/agents/${agentId}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: scanUrl }),
        })
          .then(r => r.json())
          .then((data: ScanResult) => {
            clearInterval(iv);
            if (data.error) { setErrorMsg(data.error); setStep("score"); }
            else { setResult(data); setStep("score"); }
          })
          .catch(e => { clearInterval(iv); setErrorMsg(e.message); setStep("score"); });
      }
    }
  });

  const handleCodeReviewResult = (r: ScanResult) => { setResult(r); setStep("score"); };

  const handlePush = async () => {
    if (approved.size === 0) return;
    setStep("pushing");
    setLogLines(["Creating branch fix/ai-review-" + Date.now(), "Committing approved fixes...", "Opening pull request...", "Notifying Vercel preview..."]);
    try {
      const res = await fetch("/api/agents/codereview", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: "src/app/page.tsx", fixedContent: result?.fixed_code || "// fixed", summary: result?.summary || "AI fixes" }),
      });
      const data = await res.json();
      if (data.pr_url) setPrUrl(data.pr_url);
      else setErrorMsg(data.error || "PR creation failed");
    } catch (e: any) { setErrorMsg(e.message); }
    setStep("pushed");
    onPRPushed(approved.size, result!);
  };

  const scoreColor  = result ? (result.score >= 80 ? "#059669" : result.score >= 60 ? "#D97706" : "#DC2626") : "#9CA3AF";
  const scoreBg     = result ? (result.score >= 80 ? "#ECFDF5" : result.score >= 60 ? "#FFFBEB" : "#FEF2F2") : "#F9FAFB";
  const scoreBorder = result ? (result.score >= 80 ? "#6EE7B7" : result.score >= 60 ? "#FCD34D" : "#FECACA") : "#E5E7EB";
  const scoreLabel  = result ? (result.score >= 80 ? "Good" : result.score >= 60 ? "Needs work" : "Poor") : "";
  const modeIcon: Record<string, string> = { "github-pr": "🔀", "github-url": "🔗", "git-diff": "📋", "paste": "📝" };

  const steps = [{ key: "score", label: "Score" }, { key: "suggestions", label: "Fixes" }];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.3)", backdropFilter: "blur(2px)", zIndex: 40 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 640, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif", boxShadow: "-8px 0 48px rgba(0,0,0,0.12)", borderLeft: "1px solid #E5E7EB", animation: "spSlide 0.25s cubic-bezier(.4,0,.2,1)" }}>
        <style>{`
          @keyframes spSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
          @keyframes spin{to{transform:rotate(360deg)}}
          .sps::-webkit-scrollbar{width:4px}.sps::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
          .icard{border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;background:#fff;margin-bottom:10px;transition:border-color .15s,box-shadow .15s}
          .icard:hover{box-shadow:0 2px 8px rgba(0,0,0,0.06)}
          .icard.ok{border-color:#6EE7B7;background:#F0FFF4}
          .fb{font-family:inherit;font-size:12px;padding:5px 14px;border-radius:6px;border:1px solid #E5E7EB;background:#fff;color:#374151;cursor:pointer;transition:all .15s;font-weight:500}
          .fb:hover{border-color:#9CA3AF;background:#F9FAFB}
          .fb.active{border-color:#6366F1;color:#4338CA;background:#EEF2FF}
          .fb.green{border-color:#059669;color:#065F46;background:#ECFDF5}
          .fb.green:hover{background:#D1FAE5}
        `}</style>

        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", flexShrink: 0, background: "linear-gradient(135deg,#F8FAFF,#F3F4F6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div onClick={onClose} style={{ width: 12, height: 12, borderRadius: "50%", background: "#F87171", cursor: "pointer", boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} title="Close" />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FBBF24", boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} />
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: agent.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{agent.icon}</div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{agent.title}</span>
              {result?.inputMode && <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 7px", borderRadius: 20, background: "#EEF2FF", color: "#4338CA", fontWeight: 500 }}>{modeIcon[result.inputMode]} {result.inputMode}</span>}
              {dataMode === "mock" && <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 7px", borderRadius: 20, background: "#FFF7ED", color: "#92400E", fontWeight: 500 }}>🎭 Mock</span>}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
              {result?.sourceLabel ? stripUrl(result.sourceLabel) : stripUrl(scanUrl)}
            </span>
          </div>
        </div>

        {/* Mode bar */}
        {!["input","scanning","pushing","pushed"].includes(step) && (
          <div style={{ padding: "7px 20px", borderBottom: "1px solid #F3F4F6", background: canPush ? "#F0FFF4" : myCode ? "#FFFBEB" : "#F9FAFB", display: "flex", alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: canPush ? "#059669" : myCode ? "#D97706" : "#9CA3AF", marginRight: 8 }} />
            <span style={{ fontSize: 12, color: canPush ? "#065F46" : myCode ? "#92400E" : "#6B7280", fontWeight: 500 }}>
              {canPush ? "Full mode — fixes + GitHub PR push" : myCode ? "Fixes mode — git push disabled" : "Read-only — scores & suggestions"}
            </span>
          </div>
        )}

        {/* Step nav */}
        {result && !["scanning","pushing","pushed","input"].includes(step) && (
          <div style={{ padding: "8px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, background: "#FAFAFA" }}>
            {isCodeReview && (
              <button className="fb" onClick={() => { setStep("input"); setResult(null); setApproved(new Set()); setErrorMsg(""); }} style={{ fontSize: 11, marginRight: 10 }}>← Change input</button>
            )}
            {steps.map((s, i) => {
              const isDone = currentStepIdx > i, isActive = step === s.key;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button className={`fb ${isActive ? "active" : ""}`} onClick={() => { if (isDone || isActive) setStep(s.key as PanelStep); }} style={{ opacity: !isDone && !isActive ? 0.4 : 1, fontSize: 12 }}>
                    {isDone ? "✓ " : ""}{s.label}
                  </button>
                  {i < steps.length - 1 && <span style={{ color: "#D1D5DB" }}>›</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="sps" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* Scanning log */}
          {step === "scanning" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 18, height: 18, border: "2px solid #E5E7EB", borderTop: `2px solid ${agent.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                  {dataMode === "mock" ? "Running mock scan..." : `Scanning ${stripUrl(scanUrl)} with Claude AI...`}
                </span>
              </div>
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", minHeight: 160 }}>
                {logLines.map((line, i) => (
                  <div key={i} style={{ fontSize: 12, color: i === logLines.length - 1 ? "#111827" : "#9CA3AF", lineHeight: 2, fontFamily: "monospace", display: "flex", gap: 8 }}>
                    <span style={{ color: agent.accent }}>$</span>{line}
                  </div>
                ))}
                <span style={{ fontSize: 12, color: "#D1D5DB" }}>█</span>
              </div>
            </div>
          )}

          {/* Code review input */}
          {step === "input" && isCodeReview && (
            <CodeReviewInput dataMode={dataMode} onResult={handleCodeReviewResult} onLoading={(v) => { if (v) setStep("scanning"); }} />
          )}

          {/* Error */}
          {errorMsg && step === "score" && (
            <div style={{ padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#991B1B", marginBottom: 16 }}>
              <strong style={{ fontWeight: 600 }}>Error: </strong>{errorMsg}
              {errorMsg.includes("credit") && <div style={{ marginTop: 4 }}>→ Add credits at <a href="https://console.anthropic.com/billing" target="_blank" style={{ color: "#991B1B" }}>console.anthropic.com/billing</a></div>}
            </div>
          )}

          {/* SCORE */}
          {step === "score" && result && (
            <div>
              <div style={{ background: scoreBg, border: `1.5px solid ${scoreBorder}`, borderRadius: 14, padding: "22px 20px", marginBottom: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `${scoreColor}15` }} />
                <div style={{ fontSize: 11, color: scoreColor, fontWeight: 600, marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {result.inputMode ? `${modeIcon[result.inputMode]} ${result.inputMode}` : "🌐 Scan"} · {result.sourceLabel || result.scannedUrl}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{result.score}</div>
                  <div style={{ paddingBottom: 8 }}>
                    <div style={{ fontSize: 16, color: scoreColor, fontWeight: 600 }}>/100</div>
                    <div style={{ fontSize: 11, padding: "2px 9px", borderRadius: 20, background: `${scoreColor}20`, color: scoreColor, marginTop: 4, fontWeight: 600 }}>{scoreLabel}</div>
                  </div>
                </div>
                <div style={{ height: 8, background: `${scoreColor}20`, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ width: `${result.score}%`, height: "100%", background: `linear-gradient(90deg,${scoreColor},${scoreColor}CC)`, borderRadius: 4, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
                </div>
                <div style={{ fontSize: 13, color: scoreColor, fontWeight: 500 }}>{result.summary}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[
                  { label: "Issues", value: issues.length, bg: issues.length > 0 ? "#FEF2F2" : "#ECFDF5", color: issues.length > 0 ? "#DC2626" : "#059669", border: issues.length > 0 ? "#FECACA" : "#6EE7B7" },
                  { label: "Critical", value: issues.filter(i => i.severity === "critical" || i.severity === "serious").length, bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
                  { label: "Passed", value: result.passed, bg: "#ECFDF5", color: "#059669", border: "#6EE7B7" },
                ].map(m => (
                  <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: m.color, marginTop: 3, fontWeight: 500 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Issues found</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                {issues.map((item: Issue) => {
                  const sl = sevLight[item.severity] || sevLight.info;
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: sl.bg, border: `1px solid ${sl.border}`, borderRadius: 9, borderLeft: `3px solid ${sl.text}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: sl.text + "22", color: sl.text, flexShrink: 0, letterSpacing: "0.04em" }}>{sevPrefix[item.severity] || "INFO"}</span>
                      <span style={{ fontSize: 12, color: "#111827", flex: 1, fontWeight: 500 }}>{item.issue}</span>
                      {item.line && <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>L{item.line}</span>}
                    </div>
                  );
                })}
              </div>

              {issues.length === 0 && !errorMsg && (
                <div style={{ padding: "16px", background: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: 10, fontSize: 13, color: "#065F46", textAlign: "center", fontWeight: 500 }}>
                  ✓ No issues found — looks great!
                </div>
              )}

              {myCode && issues.length > 0 && (
                <button className="fb green" onClick={() => setStep("suggestions")} style={{ width: "100%", padding: "10px", fontSize: 13, fontWeight: 600 }}>View AI fixes →</button>
              )}
              {!myCode && issues.length > 0 && (
                <div style={{ padding: "12px 14px", background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12, color: "#6B7280" }}>
                  Enable "I own this code" in the dashboard to unlock AI fixes
                </div>
              )}
            </div>
          )}

          {/* SUGGESTIONS */}
          {step === "suggestions" && result && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{approved.size} of {issues.length} fixes approved</span>
                {canPush && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="fb" onClick={() => setApproved(new Set(issues.map(i => i.id)))} style={{ fontSize: 11 }}>Approve all</button>
                    <button className="fb" onClick={() => setApproved(new Set())} style={{ fontSize: 11 }}>Clear</button>
                  </div>
                )}
              </div>

              {issues.map((item: Issue) => {
                const sl = sevLight[item.severity] || sevLight.info;
                const isApproved = approved.has(item.id);
                const isExpanded = expandedId === item.id;
                const beforeLines = (item.codePreview || "").split("\n");
                const afterLines  = (item.codeFixed  || "").split("\n");
                const maxLen = Math.max(beforeLines.length, afterLines.length);

                return (
                  <div key={item.id} className={`icard ${isApproved ? "ok" : ""}`}>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: sl.bg, color: sl.text, fontWeight: 700, border: `1px solid ${sl.border}`, letterSpacing: "0.04em" }}>{sevPrefix[item.severity]}</span>
                            {item.line && <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>line {item.line}</span>}
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{item.issue}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 8, lineHeight: 1.6 }}>
                            <span style={{ color: "#059669", fontWeight: 600 }}>Fix: </span>{item.fix}
                          </div>
                          {(item.codePreview || item.codeFixed) && (
                            <button className="fb" onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{ fontSize: 11 }}>
                              {isExpanded ? "▲ Hide diff" : "▼ Show diff"}
                            </button>
                          )}
                        </div>
                        {myCode && (
                          <button className={`fb ${isApproved ? "active" : ""}`}
                            onClick={() => { const n = new Set(approved); n.has(item.id) ? n.delete(item.id) : n.add(item.id); setApproved(n); }}
                            style={{ minWidth: 90, textAlign: "center", flexShrink: 0, fontSize: 12 }}>
                            {isApproved ? "✓ Approved" : "Approve"}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (item.codePreview || item.codeFixed) && (
                      <div style={{ borderTop: "1px solid #F3F4F6" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                          <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 6, borderRight: "1px solid #F3F4F6" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F87171" }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>Before</span>
                          </div>
                          <div style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399" }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>After</span>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                          {[beforeLines, afterLines].map((lines, idx) => (
                            <div key={idx} style={{ borderRight: idx === 0 ? "1px solid #F3F4F6" : "none" }}>
                              {Array.from({ length: maxLen }).map((_, i) => {
                                const line = lines[i] ?? "";
                                const other = (idx === 0 ? afterLines : beforeLines)[i] ?? "";
                                const changed = line !== other;
                                return (
                                  <div key={i} style={{ display: "flex", gap: 8, padding: "3px 14px", background: changed ? (idx === 0 ? "#FEF2F2" : "#ECFDF5") : "transparent", minHeight: 22 }}>
                                    <span style={{ fontSize: 10, color: "#D1D5DB", minWidth: 16, textAlign: "right", userSelect: "none", flexShrink: 0 }}>{i + 1}</span>
                                    <span style={{ fontSize: 10, color: changed ? (idx === 0 ? "#DC2626" : "#059669") : "#D1D5DB", minWidth: 10, flexShrink: 0, fontFamily: "monospace" }}>{changed ? (idx === 0 ? "−" : "+") : " "}</span>
                                    <code style={{ fontSize: 11, fontFamily: "monospace", color: changed ? (idx === 0 ? "#991B1B" : "#065F46") : "#9CA3AF", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.5 }}>{line}</code>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {canPush ? (
                approved.size > 0 ? (
                  <button onClick={handlePush}
                    style={{ width: "100%", padding: "11px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#059669,#0F6E56)", color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(5,150,105,0.35)" }}>
                    Push PR with {approved.size} fix{approved.size > 1 ? "es" : ""} to GitHub →
                  </button>
                ) : (
                  <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "#9CA3AF", background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB" }}>
                    Approve at least one fix to push a PR
                  </div>
                )
              ) : (
                <div style={{ padding: "11px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12, color: "#6B7280" }}>
                  {myCode ? "Enable Git integration to push PR" : 'Enable "I own this code" to approve fixes'}
                </div>
              )}
            </div>
          )}

          {/* PUSHING */}
          {step === "pushing" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
              <div style={{ width: 44, height: 44, border: "3px solid #E5E7EB", borderTop: "3px solid #059669", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Creating GitHub PR</div>
              <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", width: "100%" }}>
                {logLines.map((line, i) => (
                  <div key={i} style={{ fontSize: 12, color: i === logLines.length - 1 ? "#374151" : "#9CA3AF", lineHeight: 1.9, fontFamily: "monospace" }}>
                    <span style={{ color: "#059669" }}>$ </span>{line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PUSHED */}
          {step === "pushed" && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", border: "2px solid #6EE7B7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 18px", boxShadow: "0 4px 14px rgba(5,150,105,0.2)" }}>✓</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 8 }}>PR created on GitHub!</div>
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.75, marginBottom: 24 }}>Branch <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "#111827" }}>fix/ai-review</code> pushed. Vercel is building a preview.</div>
              {errorMsg && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 16, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>{errorMsg}</div>}
              {[{ n: "1", text: "Open PR on GitHub", done: true }, { n: "2", text: "Check Vercel preview URL (in PR description)", done: false }, { n: "3", text: "Merge PR → auto-deploy to production", done: false }].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < 2 ? "1px solid #F3F4F6" : "none", textAlign: "left" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: s.done ? "linear-gradient(135deg,#ECFDF5,#D1FAE5)" : "#F3F4F6", border: `1px solid ${s.done ? "#6EE7B7" : "#E5E7EB"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: s.done ? "#059669" : "#9CA3AF", flexShrink: 0 }}>{s.n}</div>
                  <span style={{ fontSize: 13, color: s.done ? "#111827" : "#9CA3AF", fontWeight: s.done ? 500 : 400 }}>{s.text}</span>
                </div>
              ))}
              {prUrl && <a href={prUrl} target="_blank" style={{ display: "block", marginTop: 18, padding: "12px", fontSize: 14, fontWeight: 600, background: "linear-gradient(135deg,#111827,#374151)", color: "#fff", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>Open PR on GitHub →</a>}
              <button onClick={onClose} style={{ width: "100%", marginTop: 8, padding: "10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 9, background: "#fff", color: "#6B7280", cursor: "pointer", fontWeight: 500 }}>Close panel</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Agent Tile ─────────────────────────────────────────────────────────────────
function AgentTile({ agent, status, result, dataMode, onRun }: {
  agent: typeof agents[0]; status: RunStatus; result?: ScanResult; dataMode: DataMode; onRun: () => void;
}) {
  const items = result ? (result.violations || result.issues || []) : [];
  const critCount = items.filter((i: any) => i.severity === "critical" || i.severity === "serious").length;
  const isCodeReview = agent.id === "codereview";
  const scoreColor = result ? (result.score >= 80 ? "#059669" : result.score >= 60 ? "#D97706" : "#DC2626") : "#9CA3AF";
  const modeIcon: Record<string, string> = { "github-pr": "🔀", "github-url": "🔗", "git-diff": "📋", "paste": "📝" };

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10, transition: "all .15s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; d.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.boxShadow = "none"; d.style.transform = "none"; }}>
      {/* Accent top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${agent.accent},${agent.accent}88)`, borderRadius: "14px 14px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: agent.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{agent.icon}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {dataMode === "mock" && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 20, background: "#FFF7ED", color: "#92400E", fontWeight: 600 }}>Mock</span>}
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: agent.badgeBg, color: agent.badgeColor }}>{agent.badge}</span>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{agent.title}</div>
      <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55, flex: 1 }}>{agent.desc}</div>

      {isCodeReview && !result && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[{ icon: "🔀", label: "PR" }, { icon: "🔗", label: "URL" }, { icon: "📋", label: "Diff" }, { icon: "📝", label: "Paste" }].map(m => (
            <span key={m.label} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB", fontWeight: 500 }}>{m.icon} {m.label}</span>
          ))}
        </div>
      )}

      {result && (
        <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 12px", border: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>Score: {result.score}/100</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: critCount > 0 ? "#FEF2F2" : "#ECFDF5", color: critCount > 0 ? "#DC2626" : "#059669", fontWeight: 600, border: `1px solid ${critCount > 0 ? "#FECACA" : "#6EE7B7"}` }}>
              {critCount > 0 ? `${critCount} critical` : "All clear"}
            </span>
          </div>
          <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${result.score}%`, height: "100%", background: `linear-gradient(90deg,${scoreColor},${scoreColor}BB)`, borderRadius: 2, transition: "width 1s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {result.inputMode ? modeIcon[result.inputMode] : "🌐"} {result.sourceLabel || result.scannedUrl}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{result.summary}</div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #F3F4F6" }}>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{status === "running" ? "Scanning..." : status === "done" ? "Just now" : "Not yet run"}</span>
        <button onClick={onRun} disabled={status === "running"}
          style={{ fontSize: 12, fontWeight: 600, padding: "6px 16px", border: "none", borderRadius: 8, background: status === "running" ? "#F3F4F6" : `linear-gradient(135deg,${agent.accent},${agent.accent}CC)`, color: status === "running" ? "#9CA3AF" : "#fff", cursor: status === "running" ? "not-allowed" : "pointer", boxShadow: status === "running" ? "none" : `0 2px 8px ${agent.accent}40` }}>
          {status === "running" ? "Scanning..." : isCodeReview ? "▶ Open reviewer" : result ? "▶ Re-scan" : "▶ Run"}
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [statuses, setStatuses]   = useState<Record<string, RunStatus>>({});
  const [results, setResults]     = useState<Record<string, ScanResult>>({});
  const [panelAgent, setPanelAgent] = useState<string | null>(null);
  const [totalPRs, setTotalPRs]   = useState(0);
  const [prBanner, setPrBanner]   = useState<string | null>(null);
  const [url, setUrl]             = useState("https://super-ai-agents-zr2x.vercel.app");
  const [myCode, setMyCode]       = useState(false);
  const [gitConnected, setGitConnected] = useState(false);
  const [dataMode, setDataMode]   = useState<DataMode>("mock");

  const totalIssues = Object.values(results).reduce((acc, r) => acc + (r.violations || r.issues || []).length, 0);

  const handleRun = (id: string) => {
    setPanelAgent(id);
    if (id !== "codereview") setStatuses(s => ({ ...s, [id]: "running" }));
  };

  const handlePRPushed = (count: number, result: ScanResult) => {
    setTotalPRs(p => p + 1);
    setStatuses(s => ({ ...s, codereview: "done" }));
    if (result) setResults(r => ({ ...r, codereview: result }));
    setPrBanner(`PR pushed with ${count} fix${count > 1 ? "es" : ""}! Merge on GitHub → Vercel auto-deploys.`);
    setTimeout(() => setPrBanner(null), 7000);
  };

  const handleClose = () => {
    if (panelAgent && panelAgent !== "codereview") setStatuses(s => ({ ...s, [panelAgent!]: "done" }));
    setPanelAgent(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F0F4FF 0%,#F9FAFB 50%,#F0FDF4 100%)", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, padding: "0 2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 2px 8px rgba(99,102,241,0.4)" }}>⚙</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111827", letterSpacing: "-0.02em" }}>AI Super Agents</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Data mode selector */}
            <div style={{ display: "flex", alignItems: "center", background: "#F3F4F6", borderRadius: 8, padding: 3, gap: 2 }}>
              {(["mock", "api"] as DataMode[]).map(m => (
                <button key={m} onClick={() => setDataMode(m)}
                  style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 6, border: "none", background: dataMode === m ? "#fff" : "transparent", color: dataMode === m ? "#111827" : "#9CA3AF", cursor: "pointer", boxShadow: dataMode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all .15s" }}>
                  {m === "mock" ? "🎭 Mock" : "🤖 API"}
                </button>
              ))}
            </div>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yoursite.com"
              style={{ fontSize: 13, padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 8, width: 280, outline: "none", color: "#111827", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: "#6366F1", background: "#EEF2FF", padding: "4px 10px", borderRadius: 20, border: "1px solid #C7D2FE" }}>3 agents</div>
          </div>
        </div>
      </div>

      {/* Mode banner */}
      {dataMode === "mock" && (
        <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFFBEB)", borderBottom: "1px solid #FED7AA", padding: "8px 2rem", textAlign: "center", fontSize: 12, color: "#92400E", fontWeight: 500 }}>
          🎭 Mock mode — showing simulated data. Switch to <strong>🤖 API</strong> mode (top right) + add Anthropic credits for real AI scanning.
        </div>
      )}
      {prBanner && (
        <div style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderBottom: "1px solid #6EE7B7", padding: "10px 2rem", textAlign: "center", fontSize: 13, color: "#065F46", fontWeight: 600 }}>
          ✓ {prBanner}
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>

        {/* Control bar */}
        <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "14px 20px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", boxShadow: "0 1px 8px rgba(99,102,241,0.08)" }}>
          <Toggle checked={myCode} onChange={v => { setMyCode(v); if (!v) setGitConnected(false); }} label="I own this code" />
          {myCode && <><div style={{ width: 1, height: 20, background: "#E5E7EB" }} /><Toggle checked={gitConnected} onChange={setGitConnected} label="Git integration enabled" /></>}
          <div style={{ marginLeft: "auto" }}>
            {!myCode && <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}>View-only — scores & suggestions</span>}
            {myCode && !gitConnected && <span style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, background: "#FFF7ED", color: "#92400E", border: "1px solid #FED7AA" }}>Fixes enabled — PR push disabled</span>}
            {myCode && gitConnected && <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: "#ECFDF5", color: "#065F46", border: "1px solid #6EE7B7" }}>✓ Full mode — fixes + GitHub PR</span>}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: "2rem" }}>
          {[
            { label: "Total agents", value: 3, icon: "⚙", color: "#6366F1", bg: "#EEF2FF", border: "#C7D2FE" },
            { label: "Active", value: 2, icon: "✅", color: "#059669", bg: "#ECFDF5", border: "#6EE7B7" },
            { label: "Issues found", value: totalIssues, icon: "⚠️", color: totalIssues > 0 ? "#DC2626" : "#059669", bg: totalIssues > 0 ? "#FEF2F2" : "#ECFDF5", border: totalIssues > 0 ? "#FECACA" : "#6EE7B7" },
            { label: "PRs opened", value: totalPRs, icon: "🔀", color: "#0891B2", bg: "#E0F2FE", border: "#7DD3FA" },
          ].map(m => (
            <div key={m.label} style={{ background: "#fff", border: `1px solid ${m.border}`, borderRadius: 14, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.color, opacity: 0.6 }} />
              <div style={{ width: 36, height: 36, borderRadius: 9, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{m.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2, fontWeight: 500 }}>{m.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Agents grid */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 14 }}>Agents</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {agents.map(agent => (
            <AgentTile key={agent.id} agent={agent} status={statuses[agent.id] || "idle"} result={results[agent.id]} dataMode={dataMode} onRun={() => handleRun(agent.id)} />
          ))}
        </div>
      </div>

      {panelAgent && (
        <SidePanel agentId={panelAgent} scanUrl={url} myCode={myCode} gitConnected={gitConnected} dataMode={dataMode} onClose={handleClose} onPRPushed={handlePRPushed} />
      )}
    </div>
  );
}