import styles from './Loader.module.css';

export default function Loader({ text }: { text: string }) {
  return (
    <div className={styles.loaderWrapper}>
      <svg
        width='80'
        height='80'
        viewBox='0 0 80 80'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className={styles.loaderSvg}
      >
        <circle
          cx='40'
          cy='40'
          r='36'
          fill='#222'
          stroke='#fff'
          strokeWidth='4'
        />
        <circle cx='40' cy='40' r='18' fill='#fff' />
        <text
          x='40'
          y='48'
          textAnchor='middle'
          fontSize='28'
          fontWeight='bold'
          fill='#222'
          fontFamily='Arial'
        >
          8
        </text>
      </svg>
      <div className={styles.loaderText}>{text}</div>
    </div>
  );
}
