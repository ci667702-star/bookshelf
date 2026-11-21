import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Select, FormError } from '../ui/Field.jsx';
import { Segmented } from '../ui/Misc.jsx';
import { readingApi } from '../../services/index.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { todayKey } from '../../utils/format.js';

/**
 * 오늘(또는 지정한 날) 읽은 페이지 기록.
 * records: 기록할 수 있는 책 목록 (읽는 중/읽고 싶은 책/중단). record 를 주면 그 책으로 고정.
 */
export default function LogModal({ open, onClose, record, records = [], defaultDate }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [recordId, setRecordId] = useState(record?.id ?? '');
  const [mode, setMode] = useState('pages');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(defaultDate ?? todayKey());
  const [memo, setMemo] = useState('');
  const [error, setError] = useState(null);

  // 열릴 때만 초기화 (records 기본값 [] 은 매 렌더 새 배열이라 의존성에 넣지 않음)
  useEffect(() => {
    if (open) {
      setRecordId(record?.id ?? records[0]?.id ?? '');
      setDate(defaultDate ?? todayKey());
      setValue('');
      setMemo('');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const current = record ?? records.find((r) => r.id === recordId);
  const base = current ? (current.status === 'WANT_TO_READ' ? 0 : current.currentPage) : 0;
  const total = current?.book?.totalPages ?? 0;

  const m = useMutation({
    mutationFn: () =>
      readingApi.addLog(current.id, {
        date,
        memo: memo.trim() || null,
        ...(mode === 'pages' ? { pagesRead: Number(value) } : { toPage: Number(value) }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries();
      toast.success(res.finished ? `완독을 축하해요! 「${current.book.title}」이 책장에 꽂혔어요.` : `${res.log.pagesRead}쪽 기록했어요.`);
      onClose();
    },
    onError: setError,
  });

  const preview =
    value && Number(value) > 0 ? Math.min(total, mode === 'pages' ? base + Number(value) : Number(value)) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="오늘 읽은 페이지 기록"
      tone="butter"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => m.mutate()} loading={m.isPending} disabled={!current || !value}>
            기록하기
          </Button>
        </>
      }
    >
      {!current ? (
        <p className="text-[14px] text-ink-soft">기록할 수 있는 책이 없어요. 먼저 읽는 중인 책을 등록해 주세요.</p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (value) m.mutate();
          }}
        >
          <FormError message={error?.message} />
          {!record && (
            <Field label="책">
              <Select value={recordId} onChange={(e) => setRecordId(e.target.value)}>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.book.title} ({r.status === 'WANT_TO_READ' ? 0 : r.currentPage}/{r.book.totalPages}쪽)
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <p className="rounded-[3px] bg-milk px-4 py-3 text-[13.5px]">
            <b className="font-serif">{current.book.title}</b> — 지금까지 <b>{base}</b> / {total}쪽
          </p>
          <Segmented
            label="입력 방식"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'pages', label: '읽은 쪽수' },
              { value: 'toPage', label: '몇 쪽까지 읽었나' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label={mode === 'pages' ? '오늘 읽은 쪽수' : '읽은 곳 (페이지)'} error={error?.fields?.pagesRead || error?.fields?.toPage}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={mode === 'pages' ? total - base : total}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={mode === 'pages' ? '예: 30' : `${base + 1} ~ ${total}`}
              />
            </Field>
            <Field label="날짜" error={error?.fields?.date}>
              <Input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <Field label="한 줄 메모 (선택)">
            <Input value={memo} maxLength={200} onChange={(e) => setMemo(e.target.value)} placeholder="오늘 마음에 남은 문장이나 생각" />
          </Field>
          {preview != null && (
            <p className="text-[13px] text-ink-soft">
              기록하면 <b className="text-ink">{preview}쪽</b>까지 읽은 것으로 저장돼요
              {preview >= total ? ' — 완독 처리됩니다!' : '.'} 독서 마라톤 +{((preview - base) * 0.01).toFixed(2)}cm
            </p>
          )}
          <button type="submit" className="hidden" />
        </form>
      )}
    </Modal>
  );
}
