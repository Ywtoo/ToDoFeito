// Simple typed Drive errors used by the Drive service
export class DrivePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DrivePermissionError';
  }
}

export const PERMISSION_ERROR_PREFIX = 'PERMISSION_ERROR:';

export default {
  DrivePermissionError,
  PERMISSION_ERROR_PREFIX,
};
