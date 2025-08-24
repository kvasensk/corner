/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import styles from './PlatformSettings.module.css';
import ImageUploader from '../ImageUploader';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
// import { db } from '../../../lib/firebase';
import { usePlatformConfig } from '../../../lib/PlatformConfigContext';
import type { PlatformConfig } from '../../../lib/firebase';
import ColorSchemeModal from './ColorSchemeModal';

export default function PlatformSettings() {
  const { config, setConfig, loading, error } = usePlatformConfig();
  const [saving, setSaving] = useState(false);
  const [durationDraft, setDurationDraft] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [cronStatus, setCronStatus] = useState<{
    isRunning: boolean;
    hasInterval: boolean;
  } | null>(null);
  const [, setCronLoading] = useState(false); // reserved for UI spinners
  const [nightlyCronStatus, setNightlyCronStatus] = useState<{
    isRunning: boolean;
    hasTimeout: boolean;
  } | null>(null);
  const [, setNightlyCronLoading] = useState(false); // reserved for UI spinners

  useEffect(() => {
    if (config) {
      setDurationDraft(config.gameDuration.toString());
    }
  }, [config]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.manualQueue, cronStatus]);

  // Автоматически запускаем ночной cron при загрузке
  useEffect(() => {
    if (nightlyCronStatus !== null && !nightlyCronStatus.isRunning) {
      handleNightlyCronAction('start');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <span className={styles.terminalTitle}>Управление приложением</span>
      </div>

      <div className={styles.settingsList}>
        <div className={styles.settingRow}>
          <span className={styles.label}>Цветовая схема</span>
          <button
            className={styles.saveButton}
            onClick={() => setColorModalOpen(true)}
            aria-haspopup='dialog'
            aria-expanded={colorModalOpen}
          >
            Настройки цветовой схемы
          </button>
        </div>

        <div className={styles.sectionTitle}>Редактирование логотипа</div>
        <div className={styles.logoCard}>
          {config.customLogoUrl ? (
            <div className={styles.logoPreviewWrap}>
              <img
                src={config.customLogoUrl}
                alt='Логотип'
                className={styles.logoPreview}
              />
            </div>
          ) : null}
          <div
            className={styles.logoControls}
            style={{ gridColumn: config.customLogoUrl ? undefined : '1 / -1' }}
          >
            <div className={styles.logoBtnsRow}>
              <ImageUploader
                value={config.customLogoUrl}
                showPreview={false}
                onUpload={async url => {
                  const newCfg = {
                    ...config,
                    customLogoUrl: url,
                  } as PlatformConfig;
                  setConfig(newCfg);
                }}
              />
              {config.customLogoUrl && (
                <button
                  className={styles.saveButton}
                  onClick={() =>
                    setConfig({
                      ...(config as PlatformConfig),
                      customLogoUrl: '',
                    })
                  }
                >
                  Удалить
                </button>
              )}
            </div>
            {config.customLogoUrl && (
              <div className={styles.logoToggleRow}>
                <span className={styles.label}>Отображать</span>
                <div className={styles.switchContainer}>
                  <label className={styles.switch}>
                    <input
                      type='checkbox'
                      checked={!!config.useCustomLogo}
                      onChange={() =>
                        setConfig({
                          ...(config as PlatformConfig),
                          useCustomLogo: !config.useCustomLogo,
                        })
                      }
                      disabled={saving}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.statusText}>
                    {config.useCustomLogo ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.inputHint}>
          Рекомендуем использовать PNG с прозрачным фоном. Отображение в меню и
          очереди: 40 × 40/ 40 x 120.
        </div>
        <div className={styles.settingRow}>
          <span className={styles.label}>Показывать кнопку меню</span>
          <div className={styles.switchContainer}>
            <label className={styles.switch}>
              <input
                type='checkbox'
                checked={config.showMenuTab}
                onChange={handleChange('showMenuTab')}
                disabled={saving}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.statusText}>
              {config.showMenuTab ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span className={styles.label}>
            Управление очередью любым игроком
          </span>
          <div className={styles.switchContainer}>
            <label className={styles.switch}>
              <input
                type='checkbox'
                checked={config.manualQueue}
                onChange={handleChange('manualQueue')}
                disabled={saving}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.statusText}>
              {config.manualQueue ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <span
            className={config.manualQueue ? styles.labelDisabled : styles.label}
          >
            Время на партию:
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
              5-60 минут
            </div>
            <input
              type='number'
              value={durationDraft}
              min={5}
              max={60}
              onChange={e =>
                setDurationDraft(e.target.value.replace(/[^\d]/g, ''))
              }
              disabled={saving || config.manualQueue}
              className={styles.input}
            />
            <button
              onClick={handleSaveDuration}
              disabled={
                Number(durationDraft) === config.gameDuration ||
                saving ||
                config.manualQueue
              }
              className={styles.saveButton}
              aria-label='Save game duration'
            >
              {saved ? '✓' : 'SAVE'}
            </button>
          </div>
        </div>

        {config.manualQueue && (
          <div className={styles.warningMsg}>
            ⚠️ Ограничение времени на партию отключено в режиме ручного
            управления
          </div>
        )}

        <div className={styles.settingRow}>
          <span className={styles.label}>Автономный контроль очереди</span>
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
          <span className={styles.label}>Очистка очереди в 1:30</span>
          <div className={styles.statusContainer}>
            <span className={styles.statusIndicator}>{'🟢'}</span>
            <span className={styles.statusText}>{'ACTIVE'}</span>
          </div>
        </div>
      </div>
      <div className={styles.updatesWrap}>
        <h3>Обновления:</h3>
        <ul>
          <li>
            Меню: фикс перетаскивания разделов/товаров — тогглы, подсветка,
            панель под шапкой, возможность скрыть каждую позицию отдельно
          </li>
          <li>
            Очередь: пользаки управляют теперь своими записями, запрет 2-й
            записи подряд (кроме админа)
          </li>
          <li>Логотип: кастомное лого приложения, высота 40px</li>
        </ul>
      </div>
      {saving && <div className={styles.saving}>SAVING CONFIGURATION...</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}
      <ColorSchemeModal
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
      />
    </div>
  );
}
