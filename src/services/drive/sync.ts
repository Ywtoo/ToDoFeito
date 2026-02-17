import { Label, LabelDataFile, Todo } from '../../types';
import {
  createFolder,
  downloadFile,
  findFile,
  findFolder,
  getFileMetadata,
  uploadFile,
} from './api';

const APP_FOLDER_NAME = 'ToDoFeito';
const DATA_FILE_NAME = 'data.json';

/**
 * Garante que a pasta raiz do app existe no Drive
 */
export const ensureAppFolder = async (): Promise<string | null> => {
  try {
    // Busca pasta existente
    let folder = await findFolder(APP_FOLDER_NAME);
    
    // Se não existe, cria
    if (!folder) {
      folder = await createFolder(APP_FOLDER_NAME);
    }

    return folder ? folder.id : null;
  } catch (error) {
    console.error('Ensure app folder error:', error);
    return null;
  }
};

/**
 * Garante que a pasta do label existe no Drive
 */
export const ensureLabelFolder = async (
  label: Label,
  appFolderId: string
): Promise<{ folderId: string; fileId: string; modifiedTime: string } | null> => {
  try {
    const folderName = `${label.id}-${label.name}`;
    
    // Busca pasta existente
    let folder = await findFolder(folderName, appFolderId);
    
    // Se não existe, cria
    if (!folder) {
      folder = await createFolder(folderName, appFolderId);
      if (!folder) {
        return null;
      }
    }

    // Busca arquivo data.json
    let file = await findFile(DATA_FILE_NAME, folder.id);
    
    return {
      folderId: folder.id,
      fileId: file?.id || '', 
      modifiedTime: file?.modifiedTime || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Ensure label folder error:', error);
    return null;
  }
};

/**
 * Faz upload dos dados de um label para o Drive
 */
export const uploadLabelData = async (
  label: Label,
  todos: Todo[]
): Promise<{ fileId: string; modifiedTime: string } | null> => {
  try {
    if (!label.driveMetadata) {
      console.error('Label sem driveMetadata');
      return null;
    }

    const dataFile: LabelDataFile = {
      label: {
        ...label,
        driveMetadata: undefined, // Remove driveMetadata do upload para evitar redundância
      },
      todos,
      version: 1,
      updatedAt: Date.now(),
    };

    const content = JSON.stringify(dataFile, null, 2);
    const { folderId, fileId } = label.driveMetadata;

    // Antes de criar novo arquivo, verifica se já existe um na pasta
    let validFileId = fileId && fileId.trim().length > 0 ? fileId : undefined;
    
    if (!validFileId) {
      const existingFile = await findFile(DATA_FILE_NAME, folderId);
      if (existingFile) {
        console.log('[uploadLabelData] Arquivo já existe, atualizando:', existingFile.id);
        validFileId = existingFile.id;
      }
    }

    const result = await uploadFile(
      DATA_FILE_NAME,
      content,
      'application/json',
      folderId,
      validFileId
    );

    return result;
  } catch (error) {
    console.error('Upload label data error:', error);
    return null;
  }
};

/**
 * Faz download dos dados de um label do Drive
 */
export const downloadLabelData = async (
  fileId: string
): Promise<LabelDataFile | null> => {
  try {
    const content = await downloadFile(fileId);
    if (!content) {
      return null;
    }

    const data: LabelDataFile = JSON.parse(content);
    return data;
  } catch (error) {
    console.error('Download label data error:', error);
    return null;
  }
};

/**
 * Faz download de um label compartilhado usando o folderId
 */
export const downloadSharedLabel = async (
  folderId: string
): Promise<LabelDataFile | null> => {
  try {
    // Busca o arquivo data.json dentro da pasta
    const file = await findFile(DATA_FILE_NAME, folderId);
    if (!file) {
      console.error('data.json não encontrado na pasta compartilhada');
      return null;
    }

    return await downloadLabelData(file.id);
  } catch (error) {
    console.error('Download shared label error:', error);
    return null;
  }
};

/**
 * Verifica se há mudanças remotas
 */
export const hasRemoteChanges = async (
  label: Label
): Promise<boolean> => {
  try {
    if (!label.driveMetadata) {
      return false;
    }

    // Se não tem fileId válido, não há arquivo remoto ainda
    if (!label.driveMetadata.fileId || label.driveMetadata.fileId.length === 0) {
      return false;
    }

    const metadata = await getFileMetadata(label.driveMetadata.fileId);
    if (!metadata) {
      return false;
    }

    // Compara timestamps
    const remoteTime = new Date(metadata.modifiedTime).getTime();
    const localTime = new Date(label.driveMetadata.modifiedTime).getTime();

    return remoteTime > localTime;
  } catch (error) {
    console.error('Check remote changes error:', error);
    return false;
  }
};

/**
 * Merge de TODOs - resolve conflitos usando last-write-wins
 */
export const mergeTodos = (
  localTodos: Todo[],
  remoteTodos: Todo[]
): Todo[] => {
  const merged = new Map<string, Todo>();

  // Adiciona todos os TODOs locais
  localTodos.forEach(todo => {
    merged.set(todo.id, todo);
  });

  // Merge com TODOs remotos (last-write-wins)
  remoteTodos.forEach(remoteTodo => {
    const localTodo = merged.get(remoteTodo.id);
    
    if (!localTodo) {
      // TODO remoto não existe localmente - adiciona
      merged.set(remoteTodo.id, remoteTodo);
    } else {
      // Conflito - mantém o mais recente
      if (remoteTodo.updatedAt > localTodo.updatedAt) {
        merged.set(remoteTodo.id, remoteTodo);
      }
    }
  });

  return Array.from(merged.values());
};

/**
 * Sincroniza um label específico
 */
export const syncLabel = async (
  label: Label,
  localTodos: Todo[]
): Promise<{
  label: Label;
  todos: Todo[];
  changed: boolean;
} | null> => {
  try {
    // Se não tem driveMetadata, este é o primeiro sync
    if (!label.driveMetadata) {
      const appFolderId = await ensureAppFolder();
      if (!appFolderId) {
        throw new Error('Falha ao criar pasta do app');
      }

      const folderData = await ensureLabelFolder(label, appFolderId);
      if (!folderData) {
        throw new Error('Falha ao criar pasta do label');
      }

      // Atualiza label com driveMetadata
      const updatedLabel: Label = {
        ...label,
        driveMetadata: folderData,
      };

      // Faz upload inicial
      const uploadResult = await uploadLabelData(updatedLabel, localTodos);
      if (!uploadResult) {
        throw new Error('Falha no upload inicial');
      }

      return {
        label: {
          ...updatedLabel,
          driveMetadata: {
            ...folderData,
            fileId: uploadResult.fileId,
            modifiedTime: uploadResult.modifiedTime,
          },
        },
        todos: localTodos,
        changed: true,
      };
    }

    // Verifica mudanças remotas
    const hasRemote = await hasRemoteChanges(label);
    
    if (hasRemote) {
      // Faz download e merge
      const remoteData = await downloadLabelData(label.driveMetadata.fileId);
      if (!remoteData) {
        throw new Error('Falha ao baixar dados remotos');
      }

      const mergedTodos = mergeTodos(localTodos, remoteData.todos);
      
      // Upload do merge
      const uploadResult = await uploadLabelData(label, mergedTodos);
      if (!uploadResult) {
        throw new Error('Falha no upload do merge');
      }

      return {
        label: {
          ...label,
          driveMetadata: {
            ...label.driveMetadata,
            fileId: uploadResult.fileId,
            modifiedTime: uploadResult.modifiedTime,
          },
        },
        todos: mergedTodos,
        changed: true,
      };
    } else {
      // Sem mudanças remotas, apenas faz upload das mudanças locais
      const uploadResult = await uploadLabelData(label, localTodos);
      if (!uploadResult) {
        // Se falhar e a pasta pode ter sido deletada, tenta recriar tudo
        console.log('[syncLabel] Upload falhou, tentando recriar estrutura...');
        const appFolderId = await ensureAppFolder();
        if (!appFolderId) {
          throw new Error('Falha ao criar pasta do app');
        }

        const folderData = await ensureLabelFolder(label, appFolderId);
        if (!folderData) {
          throw new Error('Falha ao recriar pasta do label');
        }

        // Atualiza label com nova driveMetadata
        const updatedLabel: Label = {
          ...label,
          driveMetadata: folderData,
        };

        // Tenta upload novamente
        const retryResult = await uploadLabelData(updatedLabel, localTodos);
        if (!retryResult) {
          throw new Error('Falha no upload após recriar estrutura');
        }

        return {
          label: {
            ...updatedLabel,
            driveMetadata: {
              ...folderData,
              fileId: retryResult.fileId,
              modifiedTime: retryResult.modifiedTime,
            },
          },
          todos: localTodos,
          changed: true,
        };
      }

      return {
        label: {
          ...label,
          driveMetadata: {
            ...label.driveMetadata,
            fileId: uploadResult.fileId,
            modifiedTime: uploadResult.modifiedTime,
          },
        },
        todos: localTodos,
        changed: false,
      };
    }
  } catch (error) {
    console.error('Sync label error:', error);
    return null;
  }
};
