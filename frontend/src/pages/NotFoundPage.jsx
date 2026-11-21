import Button from '../components/ui/Button.jsx';
import Sticker from '../components/ui/Sticker.jsx';
import { useDocumentTitle } from '../hooks/index.js';

export default function NotFoundPage() {
  useDocumentTitle('페이지를 찾을 수 없어요');
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <Sticker type="cat" className="h-24 w-24 -rotate-6" />
      <p className="numeral mt-6 text-[64px] leading-none text-ink">404</p>
      <h1 className="mt-3 text-[24px]">이 페이지는 책장에 없어요</h1>
      <p className="mt-2 text-[14px] text-ink-soft">주소가 바뀌었거나 삭제된 페이지예요.</p>
      <Button to="/dashboard" className="mt-6">
        홈으로
      </Button>
    </div>
  );
}
