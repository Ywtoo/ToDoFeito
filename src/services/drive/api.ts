import { getAccessToken } from './auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Cria uma pasta no Google Drive
 */
export const createFolder = async (
  folderName: string,
  parentId?: string
): Promise<{ id: string; name: string } | null> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] }),
    };

    const response = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

/**
 * Upload de arquivo para o Google Drive
 */
export const uploadFile = async (
  fileName: string,
  content: string,
  mimeType: string = 'application/json',
  parentId?: string,
  existingFileId?: string
): Promise<{ id: string; modifiedTime: string } | null> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    // Trata strings vazias como undefined para evitar duplicação
    const validFileId = existingFileId && existingFileId.trim().length > 0 
      ? existingFileId 
      : undefined;

    const metadata: any = {
      name: fileName,
      mimeType: mimeType,
    };
    
    if (!validFileId && parentId) {
      metadata.parents = [parentId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const url = validFileId
      ? `${UPLOAD_API_BASE}/files/${validFileId}?uploadType=multipart`
      : `${UPLOAD_API_BASE}/files?uploadType=multipart`;

    const method = validFileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Se erro 404 e estava tentando atualizar, tenta criar novo
      if (response.status === 404 && validFileId) {
        console.log('[uploadFile] Arquivo não existe mais (404), criando novo...');
        // Tenta novamente sem fileId para criar novo arquivo
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

/**
 * Download de arquivo do Google Drive
 */
export const downloadFile = async (
  fileId: string
): Promise<string | null> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to download file: ${error}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Download file error:', error);
    return null;
  }
};

/**
 * Lista arquivos/pastas no Google Drive
 */
export const listFiles = async (
  query?: string,
  pageSize: number = 100
): Promise<Array<{ id: string; name: string; modifiedTime: string; mimeType: string }> | null> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      fields: 'files(id, name, modifiedTime, mimeType)',
      ...(query && { q: query }),
    });

    const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list files: ${error}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('List files error:', error);
    return null;
  }
};

/**
 * Busca uma pasta pelo nome
 */
export const findFolder = async (
  folderName: string,
  parentId?: string
): Promise<{ id: string; name: string } | null> => {
  try {
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const files = await listFiles(query);
    if (!files || files.length === 0) {
      return null;
    }

    return { id: files[0].id, name: files[0].name };
  } catch (error) {
    console.error('Find folder error:', error);
    return null;
  }
};

/**
 * Busca um arquivo pelo nome em uma pasta
 */
export const findFile = async (
  fileName: string,
  parentId: string
): Promise<{ id: string; name: string; modifiedTime: string } | null> => {
  try {
    const query = `name='${fileName}' and '${parentId}' in parents and trashed=false`;
    const files = await listFiles(query);
    
    if (!files || files.length === 0) {
      return null;
    }

    return {
      id: files[0].id,
      name: files[0].name,
      modifiedTime: files[0].modifiedTime,
    };
  } catch (error) {
    console.error('Find file error:', error);
    return null;
  }
};

/**
 * Cria permissão de compartilhamento (anyoneWithLink)
 */
export const createPublicPermission = async (
  fileOrFolderId: string
): Promise<boolean> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const permission = {
      role: 'reader',
      type: 'anyone',
    };

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileOrFolderId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create permission: ${error}`);
    }

    return true;
  } catch (error) {
    console.error('Create permission error:', error);
    return false;
  }
};

/**
 * Obtém metadados de um arquivo
 */
export const getFileMetadata = async (
  fileId: string
): Promise<{ id: string; name: string; modifiedTime: string } | null> => {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,modifiedTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
