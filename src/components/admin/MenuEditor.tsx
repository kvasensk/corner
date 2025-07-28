import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ImageUploader from './ImageUploader';
import styles from './MenuEditor.module.css';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  price02?: string;
  price03?: string;
  type: string;
  picture: string;
  section?: string;
}

const typeOptions = [
  { value: 'drink', label: 'Напиток' },
  { value: 'food', label: 'Еда' },
];

const sectionOptions: Record<
  'drink' | 'food',
  { value: string; label: string }[]
> = {
  drink: [
    { value: 'кофе', label: 'Кофе' },
    { value: 'авторские напитки', label: 'Авторские напитки' },
    { value: 'чай', label: 'Чай' },
  ],
  food: [
    { value: 'сендвичи', label: 'Сендвичи' },
    { value: 'десерты', label: 'Десерты' },
  ],
};

export default function MenuEditor() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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
    name: '',
    price: '',
    imageUrl: '',
    section: 'кофе',
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  async function fetchItems() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'menu', 'items', 'items'));
    setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

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
        item.type === 'drink' || item.type === 'food' ? item.type : 'drink';
      setForm({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        price02: item.price02 || '',
        price03: item.price03 || '',
        type: validType,
        picture: item.picture || '',
      });
      setNewItem({ ...newItem, section: item.section || 'кофе' });
      setSelectedItemId(item.id);
    } else {
      setForm({
        name: '',
        description: '',
        price: '',
        price02: '',
        price03: '',
        type: 'drink',
        picture: '',
      });
      setNewItem({ ...newItem, section: 'кофе' });
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
          price: form.price.trim(),
          price02: form.price02.trim(),
          price03: form.price03.trim(),
          type: form.type,
          picture: form.picture,
          section: newItem.section,
        });
      } else {
        await addDoc(collection(db, 'menu', 'items', 'items'), {
          name: form.name.trim(),
          description: form.description.trim(),
          price: form.price.trim(),
          price02: form.price02.trim(),
          price03: form.price03.trim(),
          type: form.type,
          picture: form.picture,
          section: newItem.section,
        });
      }
      setModalOpen(false);
      fetchItems();
    } catch (e) {
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

  const validType =
    form.type === 'drink' || form.type === 'food' ? form.type : 'drink';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Меню</h2>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          +
        </button>
      </div>
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>Пока нет позиций в меню</div>
      ) : (
        <ul className={styles.menuList}>
          {items.map(item => (
            <li className={styles.menuCard} key={item.id}>
              <div className={styles.cardHeader}>
                <span className={styles.cardType}>
                  {typeOptions.find(t => t.value === item.type)?.label ||
                    'Напиток'}
                  {' / '}
                  {item.section
                    ? item.section.charAt(0).toUpperCase() +
                      item.section.slice(1)
                    : 'Кофе'}
                </span>
                <div className={styles.cardBtns}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenModal(item)}
                  >
                    ✎
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
              <div className={styles.cardBody}>
                {item.picture && (
                  <img
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
            </li>
          ))}
        </ul>
      )}
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
                      const newType = e.target.value as 'drink' | 'food';
                      setNewItem(item => ({
                        ...item,
                        section: sectionOptions[newType][0].value,
                      }));
                    }}
                    className={styles.input}
                  >
                    {typeOptions.map(opt => (
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
                    {sectionOptions[validType].map(option => (
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
              <div className={styles.label}>Картинка</div>
              {form.picture ? (
                <div className={styles.imagePreview}>
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
                <ImageUploader
                  value={form.picture}
                  onUpload={url => setForm(f => ({ ...f, picture: url }))}
                />
              )}
              {formError && <div className={styles.error}>{formError}</div>}
              <button
                className={styles.saveBtn}
                type='submit'
                disabled={saving}
              >
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </form>
          </div>
        </div>
      )}
      {deleteModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCustom}>
            <div className={styles.deleteText}>Удалить эту позицию?</div>
            <div className={styles.deleteBtns}>
              <button className={styles.deleteModalBtn} onClick={confirmDelete}>
                Удалить
              </button>
              <button className={styles.cancelBtn} onClick={handleCloseModal}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
