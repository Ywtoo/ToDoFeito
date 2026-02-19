import { fetchSharedLabelData, fetchLabelDataByFileId } from './manager';

export type PreparedImport = {
  folderId: string;
  labelName: string;
  fileId?: string;
  modifiedTime?: string;
  label: any;
  todos: any[];
};

/**
 * Prepara os dados necessários para importar um label compartilhado.
 * Faz apenas operações de leitura no Drive e retorna os dados prontos para aplicar localmente.
 */
export const prepareImportSharedLabel = async (folderId: string, labelName: string): Promise<PreparedImport | null> => {
  console.log('[prepareImportSharedLabel] Iniciando:', { folderId, labelName });
  
  const fetched = await fetchSharedLabelData(folderId);
  if (!fetched) {
    console.log('[prepareImportSharedLabel] ❌ fetchSharedLabelData retornou null');
    return null;
  }

  console.log('[prepareImportSharedLabel] ✓ Dados obtidos do fetchSharedLabelData:');
  console.log('[prepareImportSharedLabel]   - fileId:', fetched.fileId);
  console.log('[prepareImportSharedLabel]   - label:', fetched.label?.name);
  console.log('[prepareImportSharedLabel]   - todos:', fetched.todos?.length || 0);

  const data = fetched.fileId 
    ? await fetchLabelDataByFileId(fetched.fileId) 
    : { label: fetched.label, todos: fetched.todos };
  
  if (!data) {
    console.log('[prepareImportSharedLabel] ❌ fetchLabelDataByFileId retornou null');
    return null;
  }

  console.log('[prepareImportSharedLabel] ✓ Dados finais:');
  console.log('[prepareImportSharedLabel]   - label:', data.label?.name);
  console.log('[prepareImportSharedLabel]   - todos:', data.todos?.length || 0);

  return {
    folderId,
    labelName,
    fileId: fetched.fileId,
    modifiedTime: new Date().toISOString(),
    label: data.label || fetched.label,
    todos: data.todos || fetched.todos,
  };
};
