import { buildShareUrl, parseImportLink, getShareMessage, APP_DOMAIN, APP_PATH } from '../src/services/drive/shareUtils';

describe('shareUtils (drive)', () => {
  test('buildShareUrl encodes label and contains domain/path', () => {
    const url = buildShareUrl('folder123', 'My Label');
    expect(url).toContain(APP_DOMAIN);
    expect(url).toContain(APP_PATH);
    expect(url).toContain('labelName=My%20Label');
  });

  test('parseImportLink handles custom scheme', () => {
    const link = 'todofeito://import?folderId=F&labelName=Lab%20A';
    const parsed = parseImportLink(link);
    expect(parsed).not.toBeNull();
    expect(parsed!.folderId).toBe('F');
  });

  test('getShareMessage contains label and link', () => {
    const msg = getShareMessage('L', 'https://x');
    expect(msg).toContain('L');
    expect(msg).toContain('https://x');
  });
});
