import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const greetings = [
  '今天也要好好吃饭哦~',
  '每一笔记录都是爱的痕迹 ',
  '和你一起记账，是最浪漫的事',
  '精打细算的小日子，甜甜蜜蜜',
  '有你的日子，花钱也开心',
  '今天也要元气满满鸭！',
  '一起攒钱去旅行吧~',
  '记录生活的小确幸',
];

export default function Header({ date, onDateChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const d = dayjs(date);
  const weekday = WEEKDAYS[d.day()];
  const dateStr = `${d.format('YYYY年M月D日')}`;

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const greeting = greetings[dayOfYear % greetings.length];

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goDay = (offset) => {
    const next = d.add(offset, 'day');
    if (next.isAfter(dayjs())) return;
    onDateChange(next.format('YYYY-MM-DD'));
  };

  return (
    <header className="header">
      <div className="header-date" ref={wrapperRef}>
        {dateStr}
        <span className="weekday-picker" onClick={() => setOpen(!open)}>
          {weekday} ▾
        </span>
        {open && (
          <div className="date-dropdown">
            <div className="date-nav">
              <button onClick={() => goDay(-7)}>«</button>
              <button onClick={() => goDay(-1)}>‹</button>
              <span>{d.format('M月D日')}</span>
              <button onClick={() => goDay(1)} disabled={d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')}>›</button>
              <button onClick={() => goDay(7)} disabled={d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')}>»</button>
            </div>
            <div className="date-quick">
              <button
                className={date === dayjs().format('YYYY-MM-DD') ? 'active' : ''}
                onClick={() => { onDateChange(dayjs().format('YYYY-MM-DD')); setOpen(false); }}
              >今天</button>
              <button
                className={date === dayjs().subtract(1, 'day').format('YYYY-MM-DD') ? 'active' : ''}
                onClick={() => { onDateChange(dayjs().subtract(1, 'day').format('YYYY-MM-DD')); setOpen(false); }}
              >昨天</button>
              <button
                className={date === dayjs().subtract(2, 'day').format('YYYY-MM-DD') ? 'active' : ''}
                onClick={() => { onDateChange(dayjs().subtract(2, 'day').format('YYYY-MM-DD')); setOpen(false); }}
              >前天</button>
            </div>
          </div>
        )}
      </div>
      <div className="header-greeting">{greeting}</div>
    </header>
  );
}
