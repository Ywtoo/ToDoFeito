/**
 * Share helpers: generate links, enable public sharing and parse import links.
 */
import { Label } from '../../types';
import { createPublicPermission } from './permissions';
import { buildShareUrl, getShareMessage as buildShareMessage, parseImportLink as parseLink } from './shareUtils';

/**
 * Gera um link de importação para compartilhar um label
 */
export const generateShareLink = (
  label: Label
): string | null => {
  if (!label.driveMetadata) {
    console.error('Label não está sincronizado com o Drive');
    return null;
  }

  const { folderId } = label.driveMetadata;
  return buildShareUrl(folderId, label.name);
};

/**
 * Configura um label/pasta para compartilhamento público
 */
export const enableSharing = async (
  label: Label
): Promise<boolean> => {
  if (!label.driveMetadata) {
    console.error('[enableSharing] Label não está sincronizado com o Drive');
    return false;
  }

  const { folderId, fileId } = label.driveMetadata;

  try {
    // Torna a pasta e o arquivo acessíveis por qualquer pessoa com o link
    const folderPermission = await createPublicPermission(folderId);
    
    let filePermission = true;

    if (fileId) {
      filePermission = await createPublicPermission(fileId);
    }

    const success = folderPermission && filePermission;
    return success;
  } catch (error) {
    console.error('[enableSharing] Erro:', error);
    return false;
  }
};

/**
 * Mensagem pré-pronta para compartilhar via email/WhatsApp
 */
export const getShareMessage = (labelName: string, link: string): string => {
  return buildShareMessage(labelName, link);
};

/**
 * Parseia um link de importação (HTTPS ou custom scheme)
 */
export const parseImportLink = (
  url: string
): { folderId: string; labelName: string } | null => {
  return parseLink(url);
};
