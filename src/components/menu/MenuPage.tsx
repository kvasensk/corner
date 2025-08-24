/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from 'react';
import { getMenuItems } from '../../lib/firebase';
import type { MenuItem } from '../../types/menu';
import MenuSection from './MenuSection';
import styles from './MenuPage.module.css';
// import Link from 'next/link';
import Image from 'next/image';
import logo from '../../../public/assets/images/logo.png';
import { usePlatformConfig } from '../../lib/PlatformConfigContext';
import { db } from '../../lib/firebase';
import {
  writeBatch,
  doc,
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import IOSSwitch from '../../uikit/IOSSwitch';

export default function MenuPage() {
  const { config: platformConfig } = usePlatformConfig();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editMode, setEditMode] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [sectionsDragEnabled, setSectionsDragEnabled] = React.useState(false);
  const [itemsDragEnabled, setItemsDragEnabled] = React.useState(false);
  const [visibilityManageEnabled, setVisibilityManageEnabled] =
    React.useState(false);
  const [typeDocs, setTypeDocs] = useState<
    {
      id?: string;
      value: string;
      label: string;
      bevereges_price?: boolean;
      sections?: { value: string; label: string; order?: number }[];
    }[]
  >([]);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }
  }, []);
  // При выходе из режима редактирования скрываем инструменты и выключаем режимы
  React.useEffect(() => {
    if (!editMode) {
      setSectionsDragEnabled(false);
      setItemsDragEnabled(false);
      setVisibilityManageEnabled(false);
    }
  }, [editMode]);

  // При выходе из режима редактирования скрываем инструменты и выключаем DnD
  React.useEffect(() => {
    if (!editMode) {
      setSectionsDragEnabled(false);
    }
  }, [editMode]);
  useEffect(() => {
    getMenuItems().then(rawItems => {
      setItems(
        (rawItems as Partial<MenuItem>[]).map(item => ({
          id: item.id || '',
          name: item.name || '',
          description: item.description || '',
          picture: item.picture || '',
          price: item.price || '',
          price02: item.price02 || '',
          price03: item.price03 || '',
          type: item.type || '',
          section: item.section || '',
          order: typeof item.order === 'number' ? item.order : 0,
          visible:
            typeof (item as { visible?: boolean }).visible === 'boolean'
              ? (item as { visible?: boolean }).visible!
              : true,
        }))
      );
    });
  }, []);

  // Load type docs for labels and pricing behavior
  useEffect(() => {
    async function fetchTypes() {
      const snap = await getDocs(collection(db, 'menu', 'types', 'types'));
      type RawTypeDoc = {
        value: string;
        label: string;
        bevereges_price?: boolean;
        sections?: { value: string; label: string; order?: number }[];
      };
      const docs = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as RawTypeDoc),
      }));
      setTypeDocs(
        docs.map(d => ({
          id: d.id,
          value: d.value,
          label: d.label,
          bevereges_price:
            typeof d.bevereges_price === 'boolean' ? d.bevereges_price : false,
          sections: Array.isArray(d.sections) ? d.sections : [],
        }))
      );
    }
    fetchTypes();
  }, []);

  const getTypeDocByValue = React.useCallback(
    (value: string) => typeDocs.find(t => t.value === value),
    [typeDocs]
  );

  // helper kept for future use; currently naming comes from typeDocs directly

  const isDrinkLike = React.useCallback(
    (typeValue: string): boolean => {
      const doc = getTypeDocByValue(typeValue);
      return !!doc?.bevereges_price;
    },
    [getTypeDocByValue]
  );

  // Build map: type -> array of sections with their items
  const itemsByTypeSection = useMemo(() => {
    const map = new Map<string, Map<string, MenuItem[]>>();
    for (const it of items) {
      const t = it.type || 'unknown';
      const s = it.section || 'unknown';
      if (!map.has(t)) map.set(t, new Map());
      const inner = map.get(t)!;
      const arr = inner.get(s) || [];
      arr.push(it);
      inner.set(s, arr);
    }
    return map;
  }, [items]);

  // Плоский список всех разделов (независимо от типов), отсортированный по глобальному order
  const flatSections = useMemo(() => {
    const list: {
      typeValue: string;
      sectionValue: string;
      title: string;
      order: number;
      onePriceColumn: boolean;
      showVolumeHeader: boolean;
      isVisible: boolean;
      items: MenuItem[];
    }[] = [];
    for (const t of typeDocs) {
      const secs = (t.sections || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      for (const s of secs) {
        const isVisible =
          typeof (s as { visible?: boolean }).visible === 'boolean'
            ? (s as { visible?: boolean }).visible!
            : true;
        list.push({
          typeValue: t.value,
          sectionValue: s.value,
          title: s.label,
          order: s.order ?? 0,
          onePriceColumn: !isDrinkLike(t.value),
          showVolumeHeader: isDrinkLike(t.value),
          isVisible,
          items: isVisible
            ? (itemsByTypeSection.get(t.value)?.get(s.value) || [])
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : [],
        });
      }
    }
    return list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [typeDocs, itemsByTypeSection, isDrinkLike]);

  // DnD: глобальный пересчёт order для всех разделов
  async function handleSectionsDragEnd(result: DropResult) {
    if (!result.destination) return;
    const list = flatSections.slice();
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);

    // Назначаем новые order с шагом 10 и подготавливаем обновления по типам
    const nextOrderByKey = new Map<string, number>();
    list.forEach((sec, idx) =>
      nextOrderByKey.set(
        `${sec.typeValue}::${sec.sectionValue}`,
        (idx + 1) * 10
      )
    );

    const updates = typeDocs.map(t => {
      const updatedSections = (t.sections || []).map(s => {
        const key = `${t.value}::${s.value}`;
        if (nextOrderByKey.has(key)) {
          return { ...s, order: nextOrderByKey.get(key)! };
        }
        return s;
      });
      return {
        id: t.id,
        value: t.value,
        sections: updatedSections,
      };
    });

    // Сохраняем все изменения
    await Promise.all(
      updates
        .filter(u => !!u.id)
        .map(u =>
          updateDoc(doc(db, 'menu', 'types', 'types', u.id as string), {
            sections: u.sections,
          })
        )
    );

    // Обновляем локальный state
    setTypeDocs(prev =>
      prev.map(t => {
        const u = updates.find(x => x.value === t.value);
        return u
          ? {
              ...t,
              sections: (u.sections || [])
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
            }
          : t;
      })
    );
  }

  async function handleReorder(section: string, newItems: MenuItem[]) {
    // Проставляем новый order
    const withOrder = newItems.map((item, idx) => ({ ...item, order: idx }));
    // Обновляем Firestore
    const batch = writeBatch(db);
    withOrder.forEach(item => {
      batch.update(doc(db, 'menu', 'items', 'items', item.id), {
        order: item.order,
      });
    });
    await batch.commit();
    // Обновляем локально
    setItems(prev =>
      prev.map(i => {
        const found = withOrder.find(x => x.id === i.id);
        return found ? { ...i, order: found.order } : i;
      })
    );
  }

  async function handleToggleItemVisible(itemId: string, nextVisible: boolean) {
    await updateDoc(doc(db, 'menu', 'items', 'items', itemId), {
      visible: nextVisible,
    });
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, visible: nextVisible } : i))
    );
  }

  return (
    <div
      className={styles.page}
      style={{
        background: platformConfig?.colors?.useCustomColors
          ? platformConfig?.colors?.menu?.pageBg
          : undefined,
        color: platformConfig?.colors?.useCustomColors
          ? platformConfig?.colors?.menu?.text
          : undefined,
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
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? `url(${platformConfig.customLogoUrl})`
                    : undefined,
                maskImage:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? `url(${platformConfig.customLogoUrl})`
                    : undefined,
                WebkitMaskRepeat:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                maskRepeat:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                WebkitMaskSize:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                maskSize:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                WebkitMaskPosition:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'center'
                    : undefined,
                maskPosition:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'center'
                    : undefined,
                backgroundColor:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? platformConfig?.colors?.menu?.text || '#ffffff'
                    : undefined,
              }}
            />
          ) : (
            <Image
              src={logo}
              alt='Corner Coffee Spot Logo'
              width={112}
              height={63}
              style={{
                WebkitMaskImage:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? `url(${(logo as unknown as { src: string }).src || ''})`
                    : undefined,
                maskImage:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? `url(${(logo as unknown as { src: string }).src || ''})`
                    : undefined,
                WebkitMaskRepeat:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                maskRepeat:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'no-repeat'
                    : undefined,
                WebkitMaskSize:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                maskSize:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'contain'
                    : undefined,
                WebkitMaskPosition:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'center'
                    : undefined,
                maskPosition:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? 'center'
                    : undefined,
                backgroundColor:
                  platformConfig?.colors?.useCustomColors &&
                  platformConfig?.colors?.menu?.logoUseTextColor
                    ? platformConfig?.colors?.menu?.text || '#ffffff'
                    : undefined,
              }}
            />
          )}
        </div>
        <div className={styles.menu}>
          {isAdmin && (
            <button
              className={styles.editBtn}
              style={{
                color: platformConfig?.colors?.useCustomColors
                  ? platformConfig?.colors?.menu?.text
                  : undefined,
              }}
              onClick={() => setEditMode(m => !m)}
            >
              {editMode ? 'Готово' : 'Редактировать'}
            </button>
          )}
          <button
            className={styles.menuActive}
            style={{
              color: platformConfig?.colors?.useCustomColors
                ? platformConfig?.colors?.menu?.text
                : undefined,
            }}
            onClick={() => (window.location.href = '/')}
          >
            Очередь
          </button>
        </div>
      </div>
      <div className={styles.adminPanel}>
        {isAdmin && (
          <button
            className={styles.menuActive}
            style={{
              color: platformConfig?.colors?.useCustomColors
                ? platformConfig?.colors?.menu?.text
                : undefined,
            }}
            onClick={() => (window.location.href = '/admin')}
          >
            Админка
          </button>
        )}
      </div>
      {isAdmin && editMode && (
        <div
          className={styles.tools}
          role='region'
          aria-label='Инструменты редактирования'
        >
          <div className={styles.toolsRow}>
            <label className={styles.dndToggle}>
              <span>Перемещение разделов</span>
              <IOSSwitch
                checked={sectionsDragEnabled}
                onChange={() => {
                  setSectionsDragEnabled(prev => {
                    const next = !prev;
                    if (next) {
                      setItemsDragEnabled(false);
                      setVisibilityManageEnabled(false);
                    }
                    return next;
                  });
                }}
              />
            </label>
            <label className={styles.dndToggle}>
              <span>Перемещение товаров</span>
              <IOSSwitch
                checked={itemsDragEnabled}
                onChange={() => {
                  setItemsDragEnabled(prev => {
                    const next = !prev;
                    if (next) {
                      setSectionsDragEnabled(false);
                      setVisibilityManageEnabled(false);
                    }
                    return next;
                  });
                }}
              />
            </label>
            <label className={styles.dndToggle}>
              <span>Управление отображением</span>
              <IOSSwitch
                checked={visibilityManageEnabled}
                onChange={() => {
                  setVisibilityManageEnabled(prev => {
                    const next = !prev;
                    if (next) {
                      setSectionsDragEnabled(false);
                      setItemsDragEnabled(false);
                    }
                    return next;
                  });
                }}
              />
            </label>
          </div>
        </div>
      )}
      <div className={styles.main}>
        {sectionsDragEnabled ? (
          <DragDropContext onDragEnd={handleSectionsDragEnd}>
            <Droppable droppableId='sections'>
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {flatSections.map((sec, i) => (
                    <Draggable
                      key={`${sec.typeValue}::${sec.sectionValue}`}
                      draggableId={`${sec.typeValue}::${sec.sectionValue}`}
                      index={i}
                    >
                      {prov => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <MenuSection
                            dontShowPriceType={i !== 0}
                            key={`${sec.typeValue}::${sec.sectionValue}`}
                            title={sec.title}
                            items={
                              visibilityManageEnabled
                                ? sec.items
                                : sec.items.filter(
                                    it =>
                                      (it as { visible?: boolean }).visible !==
                                      false
                                  )
                            }
                            onePriceColumn={sec.onePriceColumn}
                            showVolumeHeader={sec.showVolumeHeader}
                            editable={itemsDragEnabled}
                            showVisibility={visibilityManageEnabled}
                            isVisible={sec.isVisible}
                            highlight={true}
                            onToggleVisible={async () => {
                              const t = typeDocs.find(
                                t => t.value === sec.typeValue
                              );
                              if (!t) return;
                              const updatedSections = (t.sections || []).map(
                                s =>
                                  s.value === sec.sectionValue
                                    ? ({
                                        ...s,
                                        visible: !(s as { visible?: boolean })
                                          .visible,
                                      } as {
                                        value: string;
                                        label: string;
                                        order?: number;
                                        visible?: boolean;
                                      })
                                    : s
                              );
                              await updateDoc(
                                doc(
                                  db,
                                  'menu',
                                  'types',
                                  'types',
                                  t.id as string
                                ),
                                {
                                  sections: updatedSections,
                                }
                              );
                              setTypeDocs(prev =>
                                prev.map(x =>
                                  x.value === t.value
                                    ? {
                                        ...x,
                                        sections: updatedSections as {
                                          value: string;
                                          label: string;
                                          order?: number;
                                        }[],
                                      }
                                    : x
                                )
                              );
                            }}
                            onReorder={(newItems: MenuItem[]) =>
                              handleReorder(sec.sectionValue, newItems)
                            }
                            onToggleItemVisible={(
                              itemId: string,
                              nextVisible: boolean
                            ) => handleToggleItemVisible(itemId, nextVisible)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          flatSections.map((sec, i) => (
            <MenuSection
              dontShowPriceType={i !== 0}
              key={`${sec.typeValue}::${sec.sectionValue}`}
              title={sec.title}
              items={
                visibilityManageEnabled
                  ? sec.items
                  : sec.items.filter(
                      it => (it as { visible?: boolean }).visible !== false
                    )
              }
              onePriceColumn={sec.onePriceColumn}
              showVolumeHeader={sec.showVolumeHeader}
              editable={itemsDragEnabled}
              onReorder={(newItems: MenuItem[]) =>
                handleReorder(sec.sectionValue, newItems)
              }
              showVisibility={visibilityManageEnabled}
              isVisible={sec.isVisible}
              highlight={false}
              onToggleItemVisible={(itemId: string, nextVisible: boolean) =>
                handleToggleItemVisible(itemId, nextVisible)
              }
              onToggleVisible={async () => {
                const t = typeDocs.find(t => t.value === sec.typeValue);
                if (!t) return;
                const updatedSections = (t.sections || []).map(s =>
                  s.value === sec.sectionValue
                    ? ({
                        ...s,
                        visible: !(s as { visible?: boolean }).visible,
                      } as {
                        value: string;
                        label: string;
                        order?: number;
                        visible?: boolean;
                      })
                    : s
                );
                await updateDoc(
                  doc(db, 'menu', 'types', 'types', t.id as string),
                  {
                    sections: updatedSections,
                  }
                );
                setTypeDocs(prev =>
                  prev.map(x =>
                    x.value === t.value
                      ? {
                          ...x,
                          sections: updatedSections as {
                            value: string;
                            label: string;
                            order?: number;
                          }[],
                        }
                      : x
                  )
                );
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
