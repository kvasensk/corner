import { useState, useEffect } from 'react';
import IOSSwitch from '../../../uikit/IOSSwitch';
import styles from './PlatformSettings.module.css';

export type PlatformConfig = {
  showMenuTab: boolean;
  showInfoTab: boolean;
  showClientBurger: boolean;
};

export default function PlatformSettings() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/platformConfig')
      .then(res => res.json())
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
      const res = await fetch('/api/platformConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>Загрузка настроек...</div>;
  if (!config)
    return <div className={styles.error}>Не удалось загрузить настройки</div>;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Настройки платформы</h3>
      <div className={styles.settingsList}>
        <div className={styles.settingRow}>
          <span className={styles.labelGray}>Очередь (всегда включено)</span>
          <IOSSwitch checked disabled />
        </div>
        <div className={styles.settingRow}>
          <span className={styles.label}>Меню</span>
          <IOSSwitch
            checked={config.showMenuTab}
            onChange={handleChange('showMenuTab')}
            disabled={saving}
          />
        </div>
        <div className={styles.settingRow}>
          <span className={styles.labelGray}>Инфо (в разработке)</span>
          <IOSSwitch
            checked={config.showInfoTab}
            onChange={handleChange('showInfoTab')}
            disabled
          />
        </div>
      </div>
      {saving && <div className={styles.saving}>Сохраняем...</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
