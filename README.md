# 🌟 Aurora – Plataforma de Cuidado e Gestão para Idosos

> 🚧 **Projeto em desenvolvimento ativo** – novas funcionalidades estão sendo implementadas continuamente.

O **Aurora** é uma plataforma web focada no **cuidado, acompanhamento e gestão de idosos**, conectando familiares, colaboradores e o próprio idoso em um ambiente seguro, moderno e acessível.

O objetivo principal do projeto é **centralizar informações, autenticação segura e fluxos de acesso por perfil**, garantindo que cada tipo de usuário tenha acesso apenas ao que é relevante para sua função.

Este repositório representa o **back-end da aplicação**, desenvolvido com foco em boas práticas, escalabilidade e organização de código.

---

## 🎯 Objetivo do Projeto

Criar uma solução que facilite:

* 👵 O acompanhamento do idoso
* 👨‍👩‍👧 A gestão por familiares
* 🤝 O suporte de colaboradores
* 🔐 A segurança de acesso por múltiplos níveis de permissão

Tudo isso utilizando tecnologias modernas do ecossistema JavaScript.

---

## 🧩 Perfis de Usuário (Roles)

A aplicação já trabalha com **controle de acesso por papel (role)**:

* **FAMILIAR** – acesso administrativo e de gestão
* **FAMILIAR_COLABORADOR** – acesso limitado às informações permitidas
* **IDOSO** – acesso simplificado e direcionado

O redirecionamento e as permissões são definidos automaticamente após a autenticação.

---

## 🔐 Autenticação e Segurança

Um dos principais diferenciais do projeto é o **fluxo de autenticação em duas etapas (OTP)**:

### 🔑 Fluxo de Login

1. Usuário informa email e senha
2. O backend valida as credenciais
3. Um **código OTP** é enviado por email
4. O usuário confirma o código
5. O sistema autentica e redireciona conforme o perfil

Esse fluxo aumenta significativamente a segurança da aplicação.

---

## ⚙️ Funcionalidades já implementadas

### ✅ Autenticação

* Login com email e senha
* Verificação por OTP
* Validação e expiração de código
* Controle de sessão

### ✅ Cadastro

* Cadastro de usuários
* Integração com fluxo de login + OTP
* Redirecionamento automático após cadastro

### ✅ Controle de Acesso

* Separação de dashboards por perfil
* Normalização e validação de roles

### ✅ Estrutura de Serviços

* Serviços organizados por domínio
* Camada de autenticação desacoplada
* Código preparado para crescimento do projeto

---

## 🏗️ Arquitetura e Boas Práticas

O backend foi desenvolvido seguindo princípios como:

* Separação de responsabilidades
* Código modular e reutilizável
* Serviços isolados por contexto
* Preparação para escalabilidade

Mesmo em fase inicial, o projeto já reflete **preocupação com manutenção, legibilidade e evolução futura**.

---

## 🧪 Status do Projeto

* 🔄 Em desenvolvimento
* 🧩 Novos módulos planejados
* 🛠️ Melhorias constantes no fluxo de autenticação

O projeto está sendo construído como parte do meu **desenvolvimento profissional como desenvolvedor full stack**, aplicando conceitos reais usados no mercado.

---

## 👨‍💻 Sobre o Desenvolvedor

Sou desenvolvedor **Full Stack**, com foco na construção de aplicações reais, organizadas e escaláveis.  
O projeto **Aurora** está sendo desenvolvido como uma solução prática para aplicar conceitos modernos de back-end, autenticação, segurança e arquitetura de APIs.

Neste projeto, trabalhei diretamente com as seguintes tecnologias e ferramentas:

### 🛠️ Tecnologias Principais
- **Node.js** com **TypeScript**
- **Fastify** (API performática e tipada)
- **Prisma ORM** (modelagem e acesso a banco de dados)
- **Zod** (validação e tipagem de dados)
- **JWT** para autenticação segura
- **OTP por e-mail** para verificação de acesso
- **Bcrypt** para criptografia de senhas

### 🗄️ Bancos de Dados 
- **MongoDB** (via Prisma)

### 🔐 Autenticação e Segurança
- Login com **e-mail + senha**
- Verificação em duas etapas (**OTP**)
- Controle de acesso por **roles** (ADMIN, COLABORADOR, IDOSO)
- Sessões seguras com cookies e JWT

### 📦 Integrações e Serviços
- **Nodemailer / Resend** para envio de e-mails
- **Stripe** (estrutura preparada para pagamentos)
- **Cloudinary** para upload de imagens
- **Firebase Admin** para integrações futuras

### 📚 Documentação
- **Swagger** integrado à API para documentação e testes de endpoints

### 🚀 Objetivo do Projeto
Este projeto tem como objetivo demonstrar minha capacidade de:
- Criar APIs REST bem estruturadas
- Aplicar boas práticas de segurança
- Trabalhar com autenticação real
- Organizar código pensando em crescimento e manutenção

O Aurora ainda está em desenvolvimento, com novas funcionalidades sendo adicionadas continuamente, servindo como base prática de aprendizado e evolução profissional.


