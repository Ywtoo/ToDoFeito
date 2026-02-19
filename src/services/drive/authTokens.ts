import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StorageService } from '../storage';

// Token cache + lock moved out to isolate side-effects and make logic testable
let tokenCache: { token: string; expiresAt: number } | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      return tokenCache.token;
    }

    if (refreshTokenPromise) {
      return await refreshTokenPromise;
    }

    refreshTokenPromise = refreshAccessToken();
    try {
      const token = await refreshTokenPromise;
      return token;
    } finally {
      refreshTokenPromise = null;
    }
  } catch (error) {
    refreshTokenPromise = null;
    console.error('[getAccessToken] Erro:', error);
    return null;
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const isSignedIn = await GoogleSignin.hasPreviousSignIn();
    if (!isSignedIn) return null;

    let accessToken: string | null = null;

    try {
      if (typeof (GoogleSignin as any).getTokens === 'function') {
        const tokens = await (GoogleSignin as any).getTokens();
        if (tokens && tokens.accessToken) {
          accessToken = tokens.accessToken;
        }
      }
    } catch (tokensErr) {
      console.log('[refreshAccessToken] getTokens() falhou, tentando getCurrentUser:', tokensErr);
    }

    if (!accessToken) {
      const response = await (GoogleSignin as any).getCurrentUser();
      if (response) {
        accessToken = response.serverAuthCode || response.idToken || null;
      }
    }

    if (!accessToken) {
      try {
        const silentResult = await (GoogleSignin as any).signInSilently();
        if (silentResult && silentResult.type === 'success') {
          const data = (silentResult as any).data;
          accessToken = data.serverAuthCode || data.idToken || null;
        }
      } catch (e) {
        console.log('[refreshAccessToken] signInSilently falhou:', e);
      }
    }

    if (!accessToken) return null;

    tokenCache = { token: accessToken, expiresAt: Date.now() + 50 * 60 * 1000 };

    const currentUser = await StorageService.loadDriveUser();
    if (currentUser) {
      currentUser.accessToken = accessToken;
      await StorageService.saveDriveUser(currentUser);
    }

    return accessToken;
  } catch (error) {
    console.error('[refreshAccessToken] Erro:', error);
    return null;
  }
};

export const invalidateTokenCache = () => {
  tokenCache = null;
  console.log('[invalidateTokenCache] Cache invalidado');
};

export default {
  getAccessToken,
  invalidateTokenCache,
};
