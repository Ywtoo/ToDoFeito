/**
 * Sync orchestrator: ensures app/label folders, uploads/downloads label data
 * and exposes sync helpers used by hooks and the UI.
 */
import { Label, LabelDataFile, Todo, DriveMetadata } from '../../types';
import {
  createFolder,
  downloadFile,
  findFile,
  findDataFileWithFallback,
  findFolder,
  getFileMetadata,
  listFiles,
  uploadFile,
  deleteFile,
} from './files';
import {
  makeFolderName,
  buildLabelDataFile,
  normalizeFileId,
  serializeContent,
  isRemoteNewer,
  buildLabelFoldersQuery,
  defaultMetadata,
} from './apiUtils';
import { APP_FOLDER_NAME, DATA_FILE_NAME, METADATA_FILE_NAME, LABELS_FILE_NAME } from './constants';

export interface RegistryEntry {
  id: string;
  name: string;
  isShared: boolean;
  isDefault: boolean;
  folderId: string;
  updatedAt: number;
}

export interface LabelsRegistry {
  labels: RegistryEntry[];
  updatedAt: number;
}

/**
 * Carrega o registro central de labels
 */
export const loadLabelsRegistry = async (): Promise<LabelsRegistry | null> => {
  try {
    const appFolderId = await ensureAppFolder();
    if (!appFolderId) return null;

    const file = await findFile(LABELS_FILE_NAME, appFolderId);
    if (!file) return null;

    const content = await downloadFile(file.id);
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    console.error('Load registry error:', error);
    return null;
  }
};

/**
 * Salva o registro central de labels
 */
export const saveLabelsRegistry = async (registry: LabelsRegistry): Promise<boolean> => {
  try {
    const appFolderId = await ensureAppFolder();
    if (!appFolderId) return false;

    let fileId: string | undefined;
    const existingFile = await findFile(LABELS_FILE_NAME, appFolderId);
    if (existingFile) {
      fileId = existingFile.id;
    }

    const content = JSON.stringify(registry, null, 2);
    await uploadFile(LABELS_FILE_NAME, content, 'application/json', appFolderId, fileId);
    return true;
  } catch (error) {
    console.error('Save registry error:', error);
    return false;
  }
};

/**
 * Atualiza um label no registro
 */
export const updateLabelInRegistry = async (label: Label, folderId: string): Promise<void> => {
  try {
    // Carrega registro atual ou cria novo
    let registry = await loadLabelsRegistry();
    if (!registry) {
      registry = { labels: [], updatedAt: Date.now() };
    }

    const entry: RegistryEntry = {
      id: label.id,
      name: label.name,
      isShared: label.shared,
      isDefault: label.isDefault,
      folderId: folderId,
      updatedAt: Date.now()
    };

    // Atualiza ou adiciona
    const index = registry.labels.findIndex(l => l.id === label.id);
    if (index >= 0) {
      registry.labels[index] = entry;
    } else {
      registry.labels.push(entry);
    }
    
    registry.updatedAt = Date.now();
    await saveLabelsRegistry(registry);
  } catch (error) {
    console.error('Update registry error:', error);
  }
};

/**
 * Remove um label do registro
 */
export const removeLabelFromRegistry = async (labelId: string): Promise<void> => {
  try {
    const registry = await loadLabelsRegistry();
    if (!registry) return;

    registry.labels = registry.labels.filter(l => l.id !== labelId);
    registry.updatedAt = Date.now();
    
    await saveLabelsRegistry(registry);
  } catch (error) {
    console.error('Remove from registry error:', error);
  }
};

/**
 * Deleta arquivos duplicados após merge
 */
