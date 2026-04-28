import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, LayoutDashboard, FolderKanban, GraduationCap, Award, Users,
  Plus, Loader2, Trash2, Edit3, ExternalLink, TrendingUp, Sparkles,
  Clock, CheckCircle2, Pause, Play,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, type Variants } from 'framer-motion';

import { useDesarrolloProfesionalData } from '../hooks/useDesarrolloProfesionalData';
import type {
  NewProjectInput, NewLearningInput, NewCertificationInput, NewNetworkInput,
  ProjectStatus, LearningType,
  ProProject, ProLearning, ProNetworkContact,
} from '../types';
import AetherModal from '../../../core/components/AetherModal';
import AuraLayout, { type TabItem } from '../../../components/layout/AuraLayout';

type TabType = 'dashboard' | 'proyectos' | 'aprendizaje' | 'certificaciones' | 'red';

const ACCENT = '#D9B25E';
const ACCENT_SOFT = '#E8C988';

const PROJECT_STATUSES: ProjectStatus[] = ['Activo', 'En pausa', 'Completado'];
const LEARNING_TYPES: LearningType[]   = ['Curso', 'Libro', 'Podcast', 'Workshop'];

const STATUS_COLORS: Record<string, string> = {
  'Activo':     '#34D399',
  'Completado': '#A78BFA',
  'En pausa':   '#FBBF24',
};

const TYPE_COLORS: Record<string, string> = {
  'Curso':    '#60A5FA',
  'Libro':    '#34D399',
  'Podcast':  '#FBBF24',
  'Workshop': '#FB7185',
};

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
  'Activo':     Play,
  'Completado': CheckCircle2,
  'En pausa':   Pause,
};

