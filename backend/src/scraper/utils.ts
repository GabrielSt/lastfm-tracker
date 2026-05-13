// Utilitários gerais do scraper (sem Cheerio — usamos API JSON)

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
