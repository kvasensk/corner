/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import styles from './SupportGoal.module.css';
import Image from 'next/image';
import cornerLogo from '../../../public/assets/images/logo.png';
import { usePlatformConfig } from '../../lib/PlatformConfigContext';
import { useRouter } from 'next/router';
import {
  getSupportScheme,
  setSupportScheme,
  isAdminOwner,
  type SupportScheme,
} from '../../lib/firebase';
import ImageUploader from '../admin/ImageUploader';

export default function SupportGoal() {
  const { config: platformConfig } = usePlatformConfig();
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<SupportScheme | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payLink, setPayLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const adminStatus =
          typeof window !== 'undefined' &&
          localStorage.getItem('isAdmin') === 'true';
        const username =
          typeof window !== 'undefined'
            ? localStorage.getItem('adminUsername') || ''
            : '';
        const ownerInDb = await isAdminOwner(username);
        if (mounted) {
          setIsOwner(Boolean(adminStatus && ownerInDb));
        }

        const loaded = await getSupportScheme();
        if (mounted) {
          setScheme(loaded);
          setTitle(loaded?.title || '');
          setDescription(loaded?.description || '');
          setPayLink(loaded?.payLink || '');
          setImageUrl(loaded?.imageUrl || '');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setSupportScheme({ title, description, payLink, imageUrl });
      const updated = await getSupportScheme();
      setScheme(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    setSaving(true);
    try {
      await setSupportScheme({ title, description, payLink, imageUrl: '' });
      const updated = await getSupportScheme();
      setScheme(updated);
      setImageUrl('');
    } finally {
      setSaving(false);
    }
  };

  const useCustom = platformConfig?.colors?.useCustomColors;
  const mColors = platformConfig?.colors?.menu;

  return (
    <div
      className={styles.page}
      style={{
        background: useCustom ? mColors?.pageBg : undefined,
        color: useCustom ? mColors?.text : undefined,
      }}
    >
      <div className={styles.header}>
        <div className={styles.logo}>
          {platformConfig?.useCustomLogo && platformConfig?.customLogoUrl ? (
            <img
              src={platformConfig.customLogoUrl}
              alt='Logo'
              className={styles.customLogoImg}
              style={{
                WebkitMaskImage:
                  useCustom && mColors?.logoUseTextColor
                    ? `url(${platformConfig.customLogoUrl})`
                    : undefined,
                maskImage:
                  useCustom && mColors?.logoUseTextColor
                    ? `url(${platformConfig.customLogoUrl})`
                    : undefined,
                WebkitMaskRepeat:
                  useCustom && mColors?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                maskRepeat:
                  useCustom && mColors?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                WebkitMaskSize:
                  useCustom && mColors?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                maskSize:
                  useCustom && mColors?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                WebkitMaskPosition:
                  useCustom && mColors?.logoUseTextColor ? 'center' : undefined,
                maskPosition:
                  useCustom && mColors?.logoUseTextColor ? 'center' : undefined,
                backgroundColor:
                  useCustom && mColors?.logoUseTextColor
                    ? mColors?.text || '#ffffff'
                    : undefined,
              }}
            />
          ) : (
            <Image
              src={cornerLogo}
              alt='Corner Coffee Spot Logo'
              width={112}
              height={63}
              className={styles.logoImage}
              style={{
                WebkitMaskImage:
                  useCustom && mColors?.logoUseTextColor
                    ? `url(${
                        (cornerLogo as unknown as { src: string }).src || ''
                      })`
                    : undefined,
                maskImage:
                  useCustom && mColors?.logoUseTextColor
                    ? `url(${
                        (cornerLogo as unknown as { src: string }).src || ''
                      })`
                    : undefined,
                WebkitMaskRepeat:
                  useCustom && mColors?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                maskRepeat:
                  useCustom && mColors?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                WebkitMaskSize:
                  useCustom && mColors?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                maskSize:
                  useCustom && mColors?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                WebkitMaskPosition:
                  useCustom && mColors?.logoUseTextColor ? 'center' : undefined,
                maskPosition:
                  useCustom && mColors?.logoUseTextColor ? 'center' : undefined,
                backgroundColor:
                  useCustom && mColors?.logoUseTextColor
                    ? mColors?.text || '#ffffff'
                    : undefined,
              }}
            />
          )}
        </div>
        <div className={styles.menu}>
          <button
            className={styles.menuActive}
            style={{
              color: useCustom ? mColors?.text : undefined,
            }}
            onClick={() => router.push('/')}
          >
            Очередь
          </button>
          <button
            className={styles.menuActive}
            style={{
              color: useCustom ? mColors?.text : undefined,
            }}
            onClick={() => router.push('/menu')}
          >
            Меню
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <>
            {isOwner ? (
              <div className={styles.adminControls}>
                <div className={styles.ownerHint}>Режим редактирования</div>
                <div className={styles.adminForm}>
                  <ImageUploader
                    value={imageUrl}
                    onUpload={url => setImageUrl(url)}
                  />
                  {imageUrl ? (
                    <div className={styles.imageActionsRow}>
                      <button
                        className={styles.createButton}
                        onClick={handleRemoveImage}
                        disabled={saving}
                        type='button'
                      >
                        Удалить картинку
                      </button>
                    </div>
                  ) : null}
                  <input
                    type='text'
                    placeholder='Название'
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={styles.textInput}
                  />
                  <textarea
                    placeholder='Описание'
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className={styles.textarea}
                  />
                  <input
                    type='url'
                    placeholder='Ссылка для оплаты (pay link)'
                    value={payLink}
                    onChange={e => setPayLink(e.target.value)}
                    className={styles.textInput}
                  />
                  <div className={styles.actionsRow}>
                    <button
                      className={styles.createButton}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Сохраняем...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className={styles.goalsList}>
              {scheme ? (
                <div className={styles.goalCard}>
                  {scheme.imageUrl ? (
                    <img
                      src={scheme.imageUrl}
                      alt='support visual'
                      className={styles.supportImage}
                    />
                  ) : null}
                  <p className={styles.goalTitle}>{scheme.title}</p>
                  <p className={styles.goalDescription}>{scheme.description}</p>
                  {scheme.payLink ? (
                    <div className={styles.spacedTop}>
                      <button
                        className={styles.createButton}
                        onClick={() => router.push(scheme.payLink)}
                      >
                        Продолжить
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <h2>Поддержать</h2>
                  <p>
                    {isOwner
                      ? 'Заполните название, описание и ссылку для оплаты.'
                      : 'Владелец ещё не настроил страницу поддержки.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
