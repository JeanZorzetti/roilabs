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
    volume: 1900,
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
    volume: 1600,
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
    volume: 1200,
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
    volume: 1100,
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
    volume: 2400,
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
    volume: 880,
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
    volume: 720,
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
    volume: 660,
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
    volume: 540,
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
    volume: 390,
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
    volume: 480,
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
    volume: 320,
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
    volume: 290,
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
    volume: 260,
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
    volume: 310,
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
    volume: 280,
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
    volume: 240,
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
    volume: 220,
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
    volume: 190,
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
    volume: 1800,
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
    volume: 1300,
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
    volume: 980,
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
    volume: 870,
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
    volume: 740,
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
    volume: 1400,
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
    volume: 1100,
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
    volume: 890,
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
    volume: 760,
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
    volume: 580,
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
    volume: 430,
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
];

// ponytail: mapa para lookup por slug em O(1)
export const pagesBySlug = new Map(pages.map((p) => [p.slug, p]));
