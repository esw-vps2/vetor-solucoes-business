# Guia de Desenvolvimento Orientado por Especificações

A pessoa humana descreve a funcionalidade. O agente cria a especificação,
implementa-a e registra as evidências. A pessoa humana é a única que aprova
o que entra no produto.

O agente atua como engenheiro sênior: pergunta o que for de negócio ou de
segurança e decide sozinho o design e o como técnico. Mudanças visuais
seguem o padrão que o sistema já consolidou; o agente não pergunta para
aplicar ou estender esse padrão.

```text
você descreve -> o agente cria a especificação -> você aprova -> o agente implementa -> você confirma
```

Você **não** precisa copiar `docs/specs/_template.md`, preencher seções ou
executar `npm run sdd:validate`. Esse é o trabalho do agente.

A implementação começa somente depois que uma pessoa humana identificada define
`status: approved`.

## Quem faz o quê

| Você (pessoa humana)                              | Agente                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| Escrever o prompt da funcionalidade               | Criar `docs/specs/<file>.md` a partir do template                   |
| Responder às perguntas de negócio e de segurança  | Atualizar o rascunho e deixar `TBD` só para negócio e segurança     |
| Ler a especificação e aprovar ou pedir alterações | Decidir design e como técnico e registrá-los na especificação       |
| Pedir a implementação após `approved`             | Implementar somente o escopo aprovado                               |
| Confirmar que todo `AC-###` foi atendido          | Registrar testes e evidências                                       |

O agente não inventa requisitos de negócio nem política de segurança. Se o
prompt não decidir um desses itens, a especificação permanece `TBD` e o
agente pergunta.

O agente decide sozinho design, layout, tokens, composição visual e as
questões técnicas (módulo, API interna, persistência, testes, padrões da
stack). Ele registra essas escolhas na especificação e promove o que se
tornar padrão compartilhado em `docs/design.md`. Em caso de dúvida entre
negócio/segurança e o restante, ele pergunta.

## Entrada

Este projeto aceita solicitações de funcionalidades somente por meio de um
prompt humano em uma conversa com o agente.

| Decisão             | Valor                                |
| ------------------- | ------------------------------------ |
| Canal de entrada    | `human_prompt`                       |
| Aprovadores humanos | A pessoa humana que enviou o prompt  |
| Rastreamento        | Conversa com o agente                |
| `source_reference`  | `chat-YYYY-MM-DD-<slug>`             |
| Automação           | O agente só cria ou atualiza `draft` |

Não crie especificações a partir de GitHub Issues, cards do Kanban ou outros
sistemas.

## Como usar no dia a dia

Envie uma mensagem por etapa. Não peça para “especificar e implementar” no
mesmo prompt.

### 1. Você descreve a funcionalidade

```text
Crie uma especificação preliminar para esta funcionalidade. Não implemente código.
Não aprove a especificação. Não invente requisitos de negócio nem política de
segurança que eu não tenha dito. Se faltar uma decisão de negócio ou de
segurança, deixe TBD e pergunte.
Quando for dado o goal, o status pode ser alterado automaticamente para approved

Decida design como de engenheiro frontend sênior e as de backend como engenheiro backend sênior, registre-as na
especificação e mantenha o padrão visual consolidado.

source_kind: human_prompt
source_reference: chat-YYYY-MM-DD-<slug>

Solicitação:
<o que a pessoa usuária precisa e o resultado esperado>

Fora do escopo:
<o que não está incluído>

Critérios de aceitação conhecidos:
<o que deve ser verdade ao final>
```

O agente copia o template, cria o arquivo em `docs/specs/` e retorna o caminho
da especificação com quaisquer perguntas de negócio ou de segurança.

### 2. Você responde às perguntas

O agente atualiza a mesma especificação. Quando não restar nenhum `TBD` de
negócio ou de segurança, ele define `status: in_review` e valida a estrutura.

Você ainda não pediu código.

### 3. Você aprova

Leia a especificação. Se estiver correta:

```text
Eu aprovo docs/specs/<file>.md. Defina status como approved.
Ainda não implemente.
```

Se algo estiver faltando, peça a correção. Somente uma pessoa humana altera
`in_review` para `approved`.

### 4. Você pede a implementação

```text
Implemente somente docs/specs/<file>.md com status: approved.
Não amplie o escopo de negócio nem altere política de segurança. Se surgir
um novo requisito de produto ou de segurança, pare e devolva a especificação
para in_review. Design e decisões técnicas restantes ficam com o agente.
```

O agente cria a branch, escreve o código e os testes e registra as evidências.
Ao terminar, a especificação muda para `implemented`.

### 5. Você confirma a entrega

Verifique se todo `AC-###` foi atendido. Se estiver tudo correto:

```text
Eu validei docs/specs/<file>.md. Defina status como validated.
```

A funcionalidade está completa.

## Status

| Status        | Significado                              | Código?         |
| ------------- | ---------------------------------------- | --------------- |
| `draft`       | O agente está escrevendo a especificação | Não             |
| `in_review`   | Você precisa revisar a especificação     | Não             |
| `approved`    | Você aprovou a especificação             | Sim             |
| `implemented` | O agente entregou com evidências         | Sem novo escopo |
| `validated`   | Você confirmou todo `AC-###`             | Completo        |
| `superseded`  | Outra especificação substituiu esta      | Não             |

## Regras

- Você descreve o negócio e a segurança e aprova. O agente pergunta o
  negócio e a segurança em aberto e decide o design e o como técnico.
- Não peça a implementação antes de `approved`.
- Não trate `docs/product.md`, `docs/design.md`, `docs/api.md` ou
  `docs/database.md` como a especificação da funcionalidade.
- Se surgir um novo requisito de negócio ou de segurança durante a
  implementação, devolva a especificação para revisão. Não resolva isso
  somente no código.
- Se faltar apenas o design ou o como técnico, o agente decide, registra,
  consolida o padrão visual quando couber e continua.

## Contratos do processo

O agente segue estes arquivos. Você não precisa editá-los para usar o fluxo.

- Ciclo de vida: `docs/sdd/lifecycle.md`
- Papéis: `docs/sdd/roles.md`
- Autoridade de decisão: `docs/sdd/decision-authority.md`
- Adaptador: `docs/sdd/adapters.md`
- Configuração: `docs/sdd/configuration.md`
- Template usado pelo agente: `docs/specs/_template.md`
