# 🚀 ToDoFeito — Offline-First Task Manager com Sincronização Inteligente

<p align="center">
  <img src="docs/screenshots/preview.png" alt="ToDoFeito Preview" width="750"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Beta-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Offline_First-000000?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Google_Drive_API-34A853?style=for-the-badge&logo=google-drive&logoColor=white" />
</p>

## 📚 Summary | Sumário

🇺🇸 English
- [About the Project](#about-the-project)
- [Technical Challenge](#technical-challenge)
- [Implemented Solution](#implemented-solution)
- [Architecture](#architecture)
- [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)
- [Technologies](#technologies)

🇧🇷 Português
- [Sobre o Projeto](#sobre-o-projeto)
- [Desafio Técnico](#desafio-técnico)
- [Solução Implementada](#solução-implementada)
- [Arquitetura](#arquitetura)
- [Decisões Técnicas & Trade-offs](#decisões-técnicas--trade-offs)
- [Tecnologias](#tecnologias)

- [Screenshots](#Screenshots)


#🇧🇷 Português

## 📌 Sobre o Projeto

O **ToDoFeito** é um aplicativo de gerenciamento de tarefas construído com React Native seguindo uma arquitetura **offline-first**, com sincronização opcional via Google Drive.

Mais do que um simples gerenciador de tarefas, o foco deste projeto foi resolver um problema técnico real:

> Como garantir consistência e integridade de dados entre múltiplos dispositivos sem depender de um backend próprio?

A proposta foi projetar um sistema de sincronização confiável utilizando o Google Drive como camada remota opcional, mantendo:

* Funcionamento completo offline
* Resolução determinística de conflitos
* Preservação de dados
* Compartilhamento entre contas

O resultado é uma aplicação que funciona integralmente sem internet, mas que pode sincronizar dados de forma previsível e segura quando necessário.

📩 Para ativar o Drive Sync:
**[gabrieln99626@gmail.com](mailto:gabrieln99626@gmail.com)**

---



## 🎯 Problema Técnico

Aplicações sincronizadas normalmente utilizam backend dedicado.
O desafio aqui foi utilizar o Google Drive como camada de persistência remota sem comprometer consistência ou segurança dos dados.

Era necessário evitar:

* Sobrescrita cega de informações
* Perda de tarefas
* Duplicação inconsistente
* Conflitos entre dispositivos

---

## 🔄 Solução Implementada

Foi desenvolvido um sistema de sincronização baseado em **merge determinístico**.

### Fluxo de sincronização:

1. Download completo dos dados remotos
2. Comparação com estado local
3. Mesclagem baseada em ID
4. Upload apenas do estado consolidado

### Regras adotadas:

* Nunca apagar automaticamente dados remotos
* Atualizar apenas tarefas com IDs correspondentes
* Preservar itens únicos
* Validar antes de enviar

Esse modelo reduz risco de inconsistência e mantém previsibilidade no processo.

---

## 👥 Sistema de Compartilhamento

Implementado mecanismo para compartilhamento entre contas diferentes, com:

* Ativação manual do modo compartilhado
* Controle de acesso
* Sincronização bidirecional
* Atualização entre dispositivos distintos
* Indicador de progresso durante sincronização

Foi a parte mais complexa do projeto, exigindo controle assíncrono e testes em múltiplos cenários.

---

## 🔔 Notificações Locais

Sistema de agendamento com:

* Controle de permissões
* Reagendamento automático após edição
* Remoção segura ao excluir tarefa
* Sincronização entre estado persistido e notificações ativas

Tratamento de diferenças entre plataformas foi necessário.

---

## 🏗️ Arquitetura

O projeto segue separação clara de responsabilidades:

```
UI (React Native)
        ↓
Gerenciamento de Estado
        ↓
Services (Sync / Merge / Drive API)
        ↓
Persistência
   - AsyncStorage (local)
   - Google Drive (remoto opcional)
```

A lógica de sincronização é isolada da interface, facilitando manutenção e evolução do sistema.

---

## ⚖️ Decisões Técnicas e Trade-offs

Durante o desenvolvimento, algumas decisões exigiram equilíbrio entre simplicidade, segurança e complexidade arquitetural.

### 1️⃣ Uso do Google Drive como camada remota

**Vantagem:**

* Sem necessidade de backend próprio
* Redução de custo de infraestrutura
* Persistência em nuvem já disponível

**Trade-off:**

* Menor controle sobre autenticação
* Dependência de API externa
* Maior complexidade na lógica de sincronização

---

### 2️⃣ Estratégia de Merge ao invés de Sobrescrita

**Vantagem:**

* Preservação de dados
* Redução de risco de perda de informações
* Maior previsibilidade

**Trade-off:**

* Algoritmo mais complexo
* Necessidade de validação adicional
* Maior esforço de teste

---

### 3️⃣ Arquitetura Offline-First

**Vantagem:**

* Aplicação funcional sem internet
* Melhor experiência do usuário

**Trade-off:**

* Sincronização mais complexa
* Maior responsabilidade na consistência local

---

## 🛠️ Tecnologias Utilizadas

* React Native
* TypeScript
* AsyncStorage
* Google Drive API
* Controle de estado assíncrono
* GitHub Pages (interface auxiliar de compartilhamento)

---

#🇺🇸 English

## 📌 About the Project

**ToDoFeito** is a task management application built with React Native, designed around an **offline-first architecture**, with optional synchronization via Google Drive.

Beyond being a simple task app, this project focuses on solving a real engineering challenge:

> How can we guarantee data consistency across multiple devices without relying on a dedicated backend?

The system was designed to use Google Drive as an optional remote persistence layer while maintaining:

* Full offline functionality
* Deterministic conflict resolution
* Data integrity
* Cross-account sharing support

The result is an application that works entirely offline but can synchronize safely and predictably when connectivity is available.

📩 To enable Drive Sync access:
**[gabrieln99626@gmail.com](mailto:gabrieln99626@gmail.com)**

---

## 🎯 Technical Challenge

Most synchronized applications rely on centralized backends.

The challenge here was to use Google Drive as a remote storage layer while preserving:

* Consistency
* Predictability
* Data safety

It was necessary to prevent:

* Blind overwrites
* Data loss
* Duplicate inconsistencies
* Cross-device conflicts

---

## 🔄 Implemented Solution

A **deterministic merge-based synchronization strategy** was implemented.

### Sync Flow

1. Download full remote dataset
2. Compare with local state
3. Perform ID-based merge
4. Upload consolidated state

### Rules Applied

* Never automatically delete remote data
* Update only matching IDs
* Preserve unique entries
* Validate before upload

This model reduces inconsistency risks and keeps synchronization predictable.

---

## 👥 Sharing System

A sharing mechanism was implemented allowing different accounts to access the same dataset, including:

* Manual shared mode activation
* Access control
* Bidirectional sync
* Cross-device updates
* Sync progress indicator

This was the most complex part of the project, requiring careful asynchronous control and multi-scenario testing.

---

## 🔔 Local Notifications

The app includes a scheduled local notification system with:

* Permission handling
* Automatic rescheduling after edits
* Safe removal on task deletion
* Synchronization between persisted state and active notifications

Platform-specific differences were handled to ensure reliability.

---

## 🏗️ Architecture

Clear separation of concerns:

```
UI (React Native)
        ↓
State Management
        ↓
Services Layer (Sync / Merge / Drive API)
        ↓
Persistence Layer
   - AsyncStorage (local)
   - Google Drive (remote optional)
```

Synchronization logic is isolated from UI components, improving maintainability and scalability.

---

## ⚖️ Technical Decisions & Trade-offs

### 1️⃣ Using Google Drive as Remote Layer

**Advantages:**

* No need for custom backend
* Reduced infrastructure cost
* Built-in cloud persistence

**Trade-offs:**

* Limited authentication control
* External API dependency
* Increased sync logic complexity

---

### 2️⃣ Merge Strategy Instead of Overwrite

**Advantages:**

* Data preservation
* Reduced loss risk
* Predictable sync behavior

**Trade-offs:**

* More complex algorithm
* Additional validation required
* Higher testing effort

---

### 3️⃣ Offline-First Architecture

**Advantages:**

* Fully functional without internet
* Better user experience

**Trade-offs:**

* More complex synchronization
* Greater responsibility for local consistency

---

## 🛠️ Technologies

* React Native
* TypeScript
* AsyncStorage
* Google Drive API
* Asynchronous state control
* GitHub Pages (auxiliary sharing interface)

---

## 📷 Screenshots

<p align="center">
  <img src="docs/screenshots/home.png" width="250"/>
  <img src="docs/screenshots/task-edit.png" width="250"/>
  <img src="docs/screenshots/sync-loading.png" width="250"/>
</p>




