import React from 'react';
import ReactDOM from 'react-dom';
import styles from './ColorSchemeModal.module.css';
import { usePlatformConfig } from '../../../lib/PlatformConfigContext';
import type { PlatformConfig } from '../../../lib/firebase';
import IOSSwitch from '../../../uikit/IOSSwitch';

type ColorSchemeModalProps = {
  open: boolean;
  onClose: () => void;
};

type ColorDraft = NonNullable<NonNullable<PlatformConfig['colors']>> & {
  queue: NonNullable<NonNullable<PlatformConfig['colors']>['queue']>;
  menu: NonNullable<NonNullable<PlatformConfig['colors']>['menu']>;
};

function getInitialDraft(cfg: PlatformConfig | null): ColorDraft {
  const base = cfg?.colors || {};
  return {
    useCustomColors: base.useCustomColors ?? false,
    queue: {
      pageBg: base.queue?.pageBg || '#1746d3',
      cardBg1: base.queue?.cardBg1 || '#103ef5',
      cardBg2: base.queue?.cardBg2 || '#2a3e7c',
      text: base.queue?.text || '#ffffff',
      joinButtonBg: base.queue?.joinButtonBg || '#ffd600',
      adminModalBg: base.queue?.adminModalBg || '#ffffff',
      adminModalText: base.queue?.adminModalText || '#222222',
      adminModalTopBtnBg: base.queue?.adminModalTopBtnBg || '#ffd600',
      adminModalTopBtnText: base.queue?.adminModalTopBtnText || '#1746d3',
      adminModalBottomBtnBg: base.queue?.adminModalBottomBtnBg || '#666666',
      adminModalBottomBtnText: base.queue?.adminModalBottomBtnText || '#ffffff',
      infoModalText:
        base.queue?.infoModalText || base.queue?.adminModalText || '#222222',
      logoUseTextColor: !!base.queue?.logoUseTextColor,
    },
    menu: {
      pageBg: base.menu?.pageBg || '#1746d3',
      text: base.menu?.text || '#ffffff',
      logoUseTextColor: !!base.menu?.logoUseTextColor,
    },
  };
}

