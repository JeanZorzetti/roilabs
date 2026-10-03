// 020 — contrato de parceria da cadeira, emitido de uma proposta de cadeira (spec 019).
//
// Mesmo desenho do contrato da Vértice (lib/vertice/contract.ts): o `doc` é congelado no save e a
// página pública /c/<slug> só o renderiza. Anuidade, comissão, condições e escopo saem da proposta
// relida no servidor — nunca do formulário. Do operador só vêm as partes, o início, o foro, o
// pagamento e as condições específicas. A estimativa e o ritmo da proposta NÃO entram: projeção não
// é obrigação (FR-011).
//
// ⚠ O texto das cláusulas é minuta (spec 020, Assumptions): o dono decide se passa pelo advogado
// antes do primeiro contrato real.

import { createHash } from 'node:crypto';
import type { PropostaCadeiraDoc } from './precos-cadeira';
import { brDate } from './vertice/delivery';
import {
  PLACEHOLDER,
  addMonths,
  splitLines,
  type ContractClause,
  type ContractParty,
} from './vertice/contract';

export const VIGENCIA_MESES = 12;

export type ContratoCadeiraInput = {
  /** Vazio = "Contrato de parceria — cadeira de <nicho>". */
  titulo: string;
  contratante: ContractParty;
  contratada: ContractParty;
  /** `YYYY-MM-DD`. Vazio = a vigência conta do aceite. */
  inicio: string;
  /** Comarca/UF. Ignorado quando a contratante é pessoa física: vale o domicílio dela. */
  foro: string;
  /** Formas de pagamento da entrada anual, uma por linha. */
  pagamento: string;
  /** Condições combinadas só com este parceiro, uma por linha. */
  extra: string;
  /** Subdomínios do site da cadeira, um por linha; entram no Objeto logo depois de "site". Ausente em contratos
   *  anteriores a este campo. */
  subdominios?: string;
  /** Domínio já escolhido, uma linha por regra: troca, nas condições, a linha genérica do valor inicial para .com.br.
   *  Ausente em contratos anteriores a este campo. */
  dominio?: string;
  /** Área do nicho que a exclusividade cobre (ex.: "estética e ginecologia, exceto obstetrícia"). Vazio = o nicho
   *  inteiro. Ausente em contratos anteriores a este campo. */
  exclusividade?: string;
};

export type ContratoCadeiraDoc = {
  versao: 1;
  titulo: string;
  criadoEm: string;
  contratante: ContractParty;
  contratada: ContractParty;
  pessoaFisica: boolean;
  proposta: {
    slug: string;
    paraQuem: string;
    nicho: string;
    modelo: PropostaCadeiraDoc['nicho']['modelo'];
    criadaEm: string;
  };
  entrada: PropostaCadeiraDoc['entrada'];
  entradaTotal: number;
  comissao: PropostaCadeiraDoc['comissao'];
  /** Anexo I. null = proposta anterior a 29/09/2026, sem entregáveis: vira pendência. */
  anexo: {
    cadeira: string;
    fases: { nome: string; prazo: string; itens: string[] }[];
    precisamos: string[];
    naoInclui: string[];
    extras: string[];
  } | null;
  clausulas: ContractClause[];
  /** Não vazia = a página não mostra o aceite e a action o recusa. */
  pendencias: string[];
};

const digitos = (s: string) => s.replace(/\D/g, '');
const ehPessoaFisica = (p: ContractParty) => digitos(p.document).length === 11;
const ou = (s: string) => s.trim() || PLACEHOLDER;

export const tituloPadrao = (nicho: string) => `Contrato de parceria — cadeira de ${nicho}`;

