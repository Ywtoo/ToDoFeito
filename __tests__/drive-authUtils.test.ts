import { pickAccessToken, buildDriveUser } from '../src/services/drive/authUtils';

describe('authUtils (drive)', () => {
  test('pickAccessToken prefers tokensLike', () => {
    const response = { accessToken: 'r1' };
    const tokens = { accessToken: 't1' };
    expect(pickAccessToken(response, tokens)).toBe('t1');
  });

  test('pickAccessToken falls back to serverAuthCode/idToken', () => {
    expect(pickAccessToken({ serverAuthCode: 's' })).toBe('s');
    expect(pickAccessToken({ idToken: 'i' })).toBe('i');
  });

  test('buildDriveUser builds DriveUser object', () => {
    const u = buildDriveUser({ email: 'a@b' , name: 'N'}, 'tok');
    expect(u.email).toBe('a@b');
    expect(u.accessToken).toBe('tok');
  });
});
