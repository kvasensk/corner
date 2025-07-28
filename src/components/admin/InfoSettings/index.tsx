import React, { useState, useEffect } from 'react';
import styles from './InfoSettings.module.css';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface InfoSettings {
  useDescription: boolean;
  description: string;
}

export default function InfoSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [automaticSettings, setAutomaticSettings] = useState<InfoSettings>({
    useDescription: true,
    description: 'За помощью можно обратиться к Бариста.',
  });
  const [manualSettings, setManualSettings] = useState<InfoSettings>({
    useDescription: true,
    description:
      'Пожалуйста, завершите свою игру в очереди после окончания партии.',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Загружаем automatic settings
      const automaticDoc = await getDoc(doc(db, 'info', 'automatic'));
      if (automaticDoc.exists()) {
        setAutomaticSettings(automaticDoc.data() as InfoSettings);
      }

      // Загружаем manual settings
      const manualDoc = await getDoc(doc(db, 'info', 'manual'));
      if (manualDoc.exists()) {
        setManualSettings(manualDoc.data() as InfoSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (mode: 'automatic' | 'manual') => {
    if (saving) return;

    setSaving(true);
    try {
      const settings =
        mode === 'automatic' ? automaticSettings : manualSettings;
      const newSettings = {
        ...settings,
        useDescription: !settings.useDescription,
      };

      await setDoc(doc(db, 'info', mode), newSettings);

      if (mode === 'automatic') {
        setAutomaticSettings(newSettings);
      } else {
        setManualSettings(newSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDescriptionChange = (
    mode: 'automatic' | 'manual',
    description: string
  ) => {
    if (description.length > 250) return; // Ограничение 250 символов

    const settings = mode === 'automatic' ? automaticSettings : manualSettings;
    const newSettings = {
      ...settings,
      description,
    };

    if (mode === 'automatic') {
      setAutomaticSettings(newSettings);
    } else {
      setManualSettings(newSettings);
    }
  };

  const handleSaveAutomatic = async () => {
    if (saving) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'info', 'automatic'), automaticSettings);
    } catch (error) {
      console.error('Error saving automatic settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = async () => {
    if (saving) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'info', 'manual'), manualSettings);
    } catch (error) {
      console.error('Error saving manual settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>LOADING INFO SETTINGS...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.terminalHeader}>
        <div className={styles.terminalTitle}>INFO SETTINGS</div>
        <div className={styles.terminalStatus}>ONLINE</div>
      </div>

      <div className={styles.settingsList}>
        {/* Automatic Mode */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>AUTOMATIC MODE</div>
          <div className={styles.settingRow}>
            <div className={styles.label}>USE DESCRIPTION</div>
            <div className={styles.switchContainer}>
              <label className={styles.switch}>
                <input
                  type='checkbox'
                  checked={automaticSettings.useDescription}
                  onChange={() => handleToggle('automatic')}
                  disabled={saving}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.statusText}>
                {automaticSettings.useDescription ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.label}>DESCRIPTION</div>
            <div className={styles.textAreaContainer}>
              <textarea
                value={automaticSettings.description}
                onChange={e =>
                  handleDescriptionChange('automatic', e.target.value)
                }
                disabled={saving || !automaticSettings.useDescription}
                className={`${styles.textArea} ${
                  !automaticSettings.useDescription
                    ? styles.textAreaDisabled
                    : ''
                }`}
                placeholder='Enter description for automatic mode...'
                rows={Math.max(
                  3,
                  Math.ceil(automaticSettings.description.length / 50)
                )}
                maxLength={250}
              />
              <div className={styles.charCount}>
                {automaticSettings.description.length}/250 characters
              </div>
            </div>
          </div>
          <div className={styles.saveButtonContainer}>
            <button
              className={styles.saveButton}
              onClick={handleSaveAutomatic}
              disabled={saving}
            >
              {saving ? 'SAVING...' : 'SAVE AUTOMATIC'}
            </button>
          </div>
        </div>

        {/* Manual Mode */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>MANUAL MODE</div>
          <div className={styles.settingRow}>
            <div className={styles.label}>USE DESCRIPTION</div>
            <div className={styles.switchContainer}>
              <label className={styles.switch}>
                <input
                  type='checkbox'
                  checked={manualSettings.useDescription}
                  onChange={() => handleToggle('manual')}
                  disabled={saving}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.statusText}>
                {manualSettings.useDescription ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <div className={styles.settingRow}>
            <div className={styles.label}>DESCRIPTION</div>
            <div className={styles.textAreaContainer}>
              <textarea
                value={manualSettings.description}
                onChange={e =>
                  handleDescriptionChange('manual', e.target.value)
                }
                disabled={saving || !manualSettings.useDescription}
                className={`${styles.textArea} ${
                  !manualSettings.useDescription ? styles.textAreaDisabled : ''
                }`}
                placeholder='Enter description for manual mode...'
                rows={Math.max(
                  3,
                  Math.ceil(manualSettings.description.length / 50)
                )}
                maxLength={250}
              />
              <div className={styles.charCount}>
                {manualSettings.description.length}/250 characters
              </div>
            </div>
          </div>
          <div className={styles.saveButtonContainer}>
            <button
              className={styles.saveButton}
              onClick={handleSaveManual}
              disabled={saving}
            >
              {saving ? 'SAVING...' : 'SAVE MANUAL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
