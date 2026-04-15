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
    title: "Authorize – bedirhan-test",
    heading: "Authorize Connection",
    subtitle:
      "Enter your token to connect this application via MCP.",
    tokenLabel: "Token",
    tokenPlaceholder: "your-token-here",
    cancel: "Cancel",
    authorize: "Authorize",
    errorEmpty: "Please enter your token.",
    langSwitch: "Türkçe",
  },
  tr: {
    title: "Yetkilendir – bedirhan-test",
    heading: "Bağlantıyı Yetkilendir",
    subtitle:
      "Bu uygulamayı MCP üzerinden bağlamak için tokeninizi girin.",
    tokenLabel: "Token",
    tokenPlaceholder: "tokeninizi-girin",
    cancel: "İptal",
    authorize: "Yetkilendir",
    errorEmpty: "Lütfen tokeninizi girin.",
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
      max-width: 380px;
      width: 100%;
      padding: 36px 28px;
      position: relative;
    }
    .lang-switch {
      position: absolute;
      top: 14px;
      right: 14px;
      font-size: 11px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      transition: all 0.15s;
    }
    .lang-switch:hover {
      background: #f0f4ff;
      border-color: #6366f1;
    }
    .name {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
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
  </style>
</head>
<body>
  <div class="card">
    <a href="${esc(switchUrl)}" class="lang-switch">${esc(t.langSwitch)}</a>

    <div class="name">bedirhan-test</div>

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

      <div class="actions">
        <button type="button" class="btn btn-cancel" onclick="window.close()">${esc(t.cancel)}</button>
        <button type="submit" class="btn btn-primary">${esc(t.authorize)}</button>
      </div>
    </form>
  </div>
</body>
</html>`;
}
