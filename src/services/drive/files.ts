/**
 * File operations for Drive: create, upload, download, list and find.
 * Exports: createFolder, uploadFile, downloadFile, listFiles, findFolder, findFile, findDataFileWithFallback, getFileMetadata, deleteFile
 */
import { fetchWithAuth } from './authFetch';
import { buildFilesQueryString, findFileByParent, serializeFallbackFindParams } from './apiUtils';
import { buildMultipartBody, buildUploadUrl } from './fileUtils';
import { DrivePermissionError } from './errors';
import { DATA_FILE_NAME } from './constants';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export const createFolder = async (
  folderName: string,
  parentId?: string
): Promise<{ id: string; name: string } | null> => {
  try {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] }),
    };

    const response = await fetchWithAuth(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create folder: ${error}`);
    }

    const data = await response.json();
    return { id: data.id, name: data.name };
  } catch (error) {
    console.error('Create folder error:', error);
    return null;
  }
};

export const uploadFile = async (
  fileName: string,
  content: string,
  mimeType: string = 'application/json',
  parentId?: string,
  existingFileId?: string
): Promise<{ id: string; modifiedTime: string } | null> => {
  try {
    const validFileId = existingFileId && existingFileId.trim().length > 0 ? existingFileId : undefined;

    const metadata: any = {
      name: fileName,
      mimeType: mimeType,
    };
    if (!validFileId && parentId) metadata.parents = [parentId];

    const { multipartRequestBody, contentTypeHeader } = buildMultipartBody(metadata, content, mimeType);

    const { url, method } = buildUploadUrl(validFileId);

    const response = await fetchWithAuth(url, {
      method,
      headers: {
        'Content-Type': contentTypeHeader,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404 && validFileId) {
        console.log('[uploadFile] Arquivo não existe mais (404), criando novo...');
        return uploadFile(fileName, content, mimeType, parentId, undefined);
      }
      throw new Error(`Failed to upload file: ${errorText}`);
    }

    const data = await response.json();
    return { id: data.id, modifiedTime: data.modifiedTime };
  } catch (error) {
    console.error('Upload file error:', error);
    return null;
  }
};

export const downloadFile = async (fileId: string): Promise<string | null> => {
  try {
    console.log('[downloadFile] Baixando arquivo:', fileId);
    const response = await fetchWithAuth(`${DRIVE_API_BASE}/files/${fileId}?alt=media&supportsAllDrives=true`, {
      method: 'GET',
    });

    console.log('[downloadFile] Status:', response.status);
    if (!response.ok) {
      const error = await response.text();
      console.error('[downloadFile] Erro HTTP:', response.status, error);
      if (response.status === 403 && error.includes('appNotAuthorizedToFile')) {
        throw new DrivePermissionError(error);
      }
      throw new Error(`Failed to download file: ${error}`);
    }

    const content = await response.text();
    console.log('[downloadFile] Conteúdo baixado, tamanho:', content.length);
    return content;
  } catch (error) {
    console.error('[downloadFile] Erro ao baixar:', error);
    return null;
  }
};

/**
 * Copia um arquivo/pasta do Drive (usado para importar labels compartilhados)
 */
export const copyFile = async (
  fileId: string,
  newName?: string,
  parentId?: string
): Promise<{ id: string; name: string } | null> => {
  try {
    console.log('[copyFile] Copiando arquivo:', { fileId, newName, parentId });
    
    const metadata: any = {};
    if (newName) metadata.name = newName;
    if (parentId) metadata.parents = [parentId];

    const response = await fetchWithAuth(`${DRIVE_API_BASE}/files/${fileId}/copy?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[copyFile] Erro:', error);
      throw new Error(`Failed to copy file: ${error}`);
    }

    const data = await response.json();
    console.log('[copyFile] Arquivo copiado com sucesso:', data.id);
    return { id: data.id, name: data.name };
  } catch (error) {
    console.error('Copy file error:', error);
    return null;
  }
};

export const listFiles = async (
  query?: string,
  pageSize: number = 100
): Promise<Array<{ id: string; name: string; modifiedTime: string; mimeType: string; parents?: string[] }> | null> => {
  try {
    console.log('[listFiles] Query:', query);
    const paramsString = buildFilesQueryString(query, pageSize);
    const url = `${DRIVE_API_BASE}/files?${paramsString}`;
    console.log('[listFiles] URL:', url);
    const response = await fetchWithAuth(url, { method: 'GET' });
    if (!response.ok) {
      const error = await response.text();
      console.error('[listFiles] Erro na resposta:', error);
      throw new Error(`Failed to list files: ${error}`);
    }
    const data = await response.json();
    console.log('[listFiles] Resultados:', data.files?.length || 0);
    return data.files || [];
  } catch (error) {
    console.error('[listFiles] Erro:', error);
    return null;
  }
};

