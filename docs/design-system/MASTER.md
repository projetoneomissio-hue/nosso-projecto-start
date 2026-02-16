# 🏛️ NeoMissio: MASTER Design System

Este documento é a **Fonte Única da Verdade** para a identidade visual do NeoMissio. Ele segue as diretrizes de inteligência de design do `UI/UX Pro Max Skill`.

---

## 🎨 Paleta de Cores (Educação + Fintech)

Adotamos uma abordagem híbrida que transmite confiança (Fintech) e engajamento (Educação).

| Token | Nome Oficial | Finalidade | Hex | Mood |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | **Atividade** | Ação / Destaque | `#D40055` | Energia e Movimento (Magenta) |
| `secondary` | **Conversa** | Elementos Secundários | `#FFC20E` | Troca e Comunicação (Amarelo) |
| `accent` | **Escuta** | Detalhes / Apoio | `#00B0D9` | Empatia e Acolhimento (Ciano) |
| `info` | **Quietude** | Informação / Institucional | `#1E3A8A` | Confiança e Estabilidade (Azul Profundo) |
| `highlight` | **Conhecimento** | Áreas de Estudo | `#6656A8` | Aprendizado e Evolução (Roxo) |
| `text-main` | **Seriedade** | Textos Principais | `#363636` | Profissionalismo (Grafite) |
| `success` | -- | Sucesso / Financeiro | `#10B981` | Mantido do sistema anterior |
| `background` | -- | Fundo Global | `#F8FAFC` | Ice Blue (Suave) |

---

## ✍️ Tipografia

| Tipo | Fonte | Mood |
| :--- | :--- | :--- |
| **Headings** | `Komet` (ou `Plus Jakarta Sans` como fallback) | Jovial, descontraída e moderna. |
| **Body** | `Poppins` (ou `Inter` como fallback) | Geométrica, limpa e legível. |

---

## ✨ Micro-interações & Efeitos

Os efeitos seguem o princípio de **"Premium Softness"**.

1.  **Transições Sugeridas**:
    *   Hover em Botões: `transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);`
    *   Abertura de Modais: `duration-300` com fade e scale.
2.  **Sombras (Depth)**:
    *   Cards (Resting): `shadow-sm` (subtil).
    *   Cards (Hover): `shadow-md` + transform `translate-y(-2px)`.
3.  **Bordas**:
    *   Raio padrão: `rounded-xl` (12px) para uma aparência moderna e suave.

---

## 🚫 Anti-padrões a Evitar

*   **NÃO** usar cores neon vibrantes no Financeiro.
*   **NÃO** usar emojis como ícones primários (usar Lucide).
*   **NÃO** usar transições instantâneas (sempre adicionar delay/suavização).
*   **NÃO** usar texto cinza muito claro (manter contraste 4.5:1).

---

## 🛠️ Como Aplicar Overrides

Se uma página (ex: Dashboard Financeiro) precisar de um "Mood" diferente (ex: Dark Mode), crie um arquivo em `docs/design-system/pages/[page-name].md` detalhando apenas as divergências deste Master.
