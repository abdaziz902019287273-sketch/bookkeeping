import { useState } from 'react';
import dayjs from 'dayjs';
import Header from './components/Header';
import Notebook from './components/Notebook';
import Analyst from './components/Analyst';
import './App.css';

function App() {
  const [page, setPage] = useState('notebook');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [editDate, setEditDate] = useState(null);

  const displayDate = editDate || selectedDate;

  const goToEdit = (date) => {
    setEditDate(date);
    setSelectedDate(date);
    setPage('notebook');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setEditDate(null);
  };

  return (
    <div className="app">
      <Header date={displayDate} onDateChange={handleDateChange} />

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${page === 'notebook' ? 'active' : ''}`}
          onClick={() => { setPage('notebook'); setEditDate(null); }}
        >
          <span className="tab-icon"> </span>
          <span>支出小本本</span>
        </button>
        <button
          className={`nav-tab ${page === 'analyst' ? 'active' : ''}`}
          onClick={() => setPage('analyst')}
        >
          <span className="tab-icon"> </span>
          <span>账单观察员</span>
        </button>
      </nav>

      <main className="main">
        {page === 'notebook'
          ? <Notebook date={displayDate} editDate={editDate} onBack={() => setEditDate(null)} />
          : <Analyst onGoEdit={goToEdit} />
        }
      </main>
    </div>
  );
}

export default App;
