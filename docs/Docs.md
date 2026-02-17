# ToDoFeito - Documentação

## Sistema de Soft Delete

O app implementa **soft delete** para garantir que dados nunca sejam perdidos durante sincronização:

### Como Funciona
- Quando você deleta uma tarefa, ela é marcada com `deleted: true`
- A tarefa continua no storage local mas não aparece nas listas
- Durante sync, a tarefa deletada é enviada ao Drive
- Outros dispositivos recebem a informação de que foi deletada
- Tarefas deletadas preservam histórico e evitam conflitos

### Hard Delete (Limpeza)
Use `cleanupDeletedTodos()` em `src/services/cleanup.ts` para remover permanentemente:
- Tarefas deletadas há mais de 30 dias (configurável)
- Por label específico ou globalmente
- Ideal para executar periodicamente em background

### Vantagens
✅ Impossível perder dados por acidente durante sync  
✅ Sincronização confiável entre múltiplos dispositivos  
✅ Histórico preservado para auditoria  
✅ Evita ressurreição de tarefas deletadas  

---

## Google Drive Sync - Configuração

Este guia explica como configurar o Google Cloud Platform para habilitar a sincronização com Google Drive e compartilhamento de labels.

### Visão Geral

O app usa Google Drive API para:
- Fazer backup automático das tarefas
- Sincronizar entre múltiplos dispositivos
- Compartilhar labels (categorias) com outras pessoas

**Custo**: GRATUITO - Os arquivos são salvos no Google Drive do próprio usuário. Não há custos de servidor.

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Select a project" > "New Project"
3. Nome do projeto: `ToDoFeito` (ou o que preferir)
4. Clique em "Create"

### Passo 2: Ativar a Google Drive API

1. No menu lateral, vá em "APIs & Services" > "Library"
2. Procure por "Google Drive API"
3. Clique em "Google Drive API"
4. Clique em "Enable"

### Passo 3: Configurar OAuth Consent Screen

1. Vá em "APIs & Services" > "OAuth consent screen"
2. Selecione "External" (ou "Internal" se for G Suite)
3. Clique em "Create"
4. Preencha os campos obrigatórios:
   - **App name**: ToDoFeito
   - **User support email**: seu email
   - **Developer contact information**: seu email
5. Clique em "Save and Continue"
6. Na seção "Scopes", clique em "Add or Remove Scopes"
7. Adicione o scope:
   - `https://www.googleapis.com/auth/drive.file` (Ver e gerenciar arquivos do Drive criados por este app)
8. Clique em "Update" e depois "Save and Continue"
9. Em "Test users", adicione seu email para testar
10. Clique em "Save and Continue"

### Passo 4: Criar OAuth Client IDs

#### 4.1 Web Client ID (necessário para Android e iOS)

1. Vá em "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Name: `ToDoFeito Web Client`
5. Clique em "Create"
6. **IMPORTANTE**: Copie o "Client ID" - você precisará dele no próximo passo

#### 4.2 Android OAuth Client ID

1. Na mesma tela de Credentials, clique em "Create Credentials" > "OAuth client ID"
2. Application type: **Android**
3. Name: `ToDoFeito Android`
4. Package name: `com.todofeito` (ou o nome do seu pacote)
5. SHA-1 certificate fingerprint:
   
   **Para obter o SHA-1 em desenvolvimento:**
   ```bash
   # Windows
   cd android
   .\gradlew signingReport
   
   # Procure por "Variant: debug" e copie o SHA1
   ```
   
   **Para obter o SHA-1 de produção:**
   - Use a keystore de produção
   - Ou obtenha do Google Play Console após o upload

6. Cole o SHA-1 e clique em "Create"

#### 4.3 iOS OAuth Client ID

1. Clique em "Create Credentials" > "OAuth client ID"
2. Application type: **iOS**
3. Name: `ToDoFeito iOS`
4. Bundle ID: `com.todofeito` (ou seu bundle ID - verifique em `ios/ToDoFeito.xcodeproj`)
5. Clique em "Create"

### Passo 5: Configurar o App

Observação sobre `webClientId` e fluxos de login:

- Se o seu app **não** possui um servidor (ou seja, todo o fluxo ocorre apenas no dispositivo), **não é obrigatório** usar um `webClientId`. Nesses casos, crie apenas os OAuth Client IDs nativos para **Android** e **iOS** (passos 4.2 e 4.3) e use o login nativo. Não defina `webClientId` e não habilite `offlineAccess` se não precisar de refresh token.
- Use `webClientId` quando for necessário obter um `serverAuthCode`, trocar esse código num backend ou solicitar `offlineAccess` (refresh token) para uso no servidor.

