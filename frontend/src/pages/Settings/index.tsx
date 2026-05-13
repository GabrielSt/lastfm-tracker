import { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '@/api';
import type { Config } from '@/types';

export default function Settings() {
  const [config, setConfig] = useState<Config>({ username: '', apiKey: '', maxPages: 0 });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getConfig().then(c => {
      setConfig(c);
      setApiKeySet(c.apiKeySet ?? false);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!config.username.trim()) {
      setError('Username é obrigatório');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Partial<Config> & { apiKey?: string } = {
        username: config.username,
        maxPages: config.maxPages,
      };
      // Só envia a API key se o usuário digitou uma nova
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim();
      }
      const updated = await saveConfig(payload);
      setConfig(updated);
      setApiKeySet(updated.apiKeySet ?? false);
      setApiKeyInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-1">Configurações</h1>
      <p className="text-lastfm-muted text-sm mb-8">
        Configure seu perfil do Last.fm para começar a sincronizar.
      </p>

      <div className="space-y-4">
        {/* API Key */}
        <div className="bg-lastfm-card rounded-xl border border-lastfm-border p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">API Key do Last.fm</h2>
            <p className="text-lastfm-muted text-xs">
              Necessária para buscar seus dados. É gratuita e leva menos de 2 minutos para obter.
            </p>
          </div>

          {/* Passo a passo */}
          <ol className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-lastfm-red text-white text-xs flex items-center justify-center font-bold">1</span>
              <span className="text-lastfm-muted">
                Acesse{' '}
                <a
                  href="https://www.last.fm/api/account/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lastfm-red hover:underline"
                >
                  last.fm/api/account/create
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-lastfm-red text-white text-xs flex items-center justify-center font-bold">2</span>
              <span className="text-lastfm-muted">
                Preencha qualquer nome em "Application name" (ex: <em>meu tracker</em>) e submeta
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-lastfm-red text-white text-xs flex items-center justify-center font-bold">3</span>
              <span className="text-lastfm-muted">
                Copie a <strong className="text-white">API key</strong> (não o Shared Secret) e cole abaixo
              </span>
            </li>
          </ol>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              API Key
              {apiKeySet && (
                <span className="ml-2 text-xs text-emerald-400 font-normal">✓ configurada</span>
              )}
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder={apiKeySet ? 'Deixe em branco para manter a atual' : 'Cole sua API key aqui'}
              className="w-full bg-lastfm-dark border border-lastfm-border rounded-lg px-3 py-2 text-white placeholder-lastfm-muted focus:outline-none focus:border-lastfm-red transition-colors font-mono text-sm"
            />
          </div>
        </div>

        {/* Username + configurações */}
        <div className="bg-lastfm-card rounded-xl border border-lastfm-border p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Perfil</h2>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Username do Last.fm
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lastfm-muted text-sm shrink-0">last.fm/user/</span>
              <input
                type="text"
                value={config.username}
                onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
                placeholder="bielnn"
                className="flex-1 bg-lastfm-dark border border-lastfm-border rounded-lg px-3 py-2 text-white placeholder-lastfm-muted focus:outline-none focus:border-lastfm-red transition-colors"
              />
            </div>
            <p className="text-lastfm-muted text-xs mt-1">
              Seu perfil precisa ser público.
            </p>
          </div>

          {/* Max pages */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Limite de páginas por sync
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                value={config.maxPages}
                onChange={e => setConfig(c => ({ ...c, maxPages: parseInt(e.target.value) || 0 }))}
                className="w-20 bg-lastfm-dark border border-lastfm-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lastfm-red transition-colors"
              />
              <span className="text-lastfm-muted text-sm">
                {config.maxPages === 0
                  ? 'Sem limite — pega tudo (pode demorar)'
                  : `${config.maxPages} página${config.maxPages > 1 ? 's' : ''} = até ${config.maxPages * 1000} itens`}
              </span>
            </div>
            <p className="text-lastfm-muted text-xs mt-1">
              0 = sem limite. A API retorna até 1000 itens por página.
            </p>
          </div>

          {/* Last sync */}
          {config.lastSync && (
            <div className="text-xs text-lastfm-muted border-t border-lastfm-border pt-4">
              Última sincronização:{' '}
              <span className="text-white">
                {new Date(config.lastSync).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-lastfm-red hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
