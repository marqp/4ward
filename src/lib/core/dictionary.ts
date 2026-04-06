// Lista expandida de termos médicos e siglas comuns no Brasil para otimização do algoritmo de compressão (deflate)
export const MEDICAL_DICTIONARY_STR = [
  // Frases de Normalidade (Exame Físico)
  "paciente relata", "nega comorbidades", "lúcido e orientado", "tempo e espaço",
  "ausculta cardíaca", "ritmo regular", "dois tempos", "bulhas normofonéticas",
  "sem sopros", "ausculta pulmonar", "murmúrio vesicular", "presente bilateralmente",
  "sem ruídos adventícios", "abdome flácido", "indolor à palpação", "ruídos hidroaéreos",
  "membros inferiores", "sem edemas", "pulsos presentes", "sinais vitais",
  "pressão arterial", "frequência cardíaca", "frequência respiratória", "saturação de oxigênio",
  "estado geral", "bom estado", "corado", "hidratado", "acianótico", "anictérico",
  "febril", "afebril", "sem queixas", "ao exame físico", "sinais vitais estáveis",
  "pupilas isocóricas", "fotorreagentes", "orientado em tempo", "orientado em espaço",
  "nega alergias", "medicamentos em uso", "hipertensão arterial", "diabetes mellitus",
  "dislipidemia", "tabagismo", "etilismo", "sedentarismo", "história pregressa",
  "exames laboratoriais", "sem alterações", "quadro clínico", "hipótese diagnóstica",
  "conduta médica", "aguardar exames", "estável", "prognóstico", "encaminhamento",
  "solicito avaliação", "urgência", "emergência", "anamnese", "evolução médica",

  // Siglas Médicas Onipresentes (Brasil)
  "BEG", "REG", "MEG", "LUC", "LOTESA", "RCR", "2T", "BNF", "MV+", "RA-", "RHA+",
  "HAS", "DM2", "ICC", "IAM", "AVC", "DPOC", "DRC", "IRC", "DUM", "NPO", "ACM", "SN",
  "PA", "FC", "FR", "SatO2", "T", "GCS", "DLP", "TEV", "TVP", "TEP", "HDA", "HDB",

  // Termos de Evolução e Queixas
  "queixa principal", "história da moléstia atual", "história patológica pregressa",
  "história familiar", "interrogatório sintomático", "exame físico", "hipótese diagnóstica",
  "plano terapêutico", "conduta", "encaminho ao", "solicito exames", "aguarda resultados",
  "estável hemodynamicamente", "ventilação espontânea", "ar ambiente", "cateter de O2",
  "diurese presente", "evacuação presente", "aceitando dieta", "sono e repouso",
  "dor abdominal", "cefaléia", "dispneia", "tosse seca", "expectoração", "disúria",
  "náuseas e vômitos", "astenia", "mialgia", "artralgia", "prurido", "edema de MMII",

  // Achados Específicos de Exame
  "linfonodos não palpáveis", "sem visceromegalias", "espaço de Traube livre",
  "Giordano negativo", "sinal de Blumberg ausente", "sinal de Murphy ausente",
  "extremidades bem perfundidas", "enchimento capilar", "pulsos periféricos",
  "panturrilhas livres", "bandeira negativo", "homans negativo", "sem déficits focais",
  "pares cranial preservados", "força muscular grau 5", "sensibilidade preservada",

  // Medicamentos e Vias
  "em uso de", "posologia", "via oral", "intravenosa", "subcutânea", "intramuscular",
  "soroterapia", "antibioticoterapia", "analgesia", "antiemético", "anti-hipertensivo",
  "hipoglicemiante", "anticoagulante", "prescrevo", "mantenho conduta", "alta hospitalar",
  "transferência", "unidade de terapia intensiva", "leito de enfermaria", "pronto atendimento",

  // Expressões Adicionais
  "apresenta melhora", "apresenta piora", "quadro mantido", "sem intercorrências",
  "no período", "reavaliado", "discussão com equipe", "visto pela equipe de",
  "segue em acompanhamento", "retorno em", "dias", "horas", "agendado", "urgente"
].join("\n");

// Converter para Uint8Array para uso direto no zlib/deflate
export const DICTIONARY_BIN = new TextEncoder().encode(MEDICAL_DICTIONARY_STR);
