import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Calendar,
  Award,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Users,
  Compass
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export const LandingPage = () => {
  const { isAuthenticated, role } = useAuth();

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'organizer') return '/organizer';
    return '/student';
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-violet-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Major Project Rebuild • Presentation-Ready Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
          Smart Campus Event & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Activity Intelligence
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          A unified enterprise-grade digital campus platform powering explainable AI recommendations, automated venue conflict detection, verifiable PDF credentials, and multi-role engagement analytics.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link to={getDashboardPath()}>
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Go to Workspace Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Join as Student or Faculty
                </Button>
              </Link>
              <Link to="/events">
                <Button size="lg" variant="outline" leftIcon={<Compass className="w-5 h-5" />}>
                  Explore Campus Events
                </Button>
              </Link>
            </>
          )}

          <Link to="/demo-foundation">
            <Button size="lg" variant="glass" leftIcon={<Sparkles className="w-5 h-5" />}>
              Component Foundation Catalog
            </Button>
          </Link>
        </div>

        {/* Live Feature Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Explainable Vector AI (Node.js)
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Automated Venue Conflict Guard
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tamper-Proof PDF Certificates
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Role-Based Backend Authorization
          </span>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
            Intelligent Infrastructure
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Academic Excellence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hoverable className="border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Explainable AI</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native content-based vector scoring combining department curricula, student skills, past ratings, and popularity with transparent explanations.
            </p>
          </Card>

          <Card hoverable className="border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Venue Conflict Guard</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time schedule overlap verification preventing double-booking of auditoriums, seminar halls, and computer laboratories.
            </p>
          </Card>

          <Card hoverable className="border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Verifiable Certificates</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated PDFKit certificate generation triggered exclusively upon verified event attendance with unique public verification hashes.
            </p>
          </Card>

          <Card hoverable className="border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Campus Analytics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive Recharts data telemetry visualizing registration velocity, attendance conversion rates, and department participation trends.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
