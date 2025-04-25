import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './HomePage.css';

interface QuickStatsProps {
  totalTasks: number;
  completedTasks: number;
  upcomingReminders: number;
  todayNotes: number;
}

const HomeContent: React.FC = () => {
  // This would be replaced with real data from your state management
  const mockStats: QuickStatsProps = {
    totalTasks: 5,
    completedTasks: 2,
    upcomingReminders: 3,
    todayNotes: 1,
  };

  // Моковые данные для графика (замените на реальные данные)
  const chartData = [
    { date: 'Пн', задачи: 4, выполнено: 3, заметки: 2 },
    { date: 'Вт', задачи: 6, выполнено: 4, заметки: 3 },
    { date: 'Ср', задачи: 5, выполнено: 5, заметки: 1 },
    { date: 'Чт', задачи: 8, выполнено: 6, заметки: 4 },
    { date: 'Пт', задачи: 7, выполнено: 5, заметки: 2 },
    { date: 'Сб', задачи: 3, выполнено: 2, заметки: 1 },
    { date: 'Вс', задачи: 2, выполнено: 2, заметки: 2 },
  ];

  return (
    <main>
      <div className='task-container'>

      
      {/* Welcome Section */}
      {/* <section className="welcome-section">
        <h1>Добро пожаловать!</h1>
        <p className="today-date">{new Date().toLocaleDateString('ru-RU', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </section> */}

      {/* Quick Stats Grid */}
      <section className="quick-stats-grid">
        <div className="stat-card">
          <h3>Задачи</h3>
          <p>{mockStats.completedTasks} из {mockStats.totalTasks} выполнено</p>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${(mockStats.completedTasks / mockStats.totalTasks) * 100}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <h3>Напоминания</h3>
          <p>{mockStats.upcomingReminders} на сегодня</p>
        </div>
        <div className="stat-card">
          <h3>Заметки</h3>
          <p>{mockStats.todayNotes} новых</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2>Быстрые действия</h2>
        <div className="actions-grid">
          <button className="action-button">
            <span>+ Новая задача</span>
          </button>
          <button className="action-button">
            <span>+ Напоминание</span>
          </button>
          <button className="action-button">
            <span>+ Заметка</span>
          </button>
          <button className="action-button">
            <span>Открыть календарь</span>
          </button>
        </div>
      </section>

      {/* График активности */}
      <section className="stats-chart">
        <h2>Статистика активности</h2>
        <div className="chart-tabs">
          <button className="chart-tab active">Неделя</button>
          <button className="chart-tab">Месяц</button>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                dx={-10}
              />
              <Tooltip
                wrapperClassName="custom-tooltip"
                contentStyle={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              />
              <Area
                type="monotone"
                dataKey="задачи"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorTasks)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="выполнено"
                stroke="#82ca9d"
                fillOpacity={1}
                fill="url(#colorCompleted)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      </div>
    </main>
  );
};

export default HomeContent;