export const cleanupDuplicateFiles = async (allFileIds: string[], keepFileId: string): Promise<void> => {
  if (!allFileIds || allFileIds.length <= 1) return;
  
  console.log(`[cleanupDuplicateFiles] Limpando duplicatas. Manter: ${keepFileId}, Total: ${allFileIds.length}`);
  
  const toDelete = allFileIds.filter(id => id !== keepFileId);
  
  for (const id of toDelete) {
    console.log(`[cleanupDuplicateFiles] Deletando duplicata: ${id}`);
    await deleteFile(id);
  }
};

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
    const folderName = makeFolderName(label.id, label.name);
    
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

    const dataFile = buildLabelDataFile(label, todos);
    const content = serializeContent(dataFile);
    const { folderId, fileId } = label.driveMetadata;

    // Antes de criar novo arquivo, verifica se já existe um na pasta
    let validFileId = normalizeFileId(fileId);
    
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

    return result ? { fileId: result.id, modifiedTime: result.modifiedTime } : null;
  } catch (error) {
    console.error('Upload label data error:', error);
    return null;
  }
};

/**
 * Lista TODOS os arquivos data.json em uma pasta e mescla
 * Previne múltiplos arquivos na mesma pasta
 */
export const listAndMergeAllDataFiles = async (
  folderId: string
): Promise<{ label: Label; todos: Todo[]; allFileIds: string[] } | null> => {
  try {
    console.log('[listAndMergeAllDataFiles] Listando todos os data.json na pasta:', folderId);
    
    // Lista TODOS os arquivos na pasta
    const query = `'${folderId}' in parents and trashed=false`;
    const files = await listFiles(query);
    
    if (!files || files.length === 0) {
      console.log('[listAndMergeAllDataFiles] Nenhum arquivo encontrado');
      return null;
    }
    
    console.log(`[listAndMergeAllDataFiles] Encontrados ${files.length} arquivo(s)`);
    
    // Filtra apenas data.json
    const dataFiles = files.filter(f => f.name === DATA_FILE_NAME);
    
    if (dataFiles.length === 0) {
      console.log('[listAndMergeAllDataFiles] Nenhum data.json encontrado');
      return null;
    }
    
    if (dataFiles.length === 1) {
      // Apenas 1 arquivo - retorna direto
      const content = await downloadFile(dataFiles[0].id);
      if (!content) return null;
      const data: LabelDataFile = JSON.parse(content);
      return { label: data.label, todos: data.todos, allFileIds: [dataFiles[0].id] };
    }
    
    // MÚLTIPLOS arquivos - MESCLAR!
    console.warn(`[listAndMergeAllDataFiles] ⚠️ ENCONTRADOS ${dataFiles.length} data.json! Mesclando...`);
    
    let mergedLabel: Label | null = null;
    const mergedTodosMap = new Map<string, Todo>();
    const allFileIds: string[] = [];
    
    // Ordena por modifiedTime (mais recente primeiro)
    dataFiles.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
    
    for (const file of dataFiles) {
      allFileIds.push(file.id);
      const content = await downloadFile(file.id);
      if (!content) continue;
      
      try {
        const data: LabelDataFile = JSON.parse(content);
        
        // Usa o label do arquivo mais recente
        if (!mergedLabel || data.updatedAt > (mergedLabel.updatedAt || 0)) {
          mergedLabel = data.label;
        }
        
        // Mescla todos - mantém o mais recente de cada
        data.todos.forEach(todo => {
          const existing = mergedTodosMap.get(todo.id);
          if (!existing || todo.updatedAt > existing.updatedAt) {
            mergedTodosMap.set(todo.id, todo);
          }
        });
      } catch (e) {
        console.error(`[listAndMergeAllDataFiles] Erro ao parsear ${file.id}:`, e);
      }
    }
    
    if (!mergedLabel) return null;
    
    const mergedTodos = Array.from(mergedTodosMap.values());
    console.log(`[listAndMergeAllDataFiles] ✓ Mesclados ${dataFiles.length} arquivos → ${mergedTodos.length} todos únicos`);
    
    return { label: mergedLabel, todos: mergedTodos, allFileIds };
  } catch (error) {
    console.error('[listAndMergeAllDataFiles] Erro:', error);
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
    console.log('[downloadLabelData] Baixando arquivo:', fileId);
    const content = await downloadFile(fileId);
    if (!content) {
      console.log('[downloadLabelData] Conteúdo vazio');
      return null;
    }

    console.log('[downloadLabelData] Conteúdo recebido, tamanho:', content.length);
    console.log('[downloadLabelData] Primeiros 100 chars:', content.substring(0, 100));
    console.log('[downloadLabelData] Parseando JSON...');
    const data: LabelDataFile = JSON.parse(content);
    console.log('[downloadLabelData] Dados parseados:');
    console.log('[downloadLabelData] - Label:', data.label?.name);
    console.log('[downloadLabelData] - Todos:', data.todos?.length || 0);
    return data;
  } catch (error) {
    console.error('[downloadLabelData] Erro:', error);
    return null;
  }
};

