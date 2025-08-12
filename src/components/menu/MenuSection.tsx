import React from 'react';
import type { MenuItem } from '../../types/menu';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import styles from './MenuSection.module.css';
import EyeIcon from '../../uikit/EyeIcon';

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  showVolumeHeader?: boolean;
  onePriceColumn?: boolean;
  dontShowPriceType?: boolean;
  editable?: boolean;
  onReorder?: (items: MenuItem[]) => void;
  onToggleVisible?: () => void;
  showVisibility?: boolean;
  isVisible?: boolean;
}

export default function MenuSection({
  title,
  items,
  showVolumeHeader,
  onePriceColumn,
  editable,
  dontShowPriceType,
  onReorder,
  onToggleVisible,
  showVisibility,
  isVisible,
}: MenuSectionProps) {
  const [localItems, setLocalItems] = React.useState(items);
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const reordered = Array.from(localItems);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setLocalItems(reordered);
    onReorder?.(reordered);
  }

  // В обычном режиме пустые разделы не показываем,
  // но в режиме редактирования (когда показывается глазик) — показываем заголовок
  if (!localItems.length && !showVisibility) return null;
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>
          {showVisibility ? (
            <button
              onClick={onToggleVisible}
              className={styles.eyeBtn}
              aria-label={isVisible ? 'Скрыть раздел' : 'Показать раздел'}
            >
              <EyeIcon open={!!isVisible} size={24} />
            </button>
          ) : null}
          {title}
        </span>
        {showVolumeHeader && !onePriceColumn && !dontShowPriceType && (
          <div className={styles.volumeHeader}>
            <span>0,2</span>
            <span>0,3</span>
          </div>
        )}
      </div>
      <div className={styles.items}>
        {editable ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId='menu-section-droppable'>
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {localItems.map((item, idx) => (
                    <Draggable key={item.id} draggableId={item.id} index={idx}>
                      {provided => (
                        <div
                          className={styles.itemRow}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <span
                            {...provided.dragHandleProps}
                            className={styles.dragHandle}
                          >
                            ☰
                          </span>
                          <span>{item.name}</span>
                          <div className={styles.itemPrices}>
                            {onePriceColumn ? (
                              <span className={styles.price}>
                                {item.price || '-'}
                              </span>
                            ) : (
                              <>
                                <span>{item.price02 || '-'}</span>
                                <span>{item.price03 || '-'}</span>
                              </>
                            )}
                          </div>
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
          localItems.map(item => (
            <div key={item.id} className={styles.itemRow}>
              <span>{item.name}</span>
              <div className={styles.itemPrices}>
                {onePriceColumn ? (
                  <span className={styles.price}>{item.price || '-'}</span>
                ) : (
                  <>
                    <span className={styles.price}>{item.price02 || '-'}</span>
                    <span className={styles.price}>{item.price03 || '-'}</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
