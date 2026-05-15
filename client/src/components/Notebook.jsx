import { useState, useEffect, useCallback } from 'react';
import { getExpenses, addExpense, deleteExpense } from '../api';

const CATEGORIES = [
  { key: 'breakfast', label: '早餐', icon: ' ' },
  { key: 'lunch',     label: '午餐', icon: ' ' },
  { key: 'dinner',    label: '晚餐', icon: ' ' },
  { key: 'shopping',  label: '购物', icon: ' ' },
];

const ENCOURAGEMENTS = [
  '每一笔都是爱的见证~',
  '记账也是一种浪漫呢！',
  '今天的记录完成啦~',
  '好棒，又坚持记了一笔！',
  '两个人一起记账，真好~',
  '小日子越过越有滋味~',
];

function calcExpr(expr) {
  if (!expr || !expr.trim()) return 0;
  const cleaned = expr.replace(/[^0-9+\-*/.()]/g, '');
  if (!cleaned) return 0;
  try {
    const result = Function('"use strict";return (' + cleaned + ')')();
    return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : 0;
  } catch {
    return 0;
  }
}

function getCatColor(category) {
  const map = { '早餐': '#ff9a9e', '午餐': '#a8e6cf', '晚餐': '#ffd3b6', '购物': '#c7ceea' };
  return map[category] || '#e8a0bf';
}

