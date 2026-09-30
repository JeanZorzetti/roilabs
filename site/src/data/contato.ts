// Contatos da ROI Labs num lugar só (home e rodapé).
// Canal direto B2B (Gate 3): fornecedor high-ticket quer conversa, não formulário.
// PUBLIC_WHATSAPP sobrepõe o número no build; o fallback vale sem env na EasyPanel.
export const WHATSAPP: string = import.meta.env.PUBLIC_WHATSAPP ?? '5562993265713';
export const EMAIL = 'roilabs.ia@gmail.com';

// Horário de atendimento (Maria, 30/09/2026). Rodapé, textos que prometem retorno, JSON-LD e
// llms.txt leem daqui: mudar o horário é mudar só este bloco.
export const HORARIO_DIAS_UTEIS = 'Segunda a sexta, das 8h às 19h';
export const HORARIO_SABADO = 'Sábado, das 8h às 12h';
/** Para o meio de uma frase: "Atendemos de segunda a sexta, das 8h às 19h, e aos sábados, das 8h às 12h." */
export const HORARIO_FRASE = 'de segunda a sexta, das 8h às 19h, e aos sábados, das 8h às 12h';

// Perfis da ROI Labs: ícones do rodapé e `sameAs` do JSON-LD (layouts/Base.astro) leem daqui.
export const INSTAGRAM = 'https://www.instagram.com/roilabs.curadoria/';
export const LINKEDIN = 'https://www.linkedin.com/company/roi-labs-curadoria/';
export const YOUTUBE = 'https://www.youtube.com/@ROI360podcast';

export const whatsLink = (texto = 'Quero saber se a cadeira do meu nicho está livre') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

/** 5562993265713 → (62) 99326-5713 */
export const whatsLegivel = () => `(${WHATSAPP.slice(2, 4)}) ${WHATSAPP.slice(4, 9)}-${WHATSAPP.slice(9)}`;
