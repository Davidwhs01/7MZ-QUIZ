---
description: Como importar e configurar um novo artista no 7MZ-QUIZ
---

Este documento é um guia para a **Inteligência Artificial** seguir ao receber a tarefa de importar um novo artista/canal. Siga essas etapas em ordem para garantir que a inserção de dados e tipagens não quebre o sistema da aplicação.

### Passo 1: Solicitar informações ao Usuário

Antes de modificar qualquer arquivo ou rodar comandos, peça explicitamente ao usuário os seguintes dados:
1. **Handle ou URL do canal do YouTube** (Ex: `@NomeDoCanal` ou `https://youtube.com/...`).
2. **Nome de Exibição** (Ex: "Apenas Um Show").
3. **Identificador do Artista (Artist ID)** (Geralmente em caixa alta, ex: "APENAS_UM_SHOW").
4. **Categoria da Música (SongCategory)** (Opcional, se for o mesmo que o Artista).
5. **Seção do App (AppSection)** (Se o artista entrará no estilo "geek" ou "pop").

### Passo 2: Atualizar Tipagens de TypeScript (quiz-app/src/data/songs.ts)

Você deve atualizar as restrições globais de tipagem ANTES de injetar o artista. Use o utilitário `view_file` e `replace_file_content` na raiz de `quiz-app/src/data/songs.ts`:
1. Adicione a nova Categoria a `export type SongCategory` (se for uma nova).
2. Adicione o novo Artista a `export type Artist`.
3. Verifique a função `export function getSongSection()`. Caso haja condicionais definindo em qual `AppSection` (`geek` ou `pop`) o artista se encaixa, adeque a lógica (por ex: `return ['MELANIE', 'NOVO_ARTISTA'].includes(song.artist) ? 'pop' : 'geek';`)

### Passo 3: Scraping e Injeção Automática (manage_channels.js)

Para iniciar o robô que faz web scraping no YouTube e mescla os dados automaticamente, use a ferramenta `run_command`.

// turbo
```bash
node manage_channels.js add <HANDLE_INFORMADO> --name "<NOME_EXIBICAO>" --artist "<ARTISTA_INFORMADO>" --category "<CATEGORIA_INFORMADA>"
```

*Nota para a IA:* Após o script rodar e alterar `songs.ts`, cheque o output do terminal para ver se vídeos foram processados com sucesso. O script vai atualizar sozinho os arquivos `channels.json` e `songs.ts`.

### Passo 4: CORREÇÃO OBRIGATÓRIA - Verificar Posição das Músicas

**IMPORTANTE - ERRO COMUM:** O script `manage_channels.js` as vezes insere as músicas no lugar errado (dentro de funções como `searchSongs` ao invés do array principal `songs`). Você DEVE verificar e corrigir isso antes de continuar.

**Como verificar:**
1. Abra `quiz-app/src/data/songs.ts`
2. Procure pelo final do array `songs` (geralmente após a última música do último artista, antes de um `];`)
3. As músicas devem estar dentro de `export const songs: Song[] = [` ... `];`
4. As músicas NÃO devem estar dentro de nenhuma função

**Como corrigir se estiver errado:**
1. Use `grep_search` para encontrar onde as músicas foram inseridas erroneamente
2. Remova as músicas do local errado
3. Adicione as músicas no local correto: após a última música do array, antes do `];` final
4. Exemplo de formato correto:
```typescript
export const songs: Song[] = [
  // ... outras músicas ...
  
  // --- NOVO ARTISTA UPLOADS ---
  { id: "artista-xxx", title: "Musica 1", youtubeId: "xxx", duration: 0, category: 'CATEGORIA', artist: 'ARTISTA' },
  { id: "artista-yyy", title: "Musica 2", youtubeId: "yyy", duration: 0, category: 'CATEGORIA', artist: 'ARTISTA' },
];
```

### Passo 5: Atualizar Interface de Usuário e Componentes

Muitas vezes telas como `ChannelSelector.tsx` ou arquivos que renderizam temas visuais (`globals.css`) e layouts dependem de nomes hardcoded. Usando a ferramenta `grep_search`:
1. Faça uma varredura pelas constantes de canais usando `grep_search` pela chave de um artista já existente (Ex: `"RODRIGOZIN"` ou `"MELANIE"`).
2. Verifique o arquivo `quiz-app/src/context/ChannelContext.tsx` e `quiz-app/src/components/home/ChannelSelector.tsx` se há listas pré-estabelecidas de canais lá dentro e atualize para incluir o novo artista.
3. Se existir CSS específico por artista/canal, atualize os estilos de paleta correspondentes.

### Passo 6: Atualizar menus mobile (BottomDrawer, ArtistMenu, etc)

Se o artista for GEEK, verifique se deve aparecer nos menus mobile:
1. `ArtistMenu.tsx` - contém arrays `GEEK_ARTISTS` e `POP_ARTISTS`
2. `BottomDrawer.tsx` - contém toggle de seção GEEK/POP
3. Adicione o novo artista nas listas apropriadas se necessário

### Passo 7: Validação Final

Antes de finalizar, rode os comandos de validação:

```bash
cd quiz-app && npm run build
cd quiz-app && npm run lint
```

Se o build falhar com erros de tipo em `songs.ts`, provavelmente as músicas estão no lugar errado (dentro de função). Retorne ao Passo 4.

### Checklist de Importação

- [ ] Tipos atualizados em songs.ts (SongCategory, Artist, getSongSection)
- [ ] Músicas adicionadas no ARRAY principal (não em funções!)
- [ ] build passando
- [ ] lint passando (alguns warnings são aceitáveis)
- [ ] Artista adicionado em ChannelSelector.tsx (se aplicável)
- [ ] Artista adicionado em ArtistMenu.tsx (se aplicável)
- [ ] Tema CSS adicionado em globals.css (se aplicável)

### Passo 8: Relatar Finalização com Confirmação e Validação

1. Demonstre os arquivos que foram adicionados e mostre `render_diffs()` das partes alteradas em `.ts` e `.tsx`.
2. Pergunte ao usuário se você deve iniciar o servidor de desenvolvimento para testes (`npm run dev`) para confirmar que não existem erros no React Strict Mode.