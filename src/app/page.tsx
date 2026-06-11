"use client";
import { useState, useEffect } from "react";

const agents = [
  {
    id: "wcag",
    icon: "♿",
    title: "WCAG Audit",
    desc: "Scans for accessibility violations, generates AI fixes, and opens a review diff before pushing.",
    color: "#EEEDFE",
    badge: "Active",
    badgeColor: "#EAF3DE",
    badgeText: "#27500A",
    category: "Code Quality",
    mockResult: {
      score: 67,
      summary: "Found 4 accessibility violations across 3 elements.",
      passed: 18,
      violations: [
        { id: "img-alt", severity: "critical", issue: "3 images missing alt text", element: '<img src="hero.jpg">', fix: 'Add alt="describe image here"' },
        { id: "color-contrast", severity: "serious", issue: "Button text contrast ratio 2.8:1 (min 4.5:1)", element: '<button class="btn-gray">', fix: "Change text color to #595959 or darker" },
        { id: "label-missing", severity: "moderate", issue: "Form input has no associated label", element: '<input type="email">', fix: 'Add <label for="email"> or aria-label attribute' },
        { id: "skip-nav", severity: "minor", issue: "No skip navigation link found", element: "<body>", fix: 'Add <a href="#main" class="skip-link">Skip to content</a> as first element' },
      ],
    },
  },
  {
    id: "seo",
    icon: "🔍",
    title: "SEO Check",
    desc: "Audits meta tags, headings, structured data. Proposes fixes and submits a PR on approval.",
    color: "#E1F5EE",
    badge: "Active",
    badgeColor: "#EAF3DE",
    badgeText: "#27500A",
    category: "Code Quality",
    mockResult: {
      score: 74,
      summary: "3 critical SEO issues found. Page is indexable but underoptimised.",
      passed: 11,
      issues: [
        { id: "meta-desc", severity: "critical", issue: "Meta description missing on homepage", fix: 'Add <meta name="description" content="Your page summary (150-160 chars)">' },
        { id: "h1-missing", severity: "critical", issue: "No H1 tag found on page", fix: "Add exactly one <h1> tag as primary heading" },
        { id: "og-tags", severity: "warning", issue: "Open Graph tags missing (og:title, og:image)", fix: 'Add <meta property="og:title"> and <meta property="og:image"> in <head>' },
        { id: "img-alt-seo", severity: "info", issue: "2 images missing descriptive alt text for SEO", fix: 'Use keyword-rich alt text like alt="blue running shoes for men"' },
      ],
    },
  },
  {
    id: "codereview",
    icon: "🧠",
    title: "Code Review",
    desc: "Reviews PRs for logic bugs, security issues, and style violations. Auto-fixes trivial issues.",
    color: "#E6F1FB",
    badge: "Beta",
    badgeColor: "#EEEDFE",
    badgeText: "#3C3489",
    category: "Code Quality",
    mockResult: {
      score: 88,
      summary: "No critical bugs. 2 style warnings and 1 performance suggestion.",
      passed: 14,
      issues: [
        { id: "unused-var", severity: "warning", issue: "Unused variable 'tempData' in components/Header.tsx line 42", fix: "Remove unused variable or use it" },
        { id: "console-log", severity: "warning", issue: "console.log() left in production code (3 instances)", fix: "Remove console.log statements before deploying" },
        { id: "memo", severity: "info", issue: "Large list component re-renders on every parent update", fix: "Wrap with React.memo() to prevent unnecessary re-renders" },
      ],
    },
  }
];

type RunStatus = "idle" | "running" | "done" | "error";
type ViewMode = "dashboard" | "detail";

interface ScanResult {
  score: number;
  summary: string;
  passed: number;
  violations?: any[];
  issues?: any[];
}

const severityColor: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#FCEBEB", text: "#A32D2D" },
  serious:  { bg: "#FAEEDA", text: "#633806" },
  warning:  { bg: "#FAEEDA", text: "#633806" },
  moderate: { bg: "#E6F1FB", text: "#0C447C" },
  info:     { bg: "#F1EFE8", text: "#444441" },
  minor:    { bg: "#F1EFE8", text: "#444441" },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#1D9E75" : score >= 60 ? "#BA7517" : "#E24B4A";
  const r = 28, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#eee" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 36 36)" />
      <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="500" fill={color}>{score}</text>
    </svg>
  );
}