const DEFAULT_PROJECT: NewProjectInput        = { name: '', description: '', status: 'Activo', tech_stack: '', start_date: '', end_date: '' };
const DEFAULT_LEARNING: NewLearningInput      = { name: '', type: 'Curso', platform: '', progress: '0', hours_invested: '0' };
const DEFAULT_CERT: NewCertificationInput     = { name: '', issuer: '', obtained_date: '', expiry_date: '', url: '' };
const DEFAULT_CONTACT: NewNetworkInput        = { name: '', role: '', company: '', how_met: '', notes: '' };

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};
const tapPhysics = { scale: 0.96, filter: 'brightness(1.1)' };
const hoverPhysics = { scale: 1.01 };

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${value}%`,
          backgroundColor: value >= 100 ? '#34D399' : value >= 50 ? ACCENT : '#FBBF24',
          boxShadow: `0 0 12px ${value >= 100 ? '#34D399' : ACCENT}55`,
        }}
      />
    </div>
  );
}

export default function DesarrolloProfesionalDashboard() {
  const navigate = useNavigate();
  const {
    projects, learning, certifications, network, loading,
    createProject, updateProject, deleteProject,
    createLearning, updateLearning, deleteLearning,
    createCertification, deleteCertification,
    createNetworkContact, updateNetworkContact, deleteNetworkContact,
  } = useDesarrolloProfesionalData();

  const [activeTab,    setActiveTab]    = useState<TabType>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [learnModalOpen,   setLearnModalOpen]   = useState(false);
  const [certModalOpen,    setCertModalOpen]    = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const [editingProject, setEditingProject] = useState<ProProject | null>(null);
  const [editingLearn,   setEditingLearn]   = useState<ProLearning | null>(null);
  const [editingContact, setEditingContact] = useState<ProNetworkContact | null>(null);

  const [newProject, setNewProject] = useState<NewProjectInput>(DEFAULT_PROJECT);
  const [newLearn,   setNewLearn]   = useState<NewLearningInput>(DEFAULT_LEARNING);
  const [newCert,    setNewCert]    = useState<NewCertificationInput>(DEFAULT_CERT);
  const [newContact, setNewContact] = useState<NewNetworkInput>(DEFAULT_CONTACT);

  const activeProjects = projects.filter(p => p.status === 'Activo').length;
  const certsCount     = certifications.length;
  const thisMonthHours = useMemo(() => {
    const now = new Date();
    return learning
      .filter(l => {
        const d = new Date(l.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((acc, l) => acc + Number(l.hours_invested), 0);
  }, [learning]);
  const totalLearningHours = learning.reduce((acc, l) => acc + Number(l.hours_invested), 0);

  const aiInsight = useMemo(() => {
    if (loading) return 'Cargando tu carrera profesional…';
    if (projects.length === 0 && learning.length === 0) {
      return 'Tu universo profesional está vacío. Empezá creando tu primer proyecto o agregando un curso que estés haciendo.';
    }
    const stalledLearning = learning.filter(l => l.progress > 0 && l.progress < 100).length;
    const expiringSoon = certifications.filter(c => {
      if (!c.expiry_date) return false;
      const days = (new Date(c.expiry_date).getTime() - Date.now()) / 86400000;
      return days > 0 && days < 60;
    }).length;
    if (expiringSoon > 0) {
      return `Tenés ${expiringSoon} certificación${expiringSoon > 1 ? 'es' : ''} venciendo en menos de 60 días. Renovala antes de que pierda validez.`;
    }
    if (activeProjects === 0 && projects.length > 0) {
      return 'Ningún proyecto activo. Reactivá uno o cerrá los pendientes para liberar foco.';
    }
    if (thisMonthHours === 0 && learning.length > 0) {
      return 'Cero horas de aprendizaje este mes. Bloqueá 30 minutos esta semana para retomar el ritmo.';
    }
    if (stalledLearning >= 3) {
      return `Tenés ${stalledLearning} cursos en progreso simultáneo. Considerá terminar uno antes de empezar otro.`;
    }
    return `Estás llevando ${activeProjects} proyecto${activeProjects !== 1 ? 's' : ''} activo${activeProjects !== 1 ? 's' : ''} y ${thisMonthHours}h de aprendizaje este mes. Buen ritmo.`;
  }, [loading, projects, learning, certifications, activeProjects, thisMonthHours]);

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

  if (loading && projects.length === 0 && learning.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1B1714]">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: ACCENT }} />
      </div>
    );
  }

  const auraTabs: TabItem[] = [
    { id: 'dashboard',       label: 'Resumen',       icon: <LayoutDashboard size={16} />, mobileLabel: 'Inicio'   },
    { id: 'proyectos',       label: 'Proyectos',     icon: <FolderKanban    size={16} />, mobileLabel: 'Proyectos'},
    { id: 'aprendizaje',     label: 'Aprendizaje',   icon: <GraduationCap   size={16} />, mobileLabel: 'Aprendo'  },
    { id: 'certificaciones', label: 'Certificaciones',icon: <Award           size={16} />, mobileLabel: 'Certs'    },
    { id: 'red',             label: 'Red',            icon: <Users           size={16} />, mobileLabel: 'Red'      },
  ];

  return (
    <AuraLayout
      tabs={auraTabs}
      activeTab={activeTab}
      onTabChange={(tab) => handleTabChange(tab as TabType)}
      accentColor={ACCENT}
      title="Desarrollo Profesional"
      subtitle="Carrera & Propósito"
    >
      <div className="relative z-10">
        <motion.header
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 md:mb-10"
        >
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {activeTab !== 'dashboard' && (
              <motion.button
                whileTap={tapPhysics}
                whileHover={hoverPhysics}
                onClick={() => {
                  if (activeTab === 'proyectos')         setProjectModalOpen(true);
                  else if (activeTab === 'aprendizaje')  setLearnModalOpen(true);
                  else if (activeTab === 'certificaciones') setCertModalOpen(true);
                  else if (activeTab === 'red')           setContactModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs text-black"
                style={{ backgroundColor: ACCENT, boxShadow: `0 0 24px ${ACCENT}44` }}
              >
                <Plus size={13} strokeWidth={3} />
                {activeTab === 'proyectos' ? 'Nuevo Proyecto' : activeTab === 'aprendizaje' ? 'Agregar Recurso' : activeTab === 'certificaciones' ? 'Nueva Cert.' : 'Agregar Contacto'}
              </motion.button>
            )}
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="font-serif text-white mb-6 tracking-tight"
            style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)', lineHeight: 1.05 }}
          >
            {activeTab === 'dashboard'         ? 'Tu carrera' :
             activeTab === 'proyectos'         ? 'Proyectos' :
             activeTab === 'aprendizaje'       ? 'Aprendizaje' :
             activeTab === 'certificaciones'   ? 'Certificaciones' :
             'Red profesional'}
          </motion.h2>

          <motion.div
            variants={itemVariants}
            className="rounded-3xl p-5 mb-6 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}18, rgba(255,255,255,0.02))`,
              border: `1px solid ${ACCENT}33`,
            }}
          >
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${ACCENT}22` }}>
                <Sparkles size={16} style={{ color: ACCENT }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT_SOFT }}>Aether Insight</p>
                <p className="text-sm text-zinc-200 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </motion.div>

          {activeTab === 'dashboard' && (
            <motion.div variants={itemVariants} className="flex gap-2.5 flex-wrap">
              {[
                { icon: '🚀', label: 'Proyectos activos', val: activeProjects },
                { icon: '📖', label: 'Aprendiendo', val: learning.length },
                { icon: '🏆', label: 'Certificaciones', val: certifications.length },
                { icon: '🤝', label: 'Red', val: network.length },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-sm leading-none">{s.icon}</span>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-500 leading-tight">{s.label}</p>
                    <p className="text-[15px] font-black text-white leading-none">{s.val}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.header>

        {activeTab === 'dashboard' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { label: 'Proyectos activos',          value: activeProjects,     icon: FolderKanban,  sub: `de ${projects.length} total` },
              { label: 'Certificaciones logradas',   value: certsCount,         icon: Award,         sub: 'credenciales' },
              { label: 'Horas de aprendizaje (mes)', value: thisMonthHours,     icon: TrendingUp,    sub: `${totalLearningHours}h total` },
            ].map(({ label, value, icon: Icon, sub }) => (
              <motion.div
                key={label}
                variants={itemVariants}
                whileHover={hoverPhysics}
                className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${ACCENT}1F` }}>
                    <Icon size={20} style={{ color: ACCENT }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</span>
                </div>
                <span className="text-5xl font-black text-white tracking-tight">{value}</span>
                <span className="text-sm text-zinc-400">{sub}</span>
              </motion.div>
            ))}

            <motion.div variants={itemVariants} className="sm:col-span-2 rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base text-white">Proyectos recientes</h3>
                <button onClick={() => handleTabChange('proyectos')} className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT }}>Ver todo</button>
              </div>
              {projects.slice(0, 4).length === 0 ? (
                <p className="text-sm text-zinc-500">Sin proyectos todavía.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {projects.slice(0, 4).map(p => {
                    const Icon = STATUS_ICONS[p.status];
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon size={16} style={{ color: STATUS_COLORS[p.status], flexShrink: 0 }} />
                          <p className="text-sm font-bold truncate text-zinc-100">{p.name}</p>
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: `${STATUS_COLORS[p.status]}22`, color: STATUS_COLORS[p.status] }}>
                          {p.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base text-white">En progreso</h3>
                <button onClick={() => handleTabChange('aprendizaje')} className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: ACCENT }}>Ver todo</button>
              </div>
              {learning.filter(l => l.progress < 100).slice(0, 3).length === 0 ? (
                <p className="text-sm text-zinc-500">Sin recursos en progreso.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {learning.filter(l => l.progress < 100).slice(0, 3).map(l => (
                    <div key={l.id}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-bold truncate pr-2 text-zinc-100">{l.name}</p>
                        <span className="text-xs font-mono shrink-0 text-zinc-400">{l.progress}%</span>
                      </div>
                      <ProgressBar value={l.progress} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'proyectos' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {projects.length === 0 ? (
              <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                <FolderKanban size={40} className="text-zinc-600" />
                <p className="mt-4 font-bold text-base text-zinc-300">Sin proyectos todavía</p>
                <p className="text-sm mt-1 text-zinc-500">Crea tu primer proyecto de carrera.</p>
              </motion.div>
            ) : projects.map(project => {
              const Icon = STATUS_ICONS[project.status];
              return (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  whileHover={hoverPhysics}
                  className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${STATUS_COLORS[project.status]}22` }}>
                      <FolderKanban size={20} style={{ color: STATUS_COLORS[project.status] }} />
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[project.status]}22`, color: STATUS_COLORS[project.status] }}>
                      <Icon size={12} /> {project.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-snug text-white">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm mt-1 leading-relaxed line-clamp-2 text-zinc-400">{project.description}</p>
                    )}
                  </div>
                  {project.tech_stack && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech_stack.split(',').map(t => t.trim()).filter(Boolean).map(tech => (
                        <span key={tech} className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/5 text-zinc-300 border border-white/5">{tech}</span>
                      ))}
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock size={12} />
                      <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : '?'}</span>
                      <span>→</span>
                      <span>{project.end_date ? new Date(project.end_date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'Presente'}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                    <motion.button whileTap={tapPhysics} onClick={() => openEditProject(project)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: ACCENT }}>
                      <Edit3 size={14} /> Editar
                    </motion.button>
                    <motion.button whileTap={tapPhysics} onClick={() => handleDeleteProject(project.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors text-rose-400">
                      <Trash2 size={14} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'aprendizaje' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {learning.length === 0 ? (
              <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                <GraduationCap size={40} className="text-zinc-600" />
                <p className="mt-4 font-bold text-base text-zinc-300">Sin recursos registrados</p>
                <p className="text-sm mt-1 text-zinc-500">Agrega cursos, libros y más.</p>
              </motion.div>
            ) : learning.map(item => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={hoverPhysics}
                className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-2xl" style={{ backgroundColor: `${TYPE_COLORS[item.type]}22` }}>
                    <GraduationCap size={20} style={{ color: TYPE_COLORS[item.type] }} />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${TYPE_COLORS[item.type]}22`, color: TYPE_COLORS[item.type] }}>
                    {item.type}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug text-white">{item.name}</h3>
                  {item.platform && (
                    <p className="text-sm mt-1 text-zinc-400">{item.platform}</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Progreso</span>
                    <span className="text-sm font-bold font-mono" style={{ color: item.progress >= 100 ? '#34D399' : '#fff' }}>{item.progress}%</span>
                  </div>
                  <ProgressBar value={item.progress} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-400">{item.hours_invested}h invertidas</span>
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                  <motion.button whileTap={tapPhysics} onClick={() => openEditLearn(item)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: ACCENT }}>
                    <Edit3 size={14} /> Editar
                  </motion.button>
                  <motion.button whileTap={tapPhysics} onClick={() => handleDeleteLearn(item.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors text-rose-400">
                    <Trash2 size={14} /> Eliminar
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'certificaciones' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {certifications.length === 0 ? (
              <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                <Award size={40} className="text-zinc-600" />
                <p className="mt-4 font-bold text-base text-zinc-300">Sin certificaciones aún</p>
                <p className="text-sm mt-1 text-zinc-500">Registra tus logros y credenciales.</p>
              </motion.div>
            ) : certifications.map(cert => {
              const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
              return (
                <motion.div
                  key={cert.id}
                  variants={itemVariants}
                  whileHover={hoverPhysics}
                  className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: `${ACCENT}22` }}>
                      <Award size={20} style={{ color: ACCENT }} />
                    </div>
                    {cert.expiry_date && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: isExpired ? '#7F1D1D44' : '#064E3B44', color: isExpired ? '#FCA5A5' : '#6EE7B7' }}>
                        {isExpired ? 'Expirada' : 'Vigente'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-snug text-white">{cert.name}</h3>
                    <p className="text-sm mt-1 font-medium text-zinc-400">{cert.issuer}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    {cert.obtained_date && (
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-0.5">Obtenida</span>
                        <span>{new Date(cert.obtained_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    {cert.expiry_date && (
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-0.5">Vence</span>
                        <span style={{ color: isExpired ? '#FCA5A5' : undefined }}>{new Date(cert.expiry_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: ACCENT }}>
                        <ExternalLink size={14} /> Ver
                      </a>
                    )}
                    <motion.button whileTap={tapPhysics} onClick={() => handleDeleteCert(cert.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors text-rose-400">
                      <Trash2 size={14} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'red' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {network.length === 0 ? (
              <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                <Users size={40} className="text-zinc-600" />
                <p className="mt-4 font-bold text-base text-zinc-300">Red profesional vacía</p>
                <p className="text-sm mt-1 text-zinc-500">Agrega contactos clave de tu carrera.</p>
              </motion.div>
            ) : network.map(contact => {
              const initials = contact.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
              return (
                <motion.div
                  key={contact.id}
                  variants={itemVariants}
                  whileHover={hoverPhysics}
                  className="rounded-3xl p-6 bg-zinc-900/60 border border-white/5 backdrop-blur-xl flex flex-col gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 text-black"
                      style={{ backgroundColor: ACCENT, boxShadow: `0 0 20px ${ACCENT}44` }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base leading-snug truncate text-white">{contact.name}</h3>
                      {contact.role && <p className="text-sm truncate text-zinc-400">{contact.role}</p>}
                      {contact.company && <p className="text-xs font-medium truncate text-zinc-500">{contact.company}</p>}
                    </div>
                  </div>
                  {contact.how_met && (
                    <div className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-0.5">Cómo nos conocimos</span>
                      {contact.how_met}
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-xs leading-relaxed line-clamp-2 text-zinc-400">{contact.notes}</p>
                  )}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                    <motion.button whileTap={tapPhysics} onClick={() => openEditContact(contact)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: ACCENT }}>
                      <Edit3 size={14} /> Editar
                    </motion.button>
                    <motion.button whileTap={tapPhysics} onClick={() => handleDeleteContact(contact.id)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl hover:bg-rose-500/10 transition-colors text-rose-400">
                      <Trash2 size={14} /> Eliminar
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      <AetherModal isOpen={projectModalOpen} onClose={closeProjectModal} title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
        <form onSubmit={handleProjectSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nombre del proyecto</label>
            <input type="text" required value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="neo-input" placeholder="Mi portafolio web" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Descripción</label>
            <textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="neo-input resize-none h-20" placeholder="Qué problema resuelve, objetivo..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Estado</label>
            <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as ProjectStatus })} className="neo-input appearance-none">
              {PROJECT_STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tecnologías / Herramientas</label>
            <input type="text" value={newProject.tech_stack} onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })} className="neo-input" placeholder="React, TypeScript, Supabase (separar con comas)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fecha inicio</label>
              <input type="date" value={newProject.start_date} onChange={e => setNewProject({ ...newProject, start_date: e.target.value })} className="neo-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fecha fin</label>
              <input type="date" value={newProject.end_date} onChange={e => setNewProject({ ...newProject, end_date: e.target.value })} className="neo-input" />
            </div>
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 rounded-full py-3 font-black text-sm text-black disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 28px ${ACCENT}55` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
          </motion.button>
        </form>
      </AetherModal>

      <AetherModal isOpen={learnModalOpen} onClose={closeLearnModal} title={editingLearn ? 'Editar Recurso' : 'Nuevo Recurso'}>
        <form onSubmit={handleLearnSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nombre del recurso</label>
            <input type="text" required value={newLearn.name} onChange={e => setNewLearn({ ...newLearn, name: e.target.value })} className="neo-input" placeholder="Nombre del curso, libro o podcast" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tipo</label>
              <select value={newLearn.type} onChange={e => setNewLearn({ ...newLearn, type: e.target.value as LearningType })} className="neo-input appearance-none">
                {LEARNING_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Plataforma</label>
              <input type="text" value={newLearn.platform} onChange={e => setNewLearn({ ...newLearn, platform: e.target.value })} className="neo-input" placeholder="Udemy, Coursera..." />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Progreso: {newLearn.progress}%</label>
            <input
              type="range" min="0" max="100" step="5"
              value={newLearn.progress}
              onChange={e => setNewLearn({ ...newLearn, progress: e.target.value })}
              className="w-full"
              style={{ accentColor: ACCENT }}
            />
            <div className="mt-1"><ProgressBar value={Number(newLearn.progress)} /></div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Horas invertidas</label>
            <input type="number" min="0" step="0.5" value={newLearn.hours_invested} onChange={e => setNewLearn({ ...newLearn, hours_invested: e.target.value })} className="neo-input font-mono" />
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 rounded-full py-3 font-black text-sm text-black disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 28px ${ACCENT}55` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingLearn ? 'Guardar Cambios' : 'Agregar Recurso'}
          </motion.button>
        </form>
      </AetherModal>

      <AetherModal isOpen={certModalOpen} onClose={() => { setCertModalOpen(false); setNewCert(DEFAULT_CERT); }} title="Nueva Certificación">
        <form onSubmit={handleCertSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nombre de la certificación</label>
            <input type="text" required value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} className="neo-input" placeholder="AWS Solutions Architect, PMP..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Entidad emisora</label>
            <input type="text" required value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} className="neo-input" placeholder="Amazon, Google, PMI..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fecha obtenida</label>
              <input type="date" value={newCert.obtained_date} onChange={e => setNewCert({ ...newCert, obtained_date: e.target.value })} className="neo-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fecha vencimiento</label>
              <input type="date" value={newCert.expiry_date} onChange={e => setNewCert({ ...newCert, expiry_date: e.target.value })} className="neo-input" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">URL / Credencial</label>
            <input type="url" value={newCert.url} onChange={e => setNewCert({ ...newCert, url: e.target.value })} className="neo-input" placeholder="https://..." />
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 rounded-full py-3 font-black text-sm text-black disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 28px ${ACCENT}55` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrar Certificación'}
          </motion.button>
        </form>
      </AetherModal>

      <AetherModal isOpen={contactModalOpen} onClose={closeContactModal} title={editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}>
        <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nombre completo</label>
            <input type="text" required value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} className="neo-input" placeholder="Nombre del contacto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Rol / Cargo</label>
              <input type="text" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} className="neo-input" placeholder="CTO, Developer..." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Empresa</label>
              <input type="text" value={newContact.company} onChange={e => setNewContact({ ...newContact, company: e.target.value })} className="neo-input" placeholder="Nombre de la empresa" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Cómo nos conocimos</label>
            <input type="text" value={newContact.how_met} onChange={e => setNewContact({ ...newContact, how_met: e.target.value })} className="neo-input" placeholder="Conferencia, trabajo, LinkedIn..." />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Notas</label>
            <textarea value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} className="neo-input resize-none h-20" placeholder="Contexto, proyectos en común, seguimiento..." />
          </div>
          <motion.button whileTap={tapPhysics} type="submit" disabled={isSubmitting} className="mt-2 rounded-full py-3 font-black text-sm text-black disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: ACCENT, boxShadow: `0 0 28px ${ACCENT}55` }}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingContact ? 'Guardar Cambios' : 'Agregar Contacto'}
          </motion.button>
        </form>
      </AetherModal>

      </div>
    </AuraLayout>
  );
}
