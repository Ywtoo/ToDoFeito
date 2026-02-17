export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  
  // Indica se é o label padrão (não pode ser deletado)
  isDefault: boolean;
  
  // Indica se este label foi compartilhado com outros usuários
  shared: boolean;
  
  // Metadados do Google Drive (presente apenas se sincronizado)
  driveMetadata?: {
    folderId: string;        // ID da pasta no Drive
    fileId: string;          // ID do arquivo data.json
    modifiedTime: string;    // RFC 3339 timestamp do último sync
  };
}

export interface DriveUser {
  email: string;
  name?: string;
  photo?: string;
  accessToken: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'error';
  lastSyncAt?: number;
  error?: string;
}

export interface LabelDataFile {
  label: Label;
  todos: Array<any>; // Todo[] - usa any aqui para evitar circular dependency
  version: number;
  updatedAt: number;
}