/** O que trava o aceite. Nome humano: aparece no admin. */
export function pendenciasDoContrato(input: ContratoCadeiraInput, temAnexo: boolean): string[] {
  const falta: string[] = [];
  const papeis = [
    ['contratante', input.contratante],
    ['contratada', input.contratada],
  ] as const;
  for (const [papel, p] of papeis) {
    if (!p.name.trim()) falta.push(`Nome (${papel})`);
    if (!p.document.trim()) falta.push(`CNPJ ou CPF (${papel})`);
    if (!p.address.trim()) falta.push(`Endereço (${papel})`);
    if (!ehPessoaFisica(p) && !p.representative.trim()) falta.push(`Representante (${papel})`);
  }
  if (!ehPessoaFisica(input.contratante) && !input.foro.trim()) falta.push('Foro');
  if (!temAnexo) falta.push('Entregáveis da cadeira (proposta antiga, sem escopo: guarde uma proposta nova)');

  // Marcador digitado à mão ("[percentual]") também trava, como no contrato da Vértice.
  const livres = [input.titulo, input.pagamento, input.extra, input.subdominios ?? '', input.dominio ?? '', input.exclusividade ?? '', input.foro, ...papeis.flatMap(([, p]) => Object.values(p))];
  for (const texto of livres) {
    for (const m of String(texto).match(/\[[^\]]+\]/g) ?? []) falta.push(`Texto com ${m}`);
  }
  return [...new Set(falta)];
}

// A proposta congela a regra genérica do domínio (REGRAS_DOMINIO e a nota do item de entrada). Com o domínio já
// escolhido, o contrato troca só essas duas frases; o valor da entrada continua o da proposta.
const ehRegraDominioGenerica = (c: string) => c.includes('é o valor inicial, para .com.br');
const semPontoFinal = (s: string) => s.replace(/\.+$/, '');

/** O que conta como venda originada, por modelo de cobrança do nicho (FR-010). */
function vendaOriginada(modelo: ContratoCadeiraDoc['proposta']['modelo']): string {
  if (modelo === 'mensalidade') {
    return 'Venda originada pela cadeira é a assinatura contratada por cliente que chegou pelo site da cadeira ou foi atendido pela equipe de vendas da CONTRATADA. A comissão incide sobre cada mensalidade paga dessa assinatura e sobre a taxa de implantação cobrada dela.';
  }
  if (modelo === 'consulta') {
    return 'Venda originada pela cadeira é a consulta agendada pelo site da cadeira ou pela equipe de atendimento da CONTRATADA e comparecida pelo paciente.';
  }
  return 'Venda originada pela cadeira é o pedido pago na loja que a CONTRATADA opera para a CONTRATANTE, ou fechado pela equipe de vendas da CONTRATADA com cliente que chegou pela cadeira. Recompra é o novo pedido pago de um cliente cuja 1ª compra foi originada pela cadeira.';
}

