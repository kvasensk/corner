import React from 'react';
import type { MenuItem } from '../../types/menu';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import styles from './MenuSection.module.css';

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  showVolumeHeader?: boolean;
  editable?: boolean;
  onReorder?: (items: MenuItem[]) => void;
}

export default function MenuSection({
  title,
  items,
  showVolumeHeader,
  editable,
  onReorder,
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

  if (!localItems.length) return null;
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {showVolumeHeader && (
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
                      {(provided, snapshot) => (
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
                            <span>{item.price02 || '-'}</span>
                            <span>{item.price03 || '-'}</span>
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
                <span>{item.price02 || '-'}</span>
                <span>{item.price03 || '-'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
