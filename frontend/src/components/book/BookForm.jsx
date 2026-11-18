import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shelfApi } from '../../services/index.js';
import { Field, Input, Select, Textarea, FormError } from '../ui/Field.jsx';
import { Segmented, StarRating } from '../ui/Misc.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';
import Button from '../ui/Button.jsx';
import BookCover from './BookCover.jsx';
import BookSearch from './BookSearch.jsx';
import { bookSearchApi } from '../../services/index.js';
import { STATUS, STATUS_KEYS } from '../../utils/constants.js';
import { todayKey } from '../../utils/format.js';

const EMPTY = {
  title: '',
  author: '',
  publisher: '',
  coverImage: null,
  totalPages: '',
  bookshelfId: '',
  status: 'READING',
  currentPage: '',
  rating: null,
  oneLineReview: '',
  startDate: todayKey(),
  finishDate: '',
};

export function recordToForm(record) {
  const b = record.book;
  return {
    title: b.title,
    author: b.author,
    publisher: b.publisher ?? '',
    coverImage: b.coverImage ?? null,
    totalPages: String(b.totalPages),
    bookshelfId: record.bookshelfId ?? '',
    status: record.status,
    currentPage: String(record.currentPage ?? ''),
    rating: record.rating ?? null,
    oneLineReview: record.oneLineReview ?? '',
    startDate: record.startDate ?? '',
    finishDate: record.finishDate ?? '',
  };
}

/** 클라이언트 검증 (서버도 같은 규칙으로 다시 검증) */
function validate(f) {
  const e = {};
  if (!f.title.trim()) e.title = '책 제목을 입력해 주세요.';
  if (!f.author.trim()) e.author = '저자를 입력해 주세요.';
  const total = Number(f.totalPages);
  if (!f.totalPages || !Number.isInteger(total) || total < 1) e.totalPages = '전체 페이지 수를 1 이상의 숫자로 입력해 주세요.';
  if ((f.status === 'READING' || f.status === 'STOPPED') && f.currentPage !== '') {
    const cp = Number(f.currentPage);
    if (!Number.isInteger(cp) || cp < 0) e.currentPage = '0 이상의 숫자로 입력해 주세요.';
    else if (total && cp > total) e.currentPage = `전체 페이지(${total})보다 클 수 없어요.`;
  }
  const today = todayKey();
  if (f.startDate && f.startDate > today) e.startDate = '오늘 이후 날짜는 고를 수 없어요.';
  if (f.status === 'FINISHED' && f.finishDate) {
    if (f.finishDate > today) e.finishDate = '오늘 이후 날짜는 고를 수 없어요.';
    if (f.startDate && f.finishDate < f.startDate) e.finishDate = '완독일은 시작일보다 빠를 수 없어요.';
  }
  return e;
}

