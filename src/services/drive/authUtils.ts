import { DriveUser } from '../../types';

/**
 * Pure helpers for auth token extraction and DriveUser building.
 * These functions do not call external services and are safe to unit-test.
 */
export const pickAccessToken = (responseLike: any, tokensLike?: { accessToken?: string } | null): string | null => {
  // Prefer explicit tokens object (from GoogleSignin.getTokens())
  if (tokensLike && tokensLike.accessToken) return tokensLike.accessToken;

  if (!responseLike) return null;

  // responseLike may be either the top-level response (with serverAuthCode/idToken)
  // or a nested `data` object returned by signIn/silent sign in.
  return responseLike.accessToken || responseLike.serverAuthCode || responseLike.idToken || null;
};

export const buildDriveUser = (userObj: any, token: string | null): DriveUser => {
  return {
    email: userObj.email,
    name: userObj.name || undefined,
    photo: userObj.photo || undefined,
    accessToken: token || '',
  };
};

export default {
  pickAccessToken,
  buildDriveUser,
};
