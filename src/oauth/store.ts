import crypto from "node:crypto";

interface AuthCode {
  token: string;
  clientId: string;
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: number;
}

interface ClientRegistration {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  clientName?: string;
  createdAt: number;
}

const authCodes = new Map<string, AuthCode>();
const clients = new Map<string, ClientRegistration>();

setInterval(() => {
  const now = Date.now();
  for (const [code, data] of authCodes) {
    if (data.expiresAt < now) authCodes.delete(code);
  }
}, 60_000);

export function generateAuthCode(params: Omit<AuthCode, "expiresAt">): string {
  const code = crypto.randomBytes(32).toString("hex");
  authCodes.set(code, { ...params, expiresAt: Date.now() + 5 * 60_000 });
  return code;
}

export function consumeAuthCode(code: string): AuthCode | null {
  const data = authCodes.get(code);
  if (!data || data.expiresAt < Date.now()) {
    authCodes.delete(code);
    return null;
  }
  authCodes.delete(code);
  return data;
}

export function registerClient(
  redirectUris: string[],
  clientName?: string,
): ClientRegistration {
  const clientId = crypto.randomUUID();
  const clientSecret = crypto.randomBytes(32).toString("hex");
  const reg: ClientRegistration = {
    clientId,
    clientSecret,
    redirectUris,
    clientName,
    createdAt: Date.now(),
  };
  clients.set(clientId, reg);
  return reg;
}

export function getClient(clientId: string): ClientRegistration | null {
  return clients.get(clientId) ?? null;
}

export function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method: string,
): boolean {
  if (method === "S256") {
    const hash = crypto.createHash("sha256").update(codeVerifier).digest();
    return hash.toString("base64url") === codeChallenge;
  }
  if (method === "plain") {
    return codeVerifier === codeChallenge;
  }
  return false;
}
