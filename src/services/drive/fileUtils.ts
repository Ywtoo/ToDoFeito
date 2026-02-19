/**
 * Pure helpers for building multipart upload bodies for Drive.
 */
export const buildMultipartBody = (
  metadata: any,
  content: string,
  mimeType: string = 'application/json',
  boundary: string = '-------314159265358979323846'
) => {
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const contentTypeHeader = `multipart/related; boundary=${boundary}`;

  return { multipartRequestBody, contentTypeHeader, boundary };
};

export const buildUploadUrl = (fileId?: string) => {
  const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
  if (fileId && fileId.trim().length > 0) {
    return { url: `${UPLOAD_API_BASE}/files/${fileId}?uploadType=multipart`, method: 'PATCH' };
  }
  return { url: `${UPLOAD_API_BASE}/files?uploadType=multipart`, method: 'POST' };
};

export default { buildMultipartBody };
