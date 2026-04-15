export interface AuthPageParams {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  baseUrl: string;
  dashboardUrl: string;
  lang: "en" | "tr";
  error?: string;
}

const i18n = {
  en: {
    title: "Authorize – HrPanda MCP",
    heading: "Authorize Connection",
    subtitle:
      "An application is requesting access to your HrPanda workspace via MCP. Enter your MCP token to authorize.",
    tokenLabel: "MCP Token",
    tokenPlaceholder: "mcp_xxxxxxxxxxxxxxxx",
    helpPrefix: "Generate a token in",
    helpLink: "HrPanda Settings → MCP Tokens",
    cancel: "Cancel",
    authorize: "Authorize",
    howItWorks: "How it works",
    firstTime: "First time?",
    step1: "Go to",
    step1Link: "HrPanda Settings",
    step2: "Generate a new MCP token",
    step3prefix: "Paste it above and click",
    step3bold: "Authorize",
    errorEmpty: "Please enter your MCP token.",
    langSwitch: "Türkçe",
  },
  tr: {
    title: "Yetkilendir – HrPanda MCP",
    heading: "Bağlantıyı Yetkilendir",
    subtitle:
      "Bir uygulama, HrPanda çalışma alanınıza MCP üzerinden erişim talep ediyor. Yetkilendirmek için MCP tokeninizi girin.",
    tokenLabel: "MCP Token",
    tokenPlaceholder: "mcp_xxxxxxxxxxxxxxxx",
    helpPrefix: "Token oluşturmak için",
    helpLink: "HrPanda Ayarlar → MCP Tokenları",
    cancel: "İptal",
    authorize: "Yetkilendir",
    howItWorks: "Nasıl çalışır",
    firstTime: "İlk defa mı?",
    step1: "Şuraya gidin:",
    step1Link: "HrPanda Ayarlar",
    step2: "Yeni bir MCP token oluşturun",
    step3prefix: "Yukarıya yapıştırın ve",
    step3bold: "Yetkilendir",
    errorEmpty: "Lütfen MCP tokeninizi girin.",
    langSwitch: "English",
  },
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getAuthorizationPageHtml(p: AuthPageParams): string {
  const t = i18n[p.lang];
  const otherLang = p.lang === "en" ? "tr" : "en";

  const qsEntries: [string, string][] = [
    ["response_type", "code"],
    ["client_id", p.clientId],
    ["redirect_uri", p.redirectUri],
    ["state", p.state],
    ["code_challenge", p.codeChallenge],
    ["code_challenge_method", p.codeChallengeMethod],
    ["lang", otherLang],
  ];
  const switchQs = qsEntries
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const switchUrl = `${p.baseUrl}/oauth/authorize?${switchQs}`;

  return `<!DOCTYPE html>
<html lang="${p.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(t.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f9fb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #1a1a2e;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      max-width: 420px;
      width: 100%;
      padding: 40px 32px;
      position: relative;
    }
    .lang-switch {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 12px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      transition: all 0.15s;
    }
    .lang-switch:hover {
      background: #f0f4ff;
      border-color: #6366f1;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .logo img { height: 32px; }
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      color: #dc2626;
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      margin-bottom: 6px;
    }
    input[type="password"] {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 14px;
      font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
      transition: border-color 0.15s;
      outline: none;
    }
    input[type="password"]:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }
    .help {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 6px;
      line-height: 1.5;
    }
    .help a { color: #6366f1; text-decoration: none; }
    .help a:hover { text-decoration: underline; }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 24px;
    }
    .btn {
      flex: 1;
      padding: 10px 0;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-cancel { background: #f1f5f9; color: #475569; }
    .btn-cancel:hover { background: #e2e8f0; }
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 20px 0 16px;
      font-size: 12px;
      color: #94a3b8;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }
    .info-box {
      background: #f0f4ff;
      border-radius: 10px;
      padding: 14px 16px;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    .info-box strong { color: #1a1a2e; }
    .steps { padding-left: 18px; margin-top: 6px; }
    .steps li { margin-bottom: 2px; }
    .steps a { color: #6366f1; text-decoration: none; }
    .steps a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <a href="${esc(switchUrl)}" class="lang-switch">${esc(t.langSwitch)}</a>

    <div class="logo">
      <img src="${esc(p.baseUrl)}/assets/logo.png" alt="HrPanda">
    </div>

    <h1>${esc(t.heading)}</h1>
    <p class="subtitle">${esc(t.subtitle)}</p>

    ${p.error ? `<div class="error-box">${esc(p.error)}</div>` : ""}

    <form method="POST" action="${esc(p.baseUrl)}/oauth/authorize">
      <input type="hidden" name="client_id" value="${esc(p.clientId)}">
      <input type="hidden" name="redirect_uri" value="${esc(p.redirectUri)}">
      <input type="hidden" name="state" value="${esc(p.state)}">
      <input type="hidden" name="code_challenge" value="${esc(p.codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${esc(p.codeChallengeMethod)}">

      <label for="token">${esc(t.tokenLabel)}</label>
      <input type="password" id="token" name="token" placeholder="${esc(t.tokenPlaceholder)}" required autofocus>
      <p class="help">
        ${esc(t.helpPrefix)}
        <a href="${esc(p.dashboardUrl)}/dashboard/settings" target="_blank">${esc(t.helpLink)}</a>
      </p>

      <div class="actions">
        <button type="button" class="btn btn-cancel" onclick="window.close()">${esc(t.cancel)}</button>
        <button type="submit" class="btn btn-primary">${esc(t.authorize)}</button>
      </div>
    </form>

    <div class="divider">${esc(t.howItWorks)}</div>
    <div class="info-box">
      <strong>${esc(t.firstTime)}</strong>
      <ol class="steps">
        <li>${esc(t.step1)} <a href="${esc(p.dashboardUrl)}/dashboard/settings" target="_blank">${esc(t.step1Link)}</a></li>
        <li>${esc(t.step2)}</li>
        <li>${esc(t.step3prefix)} <strong>${esc(t.step3bold)}</strong></li>
      </ol>
    </div>
  </div>
</body>
</html>`;
}
