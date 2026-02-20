import { fetchWithAuth } from './authFetch';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

/**
 * Cria permissão de compartilhamento (anyoneWithLink)
 */
export const createPublicPermission = async (fileOrFolderId: string): Promise<boolean> => {
  try {
    const permission = {
      role: 'writer', // Permite edição para colaboração
      type: 'anyone',
    };

    if (!fileOrFolderId) {
      console.warn('[createPublicPermission] Ignorando ID vazio');
      return true;
    }

    

    const response = await fetchWithAuth(`${DRIVE_API_BASE}/files/${fileOrFolderId}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permission),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[createPublicPermission] Erro HTTP:', response.status, errorText);
      if (response.status === 403) {
        throw new Error(`Permissão negada. Detalhes: ${errorText}`);
      }
      throw new Error(`Failed to create permission (${response.status}): ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error('[createPublicPermission] Erro ao criar permissão:', error);
    return false;
  }
};

export default {
  createPublicPermission,
};
