// Pure helper utilities for Drive API parameter and response handling
// Includes sync helpers used by `sync.ts` (pure, unit-testable functions)
export const buildFilesQueryString = (
  query?: string,
  pageSize: number = 100,
  fields: string = 'files(id, name, modifiedTime, mimeType, parents)'
): string => {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields,
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    ...(query && { q: query }),
  });

  return params.toString();
};

export const findFileByParent = (files: any[] | null | undefined, parentId: string) => {
  if (!files || files.length === 0) return null;
  return files.find((f: any) => f.parents && f.parents.includes(parentId)) || null;
};

export const serializeFallbackFindParams = (fileName: string, pageSize = 1000) => {
  const params = new URLSearchParams({
    q: `name='${fileName}' and trashed=false`,
    fields: 'files(id, name, parents, modifiedTime, mimeType)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    pageSize: pageSize.toString(),
  });
  return params.toString();
};

// --- Sync / general helpers (pure) ---
export const makeFolderName = (id: string, name: string): string => `${id}-${name}`;

export const buildLabelDataFile = (label: any, todos: any[]) => {
  const labelCopy = { ...label } as any;
  // Remove campos relativos ao Drive/compartilhamento (não devem ser persistidos)
  delete labelCopy.driveMetadata;
  delete labelCopy.shared;
  delete labelCopy.ownershipRole;
  return {
    label: labelCopy,
    todos,
    version: 1,
    updatedAt: Date.now(),
  };
};

export const normalizeFileId = (fileId?: string): string | undefined => {
  if (!fileId) return undefined;
  const t = fileId.trim();
  return t.length > 0 ? t : undefined;
};

export const serializeContent = (data: any): string => JSON.stringify(data, null, 2);

export const isRemoteNewer = (remoteTime: string, localTime: string): boolean => {
  const r = new Date(remoteTime).getTime();
  const l = new Date(localTime).getTime();
  return r > l;
};

export const defaultMetadata = () => ({
  deletedLabels: [],
  version: 1,
  updatedAt: Date.now(),
});

export const buildLabelFoldersQuery = (appFolderId: string): string =>
  `'${appFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

export const parseLabelFromDownloaded = (
  folderId: string,
  dataFile: { id: string; modifiedTime: string },
  data: any
): any => ({
  ...data.label,
  driveMetadata: {
    folderId,
    fileId: dataFile.id,
    modifiedTime: dataFile.modifiedTime,
  },
});

export default {
  buildFilesQueryString,
  findFileByParent,
  serializeFallbackFindParams,
  makeFolderName,
  buildLabelDataFile,
  normalizeFileId,
  serializeContent,
  isRemoteNewer,
  defaultMetadata,
  buildLabelFoldersQuery,
  parseLabelFromDownloaded,
};
