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
  
  // Indica se o usuário atual é dono (owner) ou colaborador (collaborator)
  // owner: pode deletar e compartilhar
  // collaborator: pode apenas editar, não pode deletar
  ownershipRole?: 'owner' | 'collaborator';
  
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
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
}

export interface LabelDataFile {
  label: Label;
  todos: Array<any>; // Todo[] - usa any aqui para evitar circular dependency
  version: number;
  updatedAt: number;
}

/**
 * Metadata que rastreia labels deletados intencionalmente
 * Usado para diferenciar: "label deletado" vs "label não sincronizado"
 * 
 * IMPORTANTE: Labels marcados como deletados aqui NÃO são apagados do Drive.
 * As pastas permanecem intactas no Drive, apenas são ignoradas nas sincronizações.
 * Isso permite:
 * - Evitar perda de dados
 * - Recuperar labels deletados acidentalmente
 * - Manter histórico completo no Drive
 */
export interface DriveMetadata {
  deletedLabels: {
    folderId: string;      // ID da pasta no Drive (ainda existe lá)
    labelId: string;       // ID do label local (pode estar vazio se deletado remotamente)
    labelName: string;     // Nome do label (para referência)
    deletedAt: number;     // Timestamp da deleção (marcação)
  }[];
  version: number;
  updatedAt: number;
}