export default function ColorSchemeModal({
  open,
  onClose,
}: ColorSchemeModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const { config, setConfig } = usePlatformConfig();
  const [draft, setDraft] = React.useState<ColorDraft>(() =>
    getInitialDraft(config)
  );

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (open) setDraft(getInitialDraft(config));
  }, [open, config]);

  if (!open || !mounted) return null;

  const handleSave = () => {
    if (!config) return;
    const next: PlatformConfig = {
      ...config,
      colors: {
        useCustomColors: !!draft.useCustomColors,
        queue: { ...draft.queue },
        menu: { ...draft.menu },
      },
    };
    setConfig(next);
    onClose();
  };

  const disabled = !draft.useCustomColors;

  return ReactDOM.createPortal(
    <div
      className={styles.overlay}
      role='dialog'
      aria-modal='true'
      aria-label='Настройки цветовой схемы'
      onClick={onClose}
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Настройки цветовой схемы</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label='Закрыть модалку'
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.toggleRow}>
            <label className={styles.switchLabel}>
              <span> Кастомные цвета</span>
              <IOSSwitch
                checked={!!draft.useCustomColors}
                onChange={() =>
                  setDraft(d => ({ ...d, useCustomColors: !d.useCustomColors }))
                }
              />
            </label>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Очередь</div>
            <div className={styles.grid} aria-disabled={disabled}>
              <ColorField
                label='Цвет фона'
                value={draft.queue.pageBg || ''}
                onChange={v =>
                  setDraft(d => ({ ...d, queue: { ...d.queue, pageBg: v } }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, pageBg: '#1746d3' },
                  }))
                }
              />
              <ColorField
                label='Цвет фона карточек 1'
                value={draft.queue.cardBg1 || ''}
                onChange={v =>
                  setDraft(d => ({ ...d, queue: { ...d.queue, cardBg1: v } }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, cardBg1: '#103ef5' },
                  }))
                }
              />
              <ColorField
                label='Цвет фона карточки 2'
                value={draft.queue.cardBg2 || ''}
                onChange={v =>
                  setDraft(d => ({ ...d, queue: { ...d.queue, cardBg2: v } }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, cardBg2: '#2a3e7c' },
                  }))
                }
              />
              <ColorField
                label='Цвет текста'
                value={draft.queue.text || ''}
                onChange={v =>
                  setDraft(d => ({ ...d, queue: { ...d.queue, text: v } }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, text: '#ffffff' },
                  }))
                }
              />
              <ColorField
                label="Цвет кнопки 'В очередь'"
                value={draft.queue.joinButtonBg || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, joinButtonBg: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, joinButtonBg: '#ffd600' },
                  }))
                }
              />
              <ColorField
                label='Фон модалки управления очередью'
                value={draft.queue.adminModalBg || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalBg: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalBg: '#ffffff' },
                  }))
                }
              />
              <ColorField
                label='Текст модалки управления очередью'
                value={draft.queue.adminModalText || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalText: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalText: '#222222' },
                  }))
                }
              />
              <ColorField
                label='Текст информационной модалки'
                value={draft.queue.infoModalText || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, infoModalText: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, infoModalText: '#222222' },
                  }))
                }
              />
              <ColorField
                label='Верхняя кнопка модалки очереди'
                value={draft.queue.adminModalTopBtnBg || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalTopBtnBg: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalTopBtnBg: '#ffd600' },
                  }))
                }
              />
              <ColorField
                label='Текст верхней кнопки модалки'
                value={draft.queue.adminModalTopBtnText || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalTopBtnText: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalTopBtnText: '#1746d3' },
                  }))
                }
              />
              <ColorField
                label='Нижняя кнопка модалки очереди'
                value={draft.queue.adminModalBottomBtnBg || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalBottomBtnBg: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalBottomBtnBg: '#666666' },
                  }))
                }
              />
              <ColorField
                label='Текст нижней кнопки модалки'
                value={draft.queue.adminModalBottomBtnText || ''}
                onChange={v =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalBottomBtnText: v },
                  }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    queue: { ...d.queue, adminModalBottomBtnText: '#ffffff' },
                  }))
                }
              />
              <label className={styles.colorField} aria-disabled={disabled}>
                <span className={styles.colorLabel}>
                  Цвет текста для логотипа
                </span>
                <div className={styles.inputRow}>
                  <IOSSwitch
                    checked={!!draft.queue.logoUseTextColor}
                    onChange={() =>
                      setDraft(d => ({
                        ...d,
                        queue: {
                          ...d.queue,
                          logoUseTextColor: !d.queue.logoUseTextColor,
                        },
                      }))
                    }
                    disabled={disabled}
                  />
                </div>
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Меню</div>
            <div className={styles.grid} aria-disabled={disabled}>
              <ColorField
                label='Фон меню'
                value={draft.menu.pageBg || ''}
                onChange={v =>
                  setDraft(d => ({ ...d, menu: { ...d.menu, pageBg: v } }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    menu: { ...d.menu, pageBg: '#1746d3' },
                  }))
                }
              />
              <ColorField
                label='Текст меню'
                value={draft.menu.text || ''}
                onChange={v =>
                  setDraft(d => ({ ...d, menu: { ...d.menu, text: v } }))
                }
                disabled={disabled}
                onReset={() =>
                  setDraft(d => ({
                    ...d,
                    menu: { ...d.menu, text: '#ffffff' },
                  }))
                }
              />
              <label className={styles.colorField} aria-disabled={disabled}>
                <span className={styles.colorLabel}>
                  Цвет текста для логотипа
                </span>
                <div className={styles.inputRow}>
                  <IOSSwitch
                    checked={!!draft.menu.logoUseTextColor}
                    onChange={() =>
                      setDraft(d => ({
                        ...d,
                        menu: {
                          ...d.menu,
                          logoUseTextColor: !d.menu.logoUseTextColor,
                        },
                      }))
                    }
                    disabled={disabled}
                  />
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <button
            className={styles.primaryBtn}
            onClick={handleSave}
            aria-label='Сохранить и закрыть'
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ColorField({
  label,
  value,
  onChange,
  disabled,
  onReset,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onReset?: () => void;
}) {
  return (
    <label className={styles.colorField} aria-disabled={disabled}>
      <span className={styles.colorLabel}>{label}</span>
      <div className={styles.inputRow}>
        <input
          type='color'
          className={styles.colorInput}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          aria-label={label}
        />
        <input
          type='text'
          className={styles.hexInput}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          aria-label={`${label} (hex)`}
        />
        {onReset && (
          <button
            type='button'
            className={styles.resetBtn}
            onClick={onReset}
            aria-label={`Восстановить цвет: ${label}`}
            disabled={disabled}
            title='Сбросить к стандартному'
          >
            ↺
          </button>
        )}
      </div>
    </label>
  );
}
