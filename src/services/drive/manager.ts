import { downloadSharedLabel, downloadLabelData } from './sync';
import { findFile } from './api';

/**
 * Busca os dados de um label compartilhado na pasta `folderId`.
 * Retorna os dados do label (estrutura usada pelo app) e o fileId do `data.json` quando possível.
 */
export const fetchSharedLabelData = async (folderId: string) => {
  console.log('[fetchSharedLabelData] Buscando label compartilhado:', folderId);
  
  // Tenta baixar via helper que lida com permissões/reqs
  const data = await downloadSharedLabel(folderId);
  if (!data) {
    console.log('[fetchSharedLabelData] ❌ downloadSharedLabel retornou null');
    return null;
  }

  console.log('[fetchSharedLabelData] ✓ Dados do downloadSharedLabel:');
  console.log('[fetchSharedLabelData]   - label:', data.label?.name);
  console.log('[fetchSharedLabelData]   - todos:', data.todos?.length || 0);

  // Tenta recuperar o fileId do data.json na pasta
  const file = await findFile('data.json', folderId);
  const fileId = file ? file.id : undefined;
  console.log('[fetchSharedLabelData]   - fileId encontrado:', fileId);

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
