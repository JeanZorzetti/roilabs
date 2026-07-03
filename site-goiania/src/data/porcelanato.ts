export interface PorcelanatoPage {
  slug: string;
  termoAlvo: string;
  volume: number; // buscas/mês local estimadas
  tipo: string;
  ocasiao?: string;
  titulo: string;
  intro: string;
  comoEscolher: string[];
  atributos: {
    classeAd?: number; // classe de abrasão (AD) — vem do produto real, não inventada
    acabamento?: string;
    antiderrapante?: boolean;
    dimensao?: string;
    m2PorCaixa?: number;
    ambiente?: string;
  };
  faq: { q: string; a: string }[];
  relacionados?: string[]; // slugs
}

export const pages: PorcelanatoPage[] = [
  // ──────────────── Tipos genéricos ────────────────
  {
    slug: 'porcelanato-amadeirado',
    termoAlvo: 'porcelanato amadeirado',
    volume: 720,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'amadeirado',
    titulo: 'Porcelanato Amadeirado em Goiânia',
    intro:
      'O porcelanato amadeirado traz o calor da madeira com a durabilidade do grés porcelanato — sem manutenção de verniz, sem risco de cupim. Em Goiânia, é o revestimento mais pedido para salas integradas e varandas cobertas.',
    comoEscolher: [
      'Prefira formatos retangulares (20×120 cm ou 30×150 cm) para simular tábua corrida e ampliar o ambiente visualmente.',
      'Verifique o PEI: 3 ou 4 para áreas internas de tráfego moderado; 4 para varandas.',
      'Peça amostras com diferentes variações de textura — boa qualidade tem pelo menos 6 faces distintas para evitar repetição.',
      'Para pisos com rejunte aparente, combine a cor do rejunte com a veia da madeira para um resultado mais orgânico.',
      'Calcule com 10% de margem de corte sobre a área do ambiente.',
    ],
    atributos: {
      acabamento: 'Acetinado / Natural',
      antiderrapante: false,
      dimensao: '20×120 cm / 30×150 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala, quarto, varanda coberta',
    },
    faq: [
      {
        q: 'Porcelanato amadeirado escorrega?',
        a: 'O acabamento acetinado pode ser escorregadio em pisos. Para varandas ou áreas sujeitas a molhado, escolha versões com acabamento natural ou busque certificação antiderrapante (R10 ou superior).',
      },
      {
        q: 'Posso usar porcelanato amadeirado na área externa?',
        a: 'Sim, desde que o produto tenha PEI 4 ou 5, certificação antiderrapante R10+ e seja resistente à geada. Confirme na especificação técnica antes de comprar.',
      },
      {
        q: 'Qual a diferença entre amadeirado e laminado de madeira?',
        a: 'O porcelanato é cerâmico — não dilata com umidade, não descasca e não exige selamento. O laminado é mais macio ao toque mas muito mais sensível a água.',
      },
      {
        q: 'Como limpar porcelanato amadeirado?',
        a: 'Pano úmido com detergente neutro. Evite produtos com cera (escorrega) e hipoclorito concentrado (ataca o rejunte).',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado-area-externa',
      'porcelanato-amadeirado-cozinha',
      'porcelanato-amadeirado-varanda',
      'porcelanato-amadeirado-sala',
    ],
  },
  {
    slug: 'porcelanato-marmorizado',
    termoAlvo: 'porcelanato marmorizado',
    volume: 590,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'marmorizado',
    titulo: 'Porcelanato Marmorizado em Goiânia',
    intro:
      'O porcelanato marmorizado replica as veias do mármore natural com custo de manutenção zero — sem polimento anual, sem manchas de vinho. Em Goiânia, domina as salas de alto padrão e os banheiros de luxo.',
    comoEscolher: [
      'Opte por formatos grandes (90×90 cm ou 120×120 cm) para valorizar as veias contínuas e dar amplitude ao ambiente.',
      'Peça a "livro aberto" (book-match): duas placas espelhadas formam uma veia simétrica — recurso premium nos lavabos.',
      'Acabamento polido reflete luz e aumenta a sensação de espaço, mas exige mais cuidado com riscos.',
      'PEI 3 ou 4 para uso interno; evite polido em áreas molhadas sem tratamento antiderrapante.',
      'Combine com rodapé do mesmo material para acabamento sofisticado.',
    ],
    atributos: {
      acabamento: 'Polido',
      antiderrapante: false,
      dimensao: '90×90 cm / 120×120 cm',
      m2PorCaixa: 1.62,
      ambiente: 'Sala, banheiro, lavabo, hall',
    },
    faq: [
      {
        q: 'Porcelanato marmorizado é igual ao mármore natural?',
        a: 'Visual semelhante, mas o porcelanato é mais denso, não poroso e não precisa de impermeabilização. O mármore natural é mais exclusivo mas exige polimento periódico.',
      },
      {
        q: 'Como escolher a veia certa para minha sala?',
        a: 'Veias finas e claras (Bianco, Calacatta) combinam com ambientes minimalistas. Veias grossas e dramáticas (Nero, Grigio) criam impacto em espaços maiores.',
      },
      {
        q: 'Posso usar marmorizado no banheiro inteiro (parede e piso)?',
        a: 'Sim. Use polido nas paredes e acabamento natural/antiderrapante no piso para segurança.',
      },
    ],
    relacionados: [
      'porcelanato-marmorizado-sala',
      'porcelanato-marmorizado-banheiro',
      'porcelanato-marmorizado-fachada',
      'porcelanato-polido',
    ],
  },
  {
    slug: 'porcelanato-acetinado',
    termoAlvo: 'porcelanato acetinado',
    volume: 1600,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'acetinado',
    titulo: 'Porcelanato Acetinado em Goiânia',
    intro:
      'O porcelanato acetinado tem brilho suave — entre o fosco e o polido. Reflete luz sem ofuscar, é mais resistente a riscos que o polido e se adapta a ambientes residenciais e comerciais de médio tráfego.',
    comoEscolher: [
      'Ideal para salas e corredores: tem mais brilho que o porcelanato natural, sem o excesso do polido.',
      'Evite em áreas externas ou banheiros sem acabamento antiderrapante.',
      'Combine com rodapé e soleira do mesmo acabamento para homogeneidade visual.',
      'Manutenção fácil: pano úmido retira a maioria das marcas sem deixar rastros.',
    ],
    atributos: {
      acabamento: 'Acetinado',
      antiderrapante: false,
      dimensao: '60×60 cm / 80×80 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala, corredor, quarto',
    },
    faq: [
      {
        q: 'Acetinado ou polido: qual escolher?',
        a: 'Acetinado é mais resistente a riscos e menos escorregadio. Polido tem maior brilho e amplifica o ambiente, mas exige mais cuidado. Para uso residencial, acetinado é mais prático.',
      },
      {
        q: 'Porcelanato acetinado escorrega?',
        a: 'Menos que o polido, mas ainda assim não é recomendado para áreas molhadas sem antiderrapante.',
      },
    ],
    relacionados: [
      'porcelanato-acetinado-banheiro',
      'porcelanato-polido',
      'porcelanato-marmorizado',
      'piso-porcelanato',
    ],
  },
  {
    slug: 'porcelanato-polido',
    termoAlvo: 'porcelanato polido',
    volume: 590,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'polido',
    titulo: 'Porcelanato Polido em Goiânia',
    intro:
      'O porcelanato polido oferece o máximo de brilho e reflexo — transformando ambientes pequenos em espaços amplos e luminosos. É o revestimento de escolha para salas de estar e corredores de alto padrão em Goiânia.',
    comoEscolher: [
      'Use em ambientes com boa iluminação natural — o reflexo multiplica a luz.',
      'Formatos grandes (90×90 cm ou 120×60 cm) maximizam o efeito espelho.',
      'Evite em cozinhas e banheiros: muito escorregadio quando molhado.',
      'Rejunte na cor mais próxima do porcelanato para não chamar atenção nas juntas.',
      'Limpe com pano de microfibra — marcas de sola desaparecem sem deixar riscos.',
    ],
    atributos: {
      acabamento: 'Polido',
      antiderrapante: false,
      dimensao: '90×90 cm / 120×60 cm',
      m2PorCaixa: 1.62,
      ambiente: 'Sala, corredor, lobby',
    },
    faq: [
      {
        q: 'Porcelanato polido risca fácil?',
        a: 'Sim, mais que o natural ou acetinado. Evite arrastar móveis sem feltro protetor e use tapetes em áreas de alto tráfego.',
      },
      {
        q: 'Por que o piso polido parece "sujo" com marcas de pé?',
        a: 'A superfície espelhada evidencia oleosidade. Limpe com pano levemente úmido e umedeça bem para evitar riscos por arrasto.',
      },
    ],
    relacionados: ['porcelanato-marmorizado', 'porcelanato-acetinado', 'porcelanato-polido-sala'],
  },
  {
    slug: 'piso-porcelanato',
    termoAlvo: 'piso porcelanato',
    volume: 880,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Piso de Porcelanato em Goiânia — Como Escolher',
    intro:
      'Piso de porcelanato é a escolha mais popular nas obras de Goiânia: durável, fácil de limpar e disponível em dezenas de texturas. Neste guia você aprende a escolher o tipo certo para cada ambiente da sua casa.',
    comoEscolher: [
      'Defina o ambiente: sala (PEI 3-4), cozinha (PEI 4, resistente a gordura), banheiro (antiderrapante), área externa (PEI 5, antiderrapante R10+).',
      'Escolha o acabamento: polido (mais brilho, mais cuidado), acetinado (brilho suave, prático), natural (fosco, menos riscos), antiderrapante (áreas molhadas).',
      'Calcule a metragem com 10% de folga para cortes e reposição futura.',
      'Prefira lotes do mesmo código — cor e textura podem variar entre fabricações.',
      'Verifique a absorbência: tipo BIa (< 0,5%) é o mais resistente à umidade.',
    ],
    atributos: {
      acabamento: 'Variado',
      antiderrapante: false,
      dimensao: '60×60 a 120×120 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Todos os ambientes',
    },
    faq: [
      {
        q: 'Qual a diferença entre porcelanato e cerâmica?',
        a: 'O porcelanato é mais denso (absorção < 0,5%), mais resistente a manchas e impacto. A cerâmica absorve mais água e é menos durável, mas custa menos.',
      },
      {
        q: 'Preciso de rejunte em todos os porcelanatos?',
        a: 'Sim. O rejunte garante a dilatação térmica e impede infiltração. Use espaçadores de 1,5 a 3 mm dependendo do formato.',
      },
      {
        q: 'Quanto custa instalar piso de porcelanato em Goiânia?',
        a: 'O assentamento custa entre R$ 35 e R$ 75/m² dependendo do formato (formatos grandes exigem mais mão de obra). Some o custo do produto e do rejunte.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado',
      'porcelanato-marmorizado',
      'porcelanato-60x60',
      'porcelanato-90x90',
    ],
  },

  // ──────────────── Por ocasião / ambiente ────────────────
  {
    slug: 'porcelanato-area-externa',
    termoAlvo: 'porcelanato para área externa',
    volume: 140,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    ocasiao: 'área externa',
    titulo: 'Porcelanato para Área Externa em Goiânia',
    intro:
      'Em Goiânia, a área externa vive sob sol forte e chuvas torrenciais no verão. O porcelanato certo precisa de PEI 5, certificação antiderrapante R10 mínimo e baixa absorção de água para não rachar com a variação de temperatura.',
    comoEscolher: [
      'Exija PEI 5 (máxima resistência ao desgaste) e classificação antiderrapante mínima R10.',
      'Verifique a resistência ao gelo/degelo se a área recebe água acumulada.',
      'Formatos menores (30×60 cm ou 45×45 cm) facilitam a inclinação de escoamento de água.',
      'Acabamento natural ou stone é mais seguro e disfarça melhor a sujeira de terra.',
      'Aplique rejunte flexível resistente a UV — o convencional racha com dilatação solar.',
    ],
    atributos: {
      acabamento: 'Natural / Stone',
      antiderrapante: true,
      dimensao: '30×60 cm / 45×45 cm',
      m2PorCaixa: 1.08,
      ambiente: 'Área externa, garagem, jardim',
    },
    faq: [
      {
        q: 'Qual PEI mínimo para área externa?',
        a: 'PEI 4 é o mínimo, mas PEI 5 é o recomendado para tráfego intenso (garagens, passagens) ou exposição total ao sol e chuva.',
      },
      {
        q: 'Porcelanato para piscina: serve o mesmo que para área externa?',
        a: 'Não necessariamente. Para borda de piscina o ideal é PEI 5 + R11 (mais rugoso) e resistência ao cloro. Consulte a especificação do fabricante.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado-area-externa',
      'porcelanato-antiderrapante',
      'porcelanato-externo-antiderrapante',
      'porcelanato-piscina',
    ],
  },
  {
    slug: 'porcelanato-cozinha',
    termoAlvo: 'porcelanato para cozinha',
    volume: 210,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    ocasiao: 'cozinha',
    titulo: 'Porcelanato para Cozinha em Goiânia',
    intro:
      'A cozinha combina gordura, água e alto tráfego — é o ambiente mais exigente da casa. O porcelanato certo resiste a manchas de azeite, não absorve odores e facilita a limpeza diária.',
    comoEscolher: [
      'Escolha PEI 4 no mínimo, com baixa absorção (BIa) para resistir à gordura.',
      'Acabamento natural é mais higiênico que polido — não acumula riscos microscópicos que prendem resíduos.',
      'Para o piso, evite polido (escorrega com água). Antiderrapante leve (R9) é suficiente.',
      'Para o backsplash (parede atrás do fogão), qualquer acabamento serve — o calor não afeta o porcelanato.',
      'Tons neutros (off-white, cinza claro) disfarçam melhor a farinha e a poeira diária.',
    ],
    atributos: {
      acabamento: 'Natural / Acetinado',
      antiderrapante: false,
      dimensao: '60×60 cm / 30×60 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Cozinha, área de serviço',
    },
    faq: [
      {
        q: 'Posso usar porcelanato amadeirado na cozinha?',
        a: 'Sim. O amadeirado com acabamento natural é bonito e fácil de limpar na cozinha. Evite o polido — as juntas de veia da madeira acumulam gordura mais visível.',
      },
      {
        q: 'Qual o melhor porcelanato para parede da cozinha?',
        a: 'Subway tile (retangular 10×30 cm) ou formatos maiores (60×120 cm). O importante é a facilidade de limpeza — qualquer acabamento serve na parede.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado-cozinha',
      'porcelanato-area-externa',
      'porcelanato-banheiro',
      'piso-porcelanato',
    ],
  },
  {
    slug: 'porcelanato-banheiro',
    termoAlvo: 'porcelanato para banheiro',
    volume: 390,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    ocasiao: 'banheiro',
    titulo: 'Porcelanato para Banheiro em Goiânia',
    intro:
      'No banheiro, a combinação de umidade constante e pé molhado exige porcelanato antiderrapante no piso e acabamentos lisos na parede. Em Goiânia, banheiros com porcelanato marmorizado e teto alto são tendência nos condomínios do Jardim Goiás e Setor Bueno.',
    comoEscolher: [
      'Piso: exija R9 mínimo — R10 para banheiro com chuveiro sem box fechado.',
      'Parede: qualquer acabamento serve. Retificado facilita o rejunte fino (1 mm) e o acabamento premium.',
      'Formatos longos na parede (30×90 cm ou 30×120 cm) aumentam visualmente o pé-direito.',
      'Combine 2 texturas: parede lisa + piso antiderrapante da mesma família de cor.',
      'Evite rejunte branco no piso — escurece rapidamente. Prefira cinza ou bege.',
    ],
    atributos: {
      acabamento: 'Natural (piso) / Polido (parede)',
      antiderrapante: true,
      dimensao: '60×120 cm (parede) / 30×60 cm (piso)',
      m2PorCaixa: 1.44,
      ambiente: 'Banheiro, lavabo, área molhada',
    },
    faq: [
      {
        q: 'Qual o tamanho certo para banheiro pequeno?',
        a: 'Formatos maiores (60×120 cm) abrem o espaço mesmo em banheiros pequenos. Evite formatos muito pequenos — as linhas de rejunte multiplicam e deixam o ambiente mais fechado.',
      },
      {
        q: 'Preciso impermeabilizar antes de colocar porcelanato no banheiro?',
        a: 'Sim. A impermeabilização protege a estrutura do banheiro, não o porcelanato. Deve ser feita sobre a alvenaria, especialmente em box e chão.',
      },
    ],
    relacionados: [
      'porcelanato-acetinado-banheiro',
      'porcelanato-marmorizado-banheiro',
      'porcelanato-antiderrapante',
      'porcelanato-retificado',
    ],
  },
  {
    slug: 'porcelanato-fachada',
    termoAlvo: 'porcelanato para fachada',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'fachada',
    ocasiao: 'fachada',
    titulo: 'Porcelanato para Fachada em Goiânia',
    intro:
      'Fachadas em porcelanato ganham cada vez mais espaço nos projetos de Goiânia — residências de alto padrão nos bairros Jardim América e Alphaville usam porcelanato marmorizado e pedra ferro para valorizar o imóvel e reduzir manutenção.',
    comoEscolher: [
      'Exija produto técnico certificado para uso em fachada (resistência a UV, variação térmica e impacto).',
      'Formatos menores (30×60 cm) são mais seguros na fixação por adesivo em fachada.',
      'Para fachadas ventiladas, consulte um engenheiro — a fixação mecânica é diferente do assentamento convencional.',
      'Acabamentos mais escuros absorvem mais calor — considere o impacto na temperatura interna.',
      'Verifique se o produto tem BIa (absorção < 0,5%) — essencial para o clima de Goiânia.',
    ],
    atributos: {
      acabamento: 'Natural / Stone',
      antiderrapante: false,
      dimensao: '30×60 cm / 60×120 cm',
      m2PorCaixa: 1.08,
      ambiente: 'Fachada, muro externo',
    },
    faq: [
      {
        q: 'Porcelanato de fachada é diferente do de piso?',
        a: 'Sim. Para fachada, o produto precisa de resistência a UV (não amarela), ciclos de gelo/degelo e maior resistência mecânica. Confirme a certificação de fachada na especificação.',
      },
      {
        q: 'Posso usar porcelanato marmorizado na fachada?',
        a: 'Sim, se o produto tiver certificação para uso externo. Muitos marmorizados são para uso interno apenas — verifique o datasheet do fabricante.',
      },
    ],
    relacionados: [
      'porcelanato-marmorizado-fachada',
      'porcelanato-area-externa',
      'porcelanato-externo-antiderrapante',
    ],
  },
  {
    slug: 'porcelanato-piscina',
    termoAlvo: 'porcelanato para piscina',
    volume: 110,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    ocasiao: 'piscina',
    titulo: 'Porcelanato para Piscina em Goiânia',
    intro:
      'A borda de piscina em Goiânia vive exposta ao cloro, ao sol intenso e ao pé descalço constantemente molhado. O porcelanato certo é o mais antiderrapante disponível — R11 ou R12 — e deve resistir aos produtos químicos do tratamento da água.',
    comoEscolher: [
      'Exija classificação antiderrapante R11 mínimo (R12 para crianças e idosos).',
      'Verifique resistência ao cloro e ao pH variável (4 a 10).',
      'Formatos menores (20×20 cm ou 15×60 cm) são mais seguros nas bordas curvas.',
      'Cor clara reflete calor e não escorrega menos — priorize textura sobre cor.',
      'Use rejunte bicomponente (epóxi) para resistir ao cloro e à pressão hidrostática.',
    ],
    atributos: {
      acabamento: 'Antiderrapante Stone R11',
      antiderrapante: true,
      dimensao: '20×20 cm / 15×60 cm',
      m2PorCaixa: 0.96,
      ambiente: 'Borda de piscina, solário, deck molhado',
    },
    faq: [
      {
        q: 'Qual a diferença entre R10, R11 e R12?',
        a: 'É a classificação de ângulo de inclinação antes do escorregamento em teste padronizado. R10 = inclinação até 19°; R11 = até 27°; R12 = até 35°. Para piscina, R11 é o mínimo seguro.',
      },
      {
        q: 'Posso usar pastilha de porcelanato dentro da piscina?',
        a: 'Sim. Pastilhas de porcelanato BIa são resistentes à água e ao cloro. Exija produto específico para revestimento subaquático.',
      },
    ],
    relacionados: [
      'porcelanato-area-externa',
      'porcelanato-antiderrapante',
      'porcelanato-externo-antiderrapante',
    ],
  },

  // ──────────────── Combinações tipo × ocasião ────────────────
  {
    slug: 'porcelanato-amadeirado-area-externa',
    termoAlvo: 'porcelanato amadeirado para área externa',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'amadeirado',
    ocasiao: 'área externa',
    titulo: 'Porcelanato Amadeirado para Área Externa em Goiânia',
    intro:
      'O amadeirado para área externa une estética natural e resistência técnica — traz o visual de deck de madeira sem a manutenção de verniz e sem o risco de apodrecimento. Em Goiânia, é o favorito para varandas descobertas e jardins integrados.',
    comoEscolher: [
      'Exija versão com acabamento antiderrapante R10 mínimo — os amadeirados externos têm textura de relevo que simula a fibra da madeira.',
      'PEI 5 para tráfego intenso; PEI 4 para varandas de uso residencial baixo.',
      'Formato retangular de 20×120 cm cria o visual de tábua corrida no espaço externo.',
      'Verifique resistência ao UV — cores escuras como nogueira desbotam mais que o carvalho claro se o produto for de baixa qualidade.',
      'Use rejunte flexível e impermeável — a variação térmica exige elasticidade nas juntas.',
    ],
    atributos: {
      acabamento: 'Natural Antiderrapante R10',
      antiderrapante: true,
      dimensao: '20×120 cm / 25×150 cm',
      m2PorCaixa: 1.08,
      ambiente: 'Varanda descoberta, jardim, terraço',
    },
    faq: [
      {
        q: 'Porcelanato amadeirado externo precisa de selador?',
        a: 'Não. O porcelanato não é poroso e não absorve sujeira. Limpeza com água e detergente neutro é suficiente — sem selamento anual como madeira real.',
      },
      {
        q: 'Quais tons de amadeirado envelhecem melhor ao sol?',
        a: 'Tons claros (carvalho, eucalipto) e cinza weathered são mais estáveis ao UV. Tons escuros (nogueira, mogno) exigem pigmentos de qualidade superior para não desbotar.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado',
      'porcelanato-area-externa',
      'porcelanato-amadeirado-varanda',
      'porcelanato-externo-antiderrapante',
    ],
  },
  {
    slug: 'porcelanato-amadeirado-cozinha',
    termoAlvo: 'porcelanato amadeirado para cozinha',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'amadeirado',
    ocasiao: 'cozinha',
    titulo: 'Porcelanato Amadeirado para Cozinha em Goiânia',
    intro:
      'A cozinha com piso amadeirado tem um visual aconchegante e contemporâneo — tendência forte nos projetos de Goiânia em 2025. O segredo é escolher um produto com acabamento natural, fácil limpeza e sem relevo profundo que acumule gordura.',
    comoEscolher: [
      'Prefira acabamento natural (fosco) sobre polido ou acetinado — menos escorregadio e disfarça melhor a gordura.',
      'Verifique se a superfície é lisa ao toque — relevos profundos acumulam gordura nas ranhuras.',
      'Formato 20×120 cm em tábua corrida perpendicular à janela amplia o espaço.',
      'Cor carvalho claro ou bege amadeirado combina com armários brancos ou cinza — as combinações mais pedidas em Goiânia.',
      'Solicite certificado de PEI 4 e absorção BIa para uso em área de cozinha.',
    ],
    atributos: {
      acabamento: 'Natural',
      antiderrapante: false,
      dimensao: '20×120 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Cozinha, copa, área de serviço',
    },
    faq: [
      {
        q: 'Amadeirado combina com cozinha branca?',
        a: 'Sim — é uma das combinações mais clássicas. Tons claros de amadeirado (off-white, carvalho claro) harmonizam com armários brancos e bancada de quartzo.',
      },
      {
        q: 'Posso colocar amadeirado na parede da cozinha também?',
        a: 'Pode, mas o efeito é muito forte. O ideal é usar na parede só atrás do fogão (como nicho) e deixar o restante com cor sólida ou mármore.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado',
      'porcelanato-cozinha',
      'porcelanato-amadeirado-area-externa',
    ],
  },
  {
    slug: 'porcelanato-amadeirado-varanda',
    termoAlvo: 'porcelanato amadeirado varanda',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'amadeirado',
    ocasiao: 'varanda',
    titulo: 'Porcelanato Amadeirado para Varanda em Goiânia',
    intro:
      'Varandas de apartamentos em Goiânia ganham um visual de deck sustentável com porcelanato amadeirado — sem cupim, sem lixamento anual e com resistência ao sol forte do cerrado.',
    comoEscolher: [
      'Para varanda coberta sem chuva direta: PEI 4 com acabamento acetinado basta.',
      'Para varanda descoberta ou semi-aberta: PEI 5 + antiderrapante R10.',
      'Formato em tábua longa (25×150 cm) cria profundidade visual e amplia a varanda.',
      'Aplique em diagonal (45°) para maximizar o impacto visual em varandas pequenas.',
      'Use ralo oculto nas varandas descobertas — facilita a limpeza e mantém o visual limpo.',
    ],
    atributos: {
      acabamento: 'Acetinado / Natural R10',
      antiderrapante: true,
      dimensao: '25×150 cm / 20×120 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Varanda, sacada, terraço',
    },
    faq: [
      {
        q: 'Posso usar amadeirado em varanda de apartamento?',
        a: 'Sim, mas verifique a norma do condomínio e se há limitação de peso (espessura 9 mm é mais leve que 11 mm). Verifique também a inclinação mínima de escoamento de água.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado',
      'porcelanato-amadeirado-area-externa',
      'porcelanato-area-externa',
    ],
  },
  {
    slug: 'porcelanato-amadeirado-sala',
    termoAlvo: 'porcelanato amadeirado sala',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'amadeirado',
    ocasiao: 'sala',
    titulo: 'Porcelanato Amadeirado para Sala em Goiânia',
    intro:
      'O amadeirado na sala cria ambientes aconchegantes e modernos — tendência no design de interiores de Goiânia que une o calor da madeira com o requinte do porcelanato de alta resistência.',
    comoEscolher: [
      'Aplique no sentido do comprimento da sala para ampliar visualmente o espaço.',
      'PEI 3 a 4 é suficiente — tráfego residencial de sala não exige PEI 5.',
      'Acabamento acetinado ou natural: ambos funcionam bem na sala.',
      'Leve o piso amadeirado até a cozinha integrada para unidade visual.',
      'Combine com tapetes de fibra natural (juta, sisal) para equilibrar o visual.',
    ],
    atributos: {
      acabamento: 'Acetinado / Natural',
      antiderrapante: false,
      dimensao: '20×120 cm / 30×150 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala de estar, jantar, corredor',
    },
    faq: [
      {
        q: 'Qual o melhor tom de amadeirado para sala clara?',
        a: 'Carvalho claro, nude amadeirado ou cinza weathered abrem o espaço. Tons escuros como nogueira funcionam melhor em salas grandes e bem iluminadas.',
      },
    ],
    relacionados: [
      'porcelanato-amadeirado',
      'porcelanato-polido-sala',
      'porcelanato-marmorizado-sala',
    ],
  },
  {
    slug: 'porcelanato-marmorizado-sala',
    termoAlvo: 'porcelanato marmorizado para sala',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'marmorizado',
    ocasiao: 'sala',
    titulo: 'Porcelanato Marmorizado para Sala em Goiânia',
    intro:
      'O marmorizado na sala transmite sofisticação e amplitude — especialmente em formatos grandes (90×90 cm) com veias brancas sobre fundo cinza ou bege. É o revestimento de escolha nos projetos de alto padrão do Setor Marista e Alphaville Goiânia.',
    comoEscolher: [
      'Formatos 90×90 cm ou 120×120 cm com veias contínuas maximizam o impacto visual.',
      'Combine com rodapé do mesmo porcelanato para acabamento premium.',
      'Use acabamento polido para ampliar ambientes; acetinado é mais prático no dia a dia.',
      'Peça a planta de assentamento: alinhar as veias exige planejamento prévio.',
      'Mantenha o piso limpo de marcas — o polido evidencia tudo.',
    ],
    atributos: {
      acabamento: 'Polido / Acetinado',
      antiderrapante: false,
      dimensao: '90×90 cm / 120×120 cm',
      m2PorCaixa: 1.62,
      ambiente: 'Sala de estar, jantar, hall',
    },
    faq: [
      {
        q: 'Marmorizado branco ou cinza para sala pequena?',
        a: 'O branco (Calacatta, Bianco) abre mais o ambiente. O cinza (Grigio, Pietra) é mais contemporâneo e esconde melhor o pó do dia a dia.',
      },
    ],
    relacionados: [
      'porcelanato-marmorizado',
      'porcelanato-amadeirado-sala',
      'porcelanato-polido-sala',
    ],
  },
  {
    slug: 'porcelanato-marmorizado-banheiro',
    termoAlvo: 'porcelanato marmorizado banheiro',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'marmorizado',
    ocasiao: 'banheiro',
    titulo: 'Porcelanato Marmorizado para Banheiro em Goiânia',
    intro:
      'O marmorizado no banheiro é sinônimo de luxo acessível — reproduz o visual dos mármores clássicos (Calacatta, Statuario, Grigio) sem os cuidados do mármore natural. Em Goiânia, é a escolha dominante nos projetos de lavabos de alto padrão.',
    comoEscolher: [
      'Parede: polido ou acetinado — sem problema de escorregamento.',
      'Piso: versão antiderrapante (natural ou texturizado) R9 mínimo.',
      'Use o mesmo porcelanato do piso até metade da parede (até 1,5 m) para criar o efeito banheiro de hotel.',
      'Rejunte fino (1 a 2 mm) em tom próximo ao porcelanato — elimina a grade visual de rejunte.',
      'Combine com louça branca e metais dourados para o acabamento mais pedido em Goiânia.',
    ],
    atributos: {
      acabamento: 'Polido (parede) / Natural (piso)',
      antiderrapante: true,
      dimensao: '60×120 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Banheiro, lavabo',
    },
    faq: [
      {
        q: 'Preciso usar o mesmo porcelanato no piso e na parede?',
        a: 'Não. O banheiro fica mais interessante com uma variação: mesmo tom, acabamentos diferentes (polido na parede + natural no piso). Assim você tem unidade visual e segurança.',
      },
    ],
    relacionados: [
      'porcelanato-marmorizado',
      'porcelanato-banheiro',
      'porcelanato-acetinado-banheiro',
    ],
  },
  {
    slug: 'porcelanato-acetinado-banheiro',
    termoAlvo: 'porcelanato acetinado banheiro',
    volume: 40,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'acetinado',
    ocasiao: 'banheiro',
    titulo: 'Porcelanato Acetinado para Banheiro em Goiânia',
    intro:
      'O acetinado no banheiro equilibra brilho e praticidade — tem mais vida que o fosco e é mais seguro que o polido. É a escolha de quem quer um banheiro bonito sem comprometer a funcionalidade.',
    comoEscolher: [
      'Use acetinado nas paredes — o brilho suave reflete luz sem ofuscar.',
      'No piso, prefira versão com textura leve (R9) ou opte por outro acabamento mais antiderrapante.',
      'Formatos 30×90 cm ou 60×120 cm verticais na parede aumentam o pé-direito percebido.',
      'Tons neutros acetinados (branco, greige, areia) são os mais vendidos em Goiânia.',
    ],
    atributos: {
      acabamento: 'Acetinado',
      antiderrapante: false,
      dimensao: '30×90 cm / 60×120 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Banheiro, lavabo, área de banho',
    },
    faq: [
      {
        q: 'Acetinado fica sujo rápido no banheiro?',
        a: 'O acetinado esconde menos marcas d\'água que o polido. Limpeza regular com pano úmido é suficiente. Em locais com água dura, use limpador ácido leve mensal.',
      },
    ],
    relacionados: [
      'porcelanato-acetinado',
      'porcelanato-banheiro',
      'porcelanato-marmorizado-banheiro',
    ],
  },
  {
    slug: 'porcelanato-polido-sala',
    termoAlvo: 'porcelanato polido sala',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'polido',
    ocasiao: 'sala',
    titulo: 'Porcelanato Polido para Sala em Goiânia',
    intro:
      'O piso polido transforma salas em ambientes luminosos e sofisticados — efeito espelho que dobra a percepção de espaço. Em salas com iluminação zenital ou grandes janelas, o resultado é cinema.',
    comoEscolher: [
      'Salas com iluminação natural abundante são as maiores beneficiadas pelo polido.',
      'Formatos 90×90 cm ou 120×60 cm com rejunte fino criam a ilusão de piso contínuo.',
      'Proteja com feltros todos os móveis — riscos são permanentes no polido.',
      'Tapetes de área protegem o piso e criam zonas visuais na sala integrada.',
    ],
    atributos: {
      acabamento: 'Polido',
      antiderrapante: false,
      dimensao: '90×90 cm / 120×60 cm',
      m2PorCaixa: 1.62,
      ambiente: 'Sala de estar, corredor, hall',
    },
    faq: [
      {
        q: 'Porcelanato polido vale a pena em sala com crianças?',
        a: 'É viável, mas exige mais manutenção. As marcas de pé e brinquedo aparecem mais. Uma alternativa é o acetinado — visual quase igual, muito mais prático.',
      },
    ],
    relacionados: [
      'porcelanato-polido',
      'porcelanato-marmorizado-sala',
      'porcelanato-amadeirado-sala',
    ],
  },
  {
    slug: 'porcelanato-marmorizado-fachada',
    termoAlvo: 'porcelanato marmorizado fachada',
    volume: 10,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'marmorizado',
    ocasiao: 'fachada',
    titulo: 'Porcelanato Marmorizado para Fachada em Goiânia',
    intro:
      'A fachada marmorizada é o cartão de visita das residências premium em Goiânia — transmite solidez e sofisticação, eleva o valor percebido do imóvel e dispensa manutenção de pintura.',
    comoEscolher: [
      'Exija certificação para uso externo (resistência UV, ciclo térmico e impacto).',
      'Formatos grandes (60×120 cm) em fachada exigem fixação técnica — consulte engenheiro.',
      'Verifique o coeficiente de atrito do produto — mesmo em fachada, facilita a limpeza da poeira do cerrado.',
      'Tons claros (Calacatta, Bianco) envelhecem melhor ao sol que tons escuros sem pigmentação UV estabilizada.',
    ],
    atributos: {
      acabamento: 'Acetinado / Natural',
      antiderrapante: false,
      dimensao: '30×60 cm / 60×120 cm',
      m2PorCaixa: 1.08,
      ambiente: 'Fachada, muro externo',
    },
    faq: [
      {
        q: 'Fachada marmorizada desvaloriza ou valoriza o imóvel?',
        a: 'Valoriza — a fachada é o primeiro elemento de percepção do imóvel. Porcelanato de qualidade durável aumenta o valor percebido e reduz custos de manutenção futura.',
      },
    ],
    relacionados: [
      'porcelanato-marmorizado',
      'porcelanato-fachada',
      'porcelanato-area-externa',
    ],
  },

  // ──────────────── Por dimensão ────────────────
  {
    slug: 'porcelanato-60x60',
    termoAlvo: 'porcelanato 60x60',
    volume: 140,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato 60x60 em Goiânia',
    intro:
      'O formato 60×60 cm é o mais versátil do mercado — serve para sala, quarto, cozinha e área de serviço. Em Goiânia, é o tamanho mais vendido por custo-benefício e disponibilidade.',
    comoEscolher: [
      'Ambiente até 12 m²: 60×60 cm é ideal. Para ambientes maiores, formatos maiores têm mais impacto visual.',
      'Escolha retificado para rejunte fino (2 mm) e acabamento mais sofisticado.',
      'Rendimento médio: 2,77 peças/m² — calcule a área e adicione 10% de perda.',
      'Compare especificações técnicas: dois produtos "60×60" podem ter PEI e absorção muito diferentes.',
    ],
    atributos: {
      acabamento: 'Variado',
      antiderrapante: false,
      dimensao: '60×60 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala, quarto, cozinha, serviço',
    },
    faq: [
      {
        q: '60×60 é pequeno para sala?',
        a: 'Depende do tamanho da sala. Em salas menores (até 25 m²) o 60×60 funciona bem. Para salas maiores ou integradas, 90×90 ou 120×60 dão mais amplitude.',
      },
      {
        q: 'Qual é a diferença entre retificado e não retificado?',
        a: 'O retificado tem bordas cortadas com precisão milimétrica — permite rejunte de 1-2 mm e acabamento mais fino. O não retificado precisa de rejunte maior (3-5 mm).',
      },
    ],
    relacionados: ['porcelanato-90x90', 'porcelanato-120x60', 'piso-porcelanato'],
  },
  {
    slug: 'porcelanato-90x90',
    termoAlvo: 'porcelanato 90x90',
    volume: 90,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato 90x90 em Goiânia',
    intro:
      'O formato 90×90 cm é o queridinho das salas grandes e ambientes integrados em Goiânia — dá amplitude, valoriza o espaço e é compatível com a maioria dos estilos contemporâneos.',
    comoEscolher: [
      'Recomendado para ambientes acima de 20 m² — em ambientes pequenos, as poucas peças grandes podem parecer "pesadas".',
      'Exige subfloor nivelado: qualquer variação aparece nas juntas de peças grandes.',
      'Mão de obra mais cara: as peças exigem mais cuidado no assentamento e corte.',
      'Formatos 90×90 cm em acabamento polido são o luxo acessível mais popular em Goiânia.',
    ],
    atributos: {
      acabamento: 'Polido / Natural',
      antiderrapante: false,
      dimensao: '90×90 cm',
      m2PorCaixa: 1.62,
      ambiente: 'Sala, corredor, lobby, hall',
    },
    faq: [
      {
        q: 'Porcelanato 90×90 é muito pesado para apartamento?',
        a: 'O peso do porcelanato é calculado pela laje — um engenheiro deve confirmar, mas para espessuras padrão de 10-11 mm, a carga é semelhante a outros pisos.',
      },
    ],
    relacionados: ['porcelanato-60x60', 'porcelanato-120x60', 'porcelanato-marmorizado'],
  },
  {
    slug: 'porcelanato-120x60',
    termoAlvo: 'porcelanato 120x60',
    volume: 40,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato 120x60 em Goiânia',
    intro:
      'O formato retangular 120×60 cm é o mais moderno — cria linhas longas que orientam o olhar e ampliam corredores e salas integradas. Em Goiânia, é a escolha dos projetos de interiores contemporâneos.',
    comoEscolher: [
      'Aplicado no sentido longitudinal do corredor ou sala: amplia 30% a percepção de comprimento.',
      'Aplicado no sentido transversal: amplia a largura percebida.',
      'Exige nivelamento perfeito e assentador experiente — peças longas evidenciam qualquer irregularidade.',
      'Combine com rodapé do mesmo material no formato 10×120 cm para acabamento limpo.',
    ],
    atributos: {
      acabamento: 'Acetinado / Natural',
      antiderrapante: false,
      dimensao: '120×60 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala, corredor, cozinha integrada',
    },
    faq: [
      {
        q: 'Por que o 120×60 é mais caro de instalar?',
        a: 'As peças grandes exigem mais cola, mais niveladores e mais tempo do assentador. O corte também é mais complexo — aumenta o tempo e o custo da mão de obra em 20-30%.',
      },
    ],
    relacionados: ['porcelanato-90x90', 'porcelanato-60x60', 'porcelanato-amadeirado'],
  },

  // ──────────────── Atributos especiais ────────────────
  {
    slug: 'porcelanato-retificado',
    termoAlvo: 'porcelanato retificado',
    volume: 260,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato Retificado em Goiânia',
    intro:
      'Retificado significa bordas cortadas com precisão milimétrica após a queima — permite rejunte finíssimo (1 a 2 mm) e acabamento de nível construtivo premium. Em Goiânia, virou padrão nos empreendimentos de médio-alto padrão.',
    comoEscolher: [
      'Use rejunte de 1,5 mm ou menos — o efeito "piso contínuo" exige esse detalhe.',
      'Assentador experiente é obrigatório — peças retificadas evidenciam qualquer imperfeição.',
      'Combine com subfloor autonivelante para garantir planeza perfeita.',
      'O retificado é levemente mais caro que o não retificado — o diferencial está na mão de obra, não no produto.',
    ],
    atributos: {
      acabamento: 'Polido / Natural / Acetinado',
      antiderrapante: false,
      dimensao: 'Múltiplos formatos',
      m2PorCaixa: 1.44,
      ambiente: 'Todos os ambientes',
    },
    faq: [
      {
        q: 'Todo porcelanato grande é retificado?',
        a: 'Não. Verifique a especificação do produto. Formatos maiores (90×90 cm, 120×60 cm) frequentemente são retificados, mas não é regra.',
      },
    ],
    relacionados: ['piso-porcelanato', 'porcelanato-60x60', 'porcelanato-90x90'],
  },
  {
    slug: 'porcelanato-antiderrapante',
    termoAlvo: 'porcelanato antiderrapante',
    volume: 110,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    titulo: 'Porcelanato Antiderrapante em Goiânia',
    intro:
      'O porcelanato antiderrapante é obrigatório em qualquer área molhada — banheiro, área de serviço, garagem, área externa. A classificação R (R9 a R13) indica o ângulo de segurança: quanto maior, mais aderente.',
    comoEscolher: [
      'Banheiro doméstico: R9 ou R10 são suficientes.',
      'Área externa com chuva: R10 mínimo.',
      'Bordas de piscina: R11 ou R12.',
      'Rampas e escadas: R11 mínimo; R12 para uso comercial.',
      'Verifique também a resistência ao desgaste (PEI 4 ou 5) para áreas de tráfego intenso.',
    ],
    atributos: {
      acabamento: 'Natural / Stone Antiderrapante',
      antiderrapante: true,
      dimensao: 'Variado (20×20 a 60×60 cm)',
      m2PorCaixa: 1.08,
      ambiente: 'Banheiro, área externa, garagem, piscina',
    },
    faq: [
      {
        q: 'Como saber se o porcelanato é antiderrapante?',
        a: 'Pela classificação R na embalagem. Produtos sem classificação R não foram testados — evite para áreas molhadas.',
      },
      {
        q: 'Antiderrapante fica feio?',
        a: 'Os produtos modernos têm textura sutil — relevos leves que dão aderência sem comprometer o visual. A geração atual de porcelanatos externos é muito mais bonita que os "antiestéticos" dos anos 2000.',
      },
    ],
    relacionados: [
      'porcelanato-area-externa',
      'porcelanato-piscina',
      'porcelanato-banheiro',
      'porcelanato-externo-antiderrapante',
    ],
  },

  // ──────────────── Intenção local ────────────────
  {
    slug: 'porcelanato-goiania',
    termoAlvo: 'porcelanato goiânia',
    volume: 30,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Comprar Porcelanato em Goiânia — Guia Completo',
    intro:
      'Goiânia tem um mercado aquecido de revestimentos — grandes distribuidores no Setor Industrial, lojas especializadas no Park Lozandes e a demanda crescente dos condomínios do Leste Goiano. Neste guia, você aprende a escolher, calcular e comprar porcelanato na capital goiana.',
    comoEscolher: [
      'Visite showrooms para ver as peças ao natural — a foto não substitui o produto real.',
      'Compare o prazo de entrega: grandes obras exigem produto disponível em lote completo.',
      'Peça nota fiscal com o código do produto — facilita a reposição de peças quebradas.',
      'Consulte projetos de vizinhos ou grupos de moradores do bairro para feedback real sobre durabilidade.',
      'Compre 10% a mais que a metragem da obra — é impossível garantir o mesmo lote depois.',
    ],
    atributos: {
      acabamento: 'Variado',
      antiderrapante: false,
      dimensao: 'Variado',
      m2PorCaixa: 1.44,
      ambiente: 'Todos os ambientes',
    },
    faq: [
      {
        q: 'Onde comprar porcelanato em Goiânia?',
        a: 'Entre em contato conosco pelo WhatsApp — conectamos você aos fornecedores exclusivos de Goiânia com o melhor custo-benefício do polo.',
      },
      {
        q: 'Porcelanato importado vale a pena em Goiânia?',
        a: 'Depende. O nacional (Portobello, Incepa, Eliane, Cerâmica Portinari) oferece qualidade comparável com logística e suporte local. O importado pode ter prazo de entrega longo e dificuldade de reposição.',
      },
      {
        q: 'Tem feirão de porcelanato em Goiânia?',
        a: 'Sim — o polo de materiais de construção do Setor Industrial promove eventos sazonais. Fique atento ao calendário e cadastre-se na nossa lista para ser avisado.',
      },
    ],
    relacionados: [
      'loja-porcelanato-goiania',
      'piso-porcelanato',
      'porcelanato-amadeirado',
      'porcelanato-marmorizado',
    ],
  },
  {
    slug: 'loja-porcelanato-goiania',
    termoAlvo: 'loja de porcelanato goiânia',
    volume: 10,  // ponytail: DataForSEO retorna null (abaixo do piso de medição) em cidade/estado/nacional; 10 = bucket mínimo real, proxy do termo-pai "porcelanato goiânia"  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Loja de Porcelanato em Goiânia — Encontre o Fornecedor Certo',
    intro:
      'Encontrar a loja certa de porcelanato em Goiânia vai além do preço — é sobre disponibilidade de lote, prazo de entrega e suporte técnico. Veja o que avaliar antes de fechar a compra.',
    comoEscolher: [
      'Verifique se a loja tem catálogo atualizado e estoque local — produto encomendado tem prazo de 30 a 90 dias.',
      'Peça a ficha técnica completa: PEI, absorção, dimensão, acabamento, norma ABNT.',
      'Confirme a garantia do fabricante — bons produtos têm 5 anos mínimo.',
      'Avalie o atendimento técnico: um bom vendedor explica a diferença entre os produtos, não só o preço.',
      'Compare pelo menos 3 fornecedores antes de decidir.',
    ],
    atributos: {
      acabamento: 'Variado',
      antiderrapante: false,
      dimensao: 'Variado',
      m2PorCaixa: 1.44,
      ambiente: 'Todos os ambientes',
    },
    faq: [
      {
        q: 'Como saber se uma loja de porcelanato é confiável?',
        a: 'Verifique CNPJ ativo, avaliações no Google Maps e se trabalha com marcas conhecidas. Desconfie de produtos sem procedência clara ou sem ficha técnica.',
      },
      {
        q: 'Qual a diferença entre loja e distribuidora?',
        a: 'A distribuidora vende em volume para construtoras e marmorarias. A loja atende o consumidor final com menor quantidade mínima de compra. Para obras médias, a distribuidora pode ter preço melhor.',
      },
    ],
    relacionados: [
      'porcelanato-goiania',
      'piso-porcelanato',
      'porcelanato-amadeirado',
      'porcelanato-marmorizado',
    ],
  },

  // ──────────────── Cores específicas ────────────────
  {
    slug: 'porcelanato-branco',
    termoAlvo: 'porcelanato branco',
    volume: 260,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato Branco em Goiânia',
    intro:
      'O porcelanato branco é atemporal e versátil — amplifica a luz natural em Goiânia e combina com qualquer estilo de decoração. Do off-white quente ao branco puro, as opções são muitas.',
    comoEscolher: [
      'Off-white (branco com toque bege) é mais aconchegante que o branco puro — ideal para salas e quartos.',
      'Branco puro combina com cozinhas modernas e banheiros minimalistas.',
      'Acabamento acetinado ou polido no branco amplifica ainda mais a luminosidade.',
      'Verifique o índice de brancura (ΔE): quanto menor, mais consistente a cor entre peças e lotes.',
    ],
    atributos: {
      acabamento: 'Polido / Acetinado / Natural',
      antiderrapante: false,
      dimensao: '60×60 a 120×120 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala, quarto, cozinha, banheiro',
    },
    faq: [
      {
        q: 'Porcelanato branco amarela com o tempo?',
        a: 'O porcelanato de qualidade não amarela. A variação de cor pode ocorrer no rejunte. Use rejunte de qualidade e faça impermeabilização das juntas.',
      },
    ],
    relacionados: ['porcelanato-marmorizado', 'porcelanato-cinza', 'piso-porcelanato'],
  },
  {
    slug: 'porcelanato-cinza',
    termoAlvo: 'porcelanato cinza',
    volume: 590,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato Cinza em Goiânia',
    intro:
      'O porcelanato cinza é o neutro contemporâneo por excelência — do cinza claro ao antracita, cobre do estilo escandinavo ao industrial. Em Goiânia, é a cor que mais cresce no segmento residencial de médio-alto padrão.',
    comoEscolher: [
      'Cinza claro (grigio chiaro): ambientes minimalistas e escandinavos.',
      'Cinza médio: neutro seguro para sala e cozinha integrada.',
      'Antracita (cinza escuro): impacto visual em lavabos e ambientes menores com boa iluminação.',
      'Combine com madeira clara, metais pretos ou cobre para paleta contemporânea.',
    ],
    atributos: {
      acabamento: 'Natural / Acetinado',
      antiderrapante: false,
      dimensao: '60×60 a 90×90 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Sala, quarto, banheiro, cozinha',
    },
    faq: [
      {
        q: 'Qual tom de cinza casa com piso de madeira?',
        a: 'Cinza médio e madeira carvalho claro é a combinação mais harmoniosa. Evite cinza muito frio com madeira muito quente — o contraste pode ficar agressivo.',
      },
    ],
    relacionados: ['porcelanato-branco', 'porcelanato-preto', 'porcelanato-marmorizado'],
  },
  {
    slug: 'porcelanato-preto',
    termoAlvo: 'porcelanato preto',
    volume: 480,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato Preto em Goiânia',
    intro:
      'O porcelanato preto é o recurso dos projetos de alto impacto — paredes de banheiro, lavabos dramáticos e fachadas modernas. Em Goiânia, o preto polido ou acetinado é referência nos projetos de interiores de luxo.',
    comoEscolher: [
      'Use em paredes, não necessariamente no piso inteiro — cria o drama sem pesar o espaço.',
      'Combine com metal dourado ou cobre para o visual mais pedido em Goiânia atualmente.',
      'Polido no preto é o mais espetacular — use em lavabo para impacto máximo.',
      'Acenda bem o ambiente — o preto absorve luz e pode escurecer demais se mal iluminado.',
    ],
    atributos: {
      acabamento: 'Polido / Acetinado',
      antiderrapante: false,
      dimensao: '60×120 cm / 90×90 cm',
      m2PorCaixa: 1.44,
      ambiente: 'Lavabo, banheiro, parede de destaque',
    },
    faq: [
      {
        q: 'Porcelanato preto risca fácil?',
        a: 'O acabamento polido mostra riscos mais claramente. O acetinado é mais resistente. Para áreas de uso intenso, escolha acetinado ou natural.',
      },
    ],
    relacionados: ['porcelanato-cinza', 'porcelanato-branco', 'porcelanato-marmorizado'],
  },

  // ──────────────── Long-tail especiais ────────────────
  {
    slug: 'porcelanato-externo-antiderrapante',
    termoAlvo: 'porcelanato externo antiderrapante',
    volume: 30,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    ocasiao: 'área externa',
    titulo: 'Porcelanato Externo Antiderrapante em Goiânia',
    intro:
      'Combinar uso externo com antiderrapante é obrigatório em calçadas, rampas, bordas de piscina e áreas molhadas de Goiânia. A classificação R define o nível de segurança — a especificação técnica é inegociável.',
    comoEscolher: [
      'Calçada e passeio público: R10 mínimo conforme NBR 9050.',
      'Rampa de garagem: R11 mínimo.',
      'Piso tátil obrigatório em calçadas: contraste de cor entre piso regular e tátil.',
      'Peça laudos de certificação — não confie em "é antiderrapante" sem a classificação R documentada.',
    ],
    atributos: {
      acabamento: 'Stone Antiderrapante R10-R12',
      antiderrapante: true,
      dimensao: '30×60 cm / 45×45 cm',
      m2PorCaixa: 1.08,
      ambiente: 'Calçada, rampa, área externa, jardim',
    },
    faq: [
      {
        q: 'Quais normas regulam o uso de porcelanato em calçadas de Goiânia?',
        a: 'NBR 9050 (acessibilidade) e o Código de Obras de Goiânia definem os requisitos. O piso deve ser antiderrapante, regular e com faixa tátil quando aplicável.',
      },
    ],
    relacionados: [
      'porcelanato-area-externa',
      'porcelanato-antiderrapante',
      'porcelanato-amadeirado-area-externa',
    ],
  },

  // ──────── Expansão 008: combos validados por volume real (Goiás, DataForSEO, ≥200/mês) ────────
  {
    slug: 'revestimento-cozinha',
    termoAlvo: 'revestimento cozinha',
    volume: 720,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    ocasiao: 'cozinha',
    titulo: 'Revestimento de Cozinha em Goiânia: Porcelanato para Piso e Parede',
    intro:
      'O melhor revestimento de cozinha em Goiânia combina porcelanato de baixa absorção no piso — que não mancha com gordura nem molho — e uma parede fácil de limpar atrás do fogão e da pia. Porcelanato retificado 60×60 ou 80×80 no chão e um acabamento acetinado nas paredes entregam higiene, durabilidade e um visual moderno.',
    comoEscolher: [
      'No piso, priorize porcelanato retificado com absorção baixa (≤0,5%): não mancha com molho, café ou gordura.',
      'Acabamento acetinado ou natural no piso evita escorregões perto da pia e do fogão.',
      'Na parede e no backsplash, um acabamento mais liso facilita remover a gordura respingada.',
      'Formatos grandes (80×80) reduzem o rejunte — menos linhas para acumular sujeira.',
      'Tons claros (branco, cinza, bege) ampliam cozinhas compactas.',
    ],
    atributos: {
      acabamento: 'Acetinado / Polido / Natural',
      dimensao: '60×60 cm / 80×80 cm / 20×120 cm',
      ambiente: 'Cozinha (piso e parede)',
    },
    faq: [
      {
        q: 'Qual o melhor revestimento para piso de cozinha?',
        a: 'Porcelanato retificado de baixa absorção (≤0,5%) com acabamento acetinado ou natural: resiste a manchas de gordura e molho, aguenta o tráfego e não escorrega com respingos de água.',
      },
      {
        q: 'Posso usar o mesmo porcelanato no piso e na parede da cozinha?',
        a: 'Sim. Usar a mesma peça cria continuidade visual; na parede é possível optar por um acabamento mais brilhante, já que ela não sofre com pisada nem escorregão.',
      },
      {
        q: 'Revestimento de cozinha mancha com gordura?',
        a: 'Porcelanato esmaltado ou retificado de baixa absorção não mancha se os respingos de óleo e vinho forem limpos no mesmo dia. Evite pedras naturais porosas em cozinhas.',
      },
    ],
    relacionados: ['porcelanato-cozinha', 'piso-cozinha', 'porcelanato-branco'],
  },
  {
    slug: 'revestimento-banheiro',
    termoAlvo: 'revestimento banheiro',
    volume: 720,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    ocasiao: 'banheiro',
    titulo: 'Revestimento de Banheiro em Goiânia: Piso Antiderrapante e Parede Marmorizada',
    intro:
      'Em Goiânia, o revestimento de banheiro ideal une piso antiderrapante — para o pé molhado — e paredes em porcelanato marmorizado ou acetinado, fáceis de limpar e resistentes à umidade constante do box. A combinação certa evita escorregões, mofo no rejunte e dá ao banheiro um acabamento de alto padrão.',
    comoEscolher: [
      'No piso, escolha porcelanato antiderrapante (classe R10 ou superior) para segurança com o pé molhado.',
      'Nas paredes, marmorizado ou acetinado transmitem sofisticação e limpam fácil.',
      'Prefira baixa absorção de água para resistir à umidade constante do box.',
      'Rejunte epóxi ou de boa qualidade evita mofo e mancha nas juntas.',
      'Peças grandes na parede reduzem o rejunte e ampliam banheiros pequenos.',
    ],
    atributos: {
      acabamento: 'Acetinado / Marmorizado',
      antiderrapante: true,
      dimensao: '60×60 cm / 30×90 cm',
      ambiente: 'Banheiro (piso antiderrapante + parede)',
    },
    faq: [
      {
        q: 'Qual revestimento usar no piso do banheiro?',
        a: 'Porcelanato antiderrapante (R10 ou superior) de baixa absorção. O acabamento natural ou acetinado é mais seguro que o polido em áreas molhadas.',
      },
      {
        q: 'Porcelanato marmorizado pode ir na parede do banheiro?',
        a: 'Sim, é uma das escolhas mais pedidas: o marmorizado dá aparência de alto padrão, resiste à umidade e limpa com facilidade. Deixe o antiderrapante para o piso.',
      },
      {
        q: 'Como evitar mofo no rejunte do banheiro?',
        a: 'Use rejunte epóxi ou de boa qualidade, com peças grandes para reduzir juntas, e garanta ventilação. Porcelanato de baixa absorção não retém água como materiais porosos.',
      },
    ],
    relacionados: ['porcelanato-banheiro', 'piso-banheiro', 'porcelanato-antiderrapante'],
  },
  {
    slug: 'piso-banheiro',
    termoAlvo: 'piso para banheiro',
    volume: 590,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    ocasiao: 'banheiro',
    titulo: 'Piso para Banheiro em Goiânia: Porcelanato Antiderrapante que Não Escorrega',
    intro:
      'O piso ideal para banheiro em Goiânia é o porcelanato antiderrapante de baixa absorção: seguro com o pé molhado, impermeável à umidade e fácil de higienizar. A classificação de resistência ao escorregamento R10 ou superior é o critério que separa um piso seguro de um perigoso no box e ao redor da pia.',
    comoEscolher: [
      'Exija classificação antiderrapante R10+ (ou coeficiente de atrito adequado) para a área molhada.',
      'Absorção de água ≤0,5% impede infiltração e mancha por umidade.',
      'Acabamento natural ou acetinado é mais seguro que o polido no piso do banheiro.',
      'No box, peças com mais recorte e rejunte aumentam a aderência do pé.',
      'O caimento correto para o ralo é tão importante quanto a peça — planeje o assentamento.',
    ],
    atributos: {
      acabamento: 'Natural / Acetinado',
      antiderrapante: true,
      dimensao: '60×60 cm / 80×80 cm',
      ambiente: 'Banheiro (piso)',
    },
    faq: [
      {
        q: 'Qual a classe antiderrapante para piso de banheiro?',
        a: 'R10 é o mínimo recomendado para banheiros residenciais; no box ou em banheiros de idosos, R11 aumenta a segurança. O índice deve estar declarado na ficha técnica do fabricante.',
      },
      {
        q: 'Porcelanato polido pode ir no piso do banheiro?',
        a: 'Não é recomendado: o polido fica escorregadio quando molhado. Reserve o polido para paredes ou ambientes secos e use natural ou acetinado antiderrapante no piso.',
      },
    ],
    relacionados: ['porcelanato-banheiro', 'revestimento-banheiro', 'porcelanato-antiderrapante'],
  },
  {
    slug: 'piso-antiderrapante',
    termoAlvo: 'piso antiderrapante',
    volume: 390,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    titulo: 'Piso Antiderrapante em Goiânia: Porcelanato para Áreas Molhadas',
    intro:
      'Piso antiderrapante em Goiânia é indicado para áreas molhadas — banheiro, cozinha, área de serviço, piscina e área externa. O porcelanato antiderrapante tem textura ou tratamento superficial que aumenta a aderência do pé molhado, classificado pelo índice R (de R9 a R13): quanto maior o R, maior a segurança em locais com água.',
    comoEscolher: [
      'Escolha o índice R conforme o local: R10 para banheiro e cozinha, R11+ para bordas de piscina e rampas.',
      'Antiderrapante não significa áspero demais — há acabamentos confortáveis ao pé descalço.',
      'Baixa absorção evita que a água penetre e favoreça o mofo.',
      'Para área externa, some antiderrapante com resistência a UV e à variação térmica.',
      'Confirme na ficha técnica: o índice R deve ser declarado pelo fabricante.',
    ],
    atributos: {
      acabamento: 'Natural / Texturizado',
      antiderrapante: true,
      dimensao: '60×60 cm / 90×90 cm',
      ambiente: 'Áreas molhadas (banheiro, cozinha, piscina, externa)',
    },
    faq: [
      {
        q: 'O que significa a classe R do piso antiderrapante?',
        a: 'É o índice de resistência ao escorregamento medido em rampa inclinada. R9 é o mais baixo; R11, R12 e R13 servem para áreas cada vez mais molhadas e escorregadias, como bordas de piscina e cozinhas industriais.',
      },
      {
        q: 'Piso antiderrapante é difícil de limpar?',
        a: 'A textura acumula um pouco mais de sujeira que o liso, mas o porcelanato antiderrapante moderno limpa normalmente com pano e detergente neutro — o ganho de segurança compensa nas áreas molhadas.',
      },
    ],
    relacionados: ['porcelanato-antiderrapante', 'piso-area-externa', 'porcelanato-piscina'],
  },
  {
    slug: 'porcelanato-preco',
    termoAlvo: 'porcelanato preço',
    volume: 260,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Preço de Porcelanato em Goiânia: O que Define Quanto Custa o m²',
    intro:
      'O preço do porcelanato em Goiânia varia conforme tipo, formato, acabamento, resistência técnica e marca — de linhas de entrada a produtos premium como marmorizados e grandes formatos. O custo da obra também inclui argamassa, rejunte, recorte e mão de obra. Para o valor fechado, peça um orçamento com a metragem real e aproveite pontas de estoque com pronta-entrega no polo de Goiânia.',
    comoEscolher: [
      'Formato: peças grandes (80×80, 90×90) e retificadas custam mais que o 60×60 comum.',
      'Acabamento: marmorizado e polido tendem a ser mais caros que natural e acetinado.',
      'Classe técnica: maior resistência à abrasão (uso pesado) eleva o preço.',
      'Marca e lote: promoções e pontas de estoque reduzem bastante o m².',
      'Some 10% de sobra para recortes e compare o custo total, não só o m².',
    ],
    atributos: {
      acabamento: 'Todos os acabamentos',
      dimensao: '60×60 cm / 80×80 cm',
      ambiente: 'Referência de investimento',
    },
    faq: [
      {
        q: 'Quanto custa o m² de porcelanato em Goiânia?',
        a: 'Depende do tipo, formato, acabamento e marca — a faixa vai de linhas econômicas a premium. Peça um orçamento com a metragem da sua obra para o valor exato; pontas de estoque e promoções reduzem bastante o m².',
      },
      {
        q: 'O que encarece o porcelanato?',
        a: 'Formato grande, peça retificada, acabamento marmorizado ou polido, alta resistência à abrasão e marca importada são os fatores que mais elevam o preço.',
      },
      {
        q: 'Vale a pena comprar o porcelanato mais barato?',
        a: 'Para ambientes de baixo tráfego, sim. Para áreas de uso intenso (cozinha, corredor, comércio), priorize a resistência à abrasão — economizar na classe técnica sai caro na durabilidade.',
      },
    ],
    relacionados: ['piso-porcelanato', 'porcelanato-amadeirado', 'loja-porcelanato-goiania'],
  },
  {
    slug: 'porcelanato-bege',
    termoAlvo: 'porcelanato bege',
    volume: 210,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    titulo: 'Porcelanato Bege em Goiânia: Tons Neutros que Ampliam o Ambiente',
    intro:
      'O porcelanato bege é a escolha de quem quer um ambiente claro, quente e atemporal em Goiânia. Tons areia, cru e off-white ampliam visualmente salas e quartos, combinam com qualquer paleta de móveis e disfarçam poeira melhor que o branco puro — disponíveis em acabamentos acetinado, marmorizado e amadeirado.',
    comoEscolher: [
      'Para salas e quartos, o bege acetinado ou marmorizado traz aconchego sem escurecer.',
      'Formatos grandes (80×80, 90×90) valorizam o tom neutro e reduzem o rejunte.',
      'Escolha o rejunte na mesma tonalidade para um piso de aparência contínua.',
      'Em áreas de passagem, prefira acabamento que disfarce marcas de pisada.',
      'O bege casa com madeira, preto e verde — versátil para uma reforma futura.',
    ],
    atributos: {
      acabamento: 'Acetinado / Marmorizado',
      dimensao: '60×60 cm / 80×80 cm / 90×90 cm',
      ambiente: 'Sala, quarto, ambientes integrados',
    },
    faq: [
      {
        q: 'Porcelanato bege amarela ou desbota com o tempo?',
        a: 'Porcelanato de qualidade não desbota: a cor é vitrificada na peça. O bege apenas parece "amarelar" quando mal iluminado — escolha o tom sob a luz real do ambiente antes de fechar.',
      },
      {
        q: 'Bege ou branco: qual escolher para a sala?',
        a: 'O branco amplia mais e é mais clean, mas mostra toda poeira e pisada. O bege mantém a sensação de amplitude com mais aconchego e disfarça melhor o dia a dia.',
      },
    ],
    relacionados: ['porcelanato-branco', 'porcelanato-marmorizado', 'porcelanato-acetinado'],
  },
  {
    slug: 'piso-cozinha',
    termoAlvo: 'piso para cozinha',
    volume: 210,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'genérico',
    ocasiao: 'cozinha',
    titulo: 'Piso para Cozinha em Goiânia: Porcelanato Resistente e Fácil de Limpar',
    intro:
      'O melhor piso para cozinha em Goiânia é o porcelanato retificado de baixa absorção: não mancha com gordura, café ou molho, resiste ao tráfego e limpa com pano úmido. O acabamento acetinado ou natural evita escorregões perto da pia, e formatos grandes deixam menos rejunte para acumular sujeira.',
    comoEscolher: [
      'Baixa absorção (≤0,5%) é o critério nº 1 contra as manchas típicas da cozinha.',
      'Acetinado ou natural para não escorregar com respingos de água e óleo.',
      'Resistência à abrasão média ou alta aguenta o tráfego da cozinha.',
      'Peças 80×80 ou 60×60 retificadas reduzem o rejunte e facilitam a limpeza.',
      'Tons claros ampliam; tons médios disfarçam o uso do dia a dia.',
    ],
    atributos: {
      acabamento: 'Acetinado / Natural',
      dimensao: '60×60 cm / 80×80 cm',
      ambiente: 'Cozinha (piso)',
    },
    faq: [
      {
        q: 'Qual porcelanato não mancha na cozinha?',
        a: 'O porcelanato retificado de baixa absorção (≤0,5%) não mancha se os respingos forem limpos no dia. Evite pedras naturais porosas e acabamentos muito claros sem tratamento.',
      },
      {
        q: 'Pode usar porcelanato polido no piso da cozinha?',
        a: 'Não é o ideal: o polido fica escorregadio com água e óleo. Prefira acetinado ou natural no piso e deixe o polido, se quiser, para a parede.',
      },
    ],
    relacionados: ['porcelanato-cozinha', 'revestimento-cozinha', 'porcelanato-retificado'],
  },
  {
    slug: 'piso-area-externa',
    termoAlvo: 'piso área externa',
    volume: 210,  // real Goiás (DataForSEO 2026-07-01)
    tipo: 'antiderrapante',
    ocasiao: 'área externa',
    titulo: 'Piso para Área Externa em Goiânia: Antiderrapante e Resistente ao Sol',
    intro:
      'O piso para área externa em Goiânia precisa ser antiderrapante, resistente à variação de temperatura e ao sol forte do Centro-Oeste. Porcelanato para exterior com classe R11 ou superior garante segurança em áreas molhadas — piscina, quintal, garagem — enquanto a baixa absorção evita infiltração e o desbotamento após anos de exposição.',
    comoEscolher: [
      'Índice antiderrapante R11 ou superior em bordas de piscina, rampas e áreas molhadas.',
      'Resistência a UV para não desbotar sob o sol forte de Goiânia.',
      'Baixa absorção evita infiltração e mancha por chuva e umidade.',
      'Porcelanato amadeirado externo dá clima aconchegante a varandas e áreas gourmet.',
      'Se houver churrasqueira, confira também a resistência a manchas de gordura.',
    ],
    atributos: {
      acabamento: 'Natural / Texturizado',
      antiderrapante: true,
      dimensao: '60×60 cm / 90×90 cm',
      ambiente: 'Área externa, quintal, garagem, piscina',
    },
    faq: [
      {
        q: 'Qual porcelanato usar em área externa exposta ao sol?',
        a: 'Um porcelanato para exterior com resistência a UV (não desbota), baixa absorção (não infiltra) e antiderrapante R11+. Confirme os três atributos na ficha técnica antes de comprar.',
      },
      {
        q: 'Porcelanato de área externa esquenta muito ao sol?',
        a: 'Tons claros esquentam menos que os escuros. Em áreas de piscina para uso descalço, prefira cores claras e acabamento texturizado, que reflete mais calor e aumenta a aderência.',
      },
    ],
    relacionados: ['porcelanato-area-externa', 'porcelanato-piscina', 'piso-antiderrapante'],
  },

  // ──────── Por marca (ciclo 2, validado 2026-07-03): fundo de funil de marca ────────
  // Savane (10/mês) e variações "+goiânia" (null) reprovadas no piso ≥ 200 — não publicar.
  {
    slug: 'porcelanato-biancogres',
    termoAlvo: 'porcelanato biancogres',
    volume: 390, // real Goiás: "biancogres" (DataForSEO 2026-07-03); "porcelanato biancogres" = 70
    tipo: 'genérico',
    titulo: 'Porcelanato BIANCOGRES em Goiânia: Catálogo e Preços',
    intro:
      'A BIANCOGRES é a marca com mais opções no polo de Goiânia: 18 modelos em pronta-entrega, do marmorizado polido de 120×120 cm ao amadeirado 20×120 cm, passando por linhas externas antiderrapantes. Preços entre R$ 90,99 e R$ 139,99 por m², todos retificados, com orçamento na hora pelo WhatsApp.',
    comoEscolher: [
      'Para sala e hall de alto padrão, as linhas marmorizadas (Marmo Perla, Cristallo Quartz, Tivoli, Pulpis) em 100×100 ou 120×120 cm valorizam as veias contínuas.',
      'Para clima de madeira sem manutenção, o Carvalho Natural 20×120 cm e o Castilla Noce simulam tábua corrida.',
      'Para área externa, garagem e borda de piscina, as versões Externo (Grigio, Arezzo) têm acabamento antiderrapante.',
      'Linhas urbanas (Chicago, Legado) em Mate/Acetinado seguram o dia a dia de cozinha e áreas de tráfego intenso.',
      'Todos os modelos são retificados: rejunte fino e assentamento alinhado — confira a dimensão na ficha de cada produto.',
    ],
    atributos: {
      acabamento: 'Polido / Acetinado / Mate / Natural / Externo',
      dimensao: '80×80 cm a 120×120 cm (e 20×120 cm amadeirado)',
    },
    faq: [
      {
        q: 'Onde comprar porcelanato BIANCOGRES em Goiânia?',
        a: 'No polo de Goiânia, conectamos você ao fornecedor exclusivo com 18 modelos BIANCOGRES em pronta-entrega — marmorizados, amadeirados e linhas externas. Orçamento pelo WhatsApp com preço real por m².',
      },
      {
        q: 'Quanto custa o porcelanato BIANCOGRES?',
        a: 'No catálogo do polo de Goiânia, os modelos BIANCOGRES vão de R$ 90,99 a R$ 139,99 por m², conforme linha, formato e acabamento. O preço exato de cada modelo está na página do produto.',
      },
      {
        q: 'Porcelanato BIANCOGRES é retificado?',
        a: 'Sim — todos os modelos BIANCOGRES do catálogo são retificados, com bordas a 90° que permitem rejunte fino (1,5 a 2 mm) e visual contínuo.',
      },
      {
        q: 'Qual linha BIANCOGRES usar em área externa?',
        a: 'As versões com acabamento Externo — como Grigio Externo (90×90 cm) e Arezzo Externo — têm superfície antiderrapante própria para quintal, garagem e área de piscina.',
      },
    ],
    relacionados: ['porcelanato-delta', 'porcelanato-marmorizado', 'porcelanato-amadeirado', 'porcelanato-preco'],
  },
  {
    slug: 'porcelanato-delta',
    termoAlvo: 'delta porcelanato',
    volume: 260, // real Goiás: "delta porcelanato" (DataForSEO 2026-07-03); "porcelanato delta" = 140
    tipo: 'genérico',
    titulo: 'Porcelanato Delta em Goiânia: Modelos Polidos e Preços',
    intro:
      'A Delta é a porta de entrada do porcelanato polido no polo de Goiânia: modelos retificados a partir de R$ 67,99 por m², nos formatos 62×62, 72×72 e 60×120 cm. Brilho de polido com o melhor custo por metro do catálogo — orçamento na hora pelo WhatsApp.',
    comoEscolher: [
      'O Madrid Bloc 60×120 cm é a escolha para salas amplas: formato retangular grande com veia marmorizada.',
      'Nero Polido (62×62 ou 72×72 cm) cria contraste dramático em salas e halls; combine com rejunte grafite.',
      'Avorio Polido é o tom claro que amplia ambientes menores mantendo o brilho de polido.',
      'Polido no piso pede cuidado em áreas molhadas — para cozinha e banheiro, considere usar na parede.',
      'Todos retificados: rejunte fino e alinhamento contínuo entre as peças.',
    ],
    atributos: {
      acabamento: 'Polido',
      dimensao: '62×62 cm / 72×72 cm / 60×120 cm',
    },
    faq: [
      {
        q: 'Onde comprar porcelanato Delta em Goiânia?',
        a: 'Conectamos você ao fornecedor do polo de Goiânia com os modelos Delta polidos em pronta-entrega (Madrid Bloc, Nero, Avorio). Orçamento com preço real por m² pelo WhatsApp.',
      },
      {
        q: 'Quanto custa o porcelanato Delta?',
        a: 'No catálogo do polo de Goiânia, os modelos Delta vão de R$ 67,99 a R$ 144,99 por m² — entre os melhores custos por metro em porcelanato polido retificado.',
      },
      {
        q: 'Porcelanato Delta polido escorrega?',
        a: 'Como todo polido, a superfície fica escorregadia molhada. Use em ambientes internos secos (sala, quarto, hall); para áreas molhadas, prefira acabamento acetinado ou natural.',
      },
      {
        q: 'Porcelanato Delta é retificado?',
        a: 'Sim — os modelos Delta do catálogo são retificados, permitindo rejunte fino e visual contínuo no assentamento.',
      },
    ],
    relacionados: ['porcelanato-biancogres', 'porcelanato-polido', 'porcelanato-preco'],
  },
];

// ponytail: mapa para lookup por slug em O(1)
export const pagesBySlug = new Map(pages.map((p) => [p.slug, p]));
