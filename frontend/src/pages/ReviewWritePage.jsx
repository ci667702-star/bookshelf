import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookApi, reviewApi, sharedApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { Field, Input, Select, Textarea, FormError } from '../components/ui/Field.jsx';
import { StarRating, Toggle } from '../components/ui/Misc.jsx';
import { EmptyState, PageLoader, ErrorState } from '../components/ui/States.jsx';
import BookCover from '../components/book/BookCover.jsx';
import { formatDateTime, formatTodayLong } from '../utils/format.js';

export default function ReviewWritePage() {
  const { id } = useParams();
  const editing = !!id;
  useDocumentTitle(editing ? '독후감 수정' : '독후감 쓰기');
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const books = useQuery({ queryKey: ['books', 'mine', 'all'], queryFn: () => bookApi.list({ sort: 'recent', limit: 200 }) });
  const shared = useQuery({ queryKey: ['shared', 'list', 'mine'], queryFn: () => sharedApi.list('mine') });
  const existing = useQuery({ queryKey: ['reviews', id], queryFn: () => reviewApi.get(id), enabled: editing });

  const [f, setF] = useState({
    bookId: params.get('bookId') || '',
    title: '',
    content: '',
    rating: null,
    isPublic: true,
    sharedBookshelfId: params.get('shared') || '',
  });
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(!editing);

  useEffect(() => {
    if (editing && existing.data && !loaded) {
      const r = existing.data.review;
      setF({
        bookId: r.book?.id ?? '',
        title: r.title,
        content: r.content,
        rating: r.rating,
        isPublic: r.isPublic,
        sharedBookshelfId: r.sharedBookshelf?.id ?? '',
      });
      setLoaded(true);
    }
  }, [editing, existing.data, loaded]);

  // 책을 고르면 그 책의 별점을 기본값으로
  useEffect(() => {
    if (!editing && f.bookId && f.rating == null) {
      const rec = books.data?.items.find((r) => r.book.id === f.bookId);
      if (rec?.rating) setF((v) => ({ ...v, rating: rec.rating }));
    }
    // 별점을 직접 지운 경우엔 다시 채우지 않도록 책이 바뀔 때만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.bookId, books.data, editing]);

  useEffect(() => {
    if (!f.bookId && books.data?.items?.length && !editing) setF((v) => ({ ...v, bookId: books.data.items[0].book.id }));
  }, [books.data, f.bookId, editing]);

  const save = useMutation({
    mutationFn: (body) => (editing ? reviewApi.update(id, body) : reviewApi.create(body)),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['books'] });
      qc.invalidateQueries({ queryKey: ['shared'] });
      toast.success(editing ? '독후감을 고쳤어요.' : '독후감을 남겼어요.');
      navigate(`/reviews/${res.review.id}`, { replace: true });
    },
    onError: (e) => setErrors(e.fields || {}),
  });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!f.bookId) errs.bookId = '관련 책을 골라 주세요.';
    if (!f.title.trim()) errs.title = '제목을 입력해 주세요.';
    if (f.content.trim().length < 10) errs.content = '내용을 10자 이상 써 주세요.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    save.mutate({
      bookId: f.bookId,
      title: f.title.trim(),
      content: f.content.trim(),
      rating: f.rating,
      isPublic: f.isPublic,
      sharedBookshelfId: f.sharedBookshelfId || null,
    });
  };

  if (books.isPending || (editing && existing.isPending)) return <PageLoader />;
  if (books.isError) return <ErrorState error={books.error} onRetry={books.refetch} />;
  if (editing && existing.isError) return <ErrorState error={existing.error} />;
  if (editing && existing.data && !existing.data.review.isMine) {
    return <ErrorState title="수정할 수 없어요" error={{ message: '내가 쓴 독후감만 고칠 수 있어요.' }} />;
  }
  if (!books.data.items.length) {
    return <EmptyState title="먼저 책을 등록해 주세요" description="독후감은 내 책장에 있는 책으로 쓸 수 있어요." action={<Button to="/books/new">책 등록하기</Button>} />;
  }

  const selected = books.data.items.find((r) => r.book.id === f.bookId);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[22px]">{editing ? '독후감 수정' : '독후감 쓰기'}</h1>
      <p className="mt-1 mb-6 text-[13.5px] text-ink-soft">
        작성일 {editing && existing.data ? formatDateTime(existing.data.review.createdAt) : formatTodayLong()}
      </p>

      <form onSubmit={submit} noValidate className="card flex flex-col gap-5 p-5 sm:p-8">
        <FormError message={save.error && !Object.keys(save.error.fields || {}).length ? save.error.message : null} />
        <div className="flex gap-4">
          {selected && <BookCover book={selected.book} className="hidden h-24 w-[68px] shrink-0 sm:block" />}
          <div className="flex flex-1 flex-col gap-4">
            <Field label="관련 책" required error={errors.bookId}>
              <Select value={f.bookId} onChange={(e) => setF({ ...f, bookId: e.target.value })}>
                {books.data.items.map((r) => (
                  <option key={r.book.id} value={r.book.id}>
                    {r.book.title} — {r.book.author}
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <p className="mb-1 text-[13.5px] font-semibold">별점</p>
              <StarRating value={f.rating} onChange={(v) => setF({ ...f, rating: v })} size={26} />
            </div>
          </div>
        </div>

        <Field label="제목" required error={errors.title}>
          <Input value={f.title} maxLength={100} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="이 책을 한 줄로 부른다면" className="font-serif text-[17px]" />
        </Field>
        <Field label="내용" required error={errors.content} hint={`${f.content.length.toLocaleString()} / 10,000자 · 빈 줄로 문단을 나눠요`}>
          <Textarea
            value={f.content}
            maxLength={10000}
            onChange={(e) => setF({ ...f, content: e.target.value })}
            rows={14}
            className="min-h-72 text-[15.5px] leading-[1.9]"
            placeholder="좋았던 문장, 떠오른 기억, 누군가에게 권하고 싶은 이유…"
          />
        </Field>

        <Toggle
          checked={f.isPublic}
          onChange={(v) => setF({ ...f, isPublic: v })}
          label={f.isPublic ? '공개 독후감' : '비공개 독후감'}
          description={f.isPublic ? '모든 사용자가 읽고 좋아요와 댓글을 남길 수 있어요.' : '나만 볼 수 있어요. (공유 책장에 올리면 그 책장 참여자도 볼 수 있어요)'}
        />

        <Field label="공유 책장에도 올리기 (선택)" hint={shared.data?.items?.length ? undefined : '참여 중인 공유 책장이 없어요.'}>
          <Select value={f.sharedBookshelfId} onChange={(e) => setF({ ...f, sharedBookshelfId: e.target.value })} disabled={!shared.data?.items?.length}>
            <option value="">올리지 않기</option>
            {(shared.data?.items ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end gap-2 border-t border-kraft-deep/60 pt-5">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" size="lg" loading={save.isPending}>
            {editing ? '고친 내용 저장' : '독후감 남기기'}
          </Button>
        </div>
      </form>
      {selected && (
        <p className="mt-3 text-center text-[12.5px] text-ink-soft">
          <Link to={`/books/${selected.book.id}`} className="underline">
            「{selected.book.title}」 책 페이지로
          </Link>
        </p>
      )}
    </div>
  );
}
