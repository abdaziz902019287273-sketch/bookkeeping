import { supabase } from './supabase';

export async function getExpenses(month, person) {
  let query = supabase.from('expenses').select('*');
  if (month) query = query.like('date', `${month}%`);
  if (person) query = query.eq('person', person);
  const { data, error } = await query.order('date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addExpense({ amount, category, description, person, date }) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ amount, category, description: description || '', person, date }])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function updateExpense(id, updates) {
  const { error } = await supabase.from('expenses').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getStats(month) {
  const all = await getExpenses(month);
  if (!all.length) return null;

  const byCategory = {};
  const byPerson = {};
  const byDay = {};
  let total = 0;

  all.forEach((e) => {
    const amt = Number(e.amount);
    total += amt;

    if (!byCategory[e.category]) byCategory[e.category] = { category: e.category, total: 0, count: 0 };
    byCategory[e.category].total += amt;
    byCategory[e.category].count += 1;

    if (!byPerson[e.person]) byPerson[e.person] = { person: e.person, total: 0, count: 0 };
    byPerson[e.person].total += amt;
    byPerson[e.person].count += 1;

    if (!byDay[e.date]) byDay[e.date] = { date: e.date, total: 0, count: 0 };
    byDay[e.date].total += amt;
    byDay[e.date].count += 1;
  });

  return {
    byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
    byPerson: Object.values(byPerson),
    byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    summary: { total, count: all.length },
  };
}
