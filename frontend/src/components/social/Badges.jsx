import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { socialApi } from '../../services/index.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import Sticker from '../ui/Sticker.jsx';
import { ProgressBar } from '../ui/Misc.jsx';
import { STICKER_LABELS } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/format.js';

export function useBadges(enabled = true) {
  return useQuery({ queryKey: ['badges'], queryFn: socialApi.badges, enabled, staleTime: 5000 });
}

/** 화면을 옮길 때마다 새 배지를 확인하고, 처음 얻은 배지는 알림으로 축하 */
export function BadgeWatcher() {
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useBadges();
  const announced = useRef(new Set());

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['badges'] });
  }, [pathname, qc]);

  useEffect(() => {
    const fresh = (q.data?.badges ?? []).filter((b) => b.isNew && !announced.current.has(b.key));
    if (!fresh.length) return;
    fresh.forEach((b) => announced.current.add(b.key));
    if (fresh.length > 2) {
      toast.success(`배지 ${fresh.length}개를 한꺼번에 얻었어요! 마이페이지 「배지」에서 확인해 보세요.`);
    } else {
      fresh.forEach((b) =>
        toast.success(`새 배지 「${b.name}」를 얻었어요!${b.reward ? ` 스티커 「${STICKER_LABELS[b.reward]}」가 열렸어요.` : ''}`)
      );
    }
    socialApi.badgesSeen().catch(() => {});
  }, [q.data, toast]);

  return null;
}

export function BadgeGrid({ badges }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div>
      <p className="mb-3 text-[13.5px] text-ink-soft">
        {badges.length}개 중 <b className="text-ink">{earned}개</b>를 모았어요. 배지를 얻으면 책장 꾸미기 스티커가 열려요.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b) => (
          <li
            key={b.key}
            className={`flex flex-col gap-2 rounded-[8px] border-[1.5px] p-3 ${b.earned ? 'border-ink/85 bg-butter shadow-[2px_2px_0_rgba(81,68,61,0.85)]' : 'border-dashed border-ink/30 bg-paper'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-[1.5px] ${b.earned ? 'border-ink/85 bg-paper' : 'border-ink/25 bg-kraft/60'}`}>
                {b.reward ? (
                  <Sticker type={b.reward} className={`h-8 w-8 ${b.earned ? '' : 'opacity-30 grayscale'}`} diecut={false} />
                ) : (
                  <span className={`font-pixel text-[18px] ${b.earned ? '' : 'opacity-30'}`} aria-hidden>
                    ★
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-pixel text-[13px] font-bold">{b.name}</p>
                <p className="text-[11.5px] text-ink-soft">{b.earned ? `${formatDateTime(b.earnedAt)} 획득` : `${b.progress} / ${b.goal}`}</p>
              </div>
            </div>
            <p className="text-[12px] leading-snug text-ink/80">{b.desc}</p>
            {!b.earned && <ProgressBar value={(b.progress / b.goal) * 100} tone="bg-cocoa" label={`${b.name} 진행도`} />}
            {b.reward && (
              <p className="flex items-center gap-1 text-[11.5px] text-ink-soft">
                {!b.earned && <Lock size={11} />} 보상: {STICKER_LABELS[b.reward]} 스티커
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
