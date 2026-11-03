import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import {
  Sparkles,
  Compass,
  Filter,
  RefreshCw,
  UserCheck,
  AlertCircle,
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';

const CATEGORIES = [
  'All',
  'Technical',
  'Workshop',
  'Hackathon',
  'Seminar',
  'Webinar',
  'Career',
  'Cultural',
  'Sports'
];

export const StudentRecommendationsPage = () => {
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minScore, setMinScore] = useState(0);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 12,
        minScore
      };

      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const res = await apiClient.get('/recommendations', { params });

      // Handle envelope structure
      const items = Array.isArray(res.data) ? res.data : res.data?.recommendations || [];
      setRecommendations(items);
      setMeta(res.meta || null);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Unable to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, minScore]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const hasIncompleteProfile =
    !user?.interests?.length || !user?.skills?.length || meta?.profileIncomplete;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="primary" size="sm" hasDot>
              Personalized Matching Engine
            </Badge>
            {user?.department && (
              <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {user.department}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Recommended Events for You
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Personalized event recommendations calculated from your academic department, declared
            skills, interests, and verified campus participation.
          </p>
        </div>

        {/* Decorative ambient blur */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Truthful Profile Completion Callout (Truthful messaging, no unsupported claims) */}
      {hasIncompleteProfile && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/20 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Enhance Your Recommendations</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Add your skills and interests to get more personalized recommendations tailored to your goals.
              </p>
            </div>
          </div>
          <Link to="/profile" className="shrink-0">
            <Button variant="outline" size="sm">
              Update Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Controls (Min score & Refresh) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-slate-900">All (0+)</option>
              <option value={30} className="bg-slate-900">30%+</option>
              <option value={50} className="bg-slate-900">50%+</option>
              <option value={70} className="bg-slate-900">70%+</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecommendations}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 space-y-4 border border-slate-800">
              <SkeletonLoader height="160px" className="rounded-xl" />
              <SkeletonLoader height="20px" width="70%" />
              <SkeletonLoader height="14px" width="90%" />
              <SkeletonLoader height="32px" className="rounded-lg mt-4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-950/20 border border-red-500/20 rounded-2xl max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Unable to Load Recommendations</h3>
          <p className="text-xs text-slate-300 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRecommendations}>
            Try Again
          </Button>
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No Matching Events Found"
          description={
            selectedCategory !== 'All' || minScore > 0
              ? 'No approved events meet the selected filter criteria. Try resetting your filters to see more recommendations.'
              : 'There are currently no upcoming events matching your profile criteria. Check back soon as new campus events are approved!'
          }
          action={
            <div className="flex gap-3">
              {(selectedCategory !== 'All' || minScore > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('All');
                    setMinScore(0);
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Link to="/events">
                <Button variant="primary" size="sm">
                  Browse All Events
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{recommendations.length}</strong> matching events
            </span>
            <span>Sorted by match score</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.event._id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRecommendationsPage;
