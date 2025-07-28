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
    { label: 'PLATFORM SETTINGS', id: 'platform' },
    { label: 'MENU SETTINGS', id: 'menu' },
    { label: 'INFO SETTINGS', id: 'info' },
    { label: 'README', id: 'readme' },
  ];

  return (
    <>
      <button
        className={styles.burger}
        aria-label='Open admin menu'
        onClick={() => setOpen(!open)}
      >
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
      </button>
      <nav className={open ? styles.menuOpen : styles.menuClosed}>
        <div className={styles.terminalHeader}>
          <span className={styles.terminalTitle}>ADMIN TERMINAL</span>
          <span className={styles.terminalStatus}>ONLINE</span>
        </div>
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
                <span className={styles.tabPrefix}>$</span>
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.commandSection}>
          <button
            className={styles.adminBtnMain}
            onClick={() => {
              router.push('/');
              setOpen(false);
            }}
          >
            <span className={styles.commandPrefix}>{'>'}</span>
            GO TO MAIN
          </button>
          <button
            className={styles.adminBtnLogout}
            onClick={() => {
              if (onLogout) onLogout();
              setOpen(false);
            }}
          >
            <span className={styles.commandPrefix}>!</span>
            LOGOUT
          </button>
        </div>
      </nav>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)} />
      )}
    </>
  );
}