export const findFolder = async (folderName: string, parentId?: string): Promise<{ id: string; name: string } | null> => {
  try {
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) query += ` and '${parentId}' in parents`;
    const files = await listFiles(query);
    if (!files || files.length === 0) return null;
    return { id: files[0].id, name: files[0].name };
  } catch (error) {
    console.error('Find folder error:', error);
    return null;
  }
};

export const findFile = async (
  fileName: string,
  parentId: string
): Promise<{ id: string; name: string; modifiedTime: string } | null> => {
  try {
    console.log('[findFile] Buscando arquivo:', fileName, 'na pasta:', parentId);
    let query = `name='${fileName}' and '${parentId}' in parents and trashed=false`;
    let files = await listFiles(query);
    console.log('[findFile] A busca direta retornou:', files?.length || 0);
    if (!files || files.length === 0) {
      console.log('[findFile] Busca direta falhou, tentando busca ampla por nome (pode ser lento)...');
      const fallbackParams = serializeFallbackFindParams(fileName, 1000);
      const fallbackUrl = `${DRIVE_API_BASE}/files?${fallbackParams}`;
      console.log('[findFile] URL fallback:', fallbackUrl);
      const response = await fetchWithAuth(fallbackUrl, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        const allFiles = data.files;
        if (allFiles && allFiles.length > 0) {
          console.log(`[findFile] Encontrados ${allFiles.length} arquivos com nome ${fileName} na busca ampla.`);
          const match = findFileByParent(allFiles, parentId);
          if (match) {
            console.log('[findFile] Arquivo encontrado via busca ampla e filtro manual de parents!');
            return { id: match.id, name: match.name, modifiedTime: match.modifiedTime };
          } else {
            console.log(`[findFile] Nenhum dos arquivos encontrados tem o parent ${parentId}. Parents encontrados:`, allFiles.map((f: any) => f.parents));
          }
        }
      }
    }
    console.log('[findFile] Arquivos encontrados na busca direta:', files?.length || 0);
    if (!files || files.length === 0) {
      console.log('[findFile] Nenhum arquivo encontrado');
      return null;
    }
    console.log('[findFile] Arquivo encontrado:', files[0].id);
    return { id: files[0].id, name: files[0].name, modifiedTime: files[0].modifiedTime };
  } catch (error) {
    console.error('[findFile] Erro ao buscar arquivo:', error);
    return null;
  }
};

/**
 * Procura por data.json dentro de uma pasta com fallback.
 * Primeiro tenta busca direta com `findFile`, em seguida lista contéudo da pasta e procura por nome.
 */
export const findDataFileWithFallback = async (
  folderId: string
): Promise<{ id: string; name: string; modifiedTime: string } | null> => {
  try {
    // Tenta busca direta (inclui fallback global dentro de findFile)
    const direct = await findFile(DATA_FILE_NAME, folderId as string);
    if (direct) return direct;

    // Fallback: lista todos os arquivos dentro do folder e procura pelo nome exato
    const query = `'${folderId}' in parents and trashed=false`;
    const all = await listFiles(query);
    if (all && all.length > 0) {
      const found = all.find(f => f.name === DATA_FILE_NAME);
      if (found) {
        return { id: found.id, name: found.name, modifiedTime: found.modifiedTime };
      }
    }

    return null;
  } catch (error) {
    console.error('[findDataFileWithFallback] Erro:', error);
    return null;
  }
};

export const getFileMetadata = async (fileId: string): Promise<{ id: string; name: string; modifiedTime: string } | null> => {
  try {
    const response = await fetchWithAuth(`${DRIVE_API_BASE}/files/${fileId}?fields=id,name,modifiedTime`, { method: 'GET' });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get file metadata: ${error}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Get file metadata error:', error);
    return null;
  }
};

export const deleteFile = async (fileId: string): Promise<boolean> => {
  try {
    const response = await fetchWithAuth(`${DRIVE_API_BASE}/files/${fileId}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorText = await response.text();
      // Gracefully handle 403 Forbidden (likely insufficient permissions due to drive.file scope)
      if (response.status === 403 && (errorText.includes('insufficientFilePermissions') || errorText.includes('forbidden'))) {
        console.warn(`[deleteFile] Permissão negada para deletar arquivo ${fileId} (provavelmente criado por outro app/escopo). Ignorando.`);
        return false;
      }
      
      console.error(`Failed to delete file ${fileId}:`, errorText);
      return false;
    }
    console.log(`[deleteFile] Arquivo/pasta ${fileId} deletado com sucesso`);
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
};

export default {
  createFolder,
  uploadFile,
  downloadFile,
  copyFile,
  listFiles,
  findFolder,
  findFile,
  findDataFileWithFallback,
  getFileMetadata,
  deleteFile,
};
