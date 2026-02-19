import { useCallback, useEffect, useState } from 'react';
import { DriveUser } from '../types';
import {
  configureGoogleSignIn,
  getCurrentUser,
  signIn as driveSignIn,
  signOut as driveSignOut,
} from '../services/drive/auth';
import { StorageService } from '../services/storage';

export type AccountConflict = {
  localEmail: string;
  remoteEmail: string;
  pendingUser: DriveUser;
} | null;

/**
 * Hook responsável APENAS por gerenciar autenticação do usuário
 * NÃO contém lógica de merge/restore (movida para useDriveSync)
 * NÃO contém notification state (movido para useDriveSync)
 */
export const useAccountManagement = () => {
  const [user, setUser] = useState<DriveUser | null>(null);
  const [accountConflict, setAccountConflict] = useState<AccountConflict>(null);

  // Configura Google Sign-In na montagem
  useEffect(() => {
    configureGoogleSignIn();
    
    // Verifica se já está logado
    const checkUser = async () => {
      console.log('[useAccountManagement] Verificando usuário...');
      
      // Primeiro tenta carregar do AsyncStorage (mais rápido)
      const cachedUser = await StorageService.loadDriveUser();
      if (cachedUser) {
        console.log('[useAccountManagement] Usuário em cache:', cachedUser.email);
        setUser(cachedUser);
      }
      
      // Depois verifica com o Google (valida sessão)
      const currentUser = await getCurrentUser();
      if (currentUser) {
        console.log('[useAccountManagement] Usuário autenticado:', currentUser.email);
        
        // Verifica se houve troca de conta em relação aos dados locais
        const lastEmail = await StorageService.loadLastSyncedEmail();
        
        if (lastEmail && lastEmail !== currentUser.email) {
          console.log('[useAccountManagement] Conflito de conta detectado no startup:', {
            local: lastEmail,
            remote: currentUser.email
          });

          // Exponha o conflito para a UI decidir
          setAccountConflict({
            localEmail: lastEmail,
            remoteEmail: currentUser.email,
            pendingUser: currentUser,
          });
        } else {
          // Tudo certo (mesma conta ou primeira vez que salvamos o email)
          setUser(currentUser);
          await StorageService.saveDriveUser(currentUser);
          
          if (!lastEmail) {
            // Se não tinha email salvo (primeiro uso da versão nova), salva agora
            await StorageService.saveLastSyncedEmail(currentUser.email);
          }
        }
      } else if (cachedUser) {
        // Se tinha em cache mas getCurrentUser falhou, sessão expirou
        console.log('[useAccountManagement] Sessão expirou, limpando cache');
        setUser(null);
        await StorageService.saveDriveUser(null);
      } else {
        console.log('[useAccountManagement] Nenhum usuário logado');
      }
    };
    checkUser();
  }, []);

  /**
   * Faz login com Google
   */
  const signIn = useCallback(async (): Promise<boolean> => {
    try {
      const result = await driveSignIn();
      if (result) {
        const lastEmail = await StorageService.loadLastSyncedEmail();
        
        // Se tem email anterior e é diferente do atual
        if (lastEmail && lastEmail !== result.email) {
          // Exponha conflito de conta para a UI decidir
          setAccountConflict({
            localEmail: lastEmail,
            remoteEmail: result.email,
            pendingUser: result,
          });
          return true;
        }

        // Fluxo normal
        setUser(result);
        await StorageService.saveDriveUser(result);
        await StorageService.saveLastSyncedEmail(result.email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  }, []);

  /**
   * Faz logout
   */
  const signOut = useCallback(async () => {
    try {
      console.log('[useAccountManagement] Fazendo logout e limpando sessão...');
      
      // 1. Logout do Google
      await driveSignOut();
      
      // 2. Limpar sessão, mas MANTER lastSyncedEmail para detectar conflitos futuros
      setUser(null);
      await StorageService.saveDriveUser(null);
      
      console.log('[useAccountManagement] ✓ Sessão limpa');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  /**
   * Marca que o usuário foi autenticado (usado por resolvers de conflito)
   */
  const setAuthenticatedUser = useCallback(async (newUser: DriveUser) => {
    console.log('[useAccountManagement] Setando usuário autenticado:', newUser.email);
    setUser(newUser);
    await StorageService.saveDriveUser(newUser);
    await StorageService.saveLastSyncedEmail(newUser.email);
    console.log('[useAccountManagement] ✓ Usuário autenticado salvo');
  }, []);

  /**
   * Limpa o conflito de conta detectado
   */
  const clearConflict = useCallback(() => {
    setAccountConflict(null);
  }, []);

  return {
    user,
    accountConflict,
    signIn,
    signOut,
    setAuthenticatedUser,
    clearConflict,
  };
};
