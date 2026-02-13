Boa — explico cada comando e pacote rapidamente e pra que servem.

- `npm install --save-dev typescript @types/react @types/react-native @types/jest`  
  - O que instala: o compilador TypeScript (`typescript`) e declarações de tipos (`@types/...`) para React, React Native e Jest.  
  - Pra que serve: permite tipagem estática, melhores autocompletes e checagem de erros em tempo de desenvolvimento. São devDependencies porque só são necessários enquanto você desenvolve/edita (não em runtime).

- `npm install @react-native-async-storage/async-storage`  
  - O que instala: um módulo de armazenamento local (key-value) para React Native.  
  - Pra que serve: persistir dados simples no dispositivo (ex.: lista de todos, tokens). É dependency normal (usado em runtime). Em iOS, depois rode `npx pod-install` para instalar os pods nativos.

- `npm install @react-navigation/native @react-navigation/native-stack`  
  - O que instala: o core do React Navigation e o stack navigator baseado em APIs nativas.  
  - Pra que serve: gerenciar telas/rotas no app (navegar entre telas, parâmetros, cabeçalhos). Precisa de dependências nativas adicionais (abaixo).

- `npm install react-native-screens react-native-safe-area-context`  
  - O que instala: bibliotecas nativas que o React Navigation recomenda.  
  - Pra que servem: `react-native-screens` melhora performance de navegação (usa componentes nativos de tela) e `react-native-safe-area-context` resolve corretamente áreas seguras (notch, status bar). Também são dependencies de runtime; em iOS rode `npx pod-install`.

Comandos úteis após instalar:
- Verificar tipos sem gerar arquivos:
```bash
npx tsc --noEmit
```
- Para iOS (pods):
```bash
npx pod-install
# ou: cd ios && pod install
```

Observações rápidas
- “Dev” vs “prod”: pacotes com `--save-dev` são só para desenvolvimento (ex.: TypeScript, linters). Pacotes sem `--save-dev` são necessários no app em tempo de execução.  
- Autolinking: RN autolinka a maioria dos módulos nativos; por isso normalmente não precisa linkar manualmente, só executar os pods em iOS.  
- Se a instalação nativa falhar no Android/iOS, diga o erro e eu te guio (pode exigir rebuild: `npx react-native run-android` / `run-ios`).