export function montarContratoCadeira(
  input: ContratoCadeiraInput,
  proposta: { slug: string; doc: PropostaCadeiraDoc },
  agora: Date,
): ContratoCadeiraDoc {
  const p = proposta.doc;
  const pf = ehPessoaFisica(input.contratante);
  const inicio = brDate(input.inicio);
  const pagamento = splitLines(input.pagamento);
  const extra = splitLines(input.extra);
  const subdominios = splitLines(input.subdominios ?? '');
  const dominio = splitLines(input.dominio ?? '').map(semPontoFinal);
  const areaExclusiva = semPontoFinal((input.exclusividade ?? '').trim());
  const entrada = dominio.length > 0
    ? p.entrada.map((l) => ({ ...l, nota: l.nota.replace('Valor inicial, para .com.br. ', 'Valor do 1º ano. ') }))
    : p.entrada;
  const condicoes = dominio.length === 0
    ? p.condicoes
    : p.condicoes.some(ehRegraDominioGenerica)
      ? p.condicoes.flatMap((c) => (ehRegraDominioGenerica(c) ? dominio : [c]))
      : [...p.condicoes, ...dominio];
  const e = p.entregaveis;
  const anexo: ContratoCadeiraDoc['anexo'] = e
    ? { cadeira: e.cadeira, fases: e.fases, precisamos: e.precisamos, naoInclui: e.naoInclui, extras: e.extras ?? [] }
    : null;

  const clausulas: (ContractClause | false)[] = [
    {
      id: 'objeto',
      heading: 'Objeto',
      body: [
        `A CONTRATADA monta e opera, para a CONTRATANTE, a cadeira de ${p.nicho.nome}${anexo ? ` (${anexo.cadeira})` : ''}: o canal de venda online do nicho, com site${subdominios.length > 0 ? ' e os subdomínios listados abaixo' : ''}, tecnologia, tráfego e equipe de vendas bancados pela CONTRATADA, como descrito no Anexo I.`,
        ...(subdominios.length > 0 ? [subdominios] : []),
        `O Anexo I reproduz os entregáveis da proposta feita para ${p.paraQuem} em ${brDate(p.criadaEm.slice(0, 10))}. O que não está no Anexo I não está contratado.`,
      ],
    },
    {
      id: 'exclusividade',
      heading: 'Exclusividade da cadeira',
      body: [
        areaExclusiva
          ? `Enquanto este contrato vigorar, a CONTRATADA não opera cadeira do nicho ${p.nicho.nome} na área de ${areaExclusiva} para outra empresa, em todo o Brasil.`
          : `Enquanto este contrato vigorar, a CONTRATADA não opera cadeira do nicho ${p.nicho.nome} para outra empresa, em todo o Brasil.`,
        ...(areaExclusiva ? ['Fora dessa área, não há exclusividade.'] : []),
      ],
    },
    {
      id: 'remuneracao',
      heading: 'Remuneração',
      body: [
        'A CONTRATANTE paga à CONTRATADA uma entrada anual, na assinatura deste contrato e a cada renovação:',
        entrada.map((l) => `${l.item}: ${l.valor}. ${l.nota}.`),
        ...(pagamento.length > 0 ? ['Formas de pagamento da entrada:', pagamento] : []),
        `E uma comissão sobre as vendas originadas pela cadeira: ${p.comissao.resumo}.`,
        ...(p.comissao.regras.length > 0 ? [p.comissao.regras] : []),
        p.comissao.quando,
        'Atraso de pagamento gera multa de 2%, juros de 1% ao mês, proporcionais aos dias, e correção pelo IPCA. Com mais de 15 dias de atraso, a CONTRATADA pode suspender a operação da cadeira, depois de aviso por escrito com 10 dias de prazo. A suspensão não estende a vigência.',
      ],
    },
    {
      id: 'venda-originada',
      heading: 'Venda originada e fonte do número',
      body: [
        vendaOriginada(p.nicho.modelo),
        'O número sai do registro de vendas da CONTRATADA. O que só a CONTRATANTE sabe, como pagamento recebido fora da loja da cadeira, cancelamento, devolução ou comparecimento, ela informa por escrito até o dia 02 de cada mês. Sem essa informação, vale o registro da CONTRATADA.',
      ],
    },
    {
      id: 'relatorio',
      heading: 'Relatório e contestação',
      body: [
        'Até o dia 02 de cada mês, a CONTRATADA envia o relatório venda por venda do mês anterior, com a comissão de cada uma.',
        'A CONTRATANTE tem 5 dias úteis, contados do recebimento, para contestar por escrito qualquer venda do relatório. A venda contestada sai da cobrança do dia 05 até as partes resolverem. O resto é cobrado normalmente.',
      ],
    },
    {
      id: 'condicoes',
      heading: 'Condições comerciais da proposta',
      body: ['Valem também as condições da proposta, que este contrato incorpora:', condicoes.map((c) => `${c}.`)],
    },
    {
      id: 'resultado',
      heading: 'Estimativa não é promessa',
      body: [
        'A estimativa que a proposta trouxe foi uma projeção no ritmo informado pela CONTRATANTE. A CONTRATADA não promete volume de vendas, posição em buscador nem prazo de resultado. O valor devido é sempre a regra da comissão aplicada às vendas reais.',
      ],
    },
    {
      id: 'obrigacoes-contratada',
      heading: 'Obrigações da CONTRATADA',
      body: [
        [
          'Montar e operar a cadeira como descrito no Anexo I, nos prazos de cada fase.',
          'Registrar as vendas originadas e enviar o relatório mensal.',
          'Atender a CONTRATANTE pelo canal oficial, WhatsApp e e-mail, de segunda a sexta, das 9h às 18h, exceto feriados nacionais.',
        ],
      ],
    },
    {
      id: 'obrigacoes-contratante',
      heading: 'Obrigações da CONTRATANTE',
      body: [
        [
          ...(anexo?.precisamos.length ? ['Fornecer o que o Anexo I lista em “O que precisamos de você”.'] : []),
          'Vender e entregar o que a cadeira vender. A CONTRATANTE é a vendedora perante o cliente final: emite a nota fiscal e responde por produto ou serviço, entrega, troca, garantia e atendimento pós-venda, inclusive pelo Código de Defesa do Consumidor.',
          'Manter a CONTRATADA informada de preço, estoque, prazo e condições de venda.',
          'Responder pela veracidade e pelos direitos do material que fornece, como textos, imagens e marcas, e pelas normas do seu setor.',
          'Pagar nos prazos combinados.',
        ],
        'Os prazos do Anexo I só correm depois que a CONTRATADA recebe o que precisa da CONTRATANTE. Atraso da CONTRATANTE empurra o prazo pelo mesmo número de dias.',
      ],
    },
    {
      id: 'vigencia',
      heading: 'Vigência e renovação',
      body: [
        inicio
          ? `Este contrato vale por ${VIGENCIA_MESES} meses, de ${inicio} a ${brDate(addMonths(input.inicio, VIGENCIA_MESES))}.`
          : `Este contrato vale por ${VIGENCIA_MESES} meses, contados da data do aceite eletrônico.`,
        `Ao fim do prazo, renova-se por períodos iguais de ${VIGENCIA_MESES} meses, salvo aviso de qualquer parte com 30 dias de antecedência. Na renovação, a anuidade é reajustada pelo IPCA acumulado nos 12 meses anteriores, e a comissão segue a deste contrato, salvo novo acordo por escrito.`,
      ],
    },
    {
      id: 'saida',
      heading: 'Saída antes do prazo',
      body: [
        'Qualquer parte pode encerrar este contrato antes do fim, sem multa, avisando por escrito com 30 dias de antecedência.',
        'A entrada anual já paga não é devolvida: ela cobre a montagem do site, da loja e da operação, e o domínio já comprado.',
        'As comissões das vendas originadas até o último dia do contrato continuam devidas, e a recompra segue as condições comerciais da proposta.',
        'Qualquer parte pode encerrar o contrato de imediato se a outra descumprir uma obrigação e não corrigir em 10 dias úteis após aviso por escrito.',
      ],
    },
    {
      id: 'fim',
      heading: 'Domínio, site e dados no fim do contrato',
      body: [
        'No fim do contrato, por qualquer motivo, a CONTRATADA transfere para a CONTRATANTE, em até 10 dias úteis, o domínio registrado para a cadeira.',
        'O site, a loja, o código e a plataforma continuam da CONTRATADA, que os tira do ar no domínio transferido.',
        'No mesmo prazo, a CONTRATADA entrega em arquivo os dados dos clientes da CONTRATANTE e o conteúdo que ela forneceu, como textos, fotos e marca. Depois da entrega, a CONTRATADA apaga os dados pessoais desses clientes em até 90 dias, salvo o que a lei obrigar a guardar.',
      ],
    },
    {
      id: 'dados',
      heading: 'Confidencialidade e dados pessoais',
      body: [
        'Cada parte mantém em sigilo as informações não públicas da outra, durante o contrato e por 2 anos depois dele.',
        'Ao atender os clientes da CONTRATANTE, a CONTRATADA trata dados pessoais em nome dela, como operadora, nos termos da Lei 13.709/2018 (LGPD): usa os dados só para operar a cadeira e apurar a comissão, segue as instruções da CONTRATANTE e comunica incidente de segurança em até 2 dias úteis da ciência. A CONTRATANTE, como controladora, responde pela base legal do tratamento e pelo atendimento aos titulares, com o apoio da CONTRATADA.',
        ...(p.nicho.modelo === 'consulta'
          ? ['A CONTRATADA registra só o necessário para o agendamento, como nome, contato e horário. Informação clínica do paciente não passa por ela.']
          : []),
      ],
    },
    {
      id: 'propriedade',
      heading: 'Propriedade intelectual',
      body: [
        'A plataforma, o código, o site e a loja da cadeira e os métodos de venda são da CONTRATADA.',
        'A marca, os produtos, as fotos e os textos que a CONTRATANTE fornece continuam dela, que autoriza o uso deles na cadeira enquanto o contrato vigorar.',
        'A CONTRATADA pode citar a CONTRATANTE como parceira, sem expor informação confidencial, salvo pedido contrário por escrito.',
      ],
    },
    // Consumidor (pessoa física): limitar responsabilidade é nulo (CDC arts. 25 e 51, I). A cláusula não sai.
    !pf && {
      id: 'responsabilidade',
      heading: 'Responsabilidade',
      body: [
        'A responsabilidade de cada parte por perdas ligadas a este contrato se limita ao que a CONTRATANTE pagou à CONTRATADA nos 12 meses anteriores ao fato, exceto em caso de dolo.',
        'Nenhuma parte responde por lucro cessante, nem por falha ou decisão de terceiros, como hospedagem, meios de pagamento, buscadores e redes sociais.',
      ],
    },
    extra.length > 0 && { id: 'especificas', heading: 'Condições específicas', body: [extra] },
    {
      id: 'gerais',
      heading: 'Disposições gerais',
      body: [
        'Este contrato não cria vínculo de emprego, sociedade, franquia nem representação comercial entre as partes. Cada parte responde pelos próprios tributos e pela própria equipe.',
        'Avisos valem por escrito no canal oficial: WhatsApp ou e-mail das partes.',
        'Nenhuma parte cede este contrato sem a concordância da outra por escrito. Nenhuma parte responde por atraso causado por caso fortuito ou força maior enquanto ele durar.',
        'Tolerar um descumprimento não altera o contrato. Alteração só vale por escrito, aceita pelas duas partes. Em conflito entre a proposta e este contrato, vale o contrato.',
        'As partes reconhecem como válido o aceite eletrônico deste contrato, registrado com nome, CPF, data, hora, endereço IP, navegador e a impressão digital do texto aceito, nos termos do art. 10, § 2º, da Medida Provisória 2.200-2/2001.',
      ],
    },
    {
      id: 'foro',
      heading: 'Foro',
      body: [
        pf
          ? 'Fica eleito o foro do domicílio da CONTRATANTE para resolver questões deste contrato.'
          : `Fica eleito o foro da comarca de ${ou(input.foro)} para resolver questões deste contrato.`,
      ],
    },
  ];

  return {
    versao: 1,
    titulo: input.titulo.trim() || tituloPadrao(p.nicho.nome),
    criadoEm: agora.toISOString(),
    contratante: input.contratante,
    contratada: input.contratada,
    pessoaFisica: pf,
    proposta: { slug: proposta.slug, paraQuem: p.paraQuem, nicho: p.nicho.nome, modelo: p.nicho.modelo, criadaEm: p.criadaEm },
    entrada,
    entradaTotal: p.entradaTotal,
    comissao: p.comissao,
    anexo,
    clausulas: clausulas.filter((c): c is ContractClause => Boolean(c)),
    pendencias: pendenciasDoContrato(input, anexo !== null),
  };
}

// O jsonb reordena as chaves: o hash usa as chaves em ordem, então o doc relido do banco dá o mesmo
// hash que o renderizado. Chave com undefined sai (o jsonb também a descarta).
function canonico(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const chaves = Object.keys(o).filter((k) => o[k] !== undefined).sort();
    return `{${chaves.map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}

/** Impressão digital do texto aceito (SHA-256 hex). */
export const hashDoc = (doc: ContratoCadeiraDoc) => createHash('sha256').update(canonico(doc)).digest('hex');

/** CPF com os dois dígitos verificadores certos. Sequência repetida (111…) não vale. */
export function cpfValido(s: string): boolean {
  const d = digitos(s);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}
