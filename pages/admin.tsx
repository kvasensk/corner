import { useState, useEffect } from 'react';
import {
  authorizeAdmin,
  getPlatformConfig,
  setPlatformConfig,
  PlatformConfig,
} from '../src/lib/firebase';
import AdminBurgerMenu from '../src/components/admin/AdminBurgerMenu';
import { useRouter } from 'next/router';
import MenuEditor from '../src/components/admin/MenuEditor';

function IOSSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        width: 44,
        height: 26,
        verticalAlign: 'middle',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{
          opacity: 0,
          width: 44,
          height: 26,
          margin: 0,
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span
        style={{
          display: 'block',
          width: 44,
          height: 26,
          borderRadius: 16,
          background: checked ? '#e75480' : '#eee',
          boxShadow: checked ? '0 0 0 2px #ffb6d5' : '0 0 0 1px #ccc',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            display: 'block',
            position: 'absolute',
            left: checked ? 22 : 4,
            top: 4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px #e7548033',
            transition: 'left 0.2s',
            border: checked ? '2px solid #fd1d86' : '2px solid #ccc',
          }}
        />
      </span>
    </span>
  );
}

function PlatformSettings() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getPlatformConfig()
      .then(cfg => setConfig(cfg))
      .catch(() => setError('Ошибка загрузки настроек'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof PlatformConfig) => async () => {
    if (!config) return;
    const newConfig = { ...config, [field]: !config[field] };
    setConfig(newConfig);
    setSaving(true);
    setError('');
    try {
      await setPlatformConfig(newConfig);
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div style={{ color: '#7c1fa0', padding: 32 }}>Загрузка настроек...</div>
    );
  if (!config)
    return (
      <div style={{ color: '#fd1d86', padding: 32 }}>
        Не удалось загрузить настройки
      </div>
    );

  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <h3 style={{ color: '#e75480', marginBottom: 24 }}>
        Настройки платформы
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          alignItems: 'flex-start',
          justifyContent: 'center',
          maxWidth: 340,
          margin: '0 auto',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '1.1rem',
            width: '100%',
          }}
        >
          <IOSSwitch checked disabled />
          <span style={{ color: '#bbb' }}>Очередь (всегда включено)</span>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '1.1rem',
            width: '100%',
          }}
        >
          <IOSSwitch
            checked={config.showMenuTab}
            onChange={handleChange('showMenuTab')}
            disabled={saving}
          />
          <span style={{ color: '#171717' }}>Меню</span>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '1.1rem',
            width: '100%',
          }}
        >
          <IOSSwitch
            checked={config.showInfoTab}
            onChange={handleChange('showInfoTab')}
            disabled={saving}
          />
          <span style={{ color: '#171717' }}>Инфо</span>
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '1.1rem',
            width: '100%',
          }}
        >
          <IOSSwitch
            checked={config.showClientBurger}
            onChange={handleChange('showClientBurger')}
            disabled={saving}
          />
          <span style={{ color: '#171717' }}>Клиентский бургер-меню</span>
        </label>
      </div>
      {saving && (
        <div style={{ color: '#7c1fa0', marginTop: 16 }}>Сохраняем...</div>
      )}
      {error && <div style={{ color: '#fd1d86', marginTop: 16 }}>{error}</div>}
    </div>
  );
}

function MenuSettings() {
  return <MenuEditor />;
}
function InfoSettings() {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center', color: '#7c1fa0' }}>
      Настройки инфо (скоро)
    </div>
  );
}

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'platform' | 'menu' | 'info'>(
    'platform'
  );
  const [platformConfig, setPlatformConfigState] =
    useState<PlatformConfig | null>(null);
  const isAdmin = true;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('isAdmin') === 'true') {
        setIsAuth(true);
      }
    }
    getPlatformConfig().then(setPlatformConfigState);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ok = await authorizeAdmin(username, password);
      if (ok) {
        setIsAuth(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdmin', 'true');
        }
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (err) {
      setError('Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuth(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdmin');
    }
  };

  if (isAuth) {
    let content = null;
    if (activeTab === 'platform') content = <PlatformSettings />;
    if (activeTab === 'menu') content = <MenuSettings />;
    if (activeTab === 'info') content = <InfoSettings />;
    return (
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        <AdminBurgerMenu
          activeTab={activeTab}
          onTabChange={tabId =>
            setActiveTab(tabId as 'platform' | 'menu' | 'info')
          }
          showClientBurger={
            platformConfig ? platformConfig.showClientBurger : true
          }
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
        <div style={{ marginLeft: 0, paddingTop: 48 }}>{content}</div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 320,
        margin: '64px auto',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px #b0306022',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <h2 style={{ color: '#e75480', marginBottom: 8 }}>
        Вход для администратора
      </h2>
      <input
        type='text'
        placeholder='Логин'
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #ffb6d5',
          fontSize: '1.1rem',
        }}
        autoFocus
      />
      <input
        type='password'
        placeholder='Пароль'
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #ffb6d5',
          fontSize: '1.1rem',
        }}
      />
      <button
        type='submit'
        disabled={loading || !username || !password}
        style={{
          background: '#e75480',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 0',
          fontSize: '1.1rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px #e7548033',
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>
      {error && (
        <div style={{ color: '#fd1d86', fontWeight: 500 }}>{error}</div>
      )}
    </form>
  );
}
