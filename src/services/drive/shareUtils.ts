// Pure utilities for share link generation and parsing
export const APP_DOMAIN = 'ywtoo.github.io';
export const APP_PATH = '/ToDoFeito/import';

export const buildShareUrl = (folderId: string, labelName: string): string => {
  const encodedName = encodeURIComponent(labelName);
  return `https://${APP_DOMAIN}${APP_PATH}?folderId=${folderId}&labelName=${encodedName}`;
};

export const getShareMessage = (labelName: string, link: string): string => {
  return `Olá! 👋

Estou compartilhando o label "${labelName}" com você no ToDoFeito.

Clique no link abaixo para adicionar as tarefas compartilhadas ao seu app:

${link}

Assim poderemos acompanhar nossas tarefas juntos! ✅`;
};

export const parseCustomSchemeImport = (url: string): { folderId: string; labelName: string } | null => {
  if (!url.startsWith('todofeito://')) return null;
  const valid = url.includes('todofeito://import');
  if (!valid) return null;

  const match = url.match(/folderId=([^&]+)/);
  const matchLabel = url.match(/labelName=([^&]+)/);
  if (match && matchLabel) {
    const folderId = match[1];
    const labelName = decodeURIComponent(matchLabel[1]);
    return { folderId, labelName };
  }
  return null;
};

export const parseHttpsImport = (url: string): { folderId: string; labelName: string } | null => {
  try {
    if (!url.startsWith('https://')) return null;
    const parsed = new URL(url);
    const validDomain = parsed.hostname === APP_DOMAIN;
    const validPath = parsed.pathname.startsWith(APP_PATH);
    if (!validDomain || !validPath) return null;

    const folderId = parsed.searchParams.get('folderId');
    const labelName = parsed.searchParams.get('labelName');
    if (!folderId || !labelName) return null;
    return { folderId, labelName: decodeURIComponent(labelName) };
  } catch {
    return null;
  }
};

export const parseImportLink = (url: string): { folderId: string; labelName: string } | null => {
  // Try custom scheme first
  const custom = parseCustomSchemeImport(url);
  if (custom) return custom;
  // Then HTTPS
  return parseHttpsImport(url);
};

export default {
  APP_DOMAIN,
  APP_PATH,
  buildShareUrl,
  getShareMessage,
  parseCustomSchemeImport,
  parseHttpsImport,
  parseImportLink,
};
