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
  const fetched = await fetchSharedLabelData(folderId);
  if (!fetched) {
    return null;
  }

  const data = fetched.fileId 
    ? await fetchLabelDataByFileId(fetched.fileId) 
    : { label: fetched.label, todos: fetched.todos };
  
  if (!data) {
    return null;
  }

  return {
    folderId,
    labelName,
    fileId: fetched.fileId,
    modifiedTime: new Date().toISOString(),
    label: data.label || fetched.label,
    todos: data.todos || fetched.todos,
  };
};
