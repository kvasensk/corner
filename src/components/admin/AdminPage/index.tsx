import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PlatformSettings from '../PlatformSettings';
import type { PlatformConfig } from '../PlatformSettings';
import MenuSettings from '../MenuSettings';
import InfoSettings from '../InfoSettings';
import styles from './AdminPage.module.css';
import AdminBurgerMenu from '../AdminBurgerMenu';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'platform' | 'menu' | 'info'>(
    'platform'
  );
  const isAdmin = true;
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('isAdmin') === 'true') {
        setIsAuth(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/authorizeAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      const ok = data.ok;
      if (ok) {
        setIsAuth(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('isAdmin', 'true');
          router.push('/');
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
      router.push('/');
    }
  };

  if (isAuth) {
    let content = null;
    if (activeTab === 'platform') content = <PlatformSettings />;
    if (activeTab === 'menu') content = <MenuSettings />;
    if (activeTab === 'info') content = <InfoSettings />;
    return (
      <div className={styles.wrapper}>
        <AdminBurgerMenu
          activeTab={activeTab}
          onTabChange={tabId =>
            setActiveTab(tabId as 'platform' | 'menu' | 'info')
          }
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
        <div className={styles.content}>{content}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>Вход для администратора</h2>
      <input
        type='text'
        placeholder='Логин'
        value={username}
        onChange={e => setUsername(e.target.value)}
        className={styles.input}
        autoFocus
      />
      <input
        type='password'
        placeholder='Пароль'
        value={password}
        onChange={e => setPassword(e.target.value)}
        className={styles.input}
      />
      <button
        type='submit'
        disabled={loading || !username || !password}
        className={styles.button}
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>
      {error && <div className={styles.errorMsg}>{error}</div>}
    </form>
  );
}
