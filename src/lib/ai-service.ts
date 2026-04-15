// src/universes/dinero/lib/ai-service.ts

export const aiFinancialService = {
  async categorizeWithAI(rawTransactions: any[], userCategories: any[]) {
    // Simulamos el retraso de pensar de la IA
    await new Promise(resolve => setTimeout(resolve, 800));

    return rawTransactions.map(t => {
      const desc = t.description.toUpperCase();
      let category = 'General';

      // Lógica de "AI Semántica" por contexto de NZ
      if (desc.includes('COUNTDOWN') || desc.includes('PAKN') || desc.includes('NEW WORLD') || desc.includes('SUPERMARKET')) {
        category = 'Groceries & Supermarket';
      } else if (desc.includes('NETFLIX') || desc.includes('SPOTIFY') || desc.includes('DISNEY') || desc.includes('PRIME')) {
        category = 'Entertainment & Subscriptions';
      } else if (desc.includes('SHELL') || desc.includes('Z ENERGY') || desc.includes('AT HOP') || desc.includes('BP ')) {
        category = 'Transportation';
      } else if (desc.includes('WAREHOUSE') || desc.includes('PB TECH') || desc.includes('NOEL LEEMING') || desc.includes('BUNNINGS')) {
        category = 'Work & IT';
      } else if (desc.includes('RESTAURANT') || desc.includes('CAFE') || desc.includes('UBER EATS') || desc.includes('MCDONALDS') || desc.includes('KFC')) {
        category = 'Dining out';
      } else if (desc.includes('GYM') || desc.includes('FITNESS') || desc.includes('PHARMACY') || desc.includes('CHEMIST')) {
        category = 'Health & Fitness';
      } else if (desc.includes('POWER') || desc.includes('WATER') || desc.includes('SPARK') || desc.includes('VODAFONE') || desc.includes('ONE NZ')) {
        category = 'Housing & Utilities';
      }

      return {
        ...t,
        suggestedCategory: category,
        confidence: 0.9,
      };
    });
  }
};