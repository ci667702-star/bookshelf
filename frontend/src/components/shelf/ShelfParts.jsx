import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Field, Input, Textarea, FormError } from '../ui/Field.jsx';
import { Avatar, PrivacyBadge, Toggle } from '../ui/Misc.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';
import ShelfScene from '../book/ShelfScene.jsx';
import { THEMES, THEME_KEYS } from '../../utils/constants.js';

/** 책장 목록용 카드: 작은 책장 안에 책등이 꽂힌 모양 */
export function ShelfCard({ shelf, to, showOwner = false }) {
  const books = shelf.previewBooks ?? [];
  return (
    <Link
      to={to ?? `/shelves/${shelf.id}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative">
        <ShelfScene
          compact
          minRows={1}
          linkBooks={false}
          records={books.slice(0, 12).map((b) => ({ id: b.id, book: { ...b, author: b.author ?? '' } }))}
          decoration={{ theme: shelf.theme ?? 'cream', layout: { shelfStyle: 'wood', arrangement: 'spine' }, decorations: [] }}
          className="rounded-none border-0"
          emptyMessage={<span className="text-[12.5px] text-ink-soft">아직 빈 책장이에요</span>}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-[17px] leading-snug">{shelf.name}</h3>
          {shelf.isPublic !== undefined && <PrivacyBadge isPublic={shelf.isPublic} className="shrink-0" />}
        </div>
        {shelf.description && <p className="line-clamp-2 text-[13px] text-ink-soft">{shelf.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-1 text-[12.5px] text-ink-soft">
          <span className="flex items-center gap-1">
            <BookOpen size={13} /> {shelf.bookCount ?? books.length}권
          </span>
          {showOwner && shelf.owner && (
            <span className="flex items-center gap-1.5">
              <Avatar user={shelf.owner} size={20} />
              {shelf.owner.nickname}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SharedShelfCard({ shelf }) {
  return (
    <Link
      to={`/shared/${shelf.id}`}
      className="card group flex gap-4 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
    >
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-matcha">
        {shelf.coverImage ? (
          <img src={shelf.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <Users size={28} className="text-matcha-deep" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-serif text-[17px]">{shelf.name}</h3>
          <PrivacyBadge isPublic={shelf.isPublic} className="shrink-0" />
        </div>
        {shelf.description && <p className="line-clamp-1 text-[13px] text-ink-soft">{shelf.description}</p>}
        <div className="mt-auto flex items-center gap-3 pt-2 text-[12.5px] text-ink-soft">
          {shelf.previewMembers?.length ? (
            <span className="flex -space-x-1.5">
              {shelf.previewMembers.map((m) => (
                <Avatar key={m.id} user={m} size={22} />
              ))}
            </span>
          ) : null}
          <span>참여자 {shelf.memberCount}명</span>
          <span>책 {shelf.bookCount}권</span>
          {shelf.isOwner && <span className="font-semibold text-cocoa-deep">내가 만든 책장</span>}
        </div>
      </div>
    </Link>
  );
}

/** 개인 책장 / 공유 책장 만들기 · 수정 공용 폼 */
export function ShelfFormModal({ open, onClose, initial, onSubmit, submitting, error, title, shared = false }) {
  const [f, setF] = useState({ name: '', description: '', coverImage: null, isPublic: false, theme: 'cream' });
  const [localErr, setLocalErr] = useState({});

  useEffect(() => {
    if (open) {
      setF({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        coverImage: initial?.coverImage ?? null,
        isPublic: initial?.isPublic ?? false,
        theme: initial?.theme ?? 'cream',
      });
      setLocalErr({});
    }
    // 열릴 때만 초기값을 채운다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (e) => {
    e?.preventDefault();
    if (!f.name.trim()) return setLocalErr({ name: '책장 이름을 입력해 주세요.' });
    onSubmit({
      name: f.name.trim(),
      description: f.description.trim() || null,
      coverImage: f.coverImage || null,
      isPublic: f.isPublic,
      ...(shared ? {} : { theme: f.theme }),
    });
  };

  const fields = { ...error?.fields, ...localErr };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      tone={shared ? 'green' : 'rose'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit} loading={submitting}>
            {initial ? '저장하기' : '만들기'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-4">
          <FormError message={error && !Object.keys(error.fields || {}).length ? error.message : null} />
          <Field label="책장 이름" required error={fields.name}>
            <Input
              value={f.name}
              maxLength={40}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder={shared ? '예: 토요 독서 모임' : '예: 올해의 책장'}
            />
          </Field>
          <Field label="소개" error={fields.description} hint={`${f.description.length}/300`}>
            <Textarea
              value={f.description}
              maxLength={300}
              rows={3}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder="어떤 책들이 꽂힐 책장인가요?"
            />
          </Field>
          {!shared && (
            <div>
              <p className="mb-2 text-[13.5px] font-semibold">테마</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setF({ ...f, theme: k })}
                    aria-pressed={f.theme === k}
                    className={`flex items-center gap-2 rounded-xl border-[1.5px] px-2.5 py-2 text-[12.5px] font-semibold transition ${
                      f.theme === k ? 'border-cocoa bg-milk' : 'border-kraft-deep/70 hover:border-cocoa/50'
                    }`}
                  >
                    <span className="h-5 w-5 shrink-0 rounded-full border border-ink/15" style={{ background: `linear-gradient(135deg, ${THEMES[k].bg} 50%, ${THEMES[k].plank} 50%)` }} />
                    {THEMES[k].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Toggle
            checked={f.isPublic}
            onChange={(v) => setF({ ...f, isPublic: v })}
            label={f.isPublic ? '공개 책장' : '비공개 책장'}
            description={
              shared
                ? f.isPublic
                  ? '누구나 볼 수 있어요. 참여는 초대 코드로만 할 수 있어요.'
                  : '참여자만 볼 수 있어요.'
                : f.isPublic
                  ? '다른 사람도 책장과 공개 독후감을 볼 수 있어요.'
                  : '나만 볼 수 있어요. 주소를 알아도 열리지 않아요.'
            }
          />
        </div>
        <div>
          <p className="mb-2 text-[13.5px] font-semibold">대표 이미지</p>
          <ImageUpload label="대표 이미지" aspect="aspect-square" value={f.coverImage} onChange={(v) => setF({ ...f, coverImage: v })} />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
