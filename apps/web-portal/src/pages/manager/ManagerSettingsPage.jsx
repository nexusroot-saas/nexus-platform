import { useState, useEffect } from 'react';
import ManagerLayout from '../../components/ManagerLayout.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../hooks/useAuth.js';

const TENANT_TYPE_LABEL = {
  MED: 'NexusMed — Clínica Médica', CLIN: 'NexusClin — Estética/Spa',
  ODONTO: 'NexusOdonto — Odontologia', LAB: 'NexusLab — Laboratório',
  IMG: 'NexusIMG — Centro de Imagem', ADM: 'NexusAdm — Gestão Administrativa',
};

const MODULE_LABEL = {
  NEXUSMED: 'NexusMed', NEXUSCLIN: 'NexusClin', NEXUSODONTO: 'NexusOdonto',
  NEXUSLAB: 'NexusLab', NEXUSIMG: 'NexusIMG', NEXUSLEGAL: 'NexusLegal', NEXUSADM: 'NexusAdm',
};

export default function ManagerSettingsPage() {
  const { user } = useAuth();
  const { get, patch } = useApi();

  const [settings, setSettings] = useState(null);
  const [form, setForm]         = useState({ nome_fantasia: '', razao_social: '', config_branding: {} });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    get('/manager/settings')
      .then(res => {
        setSettings(res.data);
        setForm({
          nome_fantasia:  res.data.nome_fantasia  || '',
          razao_social:   res.data.razao_social   || '',
          config_branding: res.data.config_branding || {},
        });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await patch('/manager/settings', form);
      setSettings(prev => ({ ...prev, ...res.data }));
      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function setBranding(key, value) {
    setForm(prev => ({ ...prev, config_branding: { ...prev.config_branding, [key]: value } }));
  }

  if (loading) {
    return (
      <ManagerLayout title="Configurações">
        <div style={{ padding: 20 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 16, borderRadius: 8 }} />)}
        </div>
      </ManagerLayout>
    );
  }

  return (
    <ManagerLayout title="Configurações da Unidade">
      <div style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 4 }}>Configurações</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
          Gerencie os dados e identidade visual da sua unidade.
        </p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠ {error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}

        <form onSubmit={handleSubmit}>

          {/* Dados da empresa */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Dados da empresa</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Nome fantasia</label>
                <input className="form-input" value={form.nome_fantasia} onChange={e => setForm(p => ({ ...p, nome_fantasia: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Razão social</label>
                <input className="form-input" value={form.razao_social} onChange={e => setForm(p => ({ ...p, razao_social: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Identidade visual</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">URL da logomarca</label>
                <input className="form-input" value={form.config_branding?.logo_url || ''} onChange={e => setBranding('logo_url', e.target.value)} placeholder="https://minha-clinica.com.br/logo.png" />
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  Aparece no cabeçalho do sistema, laudos e receitas.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Cor de destaque (hex)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={form.config_branding?.primary_color || '#1a6cff'}
                    onChange={e => setBranding('primary_color', e.target.value)}
                    style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--border-2)', cursor: 'pointer', padding: 2 }} />
                  <input className="form-input" value={form.config_branding?.primary_color || '#1a6cff'}
                    onChange={e => setBranding('primary_color', e.target.value)}
                    placeholder="#1a6cff" style={{ maxWidth: 140 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Cor do tema da interface</span>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Endereço / telefone (rodapé de documentos)</label>
                <input className="form-input" value={form.config_branding?.address || ''} onChange={e => setBranding('address', e.target.value)} placeholder="Rua das Flores, 123 — (67) 3000-0000" />
              </div>
            </div>
          </div>

          {/* Informações somente leitura */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header"><span className="card-title">Informações da conta</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Tipo de plataforma', value: TENANT_TYPE_LABEL[settings?.tenant_type] || settings?.tenant_type },
                  { label: 'Status da conta',    value: settings?.status },
                  { label: 'Módulos ativos',     value: (settings?.active_modules || []).map(m => MODULE_LABEL[m] || m).join(', ') || '—' },
                  { label: 'CNPJ',               value: settings?.cnpj || '—' },
                  { label: 'ID da conta',         value: settings?.id, mono: true },
                  { label: 'Cadastro em',         value: settings?.created_at ? new Date(settings.created_at).toLocaleDateString('pt-BR') : '—' },
                ].map(({ label, value, mono }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'var(--font-mono)' : undefined, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
                Para alterar tipo de plataforma, módulos ou CNPJ, entre em contato com o suporte Nexus.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
              {saving ? 'Salvando…' : 'Salvar configurações'}
            </button>
          </div>
        </form>
      </div>
    </ManagerLayout>
  );
}
