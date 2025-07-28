import React, { useState } from 'react';
import styles from './ReadmeSettings.module.css';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.section}>
      <button
        className={styles.sectionHeader}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.sectionTitle}>{title}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
};

export default function ReadmeSettings() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Руководство по управлению системой</h2>
        {/* <div className={styles.subtitle}>
          Руководство по управлению системой
        </div> */}
      </div>

      <div className={styles.content}>
        <Section title='1. НАСТРОЙКИ ПЛАТФОРМЫ'>
          <div className={styles.textBlock}>
            <h3>Platform Settings</h3>
            <p>Основные настройки системы очереди:</p>
            <ul>
              <li>
                <strong>Включить управление очередью для игроков</strong> -
                переключатель между автоматическим и ручным режимом очереди
              </li>
              <li>
                <strong>Время на партию</strong> - время игры в минутах (по
                умолчанию 25)
              </li>
              <li>
                <strong>Показать кнопку меню</strong> - отображение кнопки
                ~Меню~ в интерфейсе
              </li>
              <li>
                <strong>Автономный (гибридный) контроль очереди</strong> -
                автоматическое продвижение очереди по времени (ENABLED/DISABLED)
              </li>
              <li>
                <strong>Очистка очереди в 1:30</strong> - автоматическая очистка
                очереди в 1:30
              </li>
            </ul>
            <p>
              Все изменения сохраняются автоматически при переключении тоглов.
            </p>
          </div>
        </Section>

        <Section title='2. ВОЗМОЖНОСТИ АДМИНИСТРАТОРА'>
          <div className={styles.textBlock}>
            <h3>Управление очередью</h3>
            <p>В интерфейсе очереди администратор имеет доступ к:</p>
            <ul>
              <li>
                <strong>Панель администратора</strong> - отображается вверху
                страницы
              </li>
              <li>
                <strong>Кнопка ~Очистить очередь~</strong> - удаляет всех
                игроков из очереди
              </li>
              <li>
                <strong>Модальное окно управления игроком</strong> - открывается
                при клике три точки в правой части каждого игрока
              </li>
              <li>
                <strong>Действия с игроками:</strong>
                <ul>
                  <li>Удалить игрока из очереди</li>
                  <li>Отметить игру как завершенную</li>
                  <li>Просмотр информации об игроке</li>
                </ul>
              </li>
            </ul>
            <p>В ручном режиме игроки также могут управлять друг другом.</p>
          </div>
        </Section>

        <Section title='3. РЕЖИМЫ ОЧЕРЕДИ'>
          <div className={styles.textBlock}>
            <h3>Manual vs Automatic Queue</h3>
            <p>
              <strong>Автоматический режим:</strong>
            </p>
            <ul>
              <li>Очередь продвигается автоматически по времени</li>
              <li>Игроки не могут удалять друг друга</li>
              <li>Система работает автономно</li>
              <li>Подходит для загруженных периодов</li>
            </ul>

            <p>
              <strong>Ручной режим:</strong>
            </p>
            <ul>
              <li>Игроки сами управляют очередью</li>
              <li>Могут удалять себя и других игроков</li>
              <li>Требует активного участия игроков</li>
              <li>Подходит для спокойных периодов</li>
            </ul>

            <p>
              <strong>Переключение режимов:</strong>
            </p>
            <ul>
              <li>В Platform Settings → Manual Queue</li>
              <li>Изменения применяются мгновенно</li>
              <li>Система автоматически адаптируется</li>
            </ul>
          </div>
        </Section>

        <Section title='4. ИНФОРМАЦИОННЫЕ НАСТРОЙКИ'>
          <div className={styles.textBlock}>
            <h3>Info Settings</h3>
            <p>Настройка информационных сообщений для игроков:</p>
            <ul>
              <li>
                <strong>Автоматический режим</strong> - настройка сообщения для
                авт. режима
              </li>
              <li>
                <strong>Ручной режим</strong> - настройка сообщения для ручного
                режима
              </li>
              <li>
                <strong>Переключатели Use Description</strong> -
                включение/выключение кастомных сообщений
              </li>
              <li>
                <strong>Поля описания</strong> - до 250 символов
              </li>
              <li>
                <strong>Кнопки сохранения</strong> - отдельные для каждого
                режима
              </li>
            </ul>
            <p>
              Если кастомное описание отключено, отображается стандартное
              сообщение.
            </p>
          </div>
        </Section>

        <Section title='5. НАСТРОЙКИ МЕНЮ'>
          <div className={styles.textBlock}>
            <h3>Menu Settings</h3>
            <p>Управление меню заведения:</p>
            <ul>
              <li>
                <strong>Добавление позиций</strong> - название, описание, цена,
                изображение
              </li>
              <li>
                <strong>Редактирование</strong> - изменение существующих позиций
              </li>
              <li>
                <strong>Удаление</strong> - полное удаление позиций из меню
              </li>
              <li>
                <strong>Загрузка изображений</strong> - поддержка различных
                форматов
              </li>
              <li>
                <strong>Категории</strong> - напитки, еда, десерты и т.д.
              </li>
            </ul>
            <p>
              Все изменения сохраняются в базе данных и отображаются в публичном
              меню.
            </p>
          </div>
        </Section>

        <Section title='6. БУДУЩИЕ ОБНОВЛЕНИЯ'>
          <div className={styles.textBlock}>
            <h3>Roadmap & Features</h3>
            <p>Планируемые улучшения и новые возможности платформы:</p>

            <h4>🎯 Tournament Mode</h4>
            <p>Специальный режим для проведения быстрых бильярдных турниров:</p>
            <ul>
              <li>
                <strong>Быстрая регистрация</strong> - мгновенное добавление
                участников
              </li>
              <li>
                <strong>Автоматические пары</strong> - система автоматического
                формирования пар
              </li>
              <li>
                <strong>Турнирная сетка</strong> - визуальное отображение
                прогресса турнира
              </li>
              <li>
                <strong>Таймер матчей</strong> - ограниченное время на игру
              </li>
              <li>
                <strong>Система очков</strong> - автоматический подсчет
                результатов
              </li>
            </ul>

            <h4>🍽️ Enhanced Menu System</h4>
            <p>
              Расширенная система управления меню с гибким позиционированием:
            </p>
            <ul>
              <li>
                <strong>Drag & Drop</strong> - перетаскивание позиций для
                изменения порядка
              </li>
              <li>
                <strong>Кастомные категории</strong> - создание уникальных
                разделов меню
              </li>
              <li>
                <strong>Временные акции</strong> - ограниченные по времени
                предложения
              </li>
              <li>
                <strong>Мультимедиа контент</strong> - видео и анимации для
                позиций
              </li>
            </ul>

            <h4>🔧 Technical Improvements</h4>
            <ul>
              <li>
                <strong>Real-time уведомления</strong> - push-уведомления о
                статусе очереди
              </li>
              <li>
                <strong>QR-коды</strong> - быстрый доступ к очереди через
                сканирование
              </li>
              <li>
                <strong>Мультиязычность</strong> - поддержка нескольких языков
              </li>
              <li>
                <strong>Темная/светлая тема</strong> - переключение визуальных
                режимов
              </li>
              <li>
                <strong>API интеграции</strong> - подключение к внешним системам
              </li>
            </ul>

            <p>
              <em>
                Все обновления будут добавляться постепенно, сохраняя обратную
                совместимость и стабильность системы.
              </em>
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