export default function Notebook({ date, editDate, onBack }) {
  const isEdit = !!editDate;

  const [person, setPerson] = useState('小李');
  const [amounts, setAmounts] = useState({});
  const [others, setOthers] = useState([{ name: '', amount: '' }]);
  const [expenses, setExpenses] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedKeys, setSubmittedKeys] = useState(new Set());
  const [encouragement, setEncouragement] = useState('');

  const fetchExpenses = useCallback(async () => {
    const month = date.slice(0, 7);
    const all = await getExpenses(month);
    const dayItems = all.filter((e) => e.date === date);
    setExpenses(dayItems);
    if (dayItems.length > 0) {
      setSubmitted(true);
    } else {
      setSubmitted(false);
      setAmounts({});
      setOthers([{ name: '', amount: '' }]);
      setSubmittedKeys(new Set());
    }
  }, [date]);

  useEffect(() => {
    fetchExpenses();
  }, [date, fetchExpenses]);

  const todayTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const grouped = {};
  expenses.forEach((e) => {
    if (!grouped[e.category]) grouped[e.category] = { total: 0, byPerson: {} };
    grouped[e.category].total += Number(e.amount);
    if (!grouped[e.category].byPerson[e.person]) grouped[e.category].byPerson[e.person] = 0;
    grouped[e.category].byPerson[e.person] += Number(e.amount);
  });

  const handleSubmit = async () => {
    const items = [];
    const newKeys = new Set();

    CATEGORIES.forEach((cat) => {
      const val = amounts[cat.key];
      if (val && val.trim()) {
        const key = `${cat.label}-${val.trim()}-${person}`;
        if (submittedKeys.has(key)) return; // skip already submitted
        const amount = calcExpr(val);
        if (amount > 0) {
          items.push({ amount, category: cat.label, description: val.trim(), person, date });
          newKeys.add(key);
        }
      }
    });

    others.forEach((o) => {
      if (o.name.trim() && o.amount.trim()) {
        const key = `${o.name.trim()}-${o.amount.trim()}-${person}`;
        if (submittedKeys.has(key)) return;
        const amount = calcExpr(o.amount);
        if (amount > 0) {
          items.push({ amount, category: o.name.trim(), description: o.amount.trim(), person, date });
          newKeys.add(key);
        }
      }
    });

    if (items.length === 0) return;

    for (const item of items) {
      await addExpense(item);
    }

    setSubmittedKeys(new Set([...submittedKeys, ...newKeys]));
    setOthers([{ name: '', amount: '' }]);
    setSubmitted(true);
    setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
    setTimeout(() => setEncouragement(''), 3000);
    fetchExpenses();
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  const addOther = () => setOthers([...others, { name: '', amount: '' }]);

  const updateOther = (index, field, value) => {
    const updated = [...others];
    updated[index][field] = value;
    setOthers(updated);
  };

  const removeOther = (index) => {
    if (others.length <= 1) return;
    setOthers(others.filter((_, i) => i !== index));
  };

  return (
    <div>
      {isEdit && (
        <div className="edit-banner">
          <span>正在编辑 {date} 的账单</span>
          <button className="edit-back-btn" onClick={onBack}>返回今天</button>
        </div>
      )}

      <div className="card">
        <div className="person-selector">
          <button className={`person-btn ${person === '小李' ? 'active' : ''}`} onClick={() => setPerson('小李')}>
            {'  '} 小李
          </button>
          <button className={`person-btn ${person === '小尚' ? 'active' : ''}`} onClick={() => setPerson('小尚')}>
            {'  '} 小尚
          </button>
        </div>

        <div className="category-rows">
          {CATEGORIES.map((cat) => (
            <div className="category-row" key={cat.key}>
              <span className="category-label">{cat.icon} {cat.label}</span>
              <input
                className="category-input amount-input"
                type="text"
                placeholder="输入金额"
                value={amounts[cat.key] || ''}
                onChange={(e) => setAmounts({ ...amounts, [cat.key]: e.target.value })}
              />
            </div>
          ))}

          {others.map((o, i) => (
            <div className="category-row other-row" key={`other-${i}`}>
              <span className="category-label">✨ 其他</span>
              <div className="other-inputs">
                <input
                  className="category-input"
                  type="text"
                  placeholder="名称"
                  value={o.name}
                  onChange={(e) => updateOther(i, 'name', e.target.value)}
                />
                <input
                  className="category-input amount-input"
                  type="text"
                  placeholder="金额"
                  value={o.amount}
                  onChange={(e) => updateOther(i, 'amount', e.target.value)}
                />
                {others.length > 1 && (
                  <button className="other-remove" onClick={() => removeOther(i)}>×</button>
                )}
              </div>
            </div>
          ))}

          <button className="add-other-btn" onClick={addOther}>
            + 再加一笔其他
          </button>
        </div>

        {!submitted ? (
          <button className="submit-btn" onClick={handleSubmit}>
            {' '} 记下来~
          </button>
        ) : (
          <button className="submit-btn edit-mode" onClick={handleSubmit}>
            ✏️ 确认修改
          </button>
        )}

        {encouragement && <div className="encouragement">{encouragement}</div>}
      </div>

      <div className="total-banner">
        <div className="total-label">{isEdit ? date + ' 支出' : '今日总支出'}</div>
        <div className="total-amount">¥{todayTotal.toFixed(2)}</div>
        <div className="total-hint">{expenses.length} 笔记录，每一笔都值得珍惜~</div>
      </div>

      {expenses.length > 0 && (
        <div className="card">
          <div className="expense-list-title">  {isEdit ? '当日流水' : '今日流水'}</div>
          {Object.entries(grouped).map(([cat, data]) => (
            <div className="grouped-item" key={cat}>
              <div className="grouped-header">
                <span className="grouped-cat" style={{ borderLeftColor: getCatColor(cat) }}>
                  {cat}
                </span>
                <span className="grouped-total">¥{data.total.toFixed(2)}</span>
              </div>
              <div className="grouped-persons">
                {Object.entries(data.byPerson).map(([p, amt]) => (
                  <span className="grouped-person" key={p}>{p} ¥{amt.toFixed(2)}</span>
                ))}
              </div>
              <div className="grouped-details">
                {expenses.filter((e) => e.category === cat).map((item) => (
                  <div className="detail-row" key={item.id}>
                    <span className="detail-desc">{item.description || item.category}</span>
                    <span className="detail-person-tag">{item.person}</span>
                    <span className="detail-amt">¥{Number(item.amount).toFixed(2)}</span>
                    <button className="expense-del" onClick={() => handleDelete(item.id)}>×</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
