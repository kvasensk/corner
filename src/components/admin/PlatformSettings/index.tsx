import { useState, useEffect } from 'react';
import IOSSwitch from '../../../uikit/IOSSwitch';
import NumberInput from '../../../uikit/NumberInput';
import IconButton from '../../../uikit/IconButton';
import styles from './PlatformSettings.module.css';
import { usePlatformConfig } from '../../../lib/PlatformConfigContext';

export type PlatformConfig = {
  showMenuTab: boolean;
  showInfoTab: boolean;
  gameDuration: number; // в минутах
  manualQueue: boolean;
};

export default function PlatformSettings() {
  const { config, setConfig, loading, error } = usePlatformConfig();
  const [saving, setSaving] = useState(false);
  const [durationDraft, setDurationDraft] = useState<string>('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setDurationDraft(config.gameDuration.toString());
    }
  }, [config]);

  const handleChange = (field: keyof PlatformConfig) => async () => {
    if (!config) return;
    const newConfig = { ...config, [field]: !config[field] };
    setConfig(newConfig);
    setSaving(true);
    try {
      const res = await fetch('/api/platformConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error();
    } catch {
      // setError('Ошибка сохранения'); // This line was removed
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDuration = async () => {
    if (!config || durationDraft === '') return;
    setSaving(true);
    try {
      let num = Number(durationDraft);
      if (isNaN(num)) num = config.gameDuration;
      num = Math.max(5, Math.min(60, num));
      const newConfig = { ...config, gameDuration: num };
      setConfig(newConfig);
      const res = await fetch('/api/platformConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setDurationDraft(num.toString());
    } catch {
      // setError('Ошибка сохранения'); // This line was removed
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
        <div className={styles.settingRow}>
          <span className={styles.label}>Ручное управление очередью</span>
          <IOSSwitch
            checked={config.manualQueue}
            onChange={handleChange('manualQueue')}
            disabled={saving}
          />
        </div>
        <div className={styles.settingRow}>
          <span className={styles.label}>Время игры (мин):</span>
          <div className={styles.inputGroup}>
            <div className={styles.inputHint}>от 5 до 60 минут</div>
            <NumberInput
              value={durationDraft}
              min={5}
              max={60}
              onChange={v => setDurationDraft(v.replace(/[^\d]/g, ''))}
              disabled={saving || config.manualQueue}
            />
            <IconButton
              icon={
                saved ? (
                  <svg width='22' height='22' viewBox='0 0 22 22' fill='none'>
                    <circle cx='11' cy='11' r='11' fill='#a0e89b' />
                    <path
                      d='M6 12.5L10 16L16 8'
                      stroke='#1746d3'
                      strokeWidth='2.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                ) : (
                  <svg width='22' height='22' viewBox='0 0 22 22' fill='none'>
                    <circle cx='11' cy='11' r='11' fill='#e75480' />
                    <path
                      d='M6 12.5L10 16L16 8'
                      stroke='#fff'
                      strokeWidth='2.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                )
              }
              onClick={handleSaveDuration}
              success={saved}
              disabled={
                Number(durationDraft) === config.gameDuration ||
                saving ||
                config.manualQueue
              }
              aria-label='Сохранить время игры'
            />
          </div>
        </div>
        {config.manualQueue && (
          <div
            className={styles.inputHint}
            style={{ color: '#e75480', marginTop: 4 }}
          >
            Время игры отключено в ручном режиме
          </div>
        )}
      </div>
      {saving && <div className={styles.saving}>Сохраняем...</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
