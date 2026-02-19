import {
  makeFolderName,
  buildLabelDataFile,
  normalizeFileId,
  serializeContent,
  isRemoteNewer,
  buildLabelFoldersQuery,
} from '../src/services/drive/apiUtils';

describe('apiUtils (drive)', () => {
  test('makeFolderName concatenates id and name', () => {
    expect(makeFolderName('123', 'MyLabel')).toBe('123-MyLabel');
  });

  test('buildLabelDataFile removes driveMetadata and builds structure', () => {
    const label: any = { id: '1', name: 'L', driveMetadata: { foo: 'bar' } };
    const todos: any[] = [{ id: 't1' }];
    const data = buildLabelDataFile(label, todos);
    expect(data.label.driveMetadata).toBeUndefined();
    expect(data.todos).toEqual(todos);
    expect(typeof data.updatedAt).toBe('number');
  });

  test('normalizeFileId trims and returns undefined for empty', () => {
    expect(normalizeFileId(' abc ')).toBe('abc');
    expect(normalizeFileId('   ')).toBeUndefined();
    expect(normalizeFileId(undefined)).toBeUndefined();
  });

  test('serializeContent stringifies with spacing', () => {
    const obj = { a: 1 };
    expect(serializeContent(obj)).toContain('1');
    expect(serializeContent(obj)).toContain('\n');
  });

  test('isRemoteNewer compares timestamps', () => {
    const now = new Date().toISOString();
    const earlier = new Date(Date.now() - 1000).toISOString();
    expect(isRemoteNewer(now, earlier)).toBe(true);
    expect(isRemoteNewer(earlier, now)).toBe(false);
  });

  test('buildLabelFoldersQuery contains appFolderId', () => {
    const q = buildLabelFoldersQuery('FOLDER');
    expect(q).toContain("'FOLDER' in parents");
  });
});
