import type { Provider, ModelSummary } from '../../../shared/types/broker';

export function aggregateProvidersByModel(providers: Provider[]): ModelSummary[] {
  const modelMap = new Map<string, Provider[]>();

  for (const provider of providers) {
    const key = provider.model;
    const existing = modelMap.get(key);
    if (existing) {
      existing.push(provider);
    } else {
      modelMap.set(key, [provider]);
    }
  }

  const summaries: ModelSummary[] = [];

  for (const [model, group] of modelMap) {
    const first = group[0];
    const verifiedCount = group.filter(p => p.teeSignerAcknowledged === true).length;

    let inputPriceRange: { min: number; max: number } | null = null;
    let outputPriceRange: { min: number; max: number } | null = null;

    for (const p of group) {
      if (p.inputPrice !== undefined) {
        if (!inputPriceRange) {
          inputPriceRange = { min: p.inputPrice, max: p.inputPrice };
        } else {
          inputPriceRange.min = Math.min(inputPriceRange.min, p.inputPrice);
          inputPriceRange.max = Math.max(inputPriceRange.max, p.inputPrice);
        }
      }
      if (p.outputPrice !== undefined) {
        if (!outputPriceRange) {
          outputPriceRange = { min: p.outputPrice, max: p.outputPrice };
        } else {
          outputPriceRange.min = Math.min(outputPriceRange.min, p.outputPrice);
          outputPriceRange.max = Math.max(outputPriceRange.max, p.outputPrice);
        }
      }
    }

    const serviceType = first.serviceType || 'chatbot';
    if (!first.serviceType && process.env.NODE_ENV === 'development') {
      console.warn(`[modelAggregation] Model "${model}" missing serviceType, defaulting to chatbot`);
    }

    summaries.push({
      model,
      displayName: model,
      serviceType,
      providerCount: group.length,
      verifiedCount,
      inputPriceRange,
      outputPriceRange,
      providers: group,
    });
  }

  summaries.sort((a, b) => b.providerCount - a.providerCount);

  return summaries;
}
