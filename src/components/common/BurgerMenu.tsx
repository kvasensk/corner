import React from 'react';
import styles from './BurgerMenu.module.css';
import { useRouter } from 'next/router';

interface Tab {
  label: string;
  id: string;
  path: string;
}

interface BurgerMenuProps {
  showMenuTab?: boolean;
  showInfoTab?: boolean;
  showClientBurger?: boolean;
  isAdmin?: boolean;
  activeTab: string;
}

export default function BurgerMenu({
  showMenuTab = true,
  showInfoTab = true,
  showClientBurger = true,
  isAdmin = false,
  activeTab,
}: BurgerMenuProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Если не админ и бургер выключен — не показываем вообще
  if (!isAdmin && !showClientBurger) return null;

  const tabs: Tab[] = [
    { label: 'Очередь', id: 'queue', path: '/' },
    ...(showMenuTab ? [{ label: 'Меню', id: 'menu', path: '/menu' }] : []),
    ...(showInfoTab ? [{ label: 'Инфо', id: 'info', path: '/info' }] : []),
  ];

  return (
    <>
      <button
        className={styles.burger}
        aria-label='Открыть меню'
        onClick={() => setOpen(!open)}
      >
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
      </button>
      <nav className={open ? styles.menuOpen : styles.menuClosed}>
        {isAdmin && !showClientBurger && (
          <div className={styles.adminWarning}>
            Бургер-меню скрыто для клиентов.
            <br />
            Включите его в настройках платформы.
          </div>
        )}
        <ul className={styles.tabList}>
          {tabs.map(tab => (
            <li key={tab.id}>
              <button
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
                onClick={() => {
                  router.push(tab.path);
                  setOpen(false);
                }}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        {isAdmin && (
          <button
            className={styles.adminBtn}
            onClick={() => {
              router.push('/admin');
              setOpen(false);
            }}
          >
            Админка
          </button>
        )}
      </nav>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} />
      )}
    </>
  );
}
