import React from 'react';

interface FilterBarProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onRefresh: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ statusFilter, onStatusFilterChange, onRefresh }) => {
  return (
    <div className="d-flex align-items-center flex-wrap">
      <div className="dropdown me-3">
        <button className="btn btn-white dropdown-toggle" type="button" data-bs-toggle="dropdown">
          Status: {statusFilter === 'all' ? 'All' : statusFilter}
        </button>
        <ul className="dropdown-menu">
          <li><button className="dropdown-item" onClick={() => onStatusFilterChange('all')}>All</button></li>
          <li><button className="dropdown-item" onClick={() => onStatusFilterChange('Pending')}>Pending</button></li>
          <li><button className="dropdown-item" onClick={() => onStatusFilterChange('Accepted')}>Accepted</button></li>
          <li><button className="dropdown-item" onClick={() => onStatusFilterChange('Rejected')}>Rejected</button></li>
        </ul>
      </div>
      <button className="btn btn-outline-primary" onClick={onRefresh}>
        <i className="ti ti-refresh me-1" />
        Refresh
      </button>
    </div>
  );
};

export default FilterBar; 