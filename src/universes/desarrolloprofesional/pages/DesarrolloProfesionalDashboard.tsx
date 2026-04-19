import React, { useState } from 'react';
import {
  ArrowLeft, LayoutDashboard, FolderKanban, GraduationCap, Award, Users,
  Plus, Loader2, Trash2, Edit3, ExternalLink, TrendingUp,
  Clock, CheckCircle2, Pause, Play,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useDesarrolloProfesionalData } from '../hooks/useDesarrolloProfesionalData';
import type {
  NewProjectInput, NewLearningInput, NewCertificationInput, NewNetworkInput,
  ProjectStatus, LearningType,
  ProProject, ProLearning, ProNetworkContact,
} from '../types';
import UniverseNavItem from '../../../core/components/UniverseNavItem';
import AetherModal from '../../../core/components/AetherModal';
import UniverseBottomNav from '../../../core/components/UniverseBottomNav';
import UniverseMobileHeader from '../../../core/components/UniverseMobileHeader';

// ── Types ─────────────────────────────────────────────────────────────────────
type TabType = 'dashboard' | 'proyectos' | 'aprendizaje' | 'certificaciones' | 'red';

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME = {
  bg:       '#FFD700',
  surface:  '#FFFFFF',
  accent:   '#B8960C',
  textMain: '#1D293D',
  textMuted:'#4A5568',
  textLight:'rgba(29,41,61,0.6)',
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PROJECT_STATUSES: ProjectStatus[] = ['Activo', 'En pausa', 'Completado'];
const LEARNING_TYPES: LearningType[]   = ['Curso', 'Libro', 'Podcast', 'Workshop'];

const STATUS_COLORS: Record<string, string> = {
  'Activo':     '#10B981',
  'Completado': '#6366F1',
  'En pausa':   '#F59E0B',
};

const TYPE_COLORS: Record<string, string> = {
  'Curso':    '#3B82F6',
  'Libro':    '#10B981',
  'Podcast':  '#F59E0B',
  'Workshop': '#EF4444',
};

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
  'Activo':     Play,
  'Completado': CheckCircle2,
  'En pausa':   Pause,
};

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_PROJECT: NewProjectInput        = { name: '', description: '', status: 'Activo', tech_stack: '', start_date: '', end_date: '' };
const DEFAULT_LEARNING: NewLearningInput      = { name: '', type: 'Curso', platform: '', progress: '0', hours_invested: '0' };
const DEFAULT_CERT: NewCertificationInput     = { name: '', issuer: '', obtained_date: '', expiry_date: '', url: '' };
const DEFAULT_CONTACT: NewNetworkInput        = { name: '', role: '', company: '', how_met: '', notes: '' };

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${value}%`,
          backgroundColor: value >= 100 ? '#10B981' : value >= 50 ? THEME.accent : '#F59E0B',
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DesarrolloProfesionalDashboard() {
  const navigate = useNavigate();
  const {
    projects, learning, certifications, network, loading,
    createProject, updateProject, deleteProject,
    createLearning, updateLearning, deleteLearning,
    createCertification, deleteCertification,
    createNetworkContact, updateNetworkContact, deleteNetworkContact,
  } = useDesarrolloProfesionalData();

  const [activeTab,        setActiveTab]        = useState<TabType>('dashboard');
  const [isSubmitting,     setIsSubmitting]     = useState(false);

  // ── Modal states ──────────────────────────────────────────────────────────
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [learnModalOpen,   setLearnModalOpen]   = useState(false);
  const [certModalOpen,    setCertModalOpen]    = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // ── Edit states ───────────────────────────────────────────────────────────
  const [editingProject, setEditingProject] = useState<ProProject | null>(null);
  const [editingLearn,   setEditingLearn]   = useState<ProLearning | null>(null);
  const [editingContact, setEditingContact] = useState<ProNetworkContact | null>(null);

  // ── Form drafts ───────────────────────────────────────────────────────────
  const [newProject, setNewProject] = useState<NewProjectInput>(DEFAULT_PROJECT);
  const [newLearn,   setNewLearn]   = useState<NewLearningInput>(DEFAULT_LEARNING);
  const [newCert,    setNewCert]    = useState<NewCertificationInput>(DEFAULT_CERT);
  const [newContact, setNewContact] = useState<NewNetworkInput>(DEFAULT_CONTACT);

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const activeProjects   = projects.filter(p => p.status === 'Activo').length;
  const certsCount       = certifications.length;
  const thisMonthHours   = (() => {
    const now = new Date();
    return learning
      .filter(l => {
        const d = new Date(l.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, l) => acc + Number(l.hours_invested), 0);
  })();
  const totalLearningHours = learning.reduce((acc, l) => acc + Number(l.hours_invested), 0);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleTabChange = (tab: TabType) => { setActiveTab(tab); };

  const openEditProject = (p: ProProject) => {
    setEditingProject(p);
    setNewProject({ name: p.name, description: p.description ?? '', status: p.status, tech_stack: p.tech_stack ?? '', start_date: p.start_date ?? '', end_date: p.end_date ?? '' });
    setProjectModalOpen(true);
  };

  const openEditLearn = (l: ProLearning) => {
    setEditingLearn(l);
    setNewLearn({ name: l.name, type: l.type, platform: l.platform ?? '', progress: String(l.progress), hours_invested: String(l.hours_invested) });
    setLearnModalOpen(true);
  };

  const openEditContact = (c: ProNetworkContact) => {
    setEditingContact(c);
    setNewContact({ name: c.name, role: c.role ?? '', company: c.company ?? '', how_met: c.how_met ?? '', notes: c.notes ?? '' });
    setContactModalOpen(true);
  };

  const closeProjectModal = () => { setProjectModalOpen(false); setEditingProject(null); setNewProject(DEFAULT_PROJECT); };
  const closeLearnModal   = () => { setLearnModalOpen(false);   setEditingLearn(null);   setNewLearn(DEFAULT_LEARNING); };
  const closeContactModal = () => { setContactModalOpen(false); setEditingContact(null); setNewContact(DEFAULT_CONTACT); };

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleProjectSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, newProject);
        toast.success('Proyecto actualizado');
      } else {
        await createProject(newProject);
        toast.success('Proyecto creado');
      }
      closeProjectModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLearnSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newLearn.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingLearn) {
        await updateLearning(editingLearn.id, newLearn);
        toast.success('Recurso actualizado');
      } else {
        await createLearning(newLearn);
        toast.success('Recurso de aprendizaje añadido');
      }
      closeLearnModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCertSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newCert.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createCertification(newCert);
      toast.success('Certificación registrada');
      setCertModalOpen(false);
      setNewCert(DEFAULT_CERT);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingContact) {
        await updateNetworkContact(editingContact.id, newContact);
        toast.success('Contacto actualizado');
      } else {
        await createNetworkContact(newContact);
        toast.success('Contacto añadido a la red');
      }
      closeContactModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try { await deleteProject(id); toast.success('Proyecto eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteLearn = async (id: string) => {
    try { await deleteLearning(id); toast.success('Recurso eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteCert = async (id: string) => {
    try { await deleteCertification(id); toast.success('Certificación eliminada'); }
    catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteContact = async (id: string) => {
    try { await deleteNetworkContact(id); toast.success('Contacto eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && projects.length === 0 && learning.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THEME.bg }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: THEME.textMain }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row font-sans"
      style={{ backgroundColor: THEME.bg, color: THEME.textMain }}
    >
      <UniverseMobileHeader title="Carrera Pro" subtitle="Crecimiento Profesional" color="#1D293D" />

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <nav
        className="hidden md:flex md:w-64 flex-col z-30 shrink-0 border-r border-black/10"
        style={{ backgroundColor: THEME.bg }}
      >
        <div className="flex items-center gap-4 p-6 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            style={{ color: THEME.textMain }}
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="aether-title" style={{ color: THEME.textMain }}>Profesional</h1>
            <p className="aether-eyebrow" style={{ color: THEME.textLight }}>Carrera & Propósito</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <UniverseNavItem lightBg icon={LayoutDashboard} label="Resumen"         isActive={activeTab === 'dashboard'}       onClick={() => handleTabChange('dashboard')} />
          <UniverseNavItem lightBg icon={FolderKanban}    label="Proyectos"        isActive={activeTab === 'proyectos'}       onClick={() => handleTabChange('proyectos')} />
          <UniverseNavItem lightBg icon={GraduationCap}   label="Aprendizaje"      isActive={activeTab === 'aprendizaje'}     onClick={() => handleTabChange('aprendizaje')} />
          <UniverseNavItem lightBg icon={Award}           label="Certificaciones"  isActive={activeTab === 'certificaciones'} onClick={() => handleTabChange('certificaciones')} />
          <UniverseNavItem lightBg icon={Users}           label="Red Profesional"  isActive={activeTab === 'red'}             onClick={() => handleTabChange('red')} />
        </div>
      </nav>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pt-14 md:pt-10 pb-20 md:pb-0">

        {/* ── Header ── */}
        {/* ── Daylio header ── */}
        <header className="mb-7 md:mb-10">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {activeTab !== 'dashboard' && (
              <button
                onClick={() => {
                  if (activeTab === 'proyectos')         setProjectModalOpen(true);
                  else if (activeTab === 'aprendizaje')  setLearnModalOpen(true);
                  else if (activeTab === 'certificaciones') setCertModalOpen(true);
                  else if (activeTab === 'red')           setContactModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs active:scale-95 transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <Plus size={13} strokeWidth={3} />
                {activeTab === 'proyectos' ? 'Nuevo Proyecto' : activeTab === 'aprendizaje' ? 'Agregar Recurso' : activeTab === 'certificaciones' ? 'Nueva Cert.' : 'Agregar Contacto'}
              </button>
            )}
          </div>
          <h2 className="font-black text-white mb-4" style={{ fontSize: 'clamp(1.6rem, 6vw, 2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {activeTab === 'dashboard'         ? 'Tu carrera' :
             activeTab === 'proyectos'         ? 'Proyectos' :
             activeTab === 'aprendizaje'       ? 'Aprendizaje' :
             activeTab === 'certificaciones'   ? 'Certificaciones' :
             'Red profesional'}
          </h2>
          {activeTab === 'dashboard' && (
            <div className="flex gap-2.5 flex-wrap">
              {[
                { icon: '🚀', label: 'Proyectos activos', val: activeProjects },
                { icon: '📖', label: 'Aprendiendo', val: learning.length },
                { icon: '🏆', label: 'Certificaciones', val: certifications.length },
                { icon: '🤝', label: 'Red', val: network.length },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)' }}>
                  <span className="text-sm leading-none">{s.icon}</span>
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>{s.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* KPI Cards */}
            {[
              { label: 'Proyectos activos',          value: activeProjects,     icon: FolderKanban,  sub: `de ${projects.length} total` },
              { label: 'Certificaciones logradas',   value: certsCount,         icon: Award,         sub: 'credenciales' },
              { label: 'Horas de aprendizaje (mes)', value: thisMonthHours,     icon: TrendingUp,    sub: `${totalLearningHours}h total` },
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="aether-card aether-card-interactive flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${THEME.accent}22` }}>
                    <Icon size={20} style={{ color: THEME.accent }} />
                  </div>
                  <span className="aether-eyebrow" style={{ color: THEME.textMuted }}>{label}</span>
                </div>
                <span className="aether-metric-md" style={{ color: THEME.textMain }}>{value}</span>
                <span className="text-sm font-medium" style={{ color: THEME.textMuted }}>{sub}</span>
              </div>
            ))}

            {/* Recent projects */}
            <div className="sm:col-span-2 aether-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base" style={{ color: THEME.textMain }}>Proyectos recientes</h3>
                <button onClick={() => handleTabChange('proyectos')} className="aether-eyebrow" style={{ color: THEME.accent }}>Ver todo</button>
              </div>
              {projects.slice(0, 4).length === 0 ? (
                <p className="text-sm" style={{ color: THEME.textMuted }}>Sin proyectos todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {projects.slice(0, 4).map(p => {
                    const Icon = STATUS_ICONS[p.status];
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={16} style={{ color: STATUS_COLORS[p.status], flexShrink: 0 }} />
                          <p className="text-sm font-bold truncate" style={{ color: THEME.textMain }}>{p.name}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: `${STATUS_COLORS[p.status]}22`, color: STATUS_COLORS[p.status] }}>
                          {p.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Learning progress */}
            <div className="aether-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base" style={{ color: THEME.textMain }}>En progreso</h3>
                <button onClick={() => handleTabChange('aprendizaje')} className="aether-eyebrow" style={{ color: THEME.accent }}>Ver todo</button>
              </div>
              {learning.filter(l => l.progress < 100).slice(0, 3).length === 0 ? (
                <p className="text-sm" style={{ color: THEME.textMuted }}>Sin recursos en progreso.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {learning.filter(l => l.progress < 100).slice(0, 3).map(l => (
                    <div key={l.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold truncate pr-2" style={{ color: THEME.textMain }}>{l.name}</p>
                        <span className="text-xs font-mono shrink-0" style={{ color: THEME.textMuted }}>{l.progress}%</span>
                      </div>
                      <ProgressBar value={l.progress} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROYECTOS ── */}
        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <FolderKanban size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Sin proyectos todavía</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Crea tu primer proyecto de carrera.</p>
              </div>
            ) : projects.map(project => {
              const Icon = STATUS_ICONS[project.status];
              return (
                <div key={project.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${STATUS_COLORS[project.status]}22` }}>
                      <FolderKanban size={20} style={{ color: STATUS_COLORS[project.status] }} />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[project.status]}22`, color: STATUS_COLORS[project.status] }}>
                      <Icon size={12} /> {project.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-snug" style={{ color: THEME.textMain }}>{project.name}</h3>
                    {project.description && (
                      <p className="text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: THEME.textMuted }}>{project.description}</p>
                    )}
                  </div>
                  {project.tech_stack && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech_stack.split(',').map(t => t.trim()).filter(Boolean).map(tech => (
                        <span key={tech} className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100" style={{ color: THEME.textMuted }}>{tech}</span>
                      ))}
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: THEME.textMuted }}>
                      <Clock size={12} />
                      <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '?'}</span>
                      <span>→</span>
                      <span>{project.end_date ? new Date(project.end_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'Presente'}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                    <button onClick={() => openEditProject(project)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: THEME.accent }}>
                      <Edit3 size={14} /> Editar
                    </button>
                    <button onClick={() => handleDeleteProject(project.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── APRENDIZAJE ── */}
        {activeTab === 'aprendizaje' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learning.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <GraduationCap size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Sin recursos registrados</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Agrega cursos, libros y más.</p>
              </div>
            ) : learning.map(item => (
              <div key={item.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${TYPE_COLORS[item.type]}22` }}>
                    <GraduationCap size={20} style={{ color: TYPE_COLORS[item.type] }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${TYPE_COLORS[item.type]}22`, color: TYPE_COLORS[item.type] }}>
                    {item.type}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug" style={{ color: THEME.textMain }}>{item.name}</h3>
                  {item.platform && (
                    <p className="text-sm mt-1" style={{ color: THEME.textMuted }}>{item.platform}</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="aether-eyebrow" style={{ color: THEME.textMuted }}>Progreso</span>
                    <span className="text-sm font-bold font-mono" style={{ color: item.progress >= 100 ? '#10B981' : THEME.textMain }}>{item.progress}%</span>
                  </div>
                  <ProgressBar value={item.progress} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} style={{ color: THEME.textMuted }} />
                  <span className="text-xs font-medium" style={{ color: THEME.textMuted }}>{item.hours_invested}h invertidas</span>
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <button onClick={() => openEditLearn(item)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: THEME.accent }}>
                    <Edit3 size={14} /> Editar
                  </button>
                  <button onClick={() => handleDeleteLearn(item.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CERTIFICACIONES ── */}
        {activeTab === 'certificaciones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <Award size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Sin certificaciones aún</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Registra tus logros y credenciales.</p>
              </div>
            ) : certifications.map(cert => {
              const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
              return (
                <div key={cert.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${THEME.accent}22` }}>
                      <Award size={20} style={{ color: THEME.accent }} />
                    </div>
                    {cert.expiry_date && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: isExpired ? '#FEE2E2' : '#D1FAE5', color: isExpired ? '#EF4444' : '#10B981' }}>
                        {isExpired ? 'Expirada' : 'Vigente'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-snug" style={{ color: THEME.textMain }}>{cert.name}</h3>
                    <p className="text-sm mt-1 font-medium" style={{ color: THEME.textMuted }}>{cert.issuer}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: THEME.textMuted }}>
                    {cert.obtained_date && (
                      <div>
                        <span className="aether-eyebrow block mb-0.5">Obtenida</span>
                        <span>{new Date(cert.obtained_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    {cert.expiry_date && (
                      <div>
                        <span className="aether-eyebrow block mb-0.5">Vence</span>
                        <span style={{ color: isExpired ? '#EF4444' : undefined }}>{new Date(cert.expiry_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: THEME.accent }}>
                        <ExternalLink size={14} /> Ver
                      </a>
                    )}
                    <button onClick={() => handleDeleteCert(cert.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── RED PROFESIONAL ── */}
        {activeTab === 'red' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {network.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center h-48 rounded-[32px] border-2 border-dashed border-black/10">
                <Users size={40} style={{ color: THEME.textMuted, opacity: 0.4 }} />
                <p className="mt-4 font-bold text-base" style={{ color: THEME.textMuted }}>Red profesional vacía</p>
                <p className="text-sm mt-1" style={{ color: THEME.textLight }}>Agrega contactos clave de tu carrera.</p>
              </div>
            ) : network.map(contact => {
              const initials = contact.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
              return (
                <div key={contact.id} className="aether-card aether-card-interactive flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 text-white" style={{ backgroundColor: THEME.accent }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-snug truncate" style={{ color: THEME.textMain }}>{contact.name}</h3>
                      {contact.role && <p className="text-sm truncate" style={{ color: THEME.textMuted }}>{contact.role}</p>}
                      {contact.company && <p className="text-xs font-medium truncate" style={{ color: THEME.textLight }}>{contact.company}</p>}
                    </div>
                  </div>
                  {contact.how_met && (
                    <div className="text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-100" style={{ color: THEME.textMuted }}>
                      <span className="aether-eyebrow block mb-0.5">Cómo nos conocimos</span>
                      {contact.how_met}
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: THEME.textMuted }}>{contact.notes}</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                    <button onClick={() => openEditContact(contact)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-black/5 transition-colors" style={{ color: THEME.accent }}>
                      <Edit3 size={14} /> Editar
                    </button>
                    <button onClick={() => handleDeleteContact(contact.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-400">
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── MODAL: PROYECTO ──────────────────────────────────────────────── */}
      <AetherModal isOpen={projectModalOpen} onClose={closeProjectModal} title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
        <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre del proyecto</label>
            <input type="text" required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="aether-input" placeholder="Mi portafolio web" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Descripción</label>
            <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="aether-input resize-none h-20" placeholder="Qué problema resuelve, objetivo..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Estado</label>
            <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })} className="aether-input appearance-none">
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Tecnologías / Herramientas</label>
            <input type="text" value={newProject.tech_stack} onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })} className="aether-input" placeholder="React, TypeScript, Supabase (separar con comas)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Fecha inicio</label>
              <input type="date" value={newProject.start_date} onChange={e => setNewProject({ ...newProject, start_date: e.target.value })} className="aether-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Fecha fin</label>
              <input type="date" value={newProject.end_date} onChange={e => setNewProject({ ...newProject, end_date: e.target.value })} className="aether-input" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: APRENDIZAJE ───────────────────────────────────────────── */}
      <AetherModal isOpen={learnModalOpen} onClose={closeLearnModal} title={editingLearn ? 'Editar Recurso' : 'Nuevo Recurso'}>
        <form onSubmit={handleLearnSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre del recurso</label>
            <input type="text" required value={newLearn.name} onChange={e => setNewLearn({ ...newLearn, name: e.target.value })} className="aether-input" placeholder="Nombre del curso, libro o podcast" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Tipo</label>
              <select value={newLearn.type} onChange={e => setNewLearn({ ...newLearn, type: e.target.value as LearningType })} className="aether-input appearance-none">
                {LEARNING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Plataforma</label>
              <input type="text" value={newLearn.platform} onChange={e => setNewLearn({ ...newLearn, platform: e.target.value })} className="aether-input" placeholder="Udemy, Coursera..." />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Progreso: {newLearn.progress}%</label>
            <input
              type="range" min="0" max="100" step="5"
              value={newLearn.progress}
              onChange={e => setNewLearn({ ...newLearn, progress: e.target.value })}
              className="w-full accent-[#B8960C]"
            />
            <div className="mt-1"><ProgressBar value={Number(newLearn.progress)} /></div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Horas invertidas</label>
            <input type="number" min="0" step="0.5" value={newLearn.hours_invested} onChange={e => setNewLearn({ ...newLearn, hours_invested: e.target.value })} className="aether-input font-mono" />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingLearn ? 'Guardar Cambios' : 'Agregar Recurso'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: CERTIFICACIÓN ─────────────────────────────────────────── */}
      <AetherModal isOpen={certModalOpen} onClose={() => { setCertModalOpen(false); setNewCert(DEFAULT_CERT); }} title="Nueva Certificación">
        <form onSubmit={handleCertSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre de la certificación</label>
            <input type="text" required value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} className="aether-input" placeholder="AWS Solutions Architect, PMP..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Entidad emisora</label>
            <input type="text" required value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} className="aether-input" placeholder="Amazon, Google, PMI..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Fecha obtenida</label>
              <input type="date" value={newCert.obtained_date} onChange={e => setNewCert({ ...newCert, obtained_date: e.target.value })} className="aether-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Fecha vencimiento</label>
              <input type="date" value={newCert.expiry_date} onChange={e => setNewCert({ ...newCert, expiry_date: e.target.value })} className="aether-input" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">URL / Credencial</label>
            <input type="url" value={newCert.url} onChange={e => setNewCert({ ...newCert, url: e.target.value })} className="aether-input" placeholder="https://..." />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Certificación'}
          </button>
        </form>
      </AetherModal>

      {/* ── MODAL: CONTACTO ──────────────────────────────────────────────── */}
      <AetherModal isOpen={contactModalOpen} onClose={closeContactModal} title={editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}>
        <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Nombre completo</label>
            <input type="text" required value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} className="aether-input" placeholder="Nombre del contacto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Rol / Cargo</label>
              <input type="text" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} className="aether-input" placeholder="CTO, Developer..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="aether-eyebrow">Empresa</label>
              <input type="text" value={newContact.company} onChange={e => setNewContact({ ...newContact, company: e.target.value })} className="aether-input" placeholder="Nombre de la empresa" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Cómo nos conocimos</label>
            <input type="text" value={newContact.how_met} onChange={e => setNewContact({ ...newContact, how_met: e.target.value })} className="aether-input" placeholder="Conferencia, trabajo, LinkedIn..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="aether-eyebrow">Notas</label>
            <textarea value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} className="aether-input resize-none h-20" placeholder="Contexto, proyectos en común, seguimiento..." />
          </div>
          <button type="submit" disabled={isSubmitting} className="aether-btn mt-2 shadow-lg disabled:opacity-60" style={{ backgroundColor: THEME.textMain, color: '#FFFFFF' }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingContact ? 'Guardar Cambios' : 'Agregar Contacto'}
          </button>
        </form>
      </AetherModal>

      <UniverseBottomNav
        tabs={[
          { id: 'dashboard',       label: 'Resumen',  icon: LayoutDashboard },
          { id: 'proyectos',       label: 'Proyectos', icon: FolderKanban   },
          { id: 'aprendizaje',     label: 'Aprendo',  icon: GraduationCap  },
          { id: 'certificaciones', label: 'Certs',    icon: Award          },
          { id: 'red',             label: 'Red',      icon: Users          },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab as TabType)}
        activeColor="#93C5FD"
        bgColor="#1D293D"
      />
    </div>
  );
}
