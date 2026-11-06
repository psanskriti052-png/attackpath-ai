/**
 * ATTACKPATH AI — MOCK AGENT SERVICE
 * ----------------------------------------------------------------------------
 * This file is the ONLY place where demo behaviour is simulated.
 * Every function here maps 1:1 to a planned FastAPI endpoint (see README).
 * Nothing in here touches the network. No real scanning, no exploit payloads.
 *
 * Replace this module with an HTTP client later:
 *   startScan(target)        -> POST /api/scans
 *   streamLogs(scanId)       -> GET  /api/scans/{id}/logs   (SSE)
 *   getFindings(scanId)      -> GET  /api/scans/{id}/findings
 *   getAttackPaths(scanId)   -> GET  /api/scans/{id}/paths
 *   askAgent(question, ctx)  -> POST /api/agent/chat
 *   getHistory()             -> GET  /api/scans
 *   validateScope(target)    -> POST /api/scope/validate
 */

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

/** One line of the agent activity stream. */
export interface AgentLogLine {
  module: string;
  line: string;
  tool?: string;
}

/** Scanner chip state on the Assistant screen. */
export type ToolRunStatus = 'queued' | 'running' | 'done';

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  cvss: number;
  component: string;
  tool: 'Nmap' | 'Nikto' | 'ZAP' | 'OpenVAS';
  attack: { id: string; name: string };
  summary: string;      // plain English
  whyItMatters: string;
  evidence: string;     // scan output excerpt — descriptive only
  fixSteps: string[];
  fixSnippet: { language: string; code: string };
  phase: 'now' | 'soon' | 'monitor';
}

export interface AttackPathNode {
  id: string;
  label: string;
  x: number;
  y: number;
  severity: Severity | 'entry' | 'impact';
  findingId?: string;
  detail: string;
}

export interface AttackPathLink {
  from: string;
  to: string;
}

export interface AttackPath {
  id: string;
  name: string;
  risk: number;
  steps: string[];
  breakAt: string;
  breakFix: string;
}

export interface ScanResult {
  id: string;
  target: string;
  date: string;
  status: 'Completed' | 'Blocked' | 'Stopped';
  riskScore: number;
  grade: string;
  findings: Finding[];
  nodes: AttackPathNode[];
  links: AttackPathLink[];
  paths: AttackPath[];
  tools: { name: string; cmd: string; purpose: string }[];
}

export interface HistoryRow {
  id: string;
  target: string;
  date: string;
  riskScore: number;
  findings: number;
  status: 'Completed' | 'Blocked' | 'Stopped';
}

/* ------------------------------------------------------------------ */
/* Scope whitelist — the Scope Guard's source of truth                 */
/* ------------------------------------------------------------------ */
export const ALLOWED_TARGETS = ['testphp.vulnweb.com', 'demo.testfire.net', 'localhost:8080'];

