import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { bookApi, sharedApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import BookForm from '../components/book/BookForm.jsx';

export default function BookNewPage() {
  useDocumentTitle('책 등록');
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const sharedId = params.get('shared');
  const shared = useQuery({ queryKey: ['shared', sharedId], queryFn: () => sharedApi.get(sharedId), enabled: !!sharedId });

  const create = useMutation({
    mutationFn: (body) => bookApi.create({ ...body, ...(sharedId ? { sharedBookshelfId: sharedId } : {}) }),
    onSuccess: (res) => {
      qc.invalidateQueries();
      toast.success(`「${res.record.book.title}」을(를) 책장에 꽂았어요.`);
      navigate(sharedId ? `/shared/${sharedId}` : `/books/${res.record.bookId}`);
    },
  });

  const existingId = create.error?.fields?.existingBookId;

  return (
    <div>
      <h1 className="text-[22px]">책 등록</h1>
      <p className="mt-1 mb-6 text-[14px] text-ink-soft">읽은 책, 읽는 중인 책, 읽고 싶은 책 모두 꽂을 수 있어요.</p>
      {sharedId && shared.data && (
        <p className="mb-5 flex items-center gap-2 rounded-[8px] bg-matcha px-4 py-3 text-[13.5px]">
          <Users size={16} /> 등록하면 공유 책장 <b>「{shared.data.shelf.name}」</b>에도 함께 꽂혀요.
        </p>
      )}
      {existingId && (
        <p className="mb-5 rounded-[8px] bg-butter px-4 py-3 text-[13.5px]">
          이미 등록한 책이에요.{' '}
          <Link to={`/books/${existingId}`} className="font-semibold text-cocoa-deep underline">
            그 책으로 가기
          </Link>
        </p>
      )}
      <BookForm
        initial={location.state?.shelfId ? { bookshelfId: location.state.shelfId } : undefined}
        onSubmit={(body) => create.mutate(body)}
        submitting={create.isPending}
        serverError={create.error}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
