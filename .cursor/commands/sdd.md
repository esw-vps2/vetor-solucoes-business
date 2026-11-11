
# /sdd — Criar especificação

Crie uma especificação preliminar para a funcionalidade solicitada.
Não implemente código.

## 1. Consulte a especificação existente do projeto

Antes de gerar a especificação, leia os documentos relevantes:

- `docs/sdd/README.md`
- `docs/sdd/configuration.md`
- `docs/sdd/lifecycle.md`
- `docs/sdd/decision-authority.md`
- `docs/sdd/roles.md`
- `docs/specs/_template.md`

Consulte também `docs/sdd/agents.yml` e `docs/sdd/adapters.md`
quando forem relevantes.

Esses documentos existentes são a fonte de verdade para o processo SDD.
Não crie um processo paralelo nem substitua regras já estabelecidas.

## 2. Analise o contexto

- Examine o código e os padrões existentes que sejam relevantes.
- Tome decisões de frontend como engenheiro frontend sênior.
- Tome decisões de backend como engenheiro backend sênior.
- Preserve os padrões visuais e arquiteturais consolidados.
- Registre decisões técnicas propostas e suas justificativas.
- Não presuma tecnologias ou arquitetura sem evidências.

## 3. Regras da especificação

- Não implemente código.
- Não invente requisitos de negócio ou políticas de segurança.
- Quando faltar uma decisão de negócio ou segurança, registre `TBD`
  e faça uma pergunta objetiva.
- Diferencie requisitos informados pelo usuário de propostas técnicas.
- Preserve a rastreabilidade da solicitação.

Preencha:

source_kind: human_prompt
source_reference: chat-YYYY-MM-DD-<slug>

Inclua a solicitação, o resultado esperado, o fora do escopo
e os critérios de aceitação conhecidos.

## 4. Status e ciclo de vida

Siga as regras de status definidas em `docs/sdd/lifecycle.md`
e as autoridades de decisão definidas em
`docs/sdd/decision-authority.md`.

Não invente transições de status.

## 5. Saída

Use `docs/specs/_template.md` como template obrigatório.

Salve a especificação em `docs/specs/`, respeitando o padrão
de nomenclatura e versionamento já utilizado pelo projeto.

Ao terminar, informe o arquivo criado, as decisões técnicas
propostas e as perguntas pendentes.

## Solicitação

$ARGUMENTS
