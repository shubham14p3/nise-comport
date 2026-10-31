/** Choose a complete IMAP account; never stitch credentials from different mailboxes. */
export type ImapConnection = {
  host: string; port: number; user: string; password: string;
  secure: boolean; folder: string; tlsServername?: string;
  source: "environment" | "vault";
};

export function chooseImapConnection(
  env: Record<string, string | undefined>,
  vault: Record<string, string> = {},
): ImapConnection | null {
  const asPort = (raw: string | undefined) => {
    const parsed = Number(raw || "993");
    return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : null;
  };
  const host = env.MAIL_IMAP_HOST?.trim();
  const user = env.MAIL_IMAP_USER?.trim();
  const password = env.MAIL_IMAP_PASSWORD?.trim();
  if (host && user && password) {
    const port = asPort(env.MAIL_IMAP_PORT);
    if (port === null) return null;
    return {
      host, user, password, port, secure: env.MAIL_IMAP_SECURE ? env.MAIL_IMAP_SECURE !== "false" : port === 993,
      folder: env.MAIL_IMAP_FOLDER?.trim() || "INBOX",
      ...(env.MAIL_IMAP_TLS_SERVERNAME?.trim() ? { tlsServername: env.MAIL_IMAP_TLS_SERVERNAME.trim() } : {}),
      source: "environment",
    };
  }
  if (host || user || password) return null; // Partial overrides must never fall back to another saved mailbox.
  if (vault.imapHost?.trim() && vault.imapUser?.trim() && vault.imapPassword?.trim()) {
    const port = asPort(vault.imapPort);
    if (port === null) return null;
    return {
      host: vault.imapHost.trim(), user: vault.imapUser.trim(), password: vault.imapPassword.trim(),
      port, secure: vault.imapSecure ? vault.imapSecure !== "false" : port === 993,
      folder: vault.imapFolder?.trim() || "INBOX", source: "vault",
    };
  }
  return null;
}

/** A mailbox change must not reuse another account's IMAP cursor. Password rotation does not reset it. */
export function mailboxSyncKey(config: Pick<ImapConnection, 'host' | 'port' | 'user' | 'folder'>) {
  return `imap:${JSON.stringify([config.host.toLowerCase(), config.port, config.user.toLowerCase(), config.folder])}`;
}
