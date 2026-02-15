# 🏛️ NeoMissio: MASTER Design System

Este documento é a **Fonte Única da Verdade** para a identidade visual do NeoMissio. Ele segue as diretrizes de inteligência de design do `UI/UX Pro Max Skill`.

---

## 🎨 Paleta de Cores (Educação + Fintech)

Adotamos uma abordagem híbrida que transmite confiança (Fintech) e engajamento (Educação).

| Token | Finalidade | Hex | Exemplo |
| :--- | :--- | :--- | :--- |
| `primary` | Marca / Navegação | `#4F46E5` | ![#4F46E5](https://via.placeholder.com/15/4F46E5?text=+) Indigo |
| `secondary` | Destaques / Badges | `#818CF8` | ![#818CF8](https://via.placeholder.com/15/818CF8?text=+) Soft Indigo |
| `accent` | CTAs / Ações | `#F97316` | ![#F97316](https://via.placeholder.com/15/F97316?text=+) Orange |
| `success` | Financeiro Positivo | `#10B981` | ![#10B981](https://via.placeholder.com/15/10B981?text=+) Emerald |
| `background` | Fundo Global | `#F8FAFC` | ![#F8FAFC](https://via.placeholder.com/15/F8FAFC?text=+) Slate 50 |
| `text-main` | Texto Principal | `#1E1B4B` | ![#1E1B4B](https://via.placeholder.com/15/101010?text=+) Dark Indigo |
| `border` | Divisores / Cards | `#E2E8F0` | ![#E2E8F0](https://via.placeholder.com/15/E2E8F0?text=+) Slate 200 |

---

## ✍️ Tipografia

| Tipo | Fonte | Mood |
| :--- | :--- | :--- |
| **Headings** | `Plus Jakarta Sans` | Moderno, amigável e profissional. |
| **Body** | `Inter` | Alta legibilidade em qualquer tamanho. |

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
