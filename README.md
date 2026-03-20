Supabase CLI
Coverage Status (coveralls.io in Bing)  
Bitbucket Pipelines (bitbucket.org in Bing)  
https://gitlab.com/sweatybridge/setup-cli/-/pipelines

Supabase é uma alternativa open source ao Firebase. Estamos construindo os recursos do Firebase usando ferramentas open source de nível empresarial.

Este repositório contém toda a funcionalidade da Supabase CLI.

[x] Rodar Supabase localmente

[x] Gerenciar migrações de banco de dados

[x] Criar e fazer deploy de Supabase Functions

[x] Gerar tipos diretamente do schema do banco

[x] Fazer requisições autenticadas à Management API

🚀 Getting Started
Instalação da CLI
Disponível via NPM como dependência de desenvolvimento:

bash
npm i supabase --save-dev
Com Yarn 4, desabilite o experimental fetch:

bash
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
Nota  
Para versões do Bun abaixo de v1.0.17, adicione supabase como trusted dependency antes de rodar bun add -D supabase.

Plataformas
<details>
<summary><b>macOS</b></summary>

Via Homebrew:

sh
brew install supabase/tap/supabase
Beta release:

sh
brew install supabase/tap/supabase-beta
brew link --overwrite supabase-beta
Upgrade:

sh
brew upgrade supabase
</details>

<details>
<summary><b>Windows</b></summary>

Via Scoop:

powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
Upgrade:

powershell
scoop update supabase
</details>

<details>
<summary><b>Linux</b></summary>

via Homebrew
sh
brew install supabase/tap/supabase
brew upgrade supabase
via Pacotes Linux
Disponíveis em Releases. Baixe o pacote adequado (.apk, .deb, .rpm, .pkg.tar.zst) e instale:

sh
sudo apk add --allow-untrusted <...>.apk
sudo dpkg -i <...>.deb
sudo rpm -i <...>.rpm
sudo pacman -U <...>.pkg.tar.zst
</details>

<details>
<summary><b>Outras plataformas</b></summary>

Via Go modules:

sh
go install github.com/supabase/cli@latest
ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
</details>

<details>
<summary><b>Pacotes mantidos pela comunidade</b></summary>

pkgx → script

Nixpkgs → script

</details>

Rodar a CLI
bash
supabase bootstrap
Ou via npx:

bash
npx supabase bootstrap
O comando bootstrap guia você na criação de um projeto Supabase usando templates.

📚 Documentação
Referência de comandos e configuração: Supabase CLI Docs

⚠️ Breaking Changes
Seguimos semantic versioning para mudanças que impactam comandos, flags e configs da CLI.
Mas, devido a dependências de imagens de serviços, não garantimos compatibilidade de migrations, seed.sql e tipos gerados entre versões.
Se precisar de estabilidade, fixe uma versão específica no package.json.

👩‍💻 Desenvolvimento
Rodar a partir do código-fonte:

sh
# Go >= 1.22
go run . help


📘 CI/CD Pipeline - Nexus Platform
Este documento descreve o fluxo de integração e entrega contínua (CI/CD) do projeto Nexus Platform, com ambientes separados para Staging e Produção.

🔁 Fluxo de Branches
Branch	Ambiente	Ação automática
develop	Staging	Deploy automático
main	Produção	Deploy automático
qualquer PR	CI geral	Lint, testes, build

⚙️ Workflows GitHub Actions
ci.yml → roda em qualquer push ou PR.

Lint e Prettier

Reset do banco de testes

Testes unitários e RLS

Migrations locais

Build do projeto

staging.yml → roda em push para develop.

Validação completa

Deploy para Supabase Staging

Deploy para Render Staging

prod.yml → roda em push para main.

Validação completa

Deploy para Supabase Produção

Deploy para Render Produção

🧪 Testes locais
Antes de rodar testes localmente:

bash
npm run docker:up
npm run db:reset:test
npm run test:clean
Ou use o script completo:

bash
npm run ci:test
🛠️ Boas práticas
Sempre crie PRs para develop.

Nunca faça push direto na main.

Use npm run ci:test antes de subir código.

Mantenha .env.test com PGHOST=127.0.0.1 para evitar erros de conexão.

📊 Fluxo Visual (ASCII)
Código
           [ Pull Request / Push ]
                     |
                     v
               +------------+
               |   CI.yml   |
               | Lint/Test  |
               +------------+
                     |
        +------------+-------------+
        |                          |
        v                          v
 [ develop branch ]          [ main branch ]
        |                          |
        v                          v
+------------------+        +------------------+
| staging.yml      |        | prod.yml         |
| Deploy Staging   |        | Deploy Produção  |
+------------------+        +------------------+
        |                          |
   Supabase + Render          Supabase + Render
     Staging Env                Prod Env