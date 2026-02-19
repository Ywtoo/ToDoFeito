import { Label } from '../types';

export type DriveLabelInfo = {
  folderId: string;
  folderName: string;
  fileId?: string;
  modifiedTime?: string;
};

export const getLabelsToMarkAsDeleted = (
  driveLabels: DriveLabelInfo[],
  labels: Label[],
  deletedFolderIds: Set<string>
) => {
  const result: DriveLabelInfo[] = [];

  for (const driveLabel of driveLabels) {
    const existsLocally = labels.some(
      l => l.driveMetadata?.folderId === driveLabel.folderId
    );

    if (!existsLocally && !deletedFolderIds.has(driveLabel.folderId)) {
      const hasSyncedLabelsFromCurrentDrive = labels.some(l =>
        l.driveMetadata && driveLabels.some(dl => dl.folderId === l.driveMetadata!.folderId)
      );

      if (hasSyncedLabelsFromCurrentDrive) {
        result.push(driveLabel);
      }
    }
  }

  return result;
};

export const getLabelsToImport = (
  driveLabels: DriveLabelInfo[],
  labels: Label[],
  deletedFolderIds: Set<string>,
  labelsToMarkAsDeleted: DriveLabelInfo[]
) => {
  return driveLabels.filter(driveLabel => {
    const existsLocally = labels.some(
      l => l.driveMetadata?.folderId === driveLabel.folderId
    );
    const wasDeleted =
      deletedFolderIds.has(driveLabel.folderId) ||
      labelsToMarkAsDeleted.some(l => l.folderId === driveLabel.folderId);

    return !existsLocally && !wasDeleted;
  });
};

export const cleanLabelsForMerge = (labels: Label[]) =>
  labels.map(l => ({ ...l, driveMetadata: undefined, shared: false }));
