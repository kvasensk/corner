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
  const [cronStatus, setCronStatus] = useState<{
    isRunning: boolean;
    hasInterval: boolean;
  } | null>(null);
  const [cronLoading, setCronLoading] = useState(false);
  const [nightlyCronStatus, setNightlyCronStatus] = useState<{
    isRunning: boolean;
    hasTimeout: boolean;
  } | null>(null);
  const [nightlyCronLoading, setNightlyCronLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setDurationDraft(config.gameDuration.toString());
    }
  }, [config]);

  // Проверяем статус cron при загрузке
  useEffect(() => {
    checkCronStatus();
    checkNightlyCronStatus();
  }, []);

  // Автоматически управляем cron в зависимости от режима очереди
  useEffect(() => {
    if (config && cronStatus !== null) {
      const shouldBeRunning = !config.manualQueue;

      if (shouldBeRunning && !cronStatus.isRunning) {
        // Нужно запустить cron
        handleCronAction('start');
      } else if (!shouldBeRunning && cronStatus.isRunning) {
        // Нужно остановить cron
        handleCronAction('stop');
      }
    }
  }, [config?.manualQueue, cronStatus]);

  // Автоматически запускаем ночной cron при загрузке
  useEffect(() => {
    if (nightlyCronStatus !== null && !nightlyCronStatus.isRunning) {
      handleNightlyCronAction('start');
    }
  }, [nightlyCronStatus]);

  const checkCronStatus = async () => {
    try {
      const response = await fetch('/api/autoCron');
      const data = await response.json();
      setCronStatus(data);
    } catch (error) {
      console.error('Error checking cron status:', error);
    }
  };

  const checkNightlyCronStatus = async () => {
    try {
      const response = await fetch('/api/nightlyCron');
      const data = await response.json();
      setNightlyCronStatus(data);
    } catch (error) {
      console.error('Error checking nightly cron status:', error);
    }
  };

  const handleCronAction = async (action: 'start' | 'stop') => {
    setCronLoading(true);
    try {
      const response = await fetch('/api/autoCron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      console.log(`Cron ${action}:`, data.message);
      await checkCronStatus();
    } catch (error) {
      console.error(`Error ${action}ing cron:`, error);
    } finally {
      setCronLoading(false);
    }
  };

  const handleNightlyCronAction = async (action: 'start' | 'stop') => {
    setNightlyCronLoading(true);
    try {
      const response = await fetch('/api/nightlyCron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      console.log(`Nightly cron ${action}:`, data.message);
      await checkNightlyCronStatus();
    } catch (error) {
      console.error(`Error ${action}ing nightly cron:`, error);
    } finally {
      setNightlyCronLoading(false);
    }
  };

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
      num = Math.max(2, Math.min(60, num));
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
    <div className={styles.container}>
      <div className={styles.terminalHeader}>
        <span className={styles.terminalTitle}>PLATFORM CONFIGURATION</span>
        <span className={styles.terminalStatus}>READY</span>
      </div>

      <div className={styles.settingsList}>
        <div className={styles.settingRow}>
          <span className={styles.label}>MENU TAB:</span>
          <div className={styles.switchContainer}>
            <IOSSwitch
              checked={config.showMenuTab}
              onChange={handleChange('showMenuTab')}
              disabled={saving}
            />
            <span className={styles.statusText}>
              {config.showMenuTab ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.label}>INFO TAB:</span>
          <div className={styles.switchContainer}>
            <IOSSwitch
              checked={config.showInfoTab}
              onChange={handleChange('showInfoTab')}
              disabled={saving}
            />
            <span className={styles.statusText}>
              {config.showInfoTab ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.label}>MANUAL QUEUE:</span>
          <div className={styles.switchContainer}>
            <IOSSwitch
              checked={config.manualQueue}
              onChange={handleChange('manualQueue')}
              disabled={saving}
            />
            <span className={styles.statusText}>
              {config.manualQueue ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span
            className={config.manualQueue ? styles.labelDisabled : styles.label}
          >
            GAME DURATION (MIN):
          </span>
          <div
            className={
              config.manualQueue ? styles.inputGroupDisabled : styles.inputGroup
            }
          >
            <div
              className={
                config.manualQueue ? styles.inputHintDisabled : styles.inputHint
              }
            >
              RANGE: 5-60 MINUTES
            </div>
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
                    <circle cx='11' cy='11' r='11' fill='#00ff00' />
                    <path
                      d='M6 12.5L10 16L16 8'
                      stroke='#000000'
                      strokeWidth='2.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                ) : (
                  <svg width='22' height='22' viewBox='0 0 22 22' fill='none'>
                    <circle cx='11' cy='11' r='11' fill='#ff0000' />
                    <path
                      d='M6 12.5L10 16L16 8'
                      stroke='#ffffff'
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
              aria-label='Save game duration'
            />
          </div>
        </div>

        {config.manualQueue && (
          <div className={styles.warningMsg}>
            ⚠️ GAME DURATION DISABLED IN MANUAL MODE
          </div>
        )}

        <div className={styles.settingRow}>
          <span className={styles.label}>AUTO QUEUE ADVANCEMENT:</span>
          <div className={styles.statusContainer}>
            <span className={styles.statusIndicator}>
              {config?.manualQueue ? '🔴' : '🟢'}
            </span>
            <span className={styles.statusText}>
              {config?.manualQueue ? 'DISABLED' : 'ENABLED'}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.label}>NIGHTLY CLEANUP:</span>
          <div className={styles.statusContainer}>
            <span className={styles.statusIndicator}>
              {nightlyCronStatus?.isRunning ? '🟢' : '🔴'}
            </span>
            <span className={styles.statusText}>
              {nightlyCronStatus?.isRunning ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {saving && <div className={styles.saving}>SAVING CONFIGURATION...</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}
    </div>
  );
}
