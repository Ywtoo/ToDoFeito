import { Label } from '../../types';
import { ensureAppFolder } from './sync';
import { markLabelAsDeleted } from './sync';
import { StorageService } from '../../services/storage';

/** Marca um label como deletado no metadata do Drive (não deleta a pasta) */
export const markLabelDeletedOnDrive = async (label: Label): Promise<boolean> => {
  try {
    if (!label.driveMetadata) return false;
    const appFolderId = await ensureAppFolder();
    if (!appFolderId) return false;

    await markLabelAsDeleted(appFolderId, label);
    return true;
  } catch (e) {
    console.error('[markLabelDeletedOnDrive] Error:', e);
    return false;
  }
};

/**
 * Remove localmente um label compartilhado (não toca no Drive).
 * Retorna os novos labels e todos filtrados para que o hook atualize o estado.
 */
export const leaveSharedLabelLocal = async (labelId: string, labels: Label[]) => {
  try {
    const updatedLabels = labels.filter(l => l.id !== labelId);
    await StorageService.saveLabels(updatedLabels);

    const allTodos = await StorageService.loadTodos();
    const filteredTodos = allTodos.filter(t => t.labelId !== labelId);
    await StorageService.saveTodos(filteredTodos);

    return { updatedLabels, filteredTodos };
  } catch (e) {
    console.error('[leaveSharedLabelLocal] Error:', e);
    return null;
  }
};