/**
 * Faz download de um label compartilhado usando o folderId
 * Se der erro de permissão, copia a pasta para o Drive do usuário
 * LISTA E MESCLA TODOS os data.json na pasta
 */
export const downloadSharedLabel = async (
  folderId: string
): Promise<LabelDataFile | null> => {
  try {
    console.log('[downloadSharedLabel] Buscando e mesclando TODOS os data.json na pasta:', folderId);

    // USA A NOVA LÓGICA - lista e mescla TODOS os arquivos
    const merged = await listAndMergeAllDataFiles(folderId);
    
    if (!merged) {
      console.error('[downloadSharedLabel] Nenhum data.json encontrado na pasta compartilhada');
      return null;
    }

    console.log('[downloadSharedLabel] ✓ Dados mesclados com sucesso:');
    console.log('[downloadSharedLabel]   - label:', merged.label?.name);
    console.log('[downloadSharedLabel]   - todos:', merged.todos?.length || 0);
    console.log('[downloadSharedLabel]   - arquivos mesclados:', merged.allFileIds.length);
    
    // ATUALIZA REGISTRO
    await updateLabelInRegistry(merged.label, folderId);

    return {
      label: merged.label,
      todos: merged.todos,
      version: 1,
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error('[downloadSharedLabel] Erro ao baixar label:', error);
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
    if (!normalizeFileId(label.driveMetadata.fileId)) {
      return false;
    }

    const metadata = await getFileMetadata(label.driveMetadata.fileId);
    if (!metadata) {
      return false;
    }

    // Compara timestamps
    return isRemoteNewer(metadata.modifiedTime, label.driveMetadata.modifiedTime);
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
 * IMPORTANTE: Faz TODO o processamento local PRIMEIRO, upload SÓ NO FINAL
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
    console.log(`[syncLabel] Sincronizando: ${label.name}, role=${label.ownershipRole}, shared=${label.shared}, isDefault=${label.isDefault}`);
    
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

      // UPLOAD NO FINAL - primeira sync
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

    // ===== PASSO 1: BAIXAR E PROCESSAR TUDO LOCAL =====
    console.log(`[syncLabel] Passo 1: Baixando e mesclando TODOS os arquivos da pasta...`);
    
    const allData = await listAndMergeAllDataFiles(label.driveMetadata.folderId);
    
    let finalTodos: Todo[];
    let finalLabel: Label = label;
    let needsUpload = false;
    
    if (!allData) {
      // Nenhum arquivo no Drive - usar dados locais
      console.log(`[syncLabel] Nenhum dado no Drive, usando dados locais`);
      finalTodos = localTodos;
      needsUpload = true;
    } else {
      // Tem dados no Drive - mesclar com local
      console.log(`[syncLabel] ${allData.allFileIds.length} arquivo(s) no Drive, mesclando...`);
      console.log(`[syncLabel] Remotos: ${allData.todos.length} todos, Locais: ${localTodos.length} todos`);
      
      // MERGE LOCAL - compara data atualização
      // IMPORTANTE: Normaliza todos os todos remotos para terem o labelId do label local
      // Isso corrige casos onde data.json tem um label.id diferente (ex: renomeação ou corrupção)
      const normalizedRemoteTodos = allData.todos.map(t => ({ ...t, labelId: label.id }));
      
      finalTodos = mergeTodos(localTodos, normalizedRemoteTodos);
      console.log(`[syncLabel] Merge local completo: ${finalTodos.length} todos finais`);
      
      // Atualiza metadata do label se mudou no Drive
      if (allData.label.updatedAt > label.updatedAt) {
        finalLabel = { ...label, ...allData.label, id: label.id, driveMetadata: label.driveMetadata };
      }
      
      needsUpload = true;
    }
    
    // ===== PASSO 2: UPLOAD SÓ NO FINAL COM DADOS COMPLETOS =====
    if (!needsUpload) {
      console.log(`[syncLabel] Sem mudanças, pulando upload`);
      return {
        label: finalLabel,
        todos: finalTodos,
        changed: false,
      };
    }
    
    console.log(`[syncLabel] Passo 2: Fazendo upload dos dados finais mesclados...`);
    const uploadResult = await uploadLabelData(finalLabel, finalTodos);
    
    if (!uploadResult) {
      // Se falhar, tenta recriar estrutura
      console.log('[syncLabel] Upload falhou, tentando recriar estrutura...');
      const appFolderId = await ensureAppFolder();
      if (!appFolderId) {
        throw new Error('Falha ao criar pasta do app');
      }

      const folderData = await ensureLabelFolder(finalLabel, appFolderId);
      if (!folderData) {
        throw new Error('Falha ao recriar pasta do label');
      }

      const updatedLabel: Label = {
        ...finalLabel,
        driveMetadata: folderData,
      };

      const retryResult = await uploadLabelData(updatedLabel, finalTodos);
      if (!retryResult) {
        throw new Error('Falha no upload após recriar estrutura');
      }

      console.log('[syncLabel] ✓ Estrutura recriada, upload concluído!');
      return {
        label: {
          ...updatedLabel,
          driveMetadata: {
            ...folderData,
            fileId: retryResult.fileId,
            modifiedTime: retryResult.modifiedTime,
          },
        },
        todos: finalTodos,
        changed: true,
      };
    }

    console.log(`[syncLabel] ✓ Upload concluído com sucesso!`);
    
    // LIMPEZA DE ARQUIVOS DUPLICADOS
    if (allData && allData.allFileIds && allData.allFileIds.length > 1) {
      await cleanupDuplicateFiles(allData.allFileIds, uploadResult.fileId);
    }
    
    // ATUALIZA REGISTRO DO APP
    await updateLabelInRegistry(finalLabel, finalLabel.driveMetadata.folderId);
    
    return {
      label: {
        ...finalLabel,
        driveMetadata: {
          ...finalLabel.driveMetadata!,
          fileId: uploadResult.fileId,
          modifiedTime: uploadResult.modifiedTime,
        },
      },
      todos: finalTodos,
      changed: true,
    };
  } catch (error) {
    console.error('Sync label error:', error);
    return null;
  }
};

/**
 * Carrega o metadata do Drive (lista de labels deletados)
 */
export const loadMetadata = async (appFolderId: string): Promise<DriveMetadata> => {
  try {
    const metadataFile = await findFile(METADATA_FILE_NAME, appFolderId);
    
    if (!metadataFile) {
      // Se não existe, retorna metadata vazio
      return defaultMetadata();
    }
    
    const content = await downloadFile(metadataFile.id);
    if (!content) {
      return defaultMetadata();
    }
    
    const metadata: DriveMetadata = JSON.parse(content);
    console.log(`[loadMetadata] Carregado: ${metadata.deletedLabels.length} labels deletados registrados`);
    return metadata;
  } catch (error) {
    console.error('Load metadata error:', error);
    return {
      deletedLabels: [],
      version: 1,
      updatedAt: Date.now(),
    };
  }
};

/**
 * Salva o metadata no Drive
 */
export const saveMetadata = async (
  appFolderId: string,
  metadata: DriveMetadata
): Promise<boolean> => {
  try {
    const content = JSON.stringify(metadata, null, 2);
    
    // Busca arquivo existente
    const existingFile = await findFile(METADATA_FILE_NAME, appFolderId);
    
    const result = await uploadFile(
      METADATA_FILE_NAME,
      content,
      'application/json',
      appFolderId,
      existingFile?.id
    );
    
    if (result) {
      console.log('[saveMetadata] Metadata salvo com sucesso');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Save metadata error:', error);
    return false;
  }
};

/**
 * Marca um label como deletado no metadata
 * IMPORTANTE: NÃO deleta do Drive, apenas registra no metadata.json
 */
export const markLabelAsDeleted = async (
  appFolderId: string,
  label: Label
): Promise<boolean> => {
  try {
    if (!label.driveMetadata) {
      console.log('[markLabelAsDeleted] Label não tem driveMetadata, nada a marcar');
      return true;
    }
    
    const metadata = await loadMetadata(appFolderId);
    
    // Verifica se já está marcado
    const alreadyMarked = metadata.deletedLabels.some(
      dl => dl.folderId === label.driveMetadata!.folderId
    );
    
    if (!alreadyMarked) {
      metadata.deletedLabels.push({
        folderId: label.driveMetadata.folderId,
        labelId: label.id,
        labelName: label.name,
        deletedAt: Date.now(),
      });
      metadata.updatedAt = Date.now();
      
      console.log(`[markLabelAsDeleted] Marcando label "${label.name}" como deletado (pasta ${label.driveMetadata.folderId} permanece no Drive)`);
      return await saveMetadata(appFolderId, metadata);
    }
    
    return true;
  } catch (error) {
    console.error('Mark label as deleted error:', error);
    return false;
  }
};

/**
 * Remove um label da lista de deletados (caso seja restaurado)
 */
export const unmarkLabelAsDeleted = async (
  appFolderId: string,
  folderId: string
): Promise<boolean> => {
  try {
    const metadata = await loadMetadata(appFolderId);
    
    const originalLength = metadata.deletedLabels.length;
    metadata.deletedLabels = metadata.deletedLabels.filter(
      dl => dl.folderId !== folderId
    );
    
    if (metadata.deletedLabels.length < originalLength) {
      metadata.updatedAt = Date.now();
      console.log(`[unmarkLabelAsDeleted] Removendo marca de deleção para pasta ${folderId}`);
      return await saveMetadata(appFolderId, metadata);
    }
    
    return true;
  } catch (error) {
    console.error('Unmark label as deleted error:', error);
    return false;
  }
};

/**
 * Marca um label como deletado no metadata (NÃO deleta do Drive)
 * A pasta permanece no Drive mas será ignorada nas sincronizações
 */
export const deleteLabelFolder = async (label: Label): Promise<boolean> => {
  try {
    if (!label.driveMetadata?.folderId) {
      console.log('[deleteLabelFolder] Label não tem driveMetadata, nada a marcar');
      return true;
    }

    // Apenas marca no metadata, NÃO deleta do Drive
    const appFolderId = await ensureAppFolder();
    if (appFolderId) {
      const success = await markLabelAsDeleted(appFolderId, label);
      if (success) {
        console.log(`[deleteLabelFolder] Label "${label.name}" marcado como deletado no metadata (pasta preservada no Drive)`);
      }
      return success;
    }

    return false;
  } catch (error) {
    console.error('Delete label folder error:', error);
    return false;
  }
};

/**
 * Lista TODOS os labels disponíveis no Google Drive (incluindo compartilhados)
 */
export const listAllDriveLabels = async (): Promise<
  Array<{
    folderId: string;
    folderName: string;
    fileId: string;
    modifiedTime: string;
    appFolderId: string; // ID da pasta ToDoFeito pai (para determinar ownership)
  }>
> => {
  try {
    console.log('[listAllDriveLabels] Listando todos os labels no Drive...');
    
    // TENTA LER O REGISTRO PRIMEIRO (Para encontrar labels compartilhados importados)
    const registry = await loadLabelsRegistry();
    const registryLabelsMap = new Map<string, RegistryEntry>();
    if (registry) {
      console.log(`[listAllDriveLabels] Registro carregado com ${registry.labels.length} labels`);
      registry.labels.forEach(l => registryLabelsMap.set(l.id, l));
    }
    
    // 1. Busca TODAS as pastas ToDoFeito (incluindo compartilhadas)
    const appFoldersQuery = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const appFolders = await listFiles(appFoldersQuery);
    
    if (!appFolders || appFolders.length === 0) {
      console.log('[listAllDriveLabels] Nenhuma pasta ToDoFeito encontrada');
      return [];
    }

    console.log(`[listAllDriveLabels] Encontradas ${appFolders.length} pasta(s) ToDoFeito`);

    const result: Array<{
      folderId: string;
      folderName: string;
      fileId: string;
      modifiedTime: string;
      appFolderId: string;
    }> = [];

    // 2. Para cada pasta ToDoFeito, lista as pastas de labels dentro dela
    for (const appFolder of appFolders) {
      console.log(`[listAllDriveLabels] Listando labels em ${appFolder.name} (${appFolder.id})...`);
      
      const query = buildLabelFoldersQuery(appFolder.id);
      const labelFolders = await listFiles(query);
      
      if (!labelFolders || labelFolders.length === 0) {
        console.log(`[listAllDriveLabels] Nenhuma pasta de label em ${appFolder.name}`);
        continue;
      }

      // 3. Para cada pasta de label, verifica se tem data.json
      for (const folder of labelFolders) {
        try {
          const dataFile = await findDataFileWithFallback(folder.id);
          if (dataFile) {
            result.push({
              folderId: folder.id,
              folderName: folder.name,
              fileId: dataFile.id,
              modifiedTime: dataFile.modifiedTime,
              appFolderId: appFolder.id, // Inclui ID da pasta ToDoFeito pai
            });
          } else {
            console.warn(`[listAllDriveLabels] Pasta ${folder.name} não tem data.json`);
          }
        } catch (err) {
          console.error(`[listAllDriveLabels] Erro ao processar pasta ${folder.name}:`, err);
        }
      }
    }

    // 4. Se tiver registro, verifica labels compartilhados que podem não ter sido encontrados (fora da pasta app)
    if (registry) {
      for (const regLabel of registry.labels) {
        // Pula se já encontrado
        if (result.some(r => r.folderId === regLabel.folderId)) continue;
        
        console.log(`[listAllDriveLabels] Verificando label do registro: ${regLabel.name} (${regLabel.folderId})`);
        
        try {
          // Verifica se tem data.json
          const dataFile = await findDataFileWithFallback(regLabel.folderId);
          if (dataFile) {
            result.push({
              folderId: regLabel.folderId,
              folderName: regLabel.name,
              fileId: dataFile.id,
              modifiedTime: dataFile.modifiedTime,
              appFolderId: '', // Labels compartilhados diretos podem não ter pasta app pai conhecida
            });
            console.log(`[listAllDriveLabels] Label compartilhado adicionado via registro: ${regLabel.name}`);
          }
        } catch (err) {
          console.warn(`[listAllDriveLabels] Label do registro não acessível: ${regLabel.name}`, err);
        }
      }
    }

    console.log(`[listAllDriveLabels] Encontrados ${result.length} labels no Drive (incluindo compartilhados)`);
    return result;
  } catch (error) {
    console.error('List all drive labels error:', error);
    return [];
  }
};

/**
 * Restaura dados do Drive (usado ao trocar de conta e escolher "substituir local")
 */
export const restoreFromDrive = async (): Promise<{ labels: Label[]; todos: Todo[] } | null> => {
  try {
    console.log('[restoreFromDrive] Iniciando restauração...');
    
    // 1. Garante/Encontra pasta do app
    const appFolderId = await ensureAppFolder();
    if (!appFolderId) {
      console.error('[restoreFromDrive] Pasta do app não encontrada');
      return null;
    }

    // 2. Lista pastas de labels
    const query = `'${appFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const labelFolders = await listFiles(query);
    
    if (!labelFolders) {
      console.log('[restoreFromDrive] Nenhuma pasta de label encontrada');
      return { labels: [], todos: [] };
    }

    const restoredLabels: Label[] = [];
    let restoredTodos: Todo[] = [];

    // 3. Para cada pasta, LISTA E MESCLA TODOS os data.json
    for (const folder of labelFolders) {
      try {
        console.log(`[restoreFromDrive] Processando pasta: ${folder.name}`);
        
        // USA A NOVA LÓGICA - lista e mescla TODOS os arquivos da pasta
        const merged = await listAndMergeAllDataFiles(folder.id);
        
        if (merged) {
          // Reconstrói label com metadata atualizado
          const labelWithMeta: Label = {
            ...merged.label,
            driveMetadata: {
              folderId: folder.id,
              fileId: merged.allFileIds[0] || '', // Usa o primeiro fileId
              modifiedTime: folder.modifiedTime,
            },
          };
          
          restoredLabels.push(labelWithMeta);
          // Garante que os todos tenham o labelId correto
          const todosForLabel = merged.todos.map(t => ({ ...t, labelId: labelWithMeta.id }));
          restoredTodos = [...restoredTodos, ...todosForLabel];
          
          console.log(`[restoreFromDrive] ✓ Pasta ${folder.name}: ${merged.todos.length} todos (${merged.allFileIds.length} arquivo(s) mesclado(s))`);
        } else {
          console.warn(`[restoreFromDrive] ⚠️ Pasta ${folder.name}: sem dados`);
        }
      } catch (err) {
        console.error(`[restoreFromDrive] Erro ao processar pasta ${folder.name}:`, err);
        // Continua para as próximas pastas mesmo com erro em uma
      }
    }

    console.log(`[restoreFromDrive] Restaurados ${restoredLabels.length} labels e ${restoredTodos.length} todos`);
    return { labels: restoredLabels, todos: restoredTodos };

  } catch (error) {
    console.error('Restore from drive error:', error);
    return null;
  }
};

/**
 * Faz merge dos dados locais com dados do Drive baseado em datas
 * Mantém os mais recentes (last-write-wins)
 */
export const mergeWithDrive = async (
  localLabels: Label[],
  localTodos: Todo[]
): Promise<{ labels: Label[]; todos: Todo[] } | null> => {
  try {
    console.log('[mergeWithDrive] Iniciando merge...');
    
    // 1. Baixa todos os dados do Drive
    const driveData = await restoreFromDrive();
    if (!driveData) {
      console.log('[mergeWithDrive] Nenhum dado no Drive, usando dados locais');
      return { labels: localLabels, todos: localTodos };
    }
    
    const mergedLabels = new Map<string, Label>();
    const mergedTodos = new Map<string, Todo>();
    
    // 2. Adiciona todos os labels locais
    localLabels.forEach(label => {
      mergedLabels.set(label.id, label);
    });
    
    // 3. Merge com labels do Drive (mantém o mais recente)
    driveData.labels.forEach(driveLabel => {
      const localLabel = mergedLabels.get(driveLabel.id);
      if (!localLabel) {
        // Label só existe no Drive - adiciona
        mergedLabels.set(driveLabel.id, driveLabel);
      } else {
        // Conflito - mantém o mais recente baseado em updatedAt
        if (driveLabel.updatedAt > localLabel.updatedAt) {
          mergedLabels.set(driveLabel.id, driveLabel);
        }
        // Se local for mais recente ou igual, mantém o local (já está no map)
      }
    });
    
    // 4. Adiciona todos locais
    localTodos.forEach(todo => {
      mergedTodos.set(todo.id, todo);
    });
    
    // 5. Merge com todos do Drive (mantém o mais recente)
    driveData.todos.forEach(driveTodo => {
      const localTodo = mergedTodos.get(driveTodo.id);
      if (!localTodo) {
        // Todo só existe no Drive - adiciona
        mergedTodos.set(driveTodo.id, driveTodo);
      } else {
        // Conflito - mantém o mais recente baseado em updatedAt
        if (driveTodo.updatedAt > localTodo.updatedAt) {
          mergedTodos.set(driveTodo.id, driveTodo);
        }
        // Se local for mais recente ou igual, mantém o local (já está no map)
      }
    });
    
    console.log(`[mergeWithDrive] Merge completo: ${mergedLabels.size} labels, ${mergedTodos.size} todos`);
    return {
      labels: Array.from(mergedLabels.values()),
      todos: Array.from(mergedTodos.values())
    };
    
  } catch (error) {
    console.error('Merge with drive error:', error);
    return null;
  }
};


