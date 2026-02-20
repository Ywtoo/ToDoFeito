import { downloadSharedLabel, downloadLabelData } from './sync';
import { findFile } from './api';

/**
 * Busca os dados de um label compartilhado na pasta `folderId`.
 * Retorna os dados do label (estrutura usada pelo app) e o fileId do `data.json` quando possível.
 */
export const fetchSharedLabelData = async (folderId: string) => {
  
  // Tenta baixar via helper que lida com permissões/reqs
  const data = await downloadSharedLabel(folderId);
  if (!data) {
    return null;
  }

  // Tenta recuperar o fileId do data.json na pasta
  const file = await findFile('data.json', folderId);
  const fileId = file ? file.id : undefined;

  return {
    label: data.label,
    todos: data.todos,
    fileId,
  };
};

/**
 * Busca os dados de um label conhecido a partir de um fileId (se disponível)
 */
export const fetchLabelDataByFileId = async (fileId?: string) => {
  if (!fileId) return null;
  return await downloadLabelData(fileId);
};
