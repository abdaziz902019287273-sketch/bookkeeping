import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getExpenses, getStats } from '../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const COLORS = ['#ff9a9e', '#a8e6cf', '#ffd3b6', '#dcedc1', '#c7ceea', '#ffcbc4', '#e8a0bf'];

export default function Analyst({ onGoEdit }) {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const [stats, setStats] = useState(null);
  const [allExpenses, setAllExpenses] = useState([]);
  const [openDay, setOpenDay] = useState(null);

  const fetchData = async () => {
    const [s, all] = await Promise.all([getStats(month), getExpenses(month)]);
    setStats(s);
    setAllExpenses(all);
    setOpenDay(null);
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const getDayExpenses = (date) => allExpenses.filter((e) => e.date === date);

  const toggleDay = (date) => {
    setOpenDay(openDay === date ? null : date);
  };

  if (!stats || !stats.summary?.total) {
    return (
      <div>
        <div className="month-nav">
          <button onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))}>&lt;</button>
          <span>{month}</span>
          <button onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))}>&gt;</button>
        </div>
        <div className="card"><div className="empty-hint">这个月还没有记录哦~</div></div>
      </div>
    );
  }

  const { byCategory, byPerson, byDay, summary } = stats;

  const pieData = {
    labels: byCategory.map((c) => c.category),
    datasets: [{
      data: byCategory.map((c) => c.total),
      backgroundColor: COLORS.slice(0, byCategory.length),
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: byDay.map((d) => d.date.slice(5)),
    datasets: [{
      label: '每日消费',
      data: byDay.map((d) => d.total),
      backgroundColor: 'rgba(255, 154, 158, 0.6)',
      borderColor: '#ff9a9e',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  return (
    <div>
      <div className="month-nav">
        <button onClick={() => setMonth(dayjs(month).subtract(1, 'month').format('YYYY-MM'))}>&lt;</button>
        <span>{month}</span>
        <button onClick={() => setMonth(dayjs(month).add(1, 'month').format('YYYY-MM'))}>&gt;</button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-label">本月总支出</div>
          <div className="stat-value">¥{Number(summary.total).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">消费笔数</div>
          <div className="stat-value blue">{summary.count} 笔</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">日均消费</div>
          <div className="stat-value">¥{(summary.total / (byDay.length || 1)).toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <div className="chart-title">{' '} 记账人对比</div>
        <div className="person-compare">
          {byPerson.map((p) => (
            <div className="person-stat-card" key={p.person}>
              <div className="ps-name">{p.person}</div>
              <div className="ps-amount">¥{Number(p.total).toFixed(2)}</div>
              <div className="ps-count">{p.count} 笔</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="chart-title">{' '} 分类占比</div>
        <div className="chart-box">
          <Pie data={pieData} options={{
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
          }} />
        </div>
      </div>

      <div className="card">
        <div className="chart-title">{' '} 每日消费趋势</div>
        <div className="chart-box">
          <Bar data={barData} options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(180,120,140,0.08)' } },
              x: { grid: { display: false } },
            },
          }} />
        </div>
      </div>

      <div className="card">
        <div className="chart-title">{' '} 每日流水明细</div>
        <div className="daily-detail">
          {byDay.map((d) => {
            const dayItems = getDayExpenses(d.date);
            const isOpen = openDay === d.date;

            return (
              <div key={d.date}>
                <div className="day-item" onClick={() => toggleDay(d.date)}>
                  <span className="day-date">{d.date}</span>
                  <span className="day-count">{d.count} 笔</span>
                  <span className="day-amount">¥{Number(d.total).toFixed(2)}</span>
                </div>
                {isOpen && (
                  <div className="day-expand">
                    {dayItems.map((e) => (
                      <div className="de-item" key={e.id}>
                        <span>
                          <span className="de-cat">{e.category}</span>
                          {e.description ? ` · ${e.description}` : ''}
                          <span className="de-person">{e.person}</span>
                        </span>
                        <span className="de-amt">¥{Number(e.amount).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="day-actions">
                      <button className="day-action-btn edit" onClick={() => onGoEdit(d.date)}>
                        ✏️ 修改这天
                      </button>
                      <button className="day-action-btn add" onClick={() => onGoEdit(d.date)}>
                        ➕ 添加记录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
