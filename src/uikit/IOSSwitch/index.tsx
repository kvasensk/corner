import styles from './IOSSwitch.module.css';

export type IOSwitchProps = {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
};

export default function IOSSwitch({
  checked,
  onChange,
  disabled,
}: IOSwitchProps) {
  return (
    <span className={[styles.root, disabled ? styles.disabled : ''].join(' ')}>
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
      />
      <span
        className={[styles.track, checked ? styles.trackChecked : ''].join(' ')}
      >
        <span
          className={[styles.thumb, checked ? styles.thumbChecked : ''].join(
            ' '
          )}
        />
      </span>
    </span>
  );
}
