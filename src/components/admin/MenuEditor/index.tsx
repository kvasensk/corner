import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import ImageUploader from '../ImageUploader';
import styles from './MenuEditor.module.css';
import TypesSectionsModal from './TypesSectionsModal';
import { MenuItem } from '@/types/menu';
import Image from 'next/image';

export default function MenuEditor() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<
    'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'
  >('date_desc');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [typesModalOpen, setTypesModalOpen] = useState(false);
  const [typeDocs, setTypeDocs] = useState<
    {
      id: string;
      value: string;
      label: string;
      sections?: {
        value: string;
        label: string;
        order?: number;
        not_for_delete?: boolean;
      }[];
      bevereges_price?: boolean;
      standart?: boolean;
    }[]
  >([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    price02: '',
    price03: '',
    type: 'drink',
    picture: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    section: 'coffee',
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  async function fetchItems() {
    setLoading(true);
    let snap;
    try {
      const qRef = query(
        collection(db, 'menu', 'items', 'items'),
        orderBy('createdAt', 'desc')
      );
      snap = await getDocs(qRef);
    } catch (e) {
      // Fallback for older datasets without createdAt or missing index
      console.warn('Falling back to unordered fetchItems due to:', e);
      snap = await getDocs(collection(db, 'menu', 'items', 'items'));
    }
    type HasToMillis = { toMillis: () => number };
    const isHasToMillis = (v: unknown): v is HasToMillis => {
      return !!v && typeof (v as HasToMillis).toMillis === 'function';
    };
    type Raw = Record<string, unknown> & { createdAt?: unknown };
    const normalized = snap.docs.map(d => {
      const data = d.data() as Raw;
      const createdAtRaw = data.createdAt;
      let createdAtValue: number | undefined;
      if (isHasToMillis(createdAtRaw)) {
        createdAtValue = createdAtRaw.toMillis();
      } else if (typeof createdAtRaw === 'number') {
        createdAtValue =
          createdAtRaw < 1_000_000_000_000 ? createdAtRaw * 1000 : createdAtRaw;
      } else if (typeof createdAtRaw === 'string') {
        // Try to parse common human-readable formats
        let parsed = Date.parse(createdAtRaw);
        if (Number.isNaN(parsed)) {
          // Fallbacks: replace " at " and normalize timezone like "UTC+3" -> "+03:00"
          const normalized = createdAtRaw
            .replace(' at ', ' ')
            .replace(/UTC\s*([+-]?)\s*(\d{1,2})/, (_m, sign, hh) => {
              const s = sign || '+';
              const h = String(hh).padStart(2, '0');
              return `${s}${h}:00`;
            });
          parsed = Date.parse(normalized);
        }
        createdAtValue = Number.isNaN(parsed) ? undefined : parsed;
      } else {
        createdAtValue = undefined;
      }
      return {
        id: d.id,
        ...(data as object),
        createdAt: createdAtValue,
      } as MenuItem;
    });
    setItems(normalized);
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  // Load dynamic types/sections from Firestore
  type TypeDoc = {
    id: string;
    value: string;
    label: string;
    sections?: { value: string; label: string; glass?: boolean }[];
    bevereges_price?: boolean;
  };
  const fetchTypes = useCallback(async () => {
    const snap = await getDocs(collection(db, 'menu', 'types', 'types'));
    type RawType = {
      value: string;
      label: string;
      order?: number;
      sections?: {
        value: string;
        label: string;
        order?: number;
        not_for_delete?: boolean;
      }[];
      bevereges_price?: boolean;
      standart?: boolean;
    };
    const docs = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as RawType),
    })) as TypeDoc[];
    setTypeDocs(
      docs.map((d: TypeDoc) => ({
        id: d.id,
        value: d.value,
        label: d.label,
        sections: Array.isArray(
          (
            d as unknown as {
              sections?: {
                value: string;
                label: string;
                order?: number;
                not_for_delete?: boolean;
              }[];
            }
          ).sections
        )
          ? (
              d as unknown as {
                sections: {
                  value: string;
                  label: string;
                  order?: number;
                  not_for_delete?: boolean;
                }[];
              }
            ).sections
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : [],
        bevereges_price:
          typeof d.bevereges_price === 'boolean' ? d.bevereges_price : false,
        standart: (d as unknown as { standart?: boolean }).standart === true,
      }))
    );
  }, []);
  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // Refresh types after closing the modal to reflect newly created/updated types/sections
  useEffect(() => {
    if (!typesModalOpen) {
      fetchTypes();
    }
  }, [typesModalOpen, fetchTypes]);

  const allTypes = useMemo(() => typeDocs.slice(), [typeDocs]);

  function getTypeDocByValue(value: string) {
    return typeDocs.find(t => t.value === value);
  }

  function getSectionsForType(
    typeValue: string
  ): { value: string; label: string }[] {
    const doc = getTypeDocByValue(typeValue);
    if (!doc) return [];
    return (doc.sections || []).map(s => ({ value: s.value, label: s.label }));
  }

  function getTypeLabel(typeValue: string): string {
    return typeDocs.find(t => t.value === typeValue)?.label || typeValue;
  }

  function getSectionLabel(typeValue: string, sectionValue?: string): string {
    if (!sectionValue) return '';
    const list = getSectionsForType(typeValue);
    return list.find(s => s.value === sectionValue)?.label || sectionValue;
  }

  function getIsDrinkLike(typeValue: string): boolean {
    // Standard types
    // Use type-level bevereges_price flag; no hardcoded types
    const doc = getTypeDocByValue(typeValue);
    if (typeof doc?.bevereges_price === 'boolean') return !!doc.bevereges_price;
    return false;
  }

  const handleInput = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === 'price' && value && !/^[0-9]*$/.test(value)) return;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      const validType =
        getTypeDocByValue(item.type)?.value || (allTypes[0]?.value ?? '');
      setForm({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        price02: item.price02 || '',
        price03: item.price03 || '',
        type: validType,
        picture: item.picture || '',
      });
      setNewItem({ ...newItem, section: item.section || 'coffee' });
      setSelectedItemId(item.id);
    } else {
      setForm({
        name: '',
        description: '',
        price: '',
        price02: '',
        price03: '',
        type: allTypes[0]?.value ?? '',
        picture: '',
      });
      setNewItem({
        ...newItem,
        section: getSectionsForType(allTypes[0]?.value ?? '')[0]?.value || '',
      });
      setSelectedItemId(null);
    }
    setFormError('');
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Заполните название');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (selectedItemId) {
        await updateDoc(doc(db, 'menu', 'items', 'items', selectedItemId), {
          name: form.name.trim(),
          description: form.description.trim(),
          price: form.price?.trim() || '',
          price02: form.price02?.trim() || '',
          price03: form.price03?.trim() || '',
          type: form.type || 'drink',
          picture: form.picture || '',
          section: newItem.section || 'coffee',
        });
      } else {
        await addDoc(collection(db, 'menu', 'items', 'items'), {
          name: form.name.trim(),
          description: form.description.trim(),
          price: form.price?.trim() || '',
          price02: form.price02?.trim() || '',
          price03: form.price03?.trim() || '',
          type: form.type || 'drink',
          picture: form.picture || '',
          section: newItem.section || 'coffee',
          createdAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
      fetchItems();
    } catch {
      setFormError('Ошибка сохранения');
    } finally {
      setSaving(false);
      setSelectedItemId(null);
    }
  };

  const handleDelete = (id: string) => setDeleteModal({ open: true, id });
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    await deleteDoc(doc(db, 'menu', 'items', 'items', deleteModal.id));
    setDeleteModal({ open: false, id: null });
    fetchItems();
  };

  const validType = form.type || 'drink';

  const filteredSortedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter(i =>
      q ? (i.name || '').toLowerCase().includes(q) : true
    );
    list = list.slice().sort((a, b) => {
      const aTime = (a.createdAt as number | undefined) ?? -1;
      const bTime = (b.createdAt as number | undefined) ?? -1;
      switch (sort) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'date_asc':
          // oldest first; items without createdAt go to bottom
          const aAsc = aTime === -1 ? Number.MAX_SAFE_INTEGER : aTime;
          const bAsc = bTime === -1 ? Number.MAX_SAFE_INTEGER : bTime;
          return aAsc - bAsc;
        case 'date_desc':
        default:
          // newest first; items without createdAt go to bottom
          const aDesc = aTime === -1 ? -Infinity : aTime;
          const bDesc = bTime === -1 ? -Infinity : bTime;
          return bDesc - aDesc;
      }
    });
    return list;
  }, [items, search, sort]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Меню</h2>
        <div className={styles.headerActions}>
          <button
            className={`${styles.addBtn} ${styles.addBtnCompact}`}
            onClick={() => setTypesModalOpen(true)}
          >
            типы и разделы
          </button>
          <button className={styles.addBtn} onClick={() => handleOpenModal()}>
            +
          </button>
        </div>
      </div>
      <div
        className={styles.headerActions}
        style={{ padding: '0 14px', gap: 12 }}
      >
        <input
          className={styles.input}
          placeholder='Поиск по названию'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.input}
          value={sort}
          onChange={e =>
            setSort(
              e.target.value as
                | 'date_desc'
                | 'date_asc'
                | 'name_asc'
                | 'name_desc'
            )
          }
        >
          <option value='date_desc'>Последние сверху</option>
          <option value='date_asc'>Первые сверху</option>
          <option value='name_asc'>А-Я</option>
          <option value='name_desc'>Я-А</option>
        </select>
      </div>
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>Пока нет позиций в меню</div>
      ) : (
        <div className={styles.menuList}>
          {filteredSortedItems.map(item => (
            <div key={item.id}>
              <div className={styles.cardHeader}>
                <span className={styles.cardType}>
                  {getTypeLabel(item.type)}
                  {' / '}
                  {getSectionLabel(item.type, item.section)}
                </span>
                <div className={styles.cardBtns}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenModal(item)}
                  >
                    red
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                  >
                    del
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                {item.picture && (
                  <Image
                    src={item.picture}
                    alt={item.name}
                    className={styles.cardThumb}
                    onError={e => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.src = '/file.svg';
                        e.currentTarget.dataset.fallback = '1';
                      }
                    }}
                  />
                )}
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{item.name}</div>
                  <div className={styles.cardDesc}>{item.description}</div>
                  <div className={styles.cardPrice}>
                    {item.price && `${item.price} ₽`}
                    {item.price03 &&
                      `${item.price ? ', ' : ''}${item.price03} ₽ (0.3)`}
                    {item.price02 &&
                      `${item.price || item.price03 ? ', ' : ''}${
                        item.price02
                      } ₽ (0.2)`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <TypesSectionsModal
        open={typesModalOpen}
        onClose={() => setTypesModalOpen(false)}
        defaultTypes={[]}
        defaultSections={{}}
        onAfterItemsChange={fetchItems}
      />
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={handleCloseModal}>
              &times;
            </button>
            <h3 className={styles.modalTitle}>
              {selectedItemId ? 'Редактировать позицию' : 'Добавить позицию'}
            </h3>
            <form
              className={styles.form}
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className={styles.selectsRow}>
                <label className={styles.labelRow}>
                  <span className={styles.selectLabel}>Тип</span>
                  <select
                    name='type'
                    value={form.type}
                    onChange={e => {
                      handleInput(e);
                      const newType = e.target.value as string;
                      setNewItem(item => {
                        const validSections = getSectionsForType(newType).map(
                          opt => opt.value
                        );
                        return {
                          ...item,
                          section: validSections.includes(item.section)
                            ? item.section
                            : validSections[0] || '',
                        };
                      });
                    }}
                    className={styles.input}
                  >
                    {allTypes.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.labelRowMargin}>
                  <span className={styles.selectLabel}>Раздел</span>
                  <select
                    value={newItem.section}
                    onChange={e =>
                      setNewItem({ ...newItem, section: e.target.value })
                    }
                    className={styles.input}
                  >
                    {getSectionsForType(validType).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.label}>
                Название
                <input
                  name='name'
                  value={form.name}
                  onChange={handleInput}
                  className={styles.input}
                  autoFocus
                />
              </label>
              <label className={styles.label}>
                Описание
                <textarea
                  name='description'
                  value={form.description}
                  onChange={handleInput}
                  className={styles.input}
                />
              </label>
              {!getIsDrinkLike(validType) && (
                <label className={styles.label}>
                  Цена (₽)
                  <input
                    name='price'
                    value={form.price}
                    onChange={handleInput}
                    className={styles.input}
                    inputMode='numeric'
                    pattern='[0-9]*'
                  />
                </label>
              )}
              {getIsDrinkLike(validType) && (
                <>
                  <label className={styles.label}>
                    Цена 0.2 (₽)
                    <input
                      name='price02'
                      value={form.price02}
                      onChange={handleInput}
                      className={styles.input}
                      inputMode='numeric'
                      pattern='[0-9]*'
                    />
                  </label>
                  <label className={styles.label}>
                    Цена 0.3 (₽)
                    <input
                      name='price03'
                      value={form.price03}
                      onChange={handleInput}
                      className={styles.input}
                      inputMode='numeric'
                      pattern='[0-9]*'
                    />
                  </label>
                </>
              )}

              <div className={styles.imageRow}>
                <div className={styles.label}>Изображение</div>
                {form.picture ? (
                  <div className={styles.imagePreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.picture}
                      alt='Картинка блюда'
                      className={styles.imagePreviewImg}
                      onError={e => {
                        if (!e.currentTarget.dataset.fallback) {
                          e.currentTarget.src = '/file.svg';
                          e.currentTarget.dataset.fallback = '1';
                        }
                      }}
                    />
                    <button
                      type='button'
                      className={styles.imagePreviewRemove}
                      onClick={() => setForm(f => ({ ...f, picture: '' }))}
                      aria-label='Удалить картинку'
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className={styles.imageUploader}>
                    <ImageUploader
                      value={form.picture}
                      onUpload={url => setForm(f => ({ ...f, picture: url }))}
                    />
                  </div>
                )}
              </div>
              <div className={styles.saveBtns}>
                <button
                  className={styles.saveBtn}
                  type='submit'
                  disabled={saving}
                >
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>

                {formError && <div className={styles.error}>{formError}</div>}
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteModal.open && (
        <div className={styles.deleteModalOverlay}>
          <div className={styles.deleteModalCustom}>
            <div className={styles.deleteText}>
              Хотите удалить{' '}
              <b>{items.find(i => i.id === deleteModal.id)?.name}</b> из меню?
            </div>
            <div className={styles.deleteBtns}>
              <button className={styles.deleteModalBtn} onClick={confirmDelete}>
                Удалить
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => setDeleteModal({ open: false, id: null })}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
