import { useRef, useState } from 'react';
import { ImagePlus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { miscApi } from '../../services/index.js';
import Button from './Button.jsx';
import { Spinner } from './States.jsx';

const MAX_MB = 5;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

/**
 * 이미지 업로드(서버 /api/uploads) 또는 URL 입력.
 * value: '/uploads/...' | 'https://...' | null
 */
export default function ImageUpload({ value, onChange, label = '이미지', aspect = 'aspect-[3/4]', allowUrl = true, preview }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');

  const pick = async (file) => {
    if (!file) return;
    setError('');
    if (!ACCEPT.split(',').includes(file.type)) return setError('jpg, png, webp, gif 이미지만 올릴 수 있어요.');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`${MAX_MB}MB 이하 이미지만 올릴 수 있어요.`);
    setUploading(true);
    try {
      const res = await miscApi.upload(file);
      onChange(res.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const applyUrl = () => {
    const v = url.trim();
    if (!/^https?:\/\/\S+$/i.test(v)) return setError('http:// 또는 https:// 로 시작하는 주소를 넣어 주세요.');
    setError('');
    onChange(v);
    setUrl('');
    setUrlMode(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative overflow-hidden rounded-[8px] border-[1.5px] border-dashed border-kraft-deep bg-milk ${aspect}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        {preview ? (
          preview
        ) : value ? (
          <img src={value} alt={`${label} 미리보기`} className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-soft transition hover:bg-kraft/40"
          >
            <ImagePlus size={24} />
            <span className="text-[12.5px]">눌러서 올리거나 끌어다 놓기</span>
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-milk/80">
            <Spinner />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label={`${label} 파일 선택`} />
      <div className="flex flex-wrap gap-1.5">
        <Button size="xs" variant="soft" onClick={() => inputRef.current?.click()} loading={uploading}>
          <ImagePlus size={13} /> {value ? '바꾸기' : '사진 올리기'}
        </Button>
        {allowUrl && (
          <Button size="xs" variant="ghost" onClick={() => setUrlMode((v) => !v)}>
            <LinkIcon size={13} /> 주소로 넣기
          </Button>
        )}
        {value && (
          <Button size="xs" variant="danger-ghost" onClick={() => onChange(null)}>
            <Trash2 size={13} /> 지우기
          </Button>
        )}
      </div>
      {urlMode && (
        <div className="flex gap-1.5">
          <input
            className="field h-9 text-[13px]"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyUrl();
              }
            }}
            aria-label={`${label} 이미지 주소`}
          />
          <Button size="sm" variant="outline" onClick={applyUrl}>
            적용
          </Button>
        </div>
      )}
      {error && <p className="text-[12.5px] font-medium text-berry" role="alert">{error}</p>}
      <p className="text-[11.5px] text-ink-soft">jpg · png · webp · gif, {MAX_MB}MB 이하</p>
    </div>
  );
}
