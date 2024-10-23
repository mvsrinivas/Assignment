import React, { useState, useEffect } from 'react';
import './KanbanBoard.css';

interface Ticket {
  id: string;
  title: string;
  tag: string[];
  userId: string;
  status: string;
  priority: number;
}

interface User {
  id: string;
  name: string;
  available: boolean;
}

interface KanbanData {
  tickets: Ticket[];
  users: User[];
}

const priorityLabels: { [key: number]: string } = {
  4: 'Urgent',
  3: 'High',
  2: 'Medium',
  1: 'Low',
  0: 'No priority',
};

const priorityIcons: { [key: number]: string } = {
  4: '🔴',
  3: '🟠',
  2: '🟡',
  1: '🔵',
  0: '⚪',
};

const statusIcons: { [key: string]: string } = {
  'Backlog': '📋',
  'Todo': '📝',
  'In progress': '🔄',
  'Done': '✅',
  'Cancelled': '❌',
};

export default function KanbanBoard() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [grouping, setGrouping] = useState<'status' | 'user' | 'priority'>('status');
  const [sorting, setSorting] = useState<'priority' | 'title'>('priority');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('https://api.quicksell.co/v1/internal/frontend-assignment')
      .then(response => response.json())
      .then(setData);

    const savedState = localStorage.getItem('kanbanState');
    if (savedState) {
      const { grouping, sorting } = JSON.parse(savedState);
      setGrouping(grouping);
      setSorting(sorting);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kanbanState', JSON.stringify({ grouping, sorting }));
  }, [grouping, sorting]);

  if (!data) return <div className="loading">Loading...</div>;

  const groupTickets = () => {
    const grouped: { [key: string]: Ticket[] } = {};
    
    data.tickets.forEach(ticket => {
      let key = '';
      switch (grouping) {
        case 'status':
          key = ticket.status;
          break;
        case 'user':
          key = data.users.find(user => user.id === ticket.userId)?.name || 'Unassigned';
          break;
        case 'priority':
          key = priorityLabels[ticket.priority];
          break;
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ticket);
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (sorting === 'priority') return b.priority - a.priority;
        return a.title.localeCompare(b.title);
      });
    });

    return grouped;
  };

  const groupedTickets = groupTickets();

  return (
    <div className="kanban-board">
      <div className="header">
        <div className="dropdown">
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="dropdown-button">
            <span className="icon">☰</span> Display
          </button>
          {isDropdownOpen && (
            <div className="dropdown-content">
              <div>
                <label>Grouping</label>
                <select value={grouping} onChange={e => setGrouping(e.target.value as any)}>
                  <option value="status">Status</option>
                  <option value="user">User</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
              <div>
                <label>Ordering</label>
                <select value={sorting} onChange={e => setSorting(e.target.value as any)}>
                  <option value="priority">Priority</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="board">
        {Object.entries(groupedTickets).map(([group, tickets]) => (
          <div key={group} className="column">
            <div className="column-header">
              <div className="column-header-left">
                <span className="group-icon">{statusIcons[group] || '📌'}</span>
                <h2>{group}</h2>
                <span className="ticket-count">{tickets.length}</span>
              </div>
              <div className="column-header-right">
                <span className="add-icon">+</span>
                <span className="more-icon">...</span>
              </div>
            </div>
            {tickets.map(ticket => (
              <div key={ticket.id} className="card">
                <div className="card-header">
                  <span className="ticket-id">{ticket.id}</span>
                  <div className="user-avatar" title={data.users.find(user => user.id === ticket.userId)?.name}>
                    {data.users.find(user => user.id === ticket.userId)?.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h3>{ticket.title}</h3>
                <div className="card-footer">
                  <span className="priority-icon" title={priorityLabels[ticket.priority]}>{priorityIcons[ticket.priority]}</span>
                  {ticket.tag.map((tag, index) => (
                    <span key={index} className="tag">
                      <span className="dot">•</span> {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}