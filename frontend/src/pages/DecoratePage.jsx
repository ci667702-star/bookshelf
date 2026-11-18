import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpToLine, Minus, Plus, RotateCcw, RotateCw, Save, Trash2, Undo2 } from 'lucide-react';
import { shelfApi } from '../services/index.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/index.js';
import Button from '../components/ui/Button.jsx';
import { QueryState, EmptyState, PageLoader, ErrorState } from '../components/ui/States.jsx';
import { Select } from '../components/ui/Field.jsx';
import { Segmented } from '../components/ui/Misc.jsx';
import ImageUpload from '../components/ui/ImageUpload.jsx';
import Sticker from '../components/ui/Sticker.jsx';
import ShelfScene from '../components/book/ShelfScene.jsx';
import { ARRANGEMENTS, ITEM_LABELS, SHELF_STYLES, STICKER_LABELS, THEMES, THEME_KEYS } from '../utils/constants.js';

const BG_PRESETS = ['#FFF9F2', '#FFFFFF', '#FBE4E4', '#F2E8DC', '#EFE2D0', '#E3EEF7', '#E4EDDF', '#EEE7F6', '#F8E8B8'];
const MAX_DECO = 40;

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function Panel({ title, children }) {
  return (
    <section className="border-b border-kraft-deep/60 py-4 first:pt-0 last:border-0">
      <h2 className="mb-2.5 font-sans text-[13.5px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border-[1.5px] px-2.5 py-2 text-[12.5px] font-semibold transition ${
        active ? 'border-cocoa bg-rose/50' : 'border-kraft-deep/70 bg-paper hover:border-cocoa/50'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Editor({ shelfId, data, shelves }) {
  useDocumentTitle(`${data.shelf.name} 꾸미기`);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const saved = data.decoration;
  const [draft, setDraft] = useState(saved);
  const [selectedId, setSelectedId] = useState(null);
  const [panel, setPanel] = useState('theme');

  useEffect(() => {
    setDraft(saved);
    setSelectedId(null);
  }, [saved]);

  const dirty = useMemo(() => JSON.stringify(stripMeta(draft)) !== JSON.stringify(stripMeta(saved)), [draft, saved]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const save = useMutation({
    mutationFn: () => shelfApi.saveDecoration(shelfId, stripMeta(draft)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shelves'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('꾸민 책장을 저장했어요.');
    },
    onError: (e) => toast.error(e),
  });

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const decos = draft.decorations ?? [];
  const selected = decos.find((d) => d.id === selectedId);

  const add = (kind, type) => {
    if (decos.length >= MAX_DECO) return toast.error(`장식은 ${MAX_DECO}개까지 붙일 수 있어요.`);
    const id = newId();
    const item = {
      id,
      kind,
      type,
      x: type === 'garland' ? 50 : 30 + Math.random() * 40,
      y: type === 'garland' ? 6 : 25 + Math.random() * 40,
      rotate: type === 'garland' ? 0 : Math.round(Math.random() * 24 - 12),
      scale: 1,
    };
    set({ decorations: [...decos, item] });
    setSelectedId(id);
  };
  const updateSel = useCallback(
    (patch) => setDraft((d) => ({ ...d, decorations: d.decorations.map((x) => (x.id === selectedId ? { ...x, ...patch } : x)) })),
    [selectedId]
  );
  const onMove = useCallback(
    (id, x, y) =>
      setDraft((d) => ({
        ...d,
        decorations: d.decorations.map((dd) => (dd.id === id ? { ...dd, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : dd)),
      })),
    []
  );
  const removeSel = () => {
    set({ decorations: decos.filter((x) => x.id !== selectedId) });
    setSelectedId(null);
  };

  // 키보드로 선택한 장식 옮기기
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const step = e.shiftKey ? 5 : 1;
      const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (map[e.key]) {
        e.preventDefault();
        const [dx, dy] = map[e.key];
        updateSel({ x: Math.max(0, Math.min(100, selected.x + dx)), y: Math.max(0, Math.min(100, selected.y + dy)) });
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, updateSel]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px]">책장 꾸미기</h1>
          <p className="mt-1 text-[14px] text-ink-soft">스티커를 끌어서 옮기고, 고른 장식은 아래 도구로 돌리거나 크기를 바꿀 수 있어요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {shelves.length > 1 && (
            <Select
              aria-label="꾸밀 책장 선택"
              value={shelfId}
              onChange={(e) => {
                if (dirty && !window.confirm('저장하지 않은 변경이 있어요. 다른 책장으로 갈까요?')) return;
                navigate(`/decorate/${e.target.value}`);
              }}
              className="h-10 w-auto min-w-40 text-[13.5px]"
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDraft(saved)} disabled={!dirty}>
            <Undo2 size={15} /> 되돌리기
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!dirty}>
            <Save size={15} /> 저장하기
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="mb-2 flex items-center justify-between text-[12.5px] text-ink-soft">
            <span>실시간 미리보기</span>
            {dirty ? <span className="font-semibold text-cocoa-deep">저장하지 않은 변경이 있어요</span> : <span>저장됨</span>}
          </div>
          <ShelfScene
            records={data.records}
            decoration={draft}
            editable
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={onMove}
            linkBooks={false}
            minRows={2}
          />
          {/* 선택한 장식 도구 */}
          <div className="mt-3 flex min-h-12 flex-wrap items-center gap-2 rounded-[8px] bg-paper px-3 py-2 shadow-[var(--shadow-soft)]">
            {selected ? (
              <>
                <Sticker kind={selected.kind} type={selected.type} className="h-8 w-8" diecut={false} />
                <span className="mr-auto text-[13px] font-semibold">
                  {selected.kind === 'sticker' ? STICKER_LABELS[selected.type] : ITEM_LABELS[selected.type]}
                </span>
                <Button size="icon-sm" variant="soft" aria-label="왼쪽으로 돌리기" onClick={() => updateSel({ rotate: Math.max(-180, selected.rotate - 15) })}>
                  <RotateCcw size={15} />
                </Button>
                <Button size="icon-sm" variant="soft" aria-label="오른쪽으로 돌리기" onClick={() => updateSel({ rotate: Math.min(180, selected.rotate + 15) })}>
                  <RotateCw size={15} />
                </Button>
                <Button size="icon-sm" variant="soft" aria-label="작게" onClick={() => updateSel({ scale: Math.max(0.4, Math.round((selected.scale - 0.15) * 100) / 100) })}>
                  <Minus size={15} />
                </Button>
                <Button size="icon-sm" variant="soft" aria-label="크게" onClick={() => updateSel({ scale: Math.min(3, Math.round((selected.scale + 0.15) * 100) / 100) })}>
                  <Plus size={15} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="soft"
                  aria-label="맨 앞으로"
                  onClick={() => set({ decorations: [...decos.filter((d) => d.id !== selected.id), selected] })}
                >
                  <ArrowUpToLine size={15} />
                </Button>
                <Button size="icon-sm" variant="danger-ghost" aria-label="장식 삭제" onClick={removeSel}>
                  <Trash2 size={15} />
                </Button>
              </>
            ) : (
              <p className="text-[12.5px] text-ink-soft">
                장식을 누르면 여기서 돌리기 · 크기 · 삭제를 할 수 있어요. 방향키로 미세 조정, Delete 로 삭제. ({decos.length}/{MAX_DECO})
              </p>
            )}
          </div>
        </div>

        <aside className="card p-4">
          <div className="mb-4">
            <Segmented
              label="꾸미기 도구"
              size="sm"
              value={panel}
              onChange={setPanel}
              options={[
                { value: 'theme', label: '테마' },
                { value: 'bg', label: '배경' },
                { value: 'shelf', label: '선반' },
                { value: 'sticker', label: '스티커' },
                { value: 'item', label: '장식' },
              ]}
            />
          </div>
          {panel === 'theme' && (
            <>
          <Panel title="테마">
            <div className="grid grid-cols-2 gap-2">
              {THEME_KEYS.map((k) => (
                <Chip
                  key={k}
                  active={draft.theme === k}
                  onClick={() => set({ theme: k, background: { ...draft.background, color: THEMES[k].bg } })}
                  className="flex items-center gap-2 text-left"
                >
                  <span className="h-6 w-6 shrink-0 rounded-full border border-ink/15" style={{ background: `linear-gradient(135deg, ${THEMES[k].bg} 50%, ${THEMES[k].plank} 50%)` }} />
                  {THEMES[k].label}
                </Chip>
              ))}
            </div>
          </Panel>
            </>
          )}
          {panel === 'bg' && (
            <>
          <Panel title="배경색">
            <div className="flex flex-wrap items-center gap-2">
              {BG_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`배경색 ${c}`}
                  aria-pressed={draft.background.color.toUpperCase() === c}
                  onClick={() => set({ background: { ...draft.background, color: c } })}
                  className={`h-8 w-8 rounded-full border-[1.5px] transition ${draft.background.color.toUpperCase() === c ? 'scale-110 border-cocoa ring-2 ring-rose' : 'border-ink/15'}`}
                  style={{ background: c }}
                />
              ))}
              <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border-[1.5px] border-dashed border-ink/40" title="직접 고르기">
                <span className="sr-only">배경색 직접 고르기</span>
                <input
                  type="color"
                  value={draft.background.color}
                  onChange={(e) => set({ background: { ...draft.background, color: e.target.value.toUpperCase() } })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="grid h-full w-full place-items-center text-[14px]" aria-hidden>
                  +
                </span>
              </label>
            </div>
          </Panel>
          <Panel title="배경 이미지">
            <ImageUpload
              label="배경 이미지"
              aspect="aspect-[16/9]"
              allowUrl={false}
              value={draft.background.image}
              onChange={(v) => set({ background: { ...draft.background, image: v } })}
            />
          </Panel>
            </>
          )}
          {panel === 'shelf' && (
            <>
          <Panel title="선반 디자인">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SHELF_STYLES).map(([k, v]) => (
                <Chip key={k} active={draft.layout.shelfStyle === k} onClick={() => set({ layout: { ...draft.layout, shelfStyle: k } })}>
                  {v.label}
                </Chip>
              ))}
            </div>
          </Panel>
          <Panel title="책 배치">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ARRANGEMENTS).map(([k, v]) => (
                <Chip key={k} active={draft.layout.arrangement === k} onClick={() => set({ layout: { ...draft.layout, arrangement: k } })}>
                  {v.label}
                </Chip>
              ))}
            </div>
            <p className="mt-1.5 text-[12px] text-ink-soft">{ARRANGEMENTS[draft.layout.arrangement]?.hint}</p>
          </Panel>
            </>
          )}
          {panel === 'sticker' && (
          <Panel title="스티커 붙이기">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(STICKER_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => add('sticker', type)}
                  className="flex flex-col items-center gap-1 rounded-xl bg-milk py-2 text-[11.5px] font-semibold transition hover:bg-rose/50"
                >
                  <Sticker type={type} className="h-9 w-9" />
                  {label}
                </button>
              ))}
            </div>
          </Panel>
          )}
          {panel === 'item' && (
          <Panel title="장식 아이템">
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ITEM_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => add('item', type)}
                  className="flex flex-col items-center gap-1 rounded-xl bg-milk py-2 text-[11.5px] font-semibold transition hover:bg-matcha"
                >
                  <Sticker kind="item" type={type} className={type === 'garland' ? 'h-9 w-20' : 'h-9 w-9'} />
                  {label}
                </button>
              ))}
            </div>
          </Panel>
          )}
          <div className="mt-2 border-t border-ink/15 pt-3">
            <Link to={`/shelves/${shelfId}`} className="text-[12.5px] font-semibold text-link underline underline-offset-4">
              「{data.shelf.name}」 책장으로 돌아가기
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function stripMeta(d) {
  return { theme: d.theme, background: d.background, decorations: d.decorations, layout: d.layout };
}

export default function DecoratePage() {
  const { id } = useParams();
  const shelves = useQuery({ queryKey: ['shelves', 'mine'], queryFn: () => shelfApi.list({ scope: 'mine' }) });
  const shelfId = id || shelves.data?.items?.[0]?.id;
  const shelf = useQuery({ queryKey: ['shelves', shelfId], queryFn: () => shelfApi.get(shelfId), enabled: !!shelfId });

  if (shelves.isPending) return <PageLoader />;
  if (shelves.isError) return <ErrorState error={shelves.error} onRetry={shelves.refetch} />;
  if (!shelfId) return <EmptyState title="꾸밀 책장이 없어요" action={<Button to="/shelves">책장 만들기</Button>} />;

  return (
    <QueryState query={shelf}>
      {(data) =>
        data.isOwner ? (
          <Editor key={shelfId} shelfId={shelfId} data={data} shelves={shelves.data.items} />
        ) : (
          <ErrorState title="꾸밀 수 없어요" error={{ message: '내 책장만 꾸밀 수 있어요.' }} />
        )
      }
    </QueryState>
  );
}
