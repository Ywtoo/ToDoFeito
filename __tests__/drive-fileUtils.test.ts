import { buildMultipartBody, buildUploadUrl } from '../src/services/drive/fileUtils';

describe('fileUtils (drive)', () => {
  test('buildUploadUrl returns POST when no id', () => {
    const r = buildUploadUrl(undefined);
    expect(r.method).toBe('POST');
    expect(r.url).toContain('/files?uploadType=multipart');
  });

  test('buildUploadUrl returns PATCH when id provided', () => {
    const r = buildUploadUrl('abc');
    expect(r.method).toBe('PATCH');
    expect(r.url).toContain('/files/abc?uploadType=multipart');
  });

  test('buildMultipartBody contains boundaries and contentType', () => {
    const meta = { name: 'f' };
    const content = '{"a":1}';
    const res = buildMultipartBody(meta, content, 'application/json');
    expect(res.multipartRequestBody).toContain(content);
    expect(res.contentTypeHeader).toContain('multipart/related');
  });
});
