import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { DriveUser } from '../../types';
import { StorageService } from '../storage';

// Configuração do Google Sign-In
// IMPORTANTE: Configure os Web Client IDs no Google Cloud Console
// Android: adicione o SHA-1 certificate fingerprint
// iOS: adicione o iOS URL scheme no Info.plist
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    scopes: [
      'https://www.googleapis.com/auth/drive.file', // Acesso apenas aos arquivos criados pelo app
    ],
    // webClientId deve ser configurado com o valor do Google Cloud Console
    // Por enquanto deixamos vazio - deve ser configurado antes do build
    webClientId: '1018164630375-crpm2do5pooi82a626rmlm33jph1vacq.apps.googleusercontent.com', // TODO: Adicionar Web Client ID do Google Cloud Console
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
    
    console.log('[GoogleSignIn] Response type:', response.type);
    
    if (response.type !== 'success') {
      console.log('[GoogleSignIn] Sign in não foi sucesso');
      return null;
    }
    
    const data = response.data;
    const user = data.user;
    
    if (!user || !user.email) {
      console.error('[GoogleSignIn] Invalid user data:', data);
      throw new Error('Não foi possível obter dados do usuário');
    }
    
    // Obter access token - está no data, não no user
    let accessToken = data.serverAuthCode || data.idToken;
    
    // Tenta getTokens se disponível
    try {
      if (typeof GoogleSignin.getTokens === 'function') {
        const tokens = await GoogleSignin.getTokens();
        if (tokens && tokens.accessToken) {
          accessToken = tokens.accessToken;
        }
      }
    } catch (tokensErr) {
      console.log('[signIn] getTokens não disponível, usando token alternativo');
    }
    
    const driveUser: DriveUser = {
      email: user.email,
      name: user.name || undefined,
      photo: user.photo || undefined,
      accessToken: accessToken || '',
    };
    
    // Salva no cache
    await StorageService.saveDriveUser(driveUser);
    
    return driveUser;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled sign-in');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Sign-in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play services not available');
    } else {
      console.error('Sign-in error:', error);
    }
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
    console.log('[getCurrentUser] hasPreviousSignIn:', isSignedIn);
    
    if (!isSignedIn) {
      return null;
    }

    let response = await GoogleSignin.getCurrentUser();
    
    // Se getCurrentUser retornar null mas isSignedIn é true,
    // tenta fazer signInSilently para recuperar a sessão
    if (!response) {
      console.log('[getCurrentUser] Tentando signInSilently...');
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
          
          let accessToken = data.serverAuthCode || data.idToken;

          // Tenta obter tokens reais
          try {
            if (typeof GoogleSignin.getTokens === 'function') {
              const tokens = await GoogleSignin.getTokens();
              if (tokens && tokens.accessToken) {
                accessToken = tokens.accessToken;
              }
            }
          } catch (tErr) {
            console.log('[getCurrentUser] getTokens failed in silent retry', tErr);
          }
          
          return {
            email: user.email,
            name: user.name || undefined,
            photo: user.photo || undefined,
            accessToken: accessToken || '',
          };
        }
      } catch (silentError) {
        console.log('[getCurrentUser] signInSilently falhou:', silentError);
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
    let accessToken: string = '';
    
    try {
      if (typeof GoogleSignin.getTokens === 'function') {
        const tokens = await GoogleSignin.getTokens();
        if (tokens && tokens.accessToken) {
          accessToken = tokens.accessToken;
        }
      }
    } catch (tokensErr) {
      console.log('[getCurrentUser] getTokens falhou, tentando usar idToken/serverAuthCode do objeto user', tokensErr);
    }

    // Se getTokens falhou, tenta usar serverAuthCode ou idToken como fallback
    if (!accessToken) {
       accessToken = response.serverAuthCode || response.idToken || '';
    }

    // Se temos um token válido, podemos retornar já
    if (accessToken) {
      const driveUser: DriveUser = {
        email: userInfo.email,
        name: userInfo.name || undefined,
        photo: userInfo.photo || undefined,
        accessToken: accessToken,
      };

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
    console.log('[getCurrentUser] Sem token no objeto nem em cache, tentando signInSilently...');
    try {
      const silentResult = await GoogleSignin.signInSilently();
      if (silentResult.type === 'success') {
        const data = silentResult.data;
        const silentUser = data.user;
        let newAccessToken = data.serverAuthCode || data.idToken;
        
        // Tenta obter tokens reais via getTokens() após silent sign-in
        try {
          if (typeof GoogleSignin.getTokens === 'function') {
            const tokens = await GoogleSignin.getTokens();
            if (tokens && tokens.accessToken) {
              newAccessToken = tokens.accessToken;
            }
          }
        } catch (tokensErr) {
           console.log('[getCurrentUser] getTokens após silent sign-in falhou', tokensErr);
        }

        const driveUser: DriveUser = {
          email: silentUser.email,
          name: silentUser.name || undefined,
          photo: silentUser.photo || undefined,
          accessToken: newAccessToken || '',
        };
        
        // Salva no cache
        await StorageService.saveDriveUser(driveUser);
        
        return driveUser;
      }
    } catch (error) {
      console.log('[getCurrentUser] signInSilently falhou ao obter tokens:', error);
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

/**
 * Obtém o access token atual (usa o token salvo no usuário)
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.accessToken) {
      console.log('[getAccessToken] Usuário ou token não disponível');
      return null;
    }
    
    return currentUser.accessToken;
  } catch (error: any) {
    console.error('[getAccessToken] Erro:', error.message || error);
    return null;
  }
};
