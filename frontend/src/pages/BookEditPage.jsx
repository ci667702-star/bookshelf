import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import BookForm, { recordToForm } from '../components/book/BookForm.jsx';
import { ErrorState, QueryState } from '../components/ui/States.jsx';

export default function BookEditPage() {
  useDocumentTitle('책 정보 수정');
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['books', id], queryFn: () => bookApi.get(id) });

  const save = useMutation({
    mutationFn: (body) => bookApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('책 정보를 저장했어요.');
      navigate(`/books/${id}`);
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-[22px]">책 정보 수정</h1>
      <QueryState query={q}>
        {(data) =>
          !data.isMine || !data.record ? (
            <ErrorState title="수정할 수 없어요" error={{ message: '내가 등록한 책만 수정할 수 있어요.' }} />
          ) : (
            <BookForm
              initial={recordToForm({ ...data.record, book: data.book })}
              onSubmit={(body) => save.mutate(body)}
              submitting={save.isPending}
              serverError={save.error}
              submitLabel="저장하기"
              onCancel={() => navigate(-1)}
            />
          )
        }
      </QueryState>
    </div>
  );
}
