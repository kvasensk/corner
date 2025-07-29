import React, { useRef, useState } from 'react';
import AWS from 'aws-sdk';
import styles from './ImageUploader.module.css';

const S3_BUCKET = process.env.NEXT_PUBLIC_YANDEX_CLOUD_BUCKET;
const REGION = process.env.NEXT_PUBLIC_YANDEX_CLOUD_REGION;
const ENDPOINT = process.env.NEXT_PUBLIC_YANDEX_CLOUD_ENDPOINT;
const ACCESS_KEY = process.env.NEXT_PUBLIC_YANDEX_CLOUD_KEY;
const SECRET_KEY = process.env.NEXT_PUBLIC_YANDEX_CLOUD_SECRET;

const s3 = new AWS.S3({
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY as string,
    secretAccessKey: SECRET_KEY as string,
  },
  signatureVersion: 'v4',
});

interface ImageUploaderProps {
  value?: string;
  onUpload: (url: string) => void;
}

export default function ImageUploader({ value, onUpload }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const key = `menu/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      await s3
        .putObject({
          Bucket: S3_BUCKET as string,
          Key: key,
          Body: file,
          ContentType: file.type,
          ACL: 'public-read',
        })
        .promise();
      const url = `${ENDPOINT}/${S3_BUCKET}/${key}`;
      onUpload(url);
    } catch (e) {
      console.log(e);
      setError('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <input
        type='file'
        accept='image/*'
        ref={fileInput}
        className={styles.hiddenInput}
        onChange={handleFile}
      />
      <button
        type='button'
        onClick={() => fileInput.current?.click()}
        className={styles.uploadButton}
        disabled={loading}
      >
        {loading
          ? 'Загрузка...'
          : value
          ? 'Заменить картинку'
          : 'Загрузить картинку'}
      </button>
      {value && <img src={value} alt='preview' className={styles.previewImg} />}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
