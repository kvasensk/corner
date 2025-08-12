import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './TypesSectionsModal.module.css';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import IOSSwitch from '../../../../uikit/IOSSwitch';
import ConfirmDeleteModal from './ConfirmDeleteModal';

type Option = { value: string; label: string };
type Section = {
  value: string;
  label: string;
  order?: number;
  not_for_delete?: boolean;
  visible?: boolean;
};
type TypeDoc = {
  id: string;
  value: string;
  label: string;
  order: number;
  sections: Section[];
  bevereges_price?: boolean;
  standart?: boolean;
};

type TypesSectionsModalProps = {
  open: boolean;
  onClose: () => void;
  defaultTypes: Option[];
  defaultSections: Record<string, Section[]>;
  onAfterItemsChange?: () => void;
};

function slugify(input: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'j',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };
  const lower = input.trim().toLowerCase();
  const translit = lower
    .split('')
    .map(ch => (map[ch] !== undefined ? map[ch] : ch))
    .join('');
  return translit
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function TypesSectionsModal({
  open,
  onClose,
  defaultTypes,
  defaultSections,
  onAfterItemsChange,
}: TypesSectionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<TypeDoc[]>([]);
  const [creatingNewType, setCreatingNewType] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState<{
    label: string;
    bevereges_price: boolean;
  }>({ label: '', bevereges_price: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    typeValue: string | null;
    typeId?: string;
    sectionValue: string | null;
    sectionLabel?: string;
    anchor?: { x: number; y: number } | null;
  }>({ open: false, typeValue: null, sectionValue: null, anchor: null });

  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<{
    open: boolean;
    typeId: string | null;
    typeValue: string | null;
    label?: string;
    anchor?: { x: number; y: number } | null;
  }>({ open: false, typeId: null, typeValue: null, anchor: null });

  const defaultTypeValues = useMemo(
    () => new Set(defaultTypes.map(t => t.value)),
    [defaultTypes]
  );

  function getAllTypeValuesSet(excludeId?: string): Set<string> {
    const set = new Set<string>([...defaultTypeValues]);
    for (const t of types) {
      if (excludeId && t.id === excludeId) continue;
      set.add(t.value);
    }
    return set;
  }

  function makeUniqueTypeValue(base: string, excludeId?: string): string {
    const existing = getAllTypeValuesSet(excludeId);
    const slug = base || 'type';
    if (!existing.has(slug)) return slug;
    let i = 2;
    while (existing.has(`${slug}-${i}`)) i++;
    return `${slug}-${i}`;
  }

  async function fetchTypes() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'menu', 'types', 'types'));
    const docs = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as {
        value: string;
        label: string;
        order?: number;
        sections?: Section[];
        bevereges_price?: boolean;
        standart?: boolean;
      }),
    })) as TypeDoc[];
    setTypes(
      docs
        .map(d => ({
          ...d,
          sections: Array.isArray(d.sections)
            ? (d.sections as Section[])
                .map((s: Section) => ({
                  ...s,
                  visible: typeof s.visible === 'boolean' ? s.visible : true,
                }))
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            : [],
          bevereges_price:
            typeof d.bevereges_price === 'boolean' ? d.bevereges_price : false,
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    fetchTypes();
  }, [open]);

  async function handleCreateType() {
    const label = newTypeForm.label.trim();
    if (!label) return;
    const base = slugify(label) || 'type';
    const value = makeUniqueTypeValue(base);
    const order = (types?.length || 0) + 1;
    await addDoc(collection(db, 'menu', 'types', 'types'), {
      label,
      value,
      order,
      sections: [],
      bevereges_price: newTypeForm.bevereges_price,
    });
    setNewTypeForm({ label: '', bevereges_price: false });
    setCreatingNewType(false);
    await fetchTypes();
  }

  // delete a whole type's items (across all sections)
  async function deleteItemsByType(typeValue: string) {
    const q = query(
      collection(db, 'menu', 'items', 'items'),
      where('type', '==', typeValue)
    );
    const snap = await getDocs(q);
    const deletions = snap.docs.map(d =>
      deleteDoc(doc(db, 'menu', 'items', 'items', d.id))
    );
    await Promise.all(deletions);
  }

  async function handleUpdateType(
    id: string,
    updates: Partial<
      Pick<
        TypeDoc,
        'label' | 'value' | 'order' | 'sections' | 'bevereges_price'
      >
    >
  ) {
    await updateDoc(
      doc(db, 'menu', 'types', 'types', id),
      updates as Partial<TypeDoc>
    );
    await fetchTypes();
  }

  function getTypeDocByValue(value: string): TypeDoc | undefined {
    return types.find(t => t.value === value);
  }

  async function addSectionTo(typeValue: string, sectionLabel: string) {
    const label = sectionLabel.trim();
    if (!label) return;
    const slugBase = slugify(label) || `section-${Date.now()}`;
    const typeDoc = getTypeDocByValue(typeValue);
    const defaults = defaultSections[typeValue] || [];
    const existingValues = new Set([
      ...defaults.map(s => s.value),
      ...(typeDoc?.sections || []).map(s => s.value),
    ]);
    let value = slugBase;
    let i = 2;
    while (existingValues.has(value)) {
      value = `${slugBase}-${i++}`;
    }
    const nextOrder = (() => {
      const existingOrders = (typeDoc?.sections || []).map(s => s.order || 0);
      const base = existingOrders.length ? Math.max(...existingOrders) : 0;
      // use step 10 to leave gaps for future inserts
      return base > 0 ? base + 10 : 10;
    })();
    if (typeDoc) {
      await handleUpdateType(typeDoc.id, {
        sections: [
          ...(typeDoc.sections || []),
          { label, value, order: nextOrder, visible: true },
        ],
      });
    } else {
      const defaultType = defaultTypes.find(t => t.value === typeValue);
      if (!defaultType) return;
      await addDoc(collection(db, 'menu', 'types', 'types'), {
        label: defaultType.label,
        value: defaultType.value,
        order: defaultTypes.findIndex(t => t.value === typeValue) + 1,
        sections: [{ label, value, order: 10, visible: true }],
      });
      await fetchTypes();
    }
  }

  async function updateSections(typeId: string, sections: Section[]) {
    await handleUpdateType(typeId, { sections });
  }

  async function deleteItemsByTypeSection(
    typeValue: string,
    sectionValue: string
  ) {
    const q = query(
      collection(db, 'menu', 'items', 'items'),
      where('type', '==', typeValue),
      where('section', '==', sectionValue)
    );
    const snap = await getDocs(q);
    const deletions = snap.docs.map(d =>
      deleteDoc(doc(db, 'menu', 'items', 'items', d.id))
    );
    await Promise.all(deletions);
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          &times;
        </button>
        <h3 className={styles.modalTitle}>Типы и разделы</h3>

        <div className={styles.typesHeaderRow}>
          {!creatingNewType ? (
            <button
              className={styles.addBtn}
              onClick={() => setCreatingNewType(true)}
            >
              + Новый тип
            </button>
          ) : (
            <div className={styles.newTypeForm}>
              <input
                className={styles.input}
                placeholder='Название типа'
                value={newTypeForm.label}
                onChange={e =>
                  setNewTypeForm(f => ({ ...f, label: e.target.value }))
                }
                autoFocus
              />
              <div className={styles.chipToggleRow}>
                <IOSSwitch
                  checked={newTypeForm.bevereges_price}
                  onChange={() =>
                    setNewTypeForm(f => ({
                      ...f,
                      bevereges_price: !f.bevereges_price,
                    }))
                  }
                />
                <span>Отображать цены как для напитков</span>
              </div>
              <div className={styles.actionsRow}>
                <button className={styles.saveBtn} onClick={handleCreateType}>
                  Сохранить
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setCreatingNewType(false);
                    setNewTypeForm({ label: '', bevereges_price: false });
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : (
          <>
            <DefaultTypesList
              defaultTypes={defaultTypes}
              defaultSections={defaultSections}
              types={types}
              onAddSection={addSectionTo}
              onUpdateSections={updateSections}
              onRequestDeleteSection={(
                typeValue,
                sectionValue,
                sectionLabel,
                anchor
              ) =>
                setDeleteConfirm({
                  open: true,
                  typeValue,
                  sectionValue,
                  sectionLabel,
                  anchor: anchor ?? null,
                })
              }
            />
            <CustomTypesList
              defaultTypeValues={defaultTypeValues}
              types={types}
              onUpdateType={handleUpdateType}
              onAddSection={addSectionTo}
              onUpdateSections={updateSections}
              onRequestDeleteType={(typeDoc, anchor) =>
                setDeleteTypeConfirm({
                  open: true,
                  typeId: typeDoc.id,
                  typeValue: typeDoc.value,
                  label: typeDoc.label,
                  anchor: anchor ?? null,
                })
              }
              onRequestDeleteSection={(
                typeValue,
                sectionValue,
                sectionLabel,
                anchor
              ) =>
                setDeleteConfirm({
                  open: true,
                  typeValue,
                  sectionValue,
                  sectionLabel,
                  anchor: anchor ?? null,
                })
              }
            />
          </>
        )}
        {/* Confirm delete Type */}
        <ConfirmDeleteModal
          open={!!(deleteTypeConfirm.open && deleteTypeConfirm.typeId)}
          anchor={deleteTypeConfirm.anchor || undefined}
          message={
            <>
              Удалить тип «{deleteTypeConfirm.label}»? При удалении типа
              безвозвратно удалятся все его разделы и все позиции из этих
              разделов.
            </>
          }
          onCancel={() =>
            setDeleteTypeConfirm({
              open: false,
              typeId: null,
              typeValue: null,
              anchor: null,
            })
          }
          onConfirm={async () => {
            if (!deleteTypeConfirm.typeId || !deleteTypeConfirm.typeValue) {
              return;
            }
            await deleteItemsByType(deleteTypeConfirm.typeValue);
            await deleteDoc(
              doc(db, 'menu', 'types', 'types', deleteTypeConfirm.typeId)
            );
            await fetchTypes();
            onAfterItemsChange?.();
            setDeleteTypeConfirm({
              open: false,
              typeId: null,
              typeValue: null,
              anchor: null,
            });
          }}
        />
        <ConfirmDeleteModal
          open={
            !!(
              deleteConfirm.open &&
              deleteConfirm.typeValue &&
              deleteConfirm.sectionValue
            )
          }
          anchor={deleteConfirm.anchor || undefined}
          message={
            <>
              При удалении раздела автоматически удалятся все позиции, которые
              находятся в этом разделе. Можно переименовать данный раздел или
              перенести позицию в другой раздел.
            </>
          }
          onCancel={() =>
            setDeleteConfirm({
              open: false,
              typeValue: null,
              sectionValue: null,
              anchor: null,
            })
          }
          onConfirm={async () => {
            const t = types.find(t => t.value === deleteConfirm.typeValue);
            if (t) {
              const next = (t.sections || []).filter(
                s => s.value !== deleteConfirm.sectionValue
              );
              await updateSections(t.id, next);
            }
            await deleteItemsByTypeSection(
              deleteConfirm.typeValue!,
              deleteConfirm.sectionValue!
            );
            // Inform parent to refresh items list
            onAfterItemsChange?.();
            setDeleteConfirm({
              open: false,
              typeValue: null,
              sectionValue: null,
              anchor: null,
            });
          }}
        />
      </div>
    </div>
  );
}

function DefaultTypesList({
  defaultTypes,
  defaultSections,
  types,
  onAddSection,
  onUpdateSections,
  onRequestDeleteSection,
}: {
  defaultTypes: Option[];
  defaultSections: Record<string, Section[]>;
  types: TypeDoc[];
  onAddSection: (typeValue: string, sectionLabel: string) => Promise<void>;
  onUpdateSections: (typeId: string, sections: Section[]) => Promise<void>;
  onRequestDeleteSection: (
    typeValue: string,
    sectionValue: string,
    sectionLabel?: string,
    anchor?: { x: number; y: number }
  ) => void;
}) {
  return (
    <div className={styles.typesList}>
      {defaultTypes.map(dt => (
        <DefaultTypeItem
          key={dt.value}
          typeOption={dt}
          defaultSections={defaultSections[dt.value] || []}
          typeDoc={types.find(t => t.value === dt.value)}
          onAddSection={onAddSection}
          onUpdateSections={onUpdateSections}
          onRequestDeleteSection={onRequestDeleteSection}
        />
      ))}
    </div>
  );
}

function DefaultTypeItem({
  typeOption,
  defaultSections,
  typeDoc,
  onAddSection,
  onUpdateSections,
  onRequestDeleteSection,
}: {
  typeOption: Option;
  defaultSections: Section[];
  typeDoc?: TypeDoc;
  onAddSection: (typeValue: string, sectionLabel: string) => Promise<void>;
  onUpdateSections: (typeId: string, sections: Section[]) => Promise<void>;
  onRequestDeleteSection: (
    typeValue: string,
    sectionValue: string,
    sectionLabel?: string,
    anchor?: { x: number; y: number }
  ) => void;
}) {
  const [newSection, setNewSection] = useState('');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const extraSections = (typeDoc?.sections || []).filter(
    s => !defaultSections.some(d => d.value === s.value)
  );

  const handleDeleteSection = (
    sectionValue: string,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!typeDoc) return;
    const btnRect = e?.currentTarget.getBoundingClientRect();
    const cardRect = cardRef.current?.getBoundingClientRect();
    onRequestDeleteSection(
      typeOption.value,
      sectionValue,
      undefined,
      btnRect
        ? { x: cardRect?.left ?? btnRect.left, y: btnRect.bottom + 8 }
        : undefined
    );
  };

  const handleEditSection = async (sectionValue: string, newLabel: string) => {
    if (!typeDoc) return;
    const next = (typeDoc.sections || []).map(s =>
      s.value === sectionValue ? { ...s, label: newLabel } : s
    );
    await onUpdateSections(typeDoc.id, next);
  };

  return (
    <div className={styles.typeCard} ref={cardRef}>
      <div className={styles.typesHeaderRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={styles.cardName} style={{ margin: 0 }}>
            {typeOption.label}
          </span>
          <span className={styles.badge}>стандартный</span>
        </div>
      </div>
      <div className={styles.sectionList}>
        {defaultSections.map(s => (
          <span
            key={s.value}
            className={`${styles.sectionChip} ${styles.chipDefault}`}
          >
            {s.label}
          </span>
        ))}
        {extraSections
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(s => (
            <EditableChip
              key={s.value}
              label={s.label}
              onSave={newLabel => handleEditSection(s.value, newLabel)}
              onDelete={(e: React.MouseEvent<HTMLButtonElement>) =>
                handleDeleteSection(s.value, e)
              }
            />
          ))}
      </div>
      <div className={styles.inlineForm}>
        <input
          className={styles.input}
          placeholder='Добавить раздел'
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
        />
        <button
          className={styles.addBtn}
          disabled={!newSection.trim()}
          aria-label='Добавить раздел'
          onClick={() => {
            onAddSection(typeOption.value, newSection).then(() =>
              setNewSection('')
            );
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function CustomTypesList({
  defaultTypeValues,
  types,
  onUpdateType,
  onAddSection,
  onUpdateSections,
  onRequestDeleteType,
  onRequestDeleteSection,
}: {
  defaultTypeValues: Set<string>;
  types: TypeDoc[];
  onUpdateType: (
    id: string,
    updates: Partial<
      Pick<
        TypeDoc,
        'label' | 'value' | 'order' | 'sections' | 'bevereges_price'
      >
    >
  ) => Promise<void>;
  onAddSection: (typeValue: string, sectionLabel: string) => Promise<void>;
  onUpdateSections: (typeId: string, sections: Section[]) => Promise<void>;
  onRequestDeleteType: (
    typeDoc: TypeDoc,
    anchor?: { x: number; y: number }
  ) => void;
  onRequestDeleteSection: (
    typeValue: string,
    sectionValue: string,
    sectionLabel?: string,
    anchor?: { x: number; y: number }
  ) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 12,
      }}
    >
      {types
        .filter(t => !defaultTypeValues.has(t.value))
        .map(t => (
          <CustomTypeItem
            key={t.id}
            typeDoc={t}
            types={types}
            defaultTypeValues={defaultTypeValues}
            onUpdateType={onUpdateType}
            onAddSection={onAddSection}
            onUpdateSections={onUpdateSections}
            onRequestDeleteType={onRequestDeleteType}
            onRequestDeleteSection={onRequestDeleteSection}
          />
        ))}
    </div>
  );
}

function CustomTypeItem({
  typeDoc,
  types,
  defaultTypeValues,
  onUpdateType,
  onAddSection,
  onUpdateSections,
  onRequestDeleteType,
  onRequestDeleteSection,
}: {
  typeDoc: TypeDoc;
  types: TypeDoc[];
  defaultTypeValues: Set<string>;
  onUpdateType: (
    id: string,
    updates: Partial<
      Pick<
        TypeDoc,
        'label' | 'value' | 'order' | 'sections' | 'bevereges_price'
      >
    >
  ) => Promise<void>;
  onAddSection: (typeValue: string, sectionLabel: string) => Promise<void>;
  onUpdateSections: (typeId: string, sections: Section[]) => Promise<void>;
  onRequestDeleteType: (
    typeDoc: TypeDoc,
    anchor?: { x: number; y: number }
  ) => void;
  onRequestDeleteSection: (
    typeValue: string,
    sectionValue: string,
    sectionLabel?: string,
    anchor?: { x: number; y: number }
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    label: typeDoc.label,
    value: typeDoc.value,
    bevereges_price: !!typeDoc.bevereges_price,
  });
  const [newSection, setNewSection] = useState('');
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleSaveType = async () => {
    const label = form.label.trim();
    if (!label) return;
    const base = slugify(label) || 'type';
    const existing = new Set<string>([
      ...defaultTypeValues,
      ...types.filter(t => t.id !== typeDoc.id).map(t => t.value),
    ]);
    let value = base;
    if (existing.has(value)) {
      let i = 2;
      while (existing.has(`${value}-${i}`)) i++;
      value = `${value}-${i}`;
    }
    await onUpdateType(typeDoc.id, {
      label,
      value,
      bevereges_price: form.bevereges_price,
    });
    setEditing(false);
  };

  const handleDeleteSection = (
    sectionValue: string,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    const btnRect = e?.currentTarget.getBoundingClientRect();
    const cardRect = cardRef.current?.getBoundingClientRect();
    onRequestDeleteSection(
      typeDoc.value,
      sectionValue,
      undefined,
      btnRect
        ? { x: cardRect?.left ?? btnRect.left, y: btnRect.bottom + 8 }
        : undefined
    );
  };

  const handleEditSection = async (sectionValue: string, newLabel: string) => {
    const next = (typeDoc.sections || []).map(s =>
      s.value === sectionValue ? { ...s, label: newLabel } : s
    );
    await onUpdateSections(typeDoc.id, next);
  };

  // removed legacy per-section pricing toggle

  return (
    <div className={styles.typeCard} ref={cardRef}>
      <div className={styles.typesHeaderRow}>
        {!editing ? (
          <span className={styles.cardName} style={{ margin: 0 }}>
            {typeDoc.label}
          </span>
        ) : (
          <div className={styles.editTypeForm}>
            <input
              className={styles.input}
              placeholder='Название типа'
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              autoFocus
            />
            <div className={styles.chipToggleRow}>
              <IOSSwitch
                checked={form.bevereges_price}
                onChange={() =>
                  setForm(f => ({ ...f, bevereges_price: !f.bevereges_price }))
                }
              />
              <span>Отображать цены как для напитков</span>
            </div>
            <div className={styles.actionsRow}>
              <button className={styles.saveBtn} onClick={handleSaveType}>
                Сохранить
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setEditing(false);
                  setForm({
                    label: typeDoc.label,
                    value: typeDoc.value,
                    bevereges_price: !!typeDoc.bevereges_price,
                  });
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        <div className={styles.actionsRow}>
          {!editing && !typeDoc.standart ? (
            <>
              <button
                className={styles.editBtn}
                onClick={() => setEditing(true)}
              >
                ✎
              </button>
              <button
                className={styles.deleteBtn}
                onClick={e =>
                  onRequestDeleteType(
                    typeDoc,
                    e.currentTarget.getBoundingClientRect()
                      ? {
                          x: e.currentTarget.getBoundingClientRect().left,
                          y: e.currentTarget.getBoundingClientRect().bottom + 8,
                        }
                      : undefined
                  )
                }
              >
                🗑
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div className={styles.sectionList}>
        {(typeDoc.sections || [])
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(s => (
            <EditableChip
              key={s.value}
              label={s.label}
              onSave={newLabel => handleEditSection(s.value, newLabel)}
              onDelete={e => handleDeleteSection(s.value, e)}
              disabled={!!s.not_for_delete}
            />
          ))}
      </div>
      <div className={styles.inlineForm}>
        <input
          className={styles.input}
          placeholder='Добавить раздел'
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
        />
        <button
          className={styles.addBtn}
          disabled={!newSection.trim()}
          aria-label='Добавить раздел'
          onClick={() => {
            onAddSection(typeDoc.value, newSection).then(() =>
              setNewSection('')
            );
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function EditableChip({
  label,
  onSave,
  onDelete,
  onDeleteClick,
  disabled,
}: {
  label: string;
  onSave: (newLabel: string) => void | Promise<void>;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  onDeleteClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(label);

  useEffect(() => {
    setText(label);
  }, [label]);

  if (disabled) {
    return (
      <span className={`${styles.sectionChip} ${styles.chipNew}`}>
        <div className={styles.chipHeaderRow}>
          <span>{label}</span>
        </div>
      </span>
    );
  }

  return (
    <span className={`${styles.sectionChip} ${styles.chipNew}`}>
      {!editing ? (
        <>
          <div className={styles.chipHeaderRow}>
            <span>{label}</span>
            <span className={styles.chipActions}>
              <button
                className={styles.editBtn}
                onClick={() => {
                  setText(label);
                  setEditing(true);
                }}
              >
                ✎
              </button>
              {onDelete && (
                <button className={styles.deleteBtn} onClick={e => onDelete(e)}>
                  🗑
                </button>
              )}
              {onDeleteClick && (
                <button
                  className={styles.deleteBtn}
                  onClick={onDeleteClick}
                  aria-label='Удалить с якорем'
                  style={{ display: 'none' }}
                />
              )}
            </span>
          </div>
        </>
      ) : (
        <>
          <input
            className={styles.inlineInput}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <button
            className={styles.saveBtn}
            onClick={() => {
              onSave(text);
              setEditing(false);
            }}
          >
            ✔
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setText(label);
              setEditing(false);
            }}
          >
            ✕
          </button>
        </>
      )}
    </span>
  );
}
