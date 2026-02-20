import { getAccessToken, invalidateTokenCache } from './auth';

/**
 * Helper para executar requisição com retry automático em caso de 401
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit,
  retryCount = 0
): Promise<Response> => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Se 401 (token expirado), invalida cache e tenta uma vez mais
  if (response.status === 401 && retryCount === 0) {
    invalidateTokenCache();
    return fetchWithAuth(url, options, retryCount + 1);
  }

  return response;
};

export default fetchWithAuth;
