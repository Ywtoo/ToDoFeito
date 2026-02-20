/**
 * High-level auth utilities: signIn, signOut and current-user helpers.
 * Relies on `authTokens` and `authUtils` for token handling.
 */
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { DriveUser } from '../../types';
import { StorageService } from '../storage';
export { getAccessToken, invalidateTokenCache } from './authTokens';
import { pickAccessToken, buildDriveUser } from './authUtils';

// Configuração do Google Sign-In
// IMPORTANTE: Configure os Web Client IDs no Google Cloud Console
// Android: adicione o SHA-1 certificate fingerprint
// iOS: adicione o iOS URL scheme no Info.plist

// Token cache and refresh logic moved to authTokens.ts

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    scopes: [
      'https://www.googleapis.com/auth/drive', // Acesso completo ao Drive (necessário para compartilhamento)
    ],
    // webClientId deve ser configurado com o valor do Google Cloud Console
    // Por enquanto deixamos vazio - deve ser configurado antes do build
    webClientId: '1018164630375-crpm2do5pooi82a626rmlm33jph1vacq.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};

/**
 * Realiza o login com Google
 */
export const signIn = async (): Promise<DriveUser | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    
    
    if (response.type !== 'success') {
      return null;
    }
    
    const data = response.data;
    const user = data.user;
    
    if (!user || !user.email) {
      console.error('[GoogleSignIn] Invalid user data:', data);
      throw new Error('Não foi possível obter dados do usuário');
    }
    
    // Obter access token preferindo getTokens() quando disponível
    let tokens: { accessToken?: string } | null = null;
    try {
      if (typeof GoogleSignin.getTokens === 'function') {
        tokens = await GoogleSignin.getTokens();
      }
    } catch (tokensErr) {
      tokens = null;
    }

    const accessToken = pickAccessToken(data, tokens) || '';
    const driveUser: DriveUser = buildDriveUser(user, accessToken);
    
    // Salva no cache
    await StorageService.saveDriveUser(driveUser);
    
    return driveUser;
  } catch (error: any) {
    return null;
  }
};

/**
 * Realiza o logout
 */
export const signOut = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    await StorageService.saveDriveUser(null);
  } catch (error) {
    console.error('Sign-out error:', error);
    await StorageService.saveDriveUser(null); // Mesmo com erro, limpa o state
  }
};

/**
 * Obtém o usuário atualmente logado
 */
export const getCurrentUser = async (): Promise<DriveUser | null> => {
  try {
    const isSignedIn = await GoogleSignin.hasPreviousSignIn();

    if (!isSignedIn) {
      return null;
    }

    let response = await GoogleSignin.getCurrentUser();
    
    // Se getCurrentUser retornar null mas isSignedIn é true,
    // tenta fazer signInSilently para recuperar a sessão
    if (!response) {
      try {
        const silentResult = await GoogleSignin.signInSilently();
        if (silentResult.type === 'success') {
          // silentResult.data tem user, serverAuthCode, idToken
          const data = silentResult.data;
          const user = data.user;
          
          if (!user || !user.email) {
            console.error('[getCurrentUser] Invalid user data from silent sign in');
            return null;
          }
          
          let tokens: { accessToken?: string } | null = null;
          try {
            if (typeof GoogleSignin.getTokens === 'function') {
              tokens = await GoogleSignin.getTokens();
            }
          } catch (tErr) {
            tokens = null;
          }

          const accessToken = pickAccessToken(data, tokens) || '';
          return buildDriveUser(user, accessToken);
        }
      } catch (silentError) {
        return null;
      }
      return null;
    }

    // response é um objeto contendo { user: {...}, idToken: ..., scopes: ... }
    const userInfo = response.user;
    
    if (!userInfo || !userInfo.email) {
      console.error('[GoogleSignIn] Invalid current user data:', response);
      return null;
    }

    // Tenta obter tokens reais via getTokens()
    let tokens: { accessToken?: string } | null = null;
    try {
      if (typeof GoogleSignin.getTokens === 'function') {
        tokens = await GoogleSignin.getTokens();
      }
    } catch (tokensErr) {
      tokens = null;
    }

    const accessToken = pickAccessToken(response, tokens) || '';

    // Se temos um token válido, podemos retornar já
    if (accessToken) {
      const driveUser: DriveUser = buildDriveUser(userInfo, accessToken);

      // Atualiza o cache se diferente
      const cachedUser = await StorageService.loadDriveUser();
      if (!cachedUser || cachedUser.accessToken !== accessToken) {
        await StorageService.saveDriveUser(driveUser);
      }
      
      return driveUser;
    }

    // Se não veio token no response, tenta pegar do cache ou silent sign-in
    // Primeiro tenta pegar do cache
    const cachedUser = await StorageService.loadDriveUser();
    
    // Se há cache com token válido, usa ele
    if (cachedUser && cachedUser.accessToken && cachedUser.email === userInfo.email) {
      return cachedUser;
    }
    
    // Se não há token no cache, faz signInSilently para obter novo token
      try {
        const silentResult = await GoogleSignin.signInSilently();
        if (silentResult.type === 'success') {
          const data = silentResult.data;
          const silentUser = data.user;

          let tokensAfterSilent: { accessToken?: string } | null = null;
          try {
            if (typeof GoogleSignin.getTokens === 'function') {
              tokensAfterSilent = await GoogleSignin.getTokens();
            }
          } catch (tokensErr) {
            tokensAfterSilent = null;
          }

          const newAccessToken = pickAccessToken(data, tokensAfterSilent) || '';
          const driveUser: DriveUser = buildDriveUser(silentUser, newAccessToken);

          // Salva no cache
          await StorageService.saveDriveUser(driveUser);

          return driveUser;
        }
      } catch (error) {
      }
    
    // Fallback: retorna user sem token (vai falhar nas chamadas de API)
    return {
      email: userInfo.email,
      name: userInfo.name || undefined,
      photo: userInfo.photo || undefined,
      accessToken: '',
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};
// Token cache and refresh logic moved to authTokens.ts and re-exported above