Exemplo — app sem servidor (configuração mínima):

```typescript
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
    ],
    // Não inclua `webClientId` se você não tiver um backend
    offlineAccess: false,
  });
};
```

Exemplo — quando houver servidor e for preciso `offlineAccess` (use o Web Client ID do passo 4.1):

```typescript
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
    ],
    webClientId: 'SEU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com',
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
};
```

### Passo 6: Instalar Dependências

```bash
npm install
```

### Passo 7: Configuração Adicional

#### Android

Nenhuma configuração adicional necessária - o deep linking já está configurado no `AndroidManifest.xml`.

#### iOS

1. Abra `ios/ToDoFeito.xcworkspace` no Xcode (NÃO o .xcodeproj)
2. No Xcode, vá em `ToDoFeito` > `Signing & Capabilities`
3. Adicione capability "Sign in with Apple" (se ainda não tiver)
4. Execute:
   ```bash
   cd ios
   pod install
   ```

### Passo 8: Testar

1. Build e execute o app:
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

2. Vá em "Ajustes" > "Entrar com Google"
3. Faça login com uma conta Google de teste (adicionada no passo 3)
4. Crie algumas tarefas
5. Verifique no [Google Drive](https://drive.google.com) se a pasta "ToDoFeito" foi criada

### Estrutura de Dados no Drive

```
Google Drive/
└── ToDoFeito/
    ├── default-label-Minhas Tarefas/
    │   └── data.json
    ├── label-123-Trabalho/
    │   └── data.json
    └── label-456-Personal/
        └── data.json
```

Cada `data.json` contém:
```json
{
  "label": {
    "id": "label-123",
    "name": "Trabalho",
    "color": "#2196F3",
    ...
  },
  "todos": [
    {
      "id": "1234567890",
      "title": "Terminar relatório",
      "labelId": "label-123",
      ...
    }
  ],
  "version": 1,
  "updatedAt": 1234567890000
}
```

### Como Compartilhar Labels

1. Crie um label na aba "Labels"
2. Adicione algumas tarefas a esse label
3. Na aba "Labels", toque no ícone de compartilhar ao lado do label
4. O app:
   - Sincroniza o label com o Drive
   - Torna a pasta acessível por link
   - Abre o compartilhamento do sistema (WhatsApp, Email, etc.)
5. Envie o link gerado para outra pessoa
6. Quando a pessoa abrir o link:
   - O app abre automaticamente
   - Pede login (se necessário)
   - Importa o label e todas as tarefas
   - Agenda as notificações

### Troubleshooting

#### "Sign-in failed" no Android
- Verifique se o SHA-1 está correto no Google Cloud Console
- Certifique-se de usar o mesmo email de teste configurado no OAuth Consent Screen
- Execute `./gradlew clean` no diretório `android/`

#### "The operation couldn't be completed" no iOS
- Verifique se o Bundle ID está correto no Google Cloud Console
- Execute `pod install` no diretório `ios/`
- Limpe o build: Product > Clean Build Folder no Xcode

#### Pasta ToDoFeito não aparece no Drive
- Verifique se o webClientId está configurado corretamente
- Verifique se o scope `drive.file` está autorizado
- Force logout e login novamente

#### Deep link não abre o app
- **Android**: Verifique o `AndroidManifest.xml` - o intent-filter deve estar presente
- **iOS**: Verifique o `Info.plist` - CFBundleURLSchemes deve conter "todofeito"
- Teste manualmente: Execute `adb shell am start -W -a android.intent.action.VIEW -d "todofeito://import?folderId=test&labelName=Test"` (Android)

### Limites e Quotas

A Google Drive API tem limites gratuitos:
- **Queries por dia**: 1.000.000.000
- **Queries por 100 segundos por usuário**: 1.000
- **Queries por 100 segundos**: 10.000

Para um app pequeno com poucos usuários, esses limites são mais que suficientes e você não pagará nada.

### Próximos Passos

- Implementar detecção de conflitos mais sofisticada (atualmente usa last-write-wins)
- Adicionar opção de fazer backup manual
- Mostrar indicador visual de status de sync
- Implementar retry automático em caso de falha de rede
- Adicionar opção de restaurar versões antigas (usando Drive Revisions API)

### Suporte

Para problemas relacionados ao Google Cloud/Drive API:
- [Documentação oficial](https://developers.google.com/drive/api/guides/about-sdk)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-drive-api)

Para problemas do app:
- Verifique os logs: `npx react-native log-android` ou `npx react-native log-ios`
- Abra uma issue no repositório
