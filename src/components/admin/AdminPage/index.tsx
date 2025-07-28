import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PlatformSettings from '../PlatformSettings';
import type { PlatformConfig } from '../../../lib/firebase';
import MenuSettings from '../MenuSettings';
import InfoSettings from '../InfoSettings';
import ReadmeSettings from '../ReadmeSettings';
import styles from './AdminPage.module.css';
import AdminBurgerMenu from '../AdminBurgerMenu';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'platform' | 'menu' | 'info' | 'readme'
  >('platform');
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

    // Хакерский звуковой эффект (опционально)
    if (typeof window !== 'undefined') {
      // Можно добавить звук терминала или убрать совсем
      // const audio = new Audio('terminal-beep.mp3');
      // audio.volume = 0.3;
      // audio.play().catch(() => {});
    }

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
    if (activeTab === 'readme') content = <ReadmeSettings />;
    return (
      <div className={styles.wrapper}>
        <AdminBurgerMenu
          activeTab={activeTab}
          onTabChange={tabId =>
            setActiveTab(tabId as 'platform' | 'menu' | 'info' | 'readme')
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
      <div className={styles.loginContainer}>
        {/* Пиксельная надпись Corner Web */}
        <div className={styles.hackerLogo}>
          <pre className={styles.asciiArt}>
            {` ██████╗ ██████╗ ██████╗ ███╗   ██╗███████╗██████╗ 
██╔════╝██╔═══██╗██╔══██╗████╗  ██║██╔════╝██╔══██╗
██║     ██║   ██║██████╔╝██╔██╗ ██║█████╗  ██████╔╝
██║     ██║   ██║██╔══██╗██║╚██╗██║██╔══╝  ██╔══██╗
╚██████╗╚██████╔╝██║  ██║██║ ╚████║███████╗██║  ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝`}
          </pre>
          <div className={styles.webText}>WEB</div>
        </div>

        <h2 className={styles.title}>Вход в панель управления</h2>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Имя</label>
          <input
            type='text'
            placeholder='Enter username'
            value={username}
            onChange={e => setUsername(e.target.value)}
            className={styles.input}
            autoFocus
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Пароль</label>
          <input
            type='password'
            placeholder='Enter password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>

        <button
          type='submit'
          disabled={loading || !username || !password}
          className={styles.button}
        >
          {loading ? 'Заходим...' : 'Войти'}
        </button>

        {error && <div className={styles.errorMsg}>{error}</div>}
      </div>
    </form>
  );
}
