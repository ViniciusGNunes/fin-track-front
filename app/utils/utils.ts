export interface IEnumOptions<T = string|number> {
  label: string;
  value: T;
}

const PT_BR_TRANSLATIONS: Record<string, string> = {
  // Payment methods
  Cash: "Dinheiro",
  CreditCard: "Cartão de Crédito",
  DebitCard: "Cartão de Débito",
  BankTransfer: "Transferência / PIX",
  Pix: "PIX",
  Boleto: "Boleto Bancário",
  Other: "Outro",

  // Recurrence intervals
  Daily: "Diário",
  Weekly: "Semanal",
  Monthly: "Mensal",
  Yearly: "Anual",
  Quarterly: "Trimestral",
  SemiAnnually: "Semestral",

  // Periods
  Day: "Diário",
  Week: "Semanal",
  TwoWeeks: "Quinzenal",
  Month: "Mensal",
  Year: "Anual",

  // Time categories
  Last: "Anterior",
  Current: "Atual",
  Next: "Próximo",
  Future: "Futuro",
  Past: "Passado",

  // Transaction / Goal / Debt Status
  Active: "Ativo",
  Completed: "Concluído",
  Cancelled: "Cancelado",
  Pending: "Pendente",
  Paid: "Pago",
  Overdue: "Em Atraso",
  OnTrack: "No Ritmo",
  BehindPace: "Abaixo da Meta",
  OverBudget: "Acima do Orçamento",
};

/**
 * Returns natural, coherent Portuguese labels for TimeCategory based on the selected TimePeriod.
 * E.g., for Month: "Mês Passado", "Mês Atual", "Próximo Mês"
 * E.g., for Week: "Semana Passada", "Semana Atual", "Próxima Semana"
 * E.g., for Day: "Ontem", "Hoje", "Amanhã"
 * E.g., for Year: "Ano Passado", "Ano Atual", "Próximo Ano"
 */
export function getTimeCategoryLabel(categoryVal: number | string, periodVal: number | string): string {
  const cat = Number(categoryVal);
  const per = Number(periodVal);

  // TimeCategory: 1 = Last, 2 = Current, 3 = Next
  // TimePeriod: 1 = Day, 2 = Week, 3 = TwoWeeks, 4 = Month, 5 = Year

  if (per === 1) { // Day
    if (cat === 1) return "Ontem";
    if (cat === 2) return "Hoje";
    if (cat === 3) return "Amanhã";
  }

  if (per === 2) { // Week
    if (cat === 1) return "Semana Passada";
    if (cat === 2) return "Esta Semana";
    if (cat === 3) return "Próxima Semana";
  }

  if (per === 3) { // TwoWeeks
    if (cat === 1) return "Quinzena Passada";
    if (cat === 2) return "Esta Quinzena";
    if (cat === 3) return "Próxima Quinzena";
  }

  if (per === 4) { // Month
    if (cat === 1) return "Mês Passado";
    if (cat === 2) return "Este Mês";
    if (cat === 3) return "Próximo Mês";
  }

  if (per === 5) { // Year
    if (cat === 1) return "Ano Passado";
    if (cat === 2) return "Este Ano";
    if (cat === 3) return "Próximo Ano";
  }

  // Fallback
  if (cat === 1) return "Anterior";
  if (cat === 2) return "Atual";
  if (cat === 3) return "Próximo";

  return "Atual";
}

/**
 * Returns natural, coherent Portuguese labels for TimePeriod options.
 */
export function getTimePeriodLabel(periodVal: number | string): string {
  const per = Number(periodVal);
  switch (per) {
    case 1:
      return "Por Dia";
    case 2:
      return "Por Semana";
    case 3:
      return "Por Quinzena";
    case 4:
      return "Por Mês";
    case 5:
      return "Por Ano";
    default:
      return "Por Mês";
  }
}

export function camelToNormalCase(str: string): string {
  if (!str) return "";
  if (PT_BR_TRANSLATIONS[str]) {
    return PT_BR_TRANSLATIONS[str];
  }

  return (
    str
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .replace(/^./, (char) => char.toUpperCase())
  );
}

export function EnumToList<E extends Record<string, string | number>>(enumObj: E): IEnumOptions[]{
  const items:IEnumOptions[] = Object.keys(enumObj)
    .filter((key) => isNaN(Number(key)))
    .map((key) => ({
      label: PT_BR_TRANSLATIONS[key] || camelToNormalCase(key),
      value: enumObj[key]
    }));

  return items;
}

 