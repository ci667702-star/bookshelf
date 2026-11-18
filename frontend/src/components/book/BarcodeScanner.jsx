import { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input } from '../ui/Field.jsx';

/** 바코드 문자열에서 ISBN(978/979로 시작하는 13자리 또는 10자리)만 꺼낸다 */
export function toIsbn(text) {
  const d = String(text ?? '').replace(/[^0-9Xx]/g, '');
  if (/^97[89]\d{10}$/.test(d)) return d;
  if (/^\d{9}[\dXx]$/.test(d)) return d.toUpperCase();
  return null;
}

const hasNativeDetector = () => typeof window !== 'undefined' && 'BarcodeDetector' in window;

async function nativeDetector() {
  const formats = await window.BarcodeDetector.getSupportedFormats?.();
  if (formats && !formats.includes('ean_13')) return null;
  return new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
}

/**
 * 책 뒤표지 바코드를 찍어 ISBN 을 읽는다.
 * 1) 브라우저 내장 BarcodeDetector (안드로이드 크롬 등) 2) 없으면 ZXing 라이브러리
 * 카메라가 없거나 막혀 있으면 사진 파일로도 읽을 수 있다.
 */
export default function BarcodeScanner({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | scanning | error
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let stream;
    let stopped = false;
    let zxingControls;
    let raf;
    setManual('');

    const finish = (isbn) => {
      if (stopped) return;
      stopped = true;
      onDetected(isbn);
      onClose();
    };

    (async () => {
      setStatus('starting');
      setMessage('');
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setMessage(
          window.isSecureContext
            ? '이 기기에서는 카메라를 쓸 수 없어요. 아래 「사진으로 찾기」를 이용해 주세요.'
            : '카메라는 https 주소(또는 localhost)에서만 쓸 수 있어요. 아래 「사진으로 찾기」를 이용해 주세요.'
        );
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch (err) {
        setStatus('error');
        setMessage(
          err.name === 'NotAllowedError'
            ? '카메라 권한이 막혀 있어요. 브라우저 주소창의 권한 설정에서 카메라를 허용해 주세요.'
            : '카메라를 찾지 못했어요. 아래 「사진으로 찾기」를 이용해 주세요.'
        );
        return;
      }
      if (stopped) return;
      const video = videoRef.current;

      const detector = hasNativeDetector() ? await nativeDetector().catch(() => null) : null;
      if (detector) {
        video.srcObject = stream;
        await video.play().catch(() => {});
        setStatus('scanning');
        let last = 0;
        const tick = async (t) => {
          if (stopped) return;
          if (t - last > 250 && video.readyState >= 2) {
            last = t;
            try {
              const codes = await detector.detect(video);
              const isbn = codes.map((c) => toIsbn(c.rawValue)).find(Boolean);
              if (isbn) return finish(isbn);
            } catch {
              /* 다음 프레임에서 다시 */
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } else {
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
        if (stopped) return;
        const reader = new BrowserMultiFormatOneDReader();
        setStatus('scanning');
        zxingControls = await reader.decodeFromStream(stream, video, (result) => {
          const isbn = result && toIsbn(result.getText());
          if (isbn) finish(isbn);
        });
      }
    })();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onClose, onDetected]);

  const fromPhoto = async (file) => {
    if (!file) return;
    setMessage('사진에서 바코드를 찾는 중...');
    const url = URL.createObjectURL(file);
    try {
      let isbn = null;
      const detector = hasNativeDetector() ? await nativeDetector().catch(() => null) : null;
      if (detector) {
        const bitmap = await createImageBitmap(file);
        isbn = (await detector.detect(bitmap)).map((c) => toIsbn(c.rawValue)).find(Boolean) ?? null;
      }
      if (!isbn) {
        const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
        const result = await new BrowserMultiFormatOneDReader().decodeFromImageUrl(url).catch(() => null);
        isbn = result ? toIsbn(result.getText()) : null;
      }
      if (isbn) {
        onDetected(isbn);
        onClose();
      } else {
        setMessage('사진에서 ISBN 바코드를 찾지 못했어요. 바코드가 크고 선명하게 나오게 다시 찍어 주세요.');
      }
    } finally {
      URL.revokeObjectURL(url);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const manualIsbn = toIsbn(manual);

  return (
    <Modal open={open} onClose={onClose} title="바코드로 책 찾기" tone="aqua">
      <div className="flex flex-col gap-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] border-[1.5px] border-ink/85 bg-ink">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline aria-label="카메라 미리보기" />
          {status === 'scanning' && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
              <div className="relative h-[34%] w-[78%] rounded-[6px] border-2 border-dashed border-white/90">
                <span className="absolute inset-x-2 top-1/2 h-[2px] animate-pulse bg-pin" />
              </div>
            </div>
          )}
          {status !== 'scanning' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-[13.5px] text-white/90">
              {status === 'starting' ? (
                <span className="flex items-center gap-2">
                  <Camera size={18} /> 카메라를 켜는 중...
                </span>
              ) : (
                message
              )}
            </div>
          )}
        </div>
        <p className="text-[13px] text-ink-soft">
          책 뒤표지의 <b>ISBN 바코드</b>(978 또는 979로 시작)를 네모 칸에 맞춰 주세요. 읽히면 자동으로 검색해요.
        </p>
        {status === 'scanning' && message && <p className="text-[13px] text-berry">{message}</p>}

        <div className="flex flex-wrap items-center gap-2 border-t border-ink/15 pt-3">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <ImageUp size={14} /> 사진으로 찾기
          </Button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => fromPhoto(e.target.files?.[0])} aria-label="바코드 사진 선택" />
          {status === 'error' && message && <p className="w-full text-[12.5px] text-berry">{message}</p>}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (manualIsbn) {
              onDetected(manualIsbn);
              onClose();
            }
          }}
        >
          <label htmlFor="manual-isbn" className="sr-only">
            ISBN 직접 입력
          </label>
          <Input id="manual-isbn" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="ISBN 직접 입력 (예: 9788932917245)" inputMode="numeric" className="h-9 text-[13.5px]" />
          <Button type="submit" size="sm" variant="soft" disabled={!manualIsbn}>
            찾기
          </Button>
        </form>
      </div>
    </Modal>
  );
}