export default function BookForm({ initial, onSubmit, submitting, serverError, submitLabel = '책장에 꽂기', onCancel, lockShelf = false }) {
  const [f, setF] = useState(() => ({ ...EMPTY, ...initial }));
  const [errors, setErrors] = useState({});
  const shelves = useQuery({ queryKey: ['shelves', 'mine'], queryFn: () => shelfApi.list({ scope: 'mine' }) });

  useEffect(() => {
    if (!f.bookshelfId && shelves.data?.items?.length) {
      setF((v) => ({ ...v, bookshelfId: shelves.data.items[0].id }));
    }
  }, [shelves.data, f.bookshelfId]);

  useEffect(() => {
    if (serverError?.fields) setErrors((prev) => ({ ...prev, ...serverError.fields }));
  }, [serverError]);

  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e?.target ? e.target.value : e }));
  const [filledNote, setFilledNote] = useState('');

  // 검색 결과를 고르면 책 정보를 채운다 (페이지 수는 ISBN 으로 한 번 더 찾아본다)
  const pickFromSearch = (item) => {
    setF((v) => ({
      ...v,
      title: item.title ?? v.title,
      author: item.author ?? v.author,
      publisher: item.publisher ?? '',
      coverImage: item.coverImage ?? v.coverImage,
      totalPages: item.totalPages ? String(item.totalPages) : '',
    }));
    setErrors({});
    setFilledNote(item.totalPages ? '책 정보를 채웠어요.' : '책 정보를 채웠어요. 전체 페이지 수를 확인해 주세요.');
    if (!item.totalPages && item.isbn) {
      bookSearchApi
        .pages(item.isbn)
        .then((res) => {
          if (res.totalPages) {
            setF((v) => (v.totalPages ? v : { ...v, totalPages: String(res.totalPages) }));
            setFilledNote('책 정보를 채웠어요. 페이지 수도 찾았어요.');
          }
        })
        .catch(() => {});
    }
  };

  const total = Number(f.totalPages) || 0;
  const counted =
    f.status === 'FINISHED' ? total : f.status === 'WANT_TO_READ' ? 0 : Math.min(Number(f.currentPage) || 0, total);
  const previewBook = useMemo(
    () => ({ id: initial?.title ? `${initial.title}` : f.title || 'preview', title: f.title || '책 제목', author: f.author || '저자', coverImage: f.coverImage }),
    [f.title, f.author, f.coverImage, initial?.title]
  );

  const submit = (e) => {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const showProgress = f.status === 'READING' || f.status === 'STOPPED';
    onSubmit({
      title: f.title.trim(),
      author: f.author.trim(),
      publisher: f.publisher.trim() || null,
      coverImage: f.coverImage || null,
      totalPages: total,
      bookshelfId: f.bookshelfId || undefined,
      status: f.status,
      currentPage: showProgress ? Number(f.currentPage) || 0 : 0,
      rating: f.status === 'WANT_TO_READ' ? null : f.rating,
      oneLineReview: f.oneLineReview.trim() || null,
      startDate: f.status === 'WANT_TO_READ' ? null : f.startDate || null,
      finishDate: f.status === 'FINISHED' ? f.finishDate || null : null,
    });
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="card flex flex-col gap-5 p-5 sm:p-7">
        <FormError message={serverError && !Object.keys(serverError.fields || {}).length ? serverError.message : null} />

        <BookSearch onPick={pickFromSearch} />
        {filledNote && (
          <p role="status" className="-mt-2 text-[12.5px] font-semibold text-matcha-deep">
            {filledNote}
          </p>
        )}

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 font-serif text-[19px]">책 정보</legend>
          <Field label="책 제목" required error={errors.title}>
            <Input value={f.title} onChange={set('title')} maxLength={200} placeholder="예: 어린 왕자" autoComplete="off" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="저자" required error={errors.author}>
              <Input value={f.author} onChange={set('author')} maxLength={120} placeholder="예: 생텍쥐페리" />
            </Field>
            <Field label="출판사" error={errors.publisher}>
              <Input value={f.publisher} onChange={set('publisher')} maxLength={120} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="전체 페이지 수" required error={errors.totalPages} hint="100쪽 = 독서 마라톤 1cm">
              <Input type="number" inputMode="numeric" min={1} max={20000} value={f.totalPages} onChange={set('totalPages')} placeholder="예: 248" />
            </Field>
            <Field label="꽂을 책장" error={errors.bookshelfId}>
              <Select value={f.bookshelfId} onChange={set('bookshelfId')} disabled={lockShelf || shelves.isPending}>
                {(shelves.data?.items ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isPublic ? '(공개)' : '(비공개)'}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 border-t border-kraft-deep/60 pt-5">
          <legend className="sr-only">독서 기록</legend>
          <p className="font-serif text-[19px]" aria-hidden>
            독서 기록
          </p>
          <div>
            <p className="mb-1.5 text-[13.5px] font-semibold">독서 상태</p>
            <Segmented
              label="독서 상태"
              value={f.status}
              onChange={set('status')}
              options={STATUS_KEYS.map((k) => ({ value: k, label: STATUS[k].label }))}
            />
          </div>

          {(f.status === 'READING' || f.status === 'STOPPED') && (
            <Field label="현재 읽은 페이지" error={errors.currentPage} hint={total ? `0 ~ ${total}쪽` : undefined}>
              <Input type="number" inputMode="numeric" min={0} max={total || undefined} value={f.currentPage} onChange={set('currentPage')} placeholder="0" />
            </Field>
          )}

          {f.status !== 'WANT_TO_READ' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="읽기 시작한 날" error={errors.startDate}>
                <Input type="date" value={f.startDate} max={todayKey()} onChange={set('startDate')} />
              </Field>
              {f.status === 'FINISHED' && (
                <Field label="완독한 날" error={errors.finishDate} hint="비워 두면 오늘로 저장돼요">
                  <Input type="date" value={f.finishDate} min={f.startDate || undefined} max={todayKey()} onChange={set('finishDate')} />
                </Field>
              )}
            </div>
          )}

          {f.status !== 'WANT_TO_READ' && (
            <div>
              <p className="mb-1 text-[13.5px] font-semibold">별점</p>
              <StarRating value={f.rating} onChange={(v) => setF((x) => ({ ...x, rating: v }))} size={26} />
            </div>
          )}

          <Field label="한 줄 감상" error={errors.oneLineReview} hint={`${f.oneLineReview.length}/150`}>
            <Textarea
              value={f.oneLineReview}
              onChange={set('oneLineReview')}
              maxLength={150}
              rows={2}
              className="min-h-16"
              placeholder="이 책을 한 문장으로 남긴다면?"
            />
          </Field>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2 border-t border-kraft-deep/60 pt-5">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" size="lg" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </div>

      {/* 표지 & 미리보기 */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <p className="mb-3 text-[13.5px] font-semibold">책 표지</p>
          <ImageUpload
            label="책 표지"
            value={f.coverImage}
            onChange={(v) => setF((x) => ({ ...x, coverImage: v }))}
            preview={!f.coverImage ? <BookCover book={previewBook} className="h-full w-full" rounded="rounded-none" shadow={false} /> : undefined}
          />
        </div>
        <div className="tile bg-matcha/70 p-5">
          <p className="text-[13px] font-semibold text-matcha-deep">독서 마라톤에 더해질 높이</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="numeral text-[34px] leading-none text-ink">+{(counted * 0.01).toFixed(2)}</span>
            <span className="text-[13px] font-bold">cm</span>
          </p>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            {f.status === 'FINISHED'
              ? `완독한 책은 전체 ${total}쪽이 쌓여요.`
              : f.status === 'WANT_TO_READ'
                ? '읽기 시작하면 쌓이기 시작해요.'
                : `실제로 읽은 ${counted}쪽만 쌓여요.`}
          </p>
        </div>
      </aside>
    </form>
  );
}
