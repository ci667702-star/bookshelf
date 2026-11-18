import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { readingApi } from '../services/index.js';
import { useDocumentTitle } from '../hooks/index.js';
import { QueryState, SkeletonBlock } from '../components/ui/States.jsx';
import { ProgressBar } from '../components/ui/Misc.jsx';
import MarathonTower, { MILESTONES, milestoneInfo } from '../components/book/MarathonTower.jsx';
import { num } from '../utils/format.js';

export default function MarathonPage() {
  useDocumentTitle('독서 마라톤');
  const q = useQuery({ queryKey: ['marathon'], queryFn: readingApi.marathon });

  return (
    <QueryState query={q} loading={<SkeletonBlock className="h-96" />}>
      {(m) => {
        const ms = milestoneInfo(m.heightCm);
        return (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h1 className="text-[22px]">독서 마라톤</h1>
              <p className="mt-1 mb-5 text-[13.5px] text-ink-soft">
                100쪽마다 1cm씩 쌓여요. 완독한 책은 전체 페이지, 읽는 중인 책은 읽은 페이지만큼만.
              </p>
              <div className="card p-4 pt-8 sm:p-6 sm:pt-10">
                <MarathonTower stack={m.stack} totalPages={m.totalPages} heightCm={m.heightCm} maxHeight={360} />
              </div>
            </div>

            <aside className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['누적 페이지', num(m.totalPages), '쪽', 'bg-butter'],
                  ['누적 높이', m.heightCm, 'cm', 'bg-sky'],
                  ['완독한 책', m.finishedCount, '권', 'bg-matcha'],
                  ['이번 달', num(m.monthPages), '쪽', 'bg-lilac'],
                ].map(([label, v, u, tone]) => (
                  <div key={label} className={`tile ${tone} p-3`}>
                    <p className="text-[12px] font-semibold text-ink/70">{label}</p>
                    <p className="flex items-baseline gap-1">
                      <span className="numeral text-[22px]">{v}</span>
                      <span className="text-[12px] font-bold">{u}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="card flex flex-col gap-3 p-4">
                <div>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className="font-semibold">
                      {m.year}년 완독 목표 {m.goals.yearlyGoalBooks}권
                    </span>
                    <span className="text-ink-soft">{m.goals.yearlyRate}%</span>
                  </div>
                  <ProgressBar value={m.goals.yearlyRate} tone="bg-matcha-deep" label="올해 완독 목표 달성률" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span className="font-semibold">
                      {m.month}월 목표 {num(m.goals.monthlyGoalPages)}쪽
                    </span>
                    <span className="text-ink-soft">{m.goals.monthlyRate}%</span>
                  </div>
                  <ProgressBar value={m.goals.monthlyRate} tone="bg-pin" label="이번 달 페이지 목표 달성률" />
                </div>
                <Link to="/settings?tab=goals" className="text-[12.5px] font-semibold text-link underline underline-offset-4">
                  목표 바꾸기
                </Link>
              </div>

              <div className="card p-4">
                <h2 className="mb-2 flex items-center gap-1.5 text-[15px]">
                  <Flag size={15} /> 이정표
                </h2>
                <ol className="flex flex-col gap-1.5">
                  {MILESTONES.slice(0, 9).map((x) => {
                    const done = m.heightCm >= x.cm;
                    const isNext = ms.next?.cm === x.cm;
                    return (
                      <li
                        key={x.cm}
                        className={`flex items-center justify-between rounded-[5px] px-2.5 py-1.5 text-[13px] ${
                          done ? 'bg-matcha' : isNext ? 'border-[1.5px] border-dashed border-ink/50 bg-butter' : 'text-ink-soft'
                        }`}
                      >
                        <span>
                          {done ? '✓ ' : ''}
                          {x.label}
                        </span>
                        <span className="font-pixel text-[12px]">{x.cm}cm</span>
                      </li>
                    );
                  })}
                </ol>
                {ms.next && (
                  <p className="mt-3 text-[12.5px] text-ink-soft">
                    다음 이정표까지 <b className="text-ink">{num(ms.remainPages)}쪽</b> 남았어요.
                  </p>
                )}
              </div>
            </aside>
          </div>
        );
      }}
    </QueryState>
  );
}