export function normalizeTarget(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

/** Maps to POST /api/scope/validate */
export function validateScope(rawTarget: string): { allowed: boolean; target: string; reason?: string } {
  const target = normalizeTarget(rawTarget);
  if (!target) return { allowed: false, target, reason: 'No hostname was provided.' };
  const allowed = ALLOWED_TARGETS.includes(target);
  return {
    allowed,
    target,
    reason: allowed ? undefined : 'Target not present in the authorized lab whitelist.',
  };
}

/* ------------------------------------------------------------------ */
/* Internal agent modules (shown on the Architecture page)             */
/* ------------------------------------------------------------------ */
export const AGENT_MODULES = [
  { id: 'planner', name: 'Planner', desc: 'Reads the authorized scope and selects the minimal tool set.' },
  { id: 'gate', name: 'Approval Gate', desc: 'Freezes execution until a human approves the exact commands.' },
  { id: 'parser', name: 'Parser', desc: 'Normalizes raw scanner output into structured findings.' },
  { id: 'correlator', name: 'Correlator', desc: 'Groups duplicate findings and scores real risk.' },
  { id: 'path', name: 'Path Builder', desc: 'Links findings into multi-step attack chains.' },
  { id: 'report', name: 'Report Maker', desc: 'Writes the executive summary and remediation roadmap.' },
];

/* ------------------------------------------------------------------ */
/* Scan plan shown in the approval modal                               */
/* ------------------------------------------------------------------ */
export const SCAN_PLAN = [
  { name: 'Nmap', cmd: 'nmap -sV -T3 testphp.vulnweb.com', purpose: 'Port and service discovery' },
  { name: 'Nikto', cmd: 'nikto -h https://testphp.vulnweb.com', purpose: 'Web server misconfiguration checks' },
  { name: 'ZAP', cmd: 'zap-baseline.py -t https://testphp.vulnweb.com', purpose: 'OWASP Top 10 baseline scan' },
  { name: 'OpenVAS', cmd: 'openvas --target testphp.vulnweb.com', purpose: 'TLS and CVE configuration audit' },
];

/* ------------------------------------------------------------------ */
/* Mock findings — 9 realistic, non-exploitable descriptions           */
/* ------------------------------------------------------------------ */
const FINDINGS: Finding[] = [
  {
    id: 'f1',
    title: 'SQL injection in login form',
    severity: 'Critical',
    cvss: 9.8,
    component: '/login.php (username parameter)',
    tool: 'ZAP',
    attack: { id: 'T1190', name: 'Exploit Public-Facing Application' },
    summary:
      'The login form inserts whatever you type into the database query without checking it first. An attacker can make the database return other users\' records or bypass the password check entirely.',
    whyItMatters:
      'This is the fastest route to full data compromise. The same weakness lets an attacker read the user table, which then unlocks every other account on the site.',
    evidence:
      'ZAP baseline — parameter "username" produced a database error response with a 1,000ms+ time delta compared to the baseline request. Response body contained a MySQL syntax error string.',
    fixSteps: [
      'Replace string-concatenated queries with parameterized statements (prepared statements) in every login handler.',
      'Validate and length-limit incoming credentials before they reach the query layer.',
      'Add a WAF rule for the login endpoint as a short-term stopgap while the code fix ships.',
      'Re-test the login form after the change to confirm the error responses are gone.',
    ],
    fixSnippet: {
      language: 'php',
      code: `// BEFORE (unsafe string concatenation)
$q = "SELECT * FROM users WHERE user='" . $_POST['username'] . "'";

// AFTER (parameterized)
$stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE user = :u LIMIT 1');
$stmt->execute([':u' => $_POST['username']]);
$row = $stmt->fetch();`,
    },
    phase: 'now',
  },
  {
    id: 'f2',
    title: 'Exposed administrative panel',
    severity: 'Critical',
    cvss: 9.1,
    component: '/admin/ (no network restriction)',
    tool: 'Nikto',
    attack: { id: 'T1078', name: 'Valid Accounts' },
    summary:
      'The admin area is reachable from the public internet and shows a login page with no rate limiting. Anyone can attempt passwords indefinitely.',
    whyItMatters:
      'An admin account is the highest-value target on the site. Combined with the weak login handling, an attacker has an unlimited number of attempts against the most powerful account.',
    evidence:
      'Nikto — GET /admin/ returned HTTP 200 with an authentication form. 0 rate-limit headers present. 4 failed attempts in sequence produced no lockout or slowdown.',
    fixSteps: [
      'Restrict /admin/ to the office IP range or put it behind a VPN.',
      'Enable account lockout after 5 failed attempts and add rate limiting.',
      'Require multi-factor authentication for all administrator accounts.',
    ],
    fixSnippet: {
      language: 'nginx',
      code: `location /admin/ {
    allow 203.0.113.0/24;   # office range
    deny  all;
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
}`,
    },
    phase: 'now',
  },
  {
    id: 'f3',
    title: 'MySQL port 3306 reachable from internet',
    severity: 'High',
    cvss: 8.2,
    component: 'db.internal:3306',
    tool: 'Nmap',
    attack: { id: 'T1046', name: 'Network Service Discovery' },
    summary:
      'The database port answers connections from outside the network. A database should only ever be reachable by the application servers that need it.',
    whyItMatters:
      'Direct database exposure removes every layer of protection the web application provides. Any credential weakness becomes immediate data loss.',
    evidence:
      'Nmap -sV — 3306/tcp open, MySQL 5.7.x banner returned to an unauthenticated connection from an external address.',
    fixSteps: [
      'Bind MySQL to the private interface only (bind-address = 127.0.0.1 or private IP).',
      'Add a firewall rule allowing 3306 only from application server IPs.',
      'Rotate the database password and confirm no application is using the root account.',
    ],
    fixSnippet: {
      language: 'ini',
      code: `# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
bind-address = 10.0.2.15
skip-networking = 0

# firewall
ufw deny 3306/tcp
ufw allow from 10.0.2.0/24 to any port 3306`,
    },
    phase: 'now',
  },
  {
    id: 'f4',
    title: 'Reflected XSS in search parameter',
    severity: 'High',
    cvss: 7.4,
    component: '/search.php (q parameter)',
    tool: 'ZAP',
    attack: { id: 'T1059.007', name: 'JavaScript/JScript' },
    summary:
      'Whatever is typed in the search box is echoed back into the page without being neutralised, so script content can execute in a victim\'s browser.',
    whyItMatters:
      'An attacker can send a crafted link to a logged-in user and act as that user — stealing their session or changing their settings.',
    evidence:
      'ZAP — the q parameter value was reflected into the HTML body of the response unchanged, within a script context, without output encoding.',
    fixSteps: [
      'HTML-encode all user input that is rendered back into the page.',
      'Add a Content-Security-Policy that blocks inline script execution.',
      'Apply the framework\'s built-in escaping helpers instead of manual string output.',
    ],
    fixSnippet: {
      language: 'php',
      code: `// BEFORE
echo "<p>Results for: " . $_GET['q'] . "</p>";

// AFTER
echo "<p>Results for: " . htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8') . "</p>";`,
    },
    phase: 'now',
  },
  {
    id: 'f5',
    title: 'Outdated Apache httpd version',
    severity: 'High',
    cvss: 7.5,
    component: 'Apache/2.4.29 (Ubuntu)',
    tool: 'Nmap',
    attack: { id: 'T1190', name: 'Exploit Public-Facing Application' },
    summary:
      'The web server is running a five-year-old release with publicly documented vulnerabilities that have long since been fixed upstream.',
    whyItMatters:
      'Known-vulnerable software is the most commonly exploited entry point in real incidents, because the attack steps are already public.',
    evidence:
      'Nmap -sV — Server banner: Apache/2.4.29 (Ubuntu). 14 CVEs published against this version after its release date.',
    fixSteps: [
      'Patch to the current Apache 2.4.x maintenance release.',
      'Set up unattended security updates for the web tier.',
      'Hide the version banner to reduce reconnaissance value.',
    ],
    fixSnippet: {
      language: 'apache',
      code: `# keep the server patchable
sudo apt-get update && sudo apt-get install --only-upgrade apache2
sudo unattended-upgrade --dry-run

# reduce banner disclosure
ServerTokens Prod
ServerSignature Off`,
    },
    phase: 'soon',
  },
  {
    id: 'f6',
    title: 'Missing security headers (CSP, X-Frame-Options)',
    severity: 'Medium',
    cvss: 5.3,
    component: 'All HTTP responses',
    tool: 'Nikto',
    attack: { id: 'T1185', name: 'Browser Session Hijacking' },
    summary:
      'The site does not tell browsers to enforce script or framing rules, so it relies entirely on the application code being perfect.',
    whyItMatters:
      'These headers are the backstop that limits the damage of an injection bug. Without them, a small XSS becomes a full account takeover.',
    evidence:
      'Nikto — missing headers on 12 of 12 tested routes: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.',
    fixSteps: [
      'Add a Content-Security-Policy with a restrictive default-src.',
      'Add X-Frame-Options: DENY and X-Content-Type-Options: nosniff.',
      'Roll out in report-only mode first, then enforce.',
    ],
    fixSnippet: {
      language: 'nginx',
      code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
    },
    phase: 'soon',
  },
  {
    id: 'f7',
    title: 'Session cookies missing Secure and HttpOnly flags',
    severity: 'Medium',
    cvss: 5.0,
    component: 'PHPSESSID cookie',
    tool: 'ZAP',
    attack: { id: 'T1539', name: 'Steal Web Session Cookie' },
    summary:
      'The login cookie can be read by page scripts and can travel over unencrypted connections.',
    whyItMatters:
      'If any script on the page is compromised, it can read the session and hand it to an attacker — no password needed.',
    evidence:
      'ZAP — Set-Cookie: PHPSESSID=…; Path=/ — no Secure, no HttpOnly, no SameSite attribute observed.',
    fixSteps: [
      'Set HttpOnly and Secure on every session cookie.',
      'Set SameSite=Lax or Strict where cross-site flows allow.',
      'Serve the whole site over HTTPS with HSTS to make Secure meaningful.',
    ],
    fixSnippet: {
      language: 'php',
      code: `session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();`,
    },
    phase: 'soon',
  },
  {
    id: 'f8',
    title: 'Weak TLS configuration (TLS 1.0 enabled)',
    severity: 'Medium',
    cvss: 4.8,
    component: 'https://testphp.vulnweb.com:443',
    tool: 'OpenVAS',
    attack: { id: 'T1040', name: 'Network Sniffing' },
    summary:
      'The server still negotiates TLS 1.0 with legacy cipher suites, which are no longer considered safe.',
    whyItMatters:
      'Weak transport encryption allows an attacker on the same network to read or modify traffic, including credentials.',
    evidence:
      'OpenVAS — TLS 1.0 and TLS 1.1 accepted. RC4 and 3DES cipher suites offered. Certificate valid, expires in 84 days.',
    fixSteps: [
      'Disable TLS 1.0 and 1.1; require TLS 1.2 or newer.',
      'Remove RC4, 3DES and export cipher suites from the cipher list.',
      'Enable HSTS with a 6-month max-age.',
    ],
    fixSnippet: {
      language: 'nginx',
      code: `ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers on;
add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;`,
    },
    phase: 'monitor',
  },
  {
    id: 'f9',
    title: 'Directory listing enabled on /uploads/',
    severity: 'Low',
    cvss: 3.1,
    component: '/uploads/',
    tool: 'Nikto',
    attack: { id: 'T1083', name: 'File and Directory Discovery' },
    summary:
      'The uploads folder prints its file contents to anyone who visits it, instead of denying access.',
    whyItMatters:
      'It reveals internal file names and can expose documents that were meant to be private, which gives an attacker reconnaissance material.',
    evidence:
      'Nikto — GET /uploads/ returned HTTP 200 with an auto-generated file index listing 23 entries.',
    fixSteps: [
      'Turn off automatic index generation for the uploads directory.',
      'Move uploaded files outside the web root and serve them through an application handler.',
    ],
    fixSnippet: {
      language: 'apache',
      code: `# disable indexes everywhere
<Directory /var/www/html/uploads>
    Options -Indexes
</Directory>`,
    },
    phase: 'monitor',
  },
];

/* ------------------------------------------------------------------ */
/* Attack path graph (inline SVG coordinates)                          */
/* ------------------------------------------------------------------ */
const NODES: AttackPathNode[] = [
  { id: 'n1', label: 'Internet', x: 90, y: 250, severity: 'entry', detail: 'Public entry point — any anonymous client can reach the host.' },
  { id: 'n2', label: 'Exposed admin panel', x: 300, y: 110, severity: 'Critical', findingId: 'f2', detail: 'Unrestricted /admin/ login reachable from the public internet.' },
  { id: 'n3', label: 'Weak login', x: 300, y: 390, severity: 'High', findingId: 'f7', detail: 'No lockout, no MFA, session cookie readable by scripts.' },
  { id: 'n4', label: 'SQL injection', x: 540, y: 250, severity: 'Critical', findingId: 'f1', detail: 'Login query accepts unsanitised input and returns database errors.' },
  { id: 'n5', label: 'Database server :3306', x: 760, y: 250, severity: 'High', findingId: 'f3', detail: 'MySQL answers from the public internet.' },
  { id: 'n6', label: 'Data exposure', x: 970, y: 250, severity: 'impact', detail: 'Full user table compromise — credentials and personal data.' },
];

const LINKS: AttackPathLink[] = [
  { from: 'n1', to: 'n2' },
  { from: 'n1', to: 'n3' },
  { from: 'n2', to: 'n4' },
  { from: 'n3', to: 'n4' },
  { from: 'n4', to: 'n5' },
  { from: 'n5', to: 'n6' },
];

const PATHS: AttackPath[] = [
  {
    id: 'p1',
    name: 'Internet → SQL injection → Database → Data exposure',
    risk: 9.6,
    steps: ['Internet', 'SQL injection', 'Database server :3306', 'Data exposure'],
    breakAt: 'SQL injection in login form',
    breakFix: 'Parameterizing the login query removes the only step that reaches the database.',
  },
  {
    id: 'p2',
    name: 'Internet → Exposed admin panel → SQL injection → Data exposure',
    risk: 8.9,
    steps: ['Internet', 'Exposed admin panel', 'SQL injection', 'Data exposure'],
    breakAt: 'Exposed administrative panel',
    breakFix: 'Restricting /admin/ to the office network closes the shortest privilege-escalation route.',
  },
  {
    id: 'p3',
    name: 'Internet → Weak login → Session theft',
    risk: 6.4,
    steps: ['Internet', 'Weak login', 'Data exposure'],
    breakAt: 'Session cookies missing Secure and HttpOnly flags',
    breakFix: 'Hardening the session cookie stops a stolen script from reading the session.',
  },
];

/* ------------------------------------------------------------------ */
/* Public API — mock replacements for future FastAPI endpoints         */
/* ------------------------------------------------------------------ */

/** POST /api/scans — returns the deterministic mock result for a target */
export async function startScan(target: string): Promise<ScanResult> {
  await delay(900);
  return {
    ...getSeedScan(),
    id: `scan_${Date.now()}`,
    target,
    date: new Date().toISOString(),
  };
}

/**
 * Synchronous seed result so the Dashboard / Report / Attack Paths screens
 * have data before the user runs the demo walkthrough.
 */
export function getSeedScan(): ScanResult {
  return {
    id: 'scan_4821',
    target: 'testphp.vulnweb.com',
    date: '2026-11-04T09:12:00Z',
    status: 'Completed',
    riskScore: 8.4,
    grade: 'D',
    findings: FINDINGS,
    nodes: NODES,
    links: LINKS,
    paths: PATHS,
    tools: SCAN_PLAN,
  };
}

/** GET /api/scans/{id}/logs — streamed as SSE in production */
export const LOG_SCRIPT: AgentLogLine[] = [
  { module: 'Planner', line: 'Selecting Nmap for port discovery' },
  { module: 'Planner', line: 'Scope verified — 1 authorized host, 0 exclusions' },
  { module: 'Nmap', line: 'Starting service discovery against testphp.vulnweb.com', tool: 'Nmap' },
  { module: 'Nmap', line: 'Discovered 6 open ports: 22, 80, 443, 3306, 8080, 8443', tool: 'Nmap' },
  { module: 'Parser', line: 'Structuring scan output into 6 service records', tool: 'Nmap' },
  { module: 'Nikto', line: 'Web configuration checks started (12 routes)', tool: 'Nikto' },
  { module: 'Nikto', line: 'Found missing security headers on all routes', tool: 'Nikto' },
  { module: 'Nikto', line: 'Found accessible admin panel and uploads directory index', tool: 'Nikto' },
  { module: 'ZAP', line: 'Baseline active checks on login and search endpoints', tool: 'ZAP' },
  { module: 'ZAP', line: 'Confirmed SQL injection in username parameter', tool: 'ZAP' },
  { module: 'ZAP', line: 'Confirmed reflected XSS in q parameter', tool: 'ZAP' },
  { module: 'Parser', line: 'Structuring scan output', tool: 'ZAP' },
  { module: 'OpenVAS', line: 'TLS and CVE configuration audit', tool: 'OpenVAS' },
  { module: 'OpenVAS', line: 'Legacy TLS 1.0 accepted; 2 weak cipher suites offered', tool: 'OpenVAS' },
  { module: 'Correlator', line: 'Grouping 3 related findings (headers, cookies, TLS)' },
  { module: 'Correlator', line: 'Deduplicating 2 duplicate port records' },
  { module: 'Path Builder', line: 'Linking risks into attack paths' },
  { module: 'Path Builder', line: '3 multi-step paths ranked, highest risk 9.6' },
  { module: 'Report Maker', line: 'Generating report' },
  { module: 'Report Maker', line: 'Remediation roadmap drafted: 4 fix now, 3 fix soon, 2 monitor' },
];

export const TOOL_ORDER = ['Nmap', 'Nikto', 'ZAP', 'OpenVAS'] as const;

/** POST /api/agent/chat — grounded strictly in the mock findings */
export async function askAgent(question: string, result: ScanResult): Promise<string> {
  await delay(700);
  const q = question.toLowerCase();
  const top = [...result.findings].sort((a, b) => b.cvss - a.cvss)[0];
  const criticalCount = result.findings.filter((f) => f.severity === 'Critical').length;

  if (q.includes('top risk') || q.includes('explain')) {
    return `The biggest risk is "${top.title}" (CVSS ${top.cvss}, ${top.component}). In plain English: ${top.summary} Nothing else in this scan gets an attacker closer to your data — which is why it sits at the top of the list.`;
  }
  if (q.includes('fix first') || q.includes('first') || q.includes('priorit')) {
    return `Fix "${top.title}" first. ${top.fixSteps[0]} After that, restrict the exposed admin panel — together those two remove both routes into your database. You have ${criticalCount} critical findings, so those are the only two I'd act on today.`;
  }
  if (q.includes('path') || q.includes('chain') || q.includes('attack')) {
    return `The clearest chain is: Internet → SQL injection → Database server on port 3306 → Data exposure, with a risk score of 9.6. The cheapest place to break it is the SQL injection itself — parameterizing that one query disconnects the database from the internet-facing app.`;
  }
  if (q.includes('database') || q.includes('3306') || q.includes('mysql')) {
    const db = result.findings.find((f) => f.id === 'f3')!;
    return `Port 3306 is open to the internet. ${db.summary} ${db.fixSteps[0]}`;
  }
  if (q.includes('header') || q.includes('csp')) {
    const h = result.findings.find((f) => f.id === 'f6')!;
    return `Yes — CSP and X-Frame-Options are both missing. ${h.summary} ${h.fixSteps[0]} Your reflected XSS finding is far more dangerous without a CSP in place.`;
  }
  if (q.includes('how many') || q.includes('count') || q.includes('findings')) {
    const c = result.findings.filter((f) => f.severity === 'Critical').length;
    const h = result.findings.filter((f) => f.severity === 'High').length;
    const m = result.findings.filter((f) => f.severity === 'Medium').length;
    const l = result.findings.filter((f) => f.severity === 'Low').length;
    return `I found ${result.findings.length} findings: ${c} critical, ${h} high, ${m} medium and ${l} low. I'm only reporting what the tools actually returned — nothing inferred.`;
  }
  return `Based on this scan's ${result.findings.length} findings, the thing I'd look at is "${top.title}" (CVSS ${top.cvss}). Ask me to explain the top risk simply, what to fix first, or to show the attack path.`;
}

/** GET /api/scans — history table */
export function getHistory(): HistoryRow[] {
  return [
    { id: 'scan_4821', target: 'testphp.vulnweb.com', date: '2026-11-04T09:12:00Z', riskScore: 8.4, findings: 9, status: 'Completed' },
    { id: 'scan_4807', target: 'demo.testfire.net', date: '2026-11-03T16:40:00Z', riskScore: 7.1, findings: 7, status: 'Completed' },
    { id: 'scan_4790', target: 'localhost:8080', date: '2026-11-02T11:05:00Z', riskScore: 5.8, findings: 6, status: 'Completed' },
    { id: 'scan_4772', target: 'testphp.vulnweb.com', date: '2026-10-30T14:22:00Z', riskScore: 8.9, findings: 11, status: 'Completed' },
    { id: 'scan_4755', target: 'prod-payments.example.com', date: '2026-10-29T10:03:00Z', riskScore: 0, findings: 0, status: 'Blocked' },
    { id: 'scan_4731', target: 'demo.testfire.net', date: '2026-10-27T08:55:00Z', riskScore: 0, findings: 0, status: 'Stopped' },
  ];
}

/** GET /api/scans/{id} — load a historical scan into the dashboard */
export async function getScanById(id: string): Promise<ScanResult> {
  const base = await startScan('testphp.vulnweb.com');
  const row = getHistory().find((r) => r.id === id);
  if (!row) return base;
  const keep = Math.max(4, Math.min(FINDINGS.length, row.findings || 6));
  const findings = FINDINGS.slice(0, keep);
  return {
    ...base,
    id,
    target: row.target,
    date: row.date,
    status: row.status,
    riskScore: row.riskScore,
    findings,
  };
}

export const SEVERITY_ORDER: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
