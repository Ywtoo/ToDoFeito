import { Label } from '../../types';
import { createPublicPermission } from './api';

const APP_SCHEME = 'todofeito';

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
  
  // Gera deep link personalizado
  // Formato: todofeito://import?folderId=<ID>&labelName=<NOME>
  const labelName = encodeURIComponent(label.name);
  return `${APP_SCHEME}://import?folderId=${folderId}&labelName=${labelName}`;
};

/**
 * Configura um label/pasta para compartilhamento público
 */
export const enableSharing = async (
  label: Label
): Promise<boolean> => {
  if (!label.driveMetadata) {
    console.error('Label não está sincronizado com o Drive');
    return false;
  }

  const { folderId, fileId } = label.driveMetadata;

  try {
    // Torna a pasta e o arquivo acessíveis por qualquer pessoa com o link
    const folderPermission = await createPublicPermission(folderId);
    const filePermission = await createPublicPermission(fileId);

    return folderPermission && filePermission;
  } catch (error) {
    console.error('Enable sharing error:', error);
    return false;
  }
};

/**
 * Mensagem pré-pronta para compartilhar via email/WhatsApp
 */
export const getShareMessage = (labelName: string, link: string): string => {
  return `Olá! 👋

Estou compartilhando o label "${labelName}" com você no ToDoFeito.

Clique no link abaixo para adicionar as tarefas compartilhadas ao seu app:

${link}

Assim poderemos acompanhar nossas tarefas juntos! ✅`;
};

/**
 * Parseia um deep link de importação
 */
export const parseImportLink = (
  url: string
): { folderId: string; labelName: string } | null => {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== `${APP_SCHEME}:` || parsed.hostname !== 'import') {
      return null;
    }

    const folderId = parsed.searchParams.get('folderId');
    const labelName = parsed.searchParams.get('labelName');

    if (!folderId || !labelName) {
      return null;
    }

    return {
      folderId,
      labelName: decodeURIComponent(labelName),
    };
  } catch (error) {
    console.error('Parse import link error:', error);
    return null;
  }
};
