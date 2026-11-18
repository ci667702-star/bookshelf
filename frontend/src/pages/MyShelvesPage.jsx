import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { shelfApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { EmptyState, QueryState } from '../components/ui/States.jsx';
import { ShelfCard, ShelfFormModal } from '../components/shelf/ShelfParts.jsx';

export default function MyShelvesPage() {
  useDocumentTitle('나의 책장');
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const q = useQuery({ queryKey: ['shelves', 'mine'], queryFn: () => shelfApi.list({ scope: 'mine' }) });

  const create = useMutation({
    mutationFn: shelfApi.create,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['shelves'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`「${res.shelf.name}」 책장을 만들었어요.`);
      setCreating(false);
      navigate(`/shelves/${res.shelf.id}`);
    },
  });

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px]">나의 책장</h1>
          <p className="mt-1 text-[14px] text-ink-soft">주제별로 책장을 나누고, 공개할 책장만 골라 보여 줄 수 있어요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" to="/books/new">
            책 등록
          </Button>
          <Button
            onClick={() => {
              create.reset();
              setCreating(true);
            }}
          >
            <Plus size={16} /> 새 책장
          </Button>
        </div>
      </div>

      <QueryState query={q}>
        {(data) =>
          data.items.length === 0 ? (
            <EmptyState title="책장이 없어요" description="새 책장을 만들어 책을 꽂아 보세요." action={<Button onClick={() => setCreating(true)}>새 책장 만들기</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((s) => (
                <ShelfCard key={s.id} shelf={s} />
              ))}
            </div>
          )
        }
      </QueryState>

      <ShelfFormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="새 책장 만들기"
        onSubmit={(body) => create.mutate(body)}
        submitting={create.isPending}
        error={create.error}
      />
    </div>
  );
}
