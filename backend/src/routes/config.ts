import { Router, Request, Response } from 'express';
import { readConfig, writeConfig } from '../storage';
import { Config } from '../types';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const config = readConfig();
  // Não retorna a chave completa — mascara para o frontend
  const safe = {
    ...config,
    apiKey: config.apiKey ? '••••••••••••••••••••••••••••••••' : '',
    apiKeySet: !!config.apiKey,
  };
  res.json(safe);
});

router.post('/', (req: Request, res: Response) => {
  const { username, maxPages, apiKey } = req.body as Partial<Config>;

  if (typeof username !== 'string' || !username.trim()) {
    res.status(400).json({ error: 'username é obrigatório' });
    return;
  }

  const current = readConfig();

  const updated: Config = {
    username: username.trim(),
    apiKey: typeof apiKey === 'string' && apiKey.trim() && !apiKey.startsWith('•')
      ? apiKey.trim()
      : current.apiKey ?? '',
    maxPages: typeof maxPages === 'number' ? maxPages : current.maxPages ?? 0,
    lastSync: current.lastSync,
  };

  writeConfig(updated);

  res.json({
    ...updated,
    apiKey: updated.apiKey ? '••••••••••••••••••••••••••••••••' : '',
    apiKeySet: !!updated.apiKey,
  });
});

export default router;
