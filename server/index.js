const express = require('express');
const cors = require('cors');
const { getDb, runQuery, allQuery, getQuery } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const CATEGORIES = ['早餐', '午餐', '晚餐', '购物', '其他'];

// 获取所有账单
app.get('/api/expenses', async (req, res) => {
  await getDb();
  const { month, person } = req.query;
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];

  if (month) {
    sql += " AND substr(date, 1, 7) = ?";
    params.push(month);
  }
  if (person) {
    sql += ' AND person = ?';
    params.push(person);
  }
  sql += ' ORDER BY date DESC, created_at DESC';

  res.json(allQuery(sql, params));
});

// 新增账单
app.post('/api/expenses', async (req, res) => {
  await getDb();
  const { amount, category, description, person, date } = req.body;
  if (!amount || !category || !person) {
    return res.status(400).json({ error: '金额、类别、记账人必填' });
  }
  const today = new Date().toLocaleDateString('zh-CN');
  runQuery(
    'INSERT INTO expenses (amount, category, description, person, date) VALUES (?, ?, ?, ?, ?)',
    [amount, category, description || '', person, date || today]
  );
  const row = getQuery('SELECT MAX(id) as id FROM expenses');
  res.json({ id: row?.id });
});

// 更新账单
app.put('/api/expenses/:id', async (req, res) => {
  await getDb();
  const { amount, category, description, person, date } = req.body;
  if (!amount || !category || !person) {
    return res.status(400).json({ error: '金额、类别、记账人必填' });
  }
  runQuery(
    'UPDATE expenses SET amount=?, category=?, description=?, person=?, date=? WHERE id=?',
    [amount, category, description || '', person, date, Number(req.params.id)]
  );
  res.json({ success: true });
});

// 删除账单
app.delete('/api/expenses/:id', async (req, res) => {
  await getDb();
  runQuery('DELETE FROM expenses WHERE id = ?', [Number(req.params.id)]);
  res.json({ success: true });
});

// 月度统计
app.get('/api/stats', async (req, res) => {
  await getDb();
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: '请提供月份参数' });

  const byCategory = allQuery(`
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE substr(date, 1, 7) = ?
    GROUP BY category
    ORDER BY total DESC
  `, [month]);

  const byPerson = allQuery(`
    SELECT person, SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE substr(date, 1, 7) = ?
    GROUP BY person
  `, [month]);

  const byDay = allQuery(`
    SELECT date, SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE substr(date, 1, 7) = ?
    GROUP BY date
    ORDER BY date
  `, [month]);

  const summary = getQuery(`
    SELECT SUM(amount) as total, COUNT(*) as count
    FROM expenses
    WHERE substr(date, 1, 7) = ?
  `, [month]);

  res.json({ byCategory, byPerson, byDay, summary });
});

// 获取可用类别
app.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

app.listen(PORT, () => {
  console.log(`记账服务运行在 http://localhost:${PORT}`);
});
