import { Label } from '../../types';
import {
  ensureAppFolder,
  loadMetadata,
  listAllDriveLabels,
  downloadLabelData,
  unmarkLabelAsDeleted,
  saveMetadata,
} from './sync';

type DriveLabel = {
  folderId: string;
  folderName: string;
  fileId?: string;
  modifiedTime?: string;
  appFolderId?: string; // ID da pasta ToDoFeito pai
};

export type ImportEntry = {
  folderId: string;
  folderName: string;
  fileId?: string;
  modifiedTime?: string;
  labelData: Label;
  todos: any[];
};

/**
 * Realiza a sincronização de alto nível contra o Drive:
 * - garante pasta do app
 * - carrega metadata
 * - identifica e marca labels deletados no metadata
 * - baixa labels que devem ser importados e atualiza metadata
 * Retorna uma lista de entradas prontas para serem importadas localmente.
 */
export const performFullSync = async (
  labels: Label[],
  onProgress?: (progress: { current: number; total: number; message: string }) => void,
) => {
  const result: { importEntries: ImportEntry[]; lastSyncAt: number } = {
    importEntries: [],
    lastSyncAt: Date.now(),
  };

  // Estimativa inicial de passos antes de saber quantos loops teremos
  // 1. App Folder
  // 2. Metadata
  // 3. List Drive Labels
  // 4... Import loop
  let currentStep = 0;
  let totalSteps = 3; 

  const reportProgress = (msg: string) => {
    onProgress?.({ current: currentStep, total: totalSteps, message: msg });
  };

  currentStep = 1;
  reportProgress('Verificando pasta do app...');
  const appFolderId = await ensureAppFolder();
  if (!appFolderId) throw new Error('Falha ao encontrar pasta do app');

  currentStep = 2;
  reportProgress('Carregando metadados...');
  const metadata = await loadMetadata(appFolderId);
  const deletedFolderIds = new Set(metadata.deletedLabels.map(dl => dl.folderId));

  currentStep = 3;
  reportProgress('Listando labels no Drive...');
  const driveLabels = await listAllDriveLabels();
  
  // Obtém o ID da pasta ToDoFeito do usuário atual para determinar ownership
  const userAppFolderId = appFolderId; // A pasta garantida/criada é do usuário

  // Identifica labels do Drive que não existem localmente e devem ser marcados como deletados
  const labelsToMarkAsDeleted: DriveLabel[] = [];
  for (const driveLabel of driveLabels) {
    const existsLocally = labels.some(l => l.driveMetadata?.folderId === driveLabel.folderId);
    if (!existsLocally && !deletedFolderIds.has(driveLabel.folderId)) {
      const hasSyncedLabelsFromCurrentDrive = labels.some(l =>
        l.driveMetadata && driveLabels.some(dl => dl.folderId === l.driveMetadata!.folderId)
      );
      if (hasSyncedLabelsFromCurrentDrive) labelsToMarkAsDeleted.push(driveLabel);
    }
  }

  if (labelsToMarkAsDeleted.length > 0) {
    for (const dl of labelsToMarkAsDeleted) {
      metadata.deletedLabels.push({ folderId: dl.folderId, labelId: '', labelName: dl.folderName, deletedAt: Date.now() });
    }
    metadata.updatedAt = Date.now();
    await saveMetadata(appFolderId, metadata);
  }

  // Import candidates (não marcados como deletados)
  const labelsToImport = driveLabels.filter(driveLabel => {
    const existsLocally = labels.some(l => l.driveMetadata?.folderId === driveLabel.folderId);
    const wasDeleted = deletedFolderIds.has(driveLabel.folderId) || labelsToMarkAsDeleted.some(l => l.folderId === driveLabel.folderId);
    return !existsLocally && !wasDeleted;
  });

  // Atualiza total de passos com os que serão importados
  totalSteps += labelsToImport.length;

  for (const driveLabel of labelsToImport) {
    currentStep++;
    reportProgress(`Importando: ${driveLabel.folderName}`);

    try {
      const data = await downloadLabelData(driveLabel.fileId);
      if (!data) continue;

      // Se conseguiu baixar, remove do metadata "deletado" se estiver lá
      await unmarkLabelAsDeleted(appFolderId, driveLabel.folderId);

      // Determina ownership: se está na pasta ToDoFeito do usuário, é owner; senão, collaborator
      const isOwner = driveLabel.appFolderId === userAppFolderId;
      const labelData: Label = {
        ...data.label,
        shared: !isOwner, // Se não é owner, é compartilhado
        ownershipRole: (isOwner ? 'owner' : 'collaborator') as 'owner' | 'collaborator',
      };

      console.log(`[performFullSync] Label ${driveLabel.folderName}: ownership=${labelData.ownershipRole}, shared=${labelData.shared}`);

      result.importEntries.push({
        folderId: driveLabel.folderId,
        folderName: driveLabel.folderName,
        fileId: driveLabel.fileId,
        modifiedTime: driveLabel.modifiedTime,
        labelData,
        todos: data.todos,
      });
    } catch (e) {
      console.error('[performFullSync] Erro ao baixar label:', driveLabel.folderName, e);
    }
  }

  return result;
};