function DetailView({ agent, result, onBack, onApprove }: {
  agent: typeof agents[0]; result: ScanResult; onBack: () => void; onApprove: () => void;
}) {
  const items = result.violations || result.issues || [];
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const toggleApprove = (id: string) => {
    setApproved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ padding: "1.5rem 2rem", maxWidth: 960, margin: "0 auto" }}>
      <button onClick={onBack} style={{ fontSize: 13, color: "#666", background: "none", border: "none", cursor: "pointer", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to dashboard
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.5rem" }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: agent.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{agent.icon}</div>
        <div>
          <div style={{ fontWeight: 500, fontSize: 18, color: "#1a1a1a" }}>{agent.title} — Scan Results</div>
          <div style={{ fontSize: 13, color: "#888" }}>{result.summary}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><ScoreRing score={result.score} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Issues found", value: items.length },
          { label: "Checks passed", value: result.passed },
          { label: "Score", value: `${result.score}/100` },
        ].map(m => (
          <div key={m.label} style={{ background: "#f9f9f8", borderRadius: 10, padding: "1rem" }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: 10 }}>Issues & AI fixes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
        {items.map((item: any) => {
          const sc = severityColor[item.severity] || severityColor.info;
          const isApproved = approved.has(item.id);
          return (
            <div key={item.id} style={{ background: "#fff", border: `0.5px solid ${isApproved ? "#9FE1CB" : "#e5e5e3"}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text }}>{item.severity}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{item.issue}</span>
                  </div>
                  {item.element && (
                    <div style={{ fontSize: 12, fontFamily: "monospace", background: "#f5f5f3", padding: "4px 8px", borderRadius: 6, color: "#555", marginBottom: 6 }}>{item.element}</div>
                  )}
                  <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                    <span style={{ color: "#1D9E75", fontWeight: 500 }}>Fix: </span>{item.fix}
                  </div>
                </div>
                <button
                  onClick={() => toggleApprove(item.id)}
                  style={{ fontSize: 12, padding: "5px 14px", border: `0.5px solid ${isApproved ? "#1D9E75" : "#ddd"}`, borderRadius: 8, background: isApproved ? "#E1F5EE" : "#fff", color: isApproved ? "#0F6E56" : "#666", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {isApproved ? "✓ Approved" : "Approve fix"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {approved.size > 0 && (
        <div style={{ background: "#E1F5EE", border: "0.5px solid #9FE1CB", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: "#085041" }}>{approved.size} fix{approved.size > 1 ? "es" : ""} approved</div>
            <div style={{ fontSize: 12, color: "#0F6E56" }}>A GitHub PR will be created with these changes</div>
          </div>
          <button onClick={onApprove} style={{ fontSize: 13, fontWeight: 500, padding: "8px 20px", border: "none", borderRadius: 8, background: "#0F6E56", color: "#fff", cursor: "pointer" }}>
            Push PR →
          </button>
        </div>
      )}
    </div>
  );
}

function AgentTile({ agent, status, result, onRun, onView }: {
  agent: typeof agents[0]; status: RunStatus; result?: ScanResult; onRun: () => void; onView: () => void;
}) {
  const isSoon = agent.badge === "Soon";
  const items = result ? (result.violations || result.issues || []) : [];
  const criticalCount = items.filter((i: any) => i.severity === "critical" || i.severity === "serious").length;

  return (
    <div style={{ background: "#fff", border: agent.badge === "Active" ? "2px solid #b5d4f4" : "0.5px solid #e5e5e3", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 8, background: agent.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{agent.icon}</div>
        <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20, background: agent.badgeColor, color: agent.badgeText }}>{agent.badge}</span>
      </div>
      <div style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>{agent.title}</div>
      <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, flex: 1 }}>{agent.desc}</div>

      {result && (
        <div style={{ background: "#f9f9f8", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>Score: {result.score}/100</span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: criticalCount > 0 ? "#FCEBEB" : "#EAF3DE", color: criticalCount > 0 ? "#A32D2D" : "#27500A" }}>
              {criticalCount > 0 ? `${criticalCount} critical` : "No critical issues"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>{result.summary}</div>
          <button onClick={onView} style={{ marginTop: 8, fontSize: 12, fontWeight: 500, padding: "5px 12px", border: "0.5px solid #b5d4f4", borderRadius: 6, background: "#E6F1FB", color: "#0C447C", cursor: "pointer" }}>
            View issues & fixes →
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "0.5px solid #eee" }}>
        <span style={{ fontSize: 11, color: "#bbb" }}>
          {status === "running" ? "Scanning..." : status === "done" ? "Just now" : "Not yet run"}
        </span>
        <button
          onClick={onRun}
          disabled={isSoon || status === "running"}
          style={{ fontSize: 12, fontWeight: 500, padding: "5px 14px", border: "0.5px solid #ddd", borderRadius: 8, background: status === "running" ? "#f5f5f3" : isSoon ? "#f5f5f3" : "#fff", color: isSoon ? "#bbb" : status === "running" ? "#888" : "#1a1a1a", cursor: isSoon || status === "running" ? "not-allowed" : "pointer" }}
        >
          {status === "running" ? "⏳ Scanning..." : isSoon ? "⏰ Soon" : "▶ Run"}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [statuses, setStatuses] = useState<Record<string, RunStatus>>({});
  const [results, setResults] = useState<Record<string, ScanResult>>({});
  const [url, setUrl] = useState("https://example.com");
  const [view, setView] = useState<{ mode: ViewMode; agentId?: string }>({ mode: "dashboard" });
  const [prSuccess, setPrSuccess] = useState<string | null>(null);
  const [totalIssues, setTotalIssues] = useState(0);
  const [totalPRs, setTotalPRs] = useState(0);

  useEffect(() => {
    let count = 0;
    Object.values(results).forEach(r => { count += (r.violations || r.issues || []).length; });
    setTotalIssues(count);
  }, [results]);

  const runAgent = async (id: string) => {
    if (statuses[id] === "running") return;
    setStatuses(s => ({ ...s, [id]: "running" }));
    await new Promise(res => setTimeout(res, 2000));
    try {
      const agent = agents.find(a => a.id === id);
      const data = agent?.mockResult as ScanResult;
      if (data) {
        setResults(r => ({ ...r, [id]: data }));
        setStatuses(s => ({ ...s, [id]: "done" }));
      }
    } catch {
      setStatuses(s => ({ ...s, [id]: "error" }));
    }
  };

  const handleApprove = (agentId: string) => {
    setTotalPRs(p => p + 1);
    setPrSuccess(`PR created for ${agents.find(a => a.id === agentId)?.title}!`);
    setTimeout(() => setPrSuccess(null), 4000);
    setView({ mode: "dashboard" });
  };

  const activeAgent = view.agentId ? agents.find(a => a.id === view.agentId) : null;
  const activeResult = view.agentId ? results[view.agentId] : null;

  if (view.mode === "detail" && activeAgent && activeResult) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9f9f8", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e5e3", padding: "0 2rem" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", height: 56, gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#EEEDFE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙</div>
            <span style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>AI Agents</span>
          </div>
        </div>
        <DetailView agent={activeAgent} result={activeResult} onBack={() => setView({ mode: "dashboard" })} onApprove={() => handleApprove(activeAgent.id)} />
      </div>
    );
  }

  const codeQuality = agents.filter(a => a.category === "Code Quality");
  const perfContent = agents.filter(a => a.category === "Performance & Content");

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e5e3", padding: "0 2rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#EEEDFE", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚙</div>
            <span style={{ fontWeight: 500, fontSize: 15, color: "#1a1a1a" }}>AI Super Agents </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter URL to scan"
              style={{ fontSize: 13, padding: "6px 12px", border: "0.5px solid #ddd", borderRadius: 8, width: 260, outline: "none", color: "#1a1a1a", background: "#fff" }} />
            <div style={{ fontSize: 12, color: "#888", background: "#f1f1ee", padding: "4px 10px", borderRadius: 20 }}>3 agents · 2 active</div>
          </div>
        </div>
      </div>

      {prSuccess && (
        <div style={{ background: "#E1F5EE", borderBottom: "0.5px solid #9FE1CB", padding: "10px 2rem", textAlign: "center", fontSize: 13, color: "#085041", fontWeight: 500 }}>
          ✓ {prSuccess} Check your GitHub repository for the new PR.
        </div>
      )}

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "2rem" }}>
          {[
            { label: "Total agents", value: "3" },
            { label: "Active", value: "2" },
            { label: "Issues found", value: String(totalIssues) },
            { label: "PRs opened", value: String(totalPRs) },
          ].map(m => (
            <div key={m.label} style={{ background: "#fff", border: "0.5px solid #e5e5e3", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: "#1a1a1a" }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "#aaa", textTransform: "uppercase", marginBottom: 12 }}>Code quality</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "2rem" }}>
          {codeQuality.map(agent => (
            <AgentTile key={agent.id} agent={agent} status={statuses[agent.id] || "idle"} result={results[agent.id]} onRun={() => runAgent(agent.id)} onView={() => setView({ mode: "detail", agentId: agent.id })} />
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", color: "#aaa", textTransform: "uppercase", marginBottom: 12 }}>Performance & content</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {perfContent.map(agent => (
            <AgentTile key={agent.id} agent={agent} status={statuses[agent.id] || "idle"} result={results[agent.id]} onRun={() => runAgent(agent.id)} onView={() => setView({ mode: "detail", agentId: agent.id })} />
          ))}
          <div
            style={{ border: "0.5px dashed #ccc", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 180, cursor: "pointer", color: "#bbb" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f5f5f3"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{ fontSize: 24 }}>+</div>
            <span style={{ fontSize: 13 }}>Add agent</span>
          </div>
        </div>
      </div>
    </div>
  );
}