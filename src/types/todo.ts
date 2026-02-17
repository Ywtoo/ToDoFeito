export interface Todo {
  id: string;
  title: string;
  description?: string;

  completed: boolean;
  deleted?: boolean;  // Soft delete - não mostrar mas manter no sync

  createdAt: number;
  updatedAt: number;

  // ID do label ao qual este todo pertence
  labelId: string;

  dueInitial?: number;   // horário previsto de início
  dueAt?: number;              // horário previsto de término
  
  // Timestamp (ms since epoch) indicando quando o lembrete deve disparar.
  // OBS: embora o formulário aceite um valor em minutos como offset,
  // o código converte esse offset em um timestamp absoluto e armazena aqui.
  reminderInterval?: number;
  notificationId?: string;
}
