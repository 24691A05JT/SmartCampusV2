import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import EventCard from '../components/events/EventCard';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import SkeletonLoader from '../components/common/SkeletonLoader';
import EmptyState from '../components/common/EmptyState';
import apiClient from '../services/apiClient';

const CATEGORIES = [
  'All Categories',
  'Technical',
  'Workshop',
  'Cultural',
  'Sports',
  'Seminar',
  'Hackathon',
  'Webinar',
  'Career'
];

const DEPARTMENTS = [
  'All Departments',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Business Administration',
  'Humanities & Sciences'
];

const SORT_OPTIONS = [
  { value: 'date-asc', label: 'Event Date (Upcoming First)' },
  { value: 'date-desc', label: 'Event Date (Latest First)' },
  { value: 'capacity-desc', label: 'Capacity (Largest First)' },
  { value: 'title-asc', label: 'Title (A to Z)' }
];

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [department, setDepartment] = useState('All Departments');
  const [dateFrom, setDateFrom] = useState('');
  const [sortOption, setSortOption] = useState('date-asc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Events from Backend
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sortByField, sortOrderField] = sortOption.split('-');

      const params = {
        page,
        limit: 9,
        sortBy: sortByField,
        sortOrder: sortOrderField
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (category !== 'All Categories') params.category = category;
      if (department !== 'All Departments') params.department = department;
      if (dateFrom) params.dateFrom = dateFrom;

      const res = await apiClient.get('/events', { params });
      const eventsList = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      const paginationData = res?.pagination || res?.data?.pagination || null;

      setEvents(eventsList);
      if (paginationData) {
        setPagination(paginationData);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Unable to load campus events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, department, dateFrom, sortOption, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('All Categories');
    setDepartment('All Departments');
    setDateFrom('');
    setSortOption('date-asc');
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    category !== 'All Categories' ||
    department !== 'All Departments' ||
    dateFrom ||
    sortOption !== 'date-asc';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Campus Discovery Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Explore Campus Activities & Technical Events
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Discover hackathons, workshops, guest lectures, cultural fests, and competitive sports
            happening across departments. Register with one click and earn digital activity credits.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4">
        {/* Top Controls: Search + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="event-search-input"
              placeholder="Search events by title, topics, tags (e.g. AI, Robotics, Cyber)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-xl border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-4">
            <Select
              id="event-sort-select"
              options={SORT_OPTIONS}
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Secondary Filter Row: Category, Department, Date Picker, Clear */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 items-end">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
              Category
            </label>
            <select
              id="event-category-filter"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900/90 text-slate-200 text-xs rounded-xl border border-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
              Department
            </label>
            <select
              id="event-dept-filter"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900/90 text-slate-200 text-xs rounded-xl border border-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
              From Date
            </label>
            <input
              type="date"
              id="event-date-filter"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-900/90 text-slate-200 text-xs rounded-xl border border-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={handleResetFilters}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Reset Filters
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="px-3"
              onClick={fetchEvents}
              title="Refresh events"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4"
            >
              <SkeletonLoader height="160px" className="rounded-xl" />
              <SkeletonLoader height="24px" width="70%" />
              <SkeletonLoader height="16px" count={2} />
              <div className="pt-4 border-t border-slate-800 flex justify-between">
                <SkeletonLoader height="32px" width="40%" />
                <SkeletonLoader height="32px" width="30%" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-8 border border-rose-800/40 text-center space-y-4">
          <p className="text-rose-400 font-semibold">{error}</p>
          <Button variant="outline" onClick={fetchEvents}>
            Try Again
          </Button>
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No campus events found"
          description={
            hasActiveFilters
              ? 'No approved events matched your current search and filter criteria. Try adjusting your parameters.'
              : 'There are currently no approved campus events scheduled. Check back soon!'
          }
          actionLabel={hasActiveFilters ? 'Clear All Filters' : undefined}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <div className="space-y-8">
          {/* Results Count */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing <strong className="text-white">{events.length}</strong> of{' '}
              <strong className="text-white">{pagination.total}</strong> approved campus events
            </span>
            <span>
              Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.totalPages}</strong>
            </span>
          </div>

          {/* Grid of Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-800">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1 px-3 text-xs text-slate-300">
                {Array.from({ length: pagination.totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        page === pNum
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
