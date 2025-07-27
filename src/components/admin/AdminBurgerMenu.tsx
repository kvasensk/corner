import React from 'react';
import styles from './AdminBurgerMenu.module.css';
import { useRouter } from 'next/router';

interface Tab {
  label: string;
  id: string;
}

interface AdminBurgerMenuProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function AdminBurgerMenu({
  activeTab,
  onTabChange,
  isAdmin = false,
  onLogout,
}: AdminBurgerMenuProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const tabs: Tab[] = [
    { label: 'Настройки платформы', id: 'platform' },
    { label: 'Настройки меню', id: 'menu' },
    { label: 'Настройки инфо', id: 'info' },
  ];

  return (
    <>
      <button
        className={styles.burger}
        aria-label='Открыть меню администратора'
        onClick={() => setOpen(!open)}
      >
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
      </button>
      <nav className={open ? styles.menuOpen : styles.menuClosed}>
        <ul className={styles.tabList}>
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => {
                  onTabChange(tab.id);
                  setOpen(false);
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        <button
          className={styles.adminBtnMain}
          onClick={() => {
            router.push('/');
            setOpen(false);
          }}
        >
          На главную
        </button>
        <button
          className={styles.adminBtnLogout}
          onClick={() => {
            if (onLogout) onLogout();
            setOpen(false);
          }}
        >
          Выйти
        </button>
      </nav>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} />
      )}
    </>
  );
}
