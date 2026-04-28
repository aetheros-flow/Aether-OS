import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, Brain, Dumbbell, Leaf, Heart, Wallet, Briefcase, Users, Home as HomeIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UniverseCard, { type UniverseData } from '../../../components/dashboard/UniverseCard';
import FrequencyTuningSheet from '../components/FrequencyTuningSheet';
import AuraLayout from '../../../components/layout/AuraLayout';

// ── Universe metadata — icon as Lucide ReactNode, color as hex ────────────────
const UNIVERSE_META: Record<string, Omit<UniverseData, 'id' | 'value' | 'path'>> = {
  desarrollopersonal: {
    name: 'Mind & Spirit',
    description: 'Cultivate inner peace, expand consciousness, and nurture your mental sanctuary through guided reflection.',
    icon: <Brain size={20} />,
    color: '#6B8FC4',
    textColorClass: 'text-blue-400',
    bgIconClass: 'bg-blue-500/20',
    glowClass: '',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpInoK5yGWUnTGE0MOQsbn75eLcicxmDpwQ_EgRTYKMKy2PUsl7jIhk2ogTW0qvUxLvyeXEdcFXZWwqMFSRVSMVD5RfruXxNoZjorL--19gLy7pkLhm9_ROSPwhPx7XpIZq399JWdsu17_l2jxc5SQHfav2jx0ByXhTFdhZRXu1dxNew7gfnqSBGEshREd6cW89xMlaCsUqbfPeZHDJOAKL4RWqvW3Ui3QD0NFCT4EJhRifxTHDn_dmMNxLlo9HH_oHpIqGck4_GKn',
  },
  salud: {
    name: 'Physical Vitality',
    description: 'Energize your vessel, optimize physical movement, and embrace the rhythm of your body\'s natural state.',
    icon: <Dumbbell size={20} />,
    color: '#D97A3A',
    textColorClass: 'text-orange-400',
    bgIconClass: 'bg-orange-500/20',
    glowClass: '',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlgYTKT1PnFD_rssdqmVHsuhvzbmK0pAqi1QkFnu3sGU7VC1BIzjHDxFbv8VppvkEpi7WuNwC3DmJsblnDKxNYFDxX-T43QKJbgHwzIxHKETRMidhO2p8OzX4c5y7gB25p4rOGrbMK7rIyV20UNX53HFzlme1vKhwwbLL9XKdx_TOvNl3dvMDkDkiUh8Q_WmsS-W1x8NgEjfqCgng34A3p5gl9ei2FI5ERmcoDncPpmOxbEN9pOv9EgKnkhrLDzYvqh_kzu-KFdH33',
  },
  ocio: {
    name: 'Leisure & Joy',
    description: 'Fuel your existence with intention, balancing play and rest through the sacred alchemy of enjoyment.',
    icon: <Leaf size={20} />,
    color: '#D97265',
    textColorClass: 'text-rose-400',
    bgIconClass: 'bg-rose-500/20',
    glowClass: '',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6rrdqImuLLEjqypxBMJSeXoDAZjs1plkHgfpjp8gSUrhgRcVr9iYiwFm_q8PyDy-vFw-RN53EChzG3dliiF3_iQrufA9DQJkulOL931AdtbVOhDa2dL8SIByVuQ1HjI4-IgiNMUWH0Uz1F6rarn5afVcZEMVFBvm02yPXrQCu9Dr6Gr9gsbiH_rkxWu8H32M4HAsyJJm5coOzcRGn5cvoRGSESfLamq5PPimGptWUNk1cWu6nVD4iT0psI2Z1q0Lp3kMwvCYFMT82',
  },
  amor: {
    name: 'Love & Connection',
    description: 'Foster deep resonance with others and cultivate the magnetic frequency of pure affection.',
    icon: <Heart size={20} />,
    color: '#E05A7A',
    textColorClass: 'text-pink-400',
    bgIconClass: 'bg-pink-500/20',
    glowClass: '',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
  },
  dinero: {
    name: 'Economic Flow',
    description: 'Master the currents of abundance, generating sustainable wealth and freedom of choice.',
    icon: <Wallet size={20} />,
    color: '#7EC28A',
    textColorClass: 'text-green-400',
    bgIconClass: 'bg-green-500/20',
    glowClass: '',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
  },
  desarrolloprofesional: {
    name: 'Professional Path',
    description: 'Align your career trajectory with your ultimate purpose, climbing through continuous mastery.',
    icon: <Briefcase size={20} />,
    color: '#D9B25E',
    textColorClass: 'text-amber-400',
    bgIconClass: 'bg-amber-500/20',
    glowClass: '',
    imageUrl: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1000&auto=format&fit=crop',
  },
  social: {
    name: 'Social Resonance',
    description: 'Expand your network of impact and immerse yourself in communities that elevate your frequency.',
    icon: <Users size={20} />,
    color: '#9F87C9',
    textColorClass: 'text-violet-400',
    bgIconClass: 'bg-violet-500/20',
    glowClass: '',
    imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1000&auto=format&fit=crop',
  },
  familia: {
    name: 'Family & Roots',
    description: 'Strengthen the foundational bonds that ground you and provide unconditional support.',
    icon: <HomeIcon size={20} />,
    color: '#C090BC',
    textColorClass: 'text-fuchsia-400',
    bgIconClass: 'bg-fuchsia-500/20',
    glowClass: '',
    imageUrl: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1000&auto=format&fit=crop',
  },
};

const UNIVERSE_ORDER = [
  'desarrollopersonal', 'salud', 'ocio', 'amor',
  'dinero', 'desarrolloprofesional', 'social', 'familia',
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [universes, setUniverses] = useState<UniverseData[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: auth, error: authErr } = await supabase.auth.getUser();
        if (authErr || !auth?.user) { navigate('/login'); return; }

        const { data: rows } = await supabase
          .from('UserWheel')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        let wheelData = rows && rows.length > 0 ? rows[0] : null;
        if (!wheelData) {
          const { data: newRow } = await supabase
            .from('UserWheel')
            .insert([{ user_id: auth.user.id }])
            .select();
          if (newRow && newRow.length > 0) wheelData = newRow[0];
        }

        const mapped: UniverseData[] = UNIVERSE_ORDER.map(key => ({
          id: key,
          value: Number(wheelData?.[key] ?? 0),
          path: `/${key}`,
          ...UNIVERSE_META[key],
        }));
        setUniverses(mapped);
      } catch (err) {
        console.error('[Dashboard] load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleLocalChange = (id: string, value: number) =>
    setUniverses(prev => prev.map(u => u.id === id ? { ...u, value } : u));

  const handleCommit = async (id: string, value: number) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      await supabase.from('UserWheel').update({ [id]: value }).eq('user_id', auth.user.id);
    } catch (err) {
      console.error('[Dashboard] save error', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0c16' }}>
        <Loader2 className="w-8 h-8 animate-spin opacity-30 text-violet-400" />
      </div>
    );
  }

  return (
    <AuraLayout
      isDashboard
      onTuneClick={() => setTuneOpen(true)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {universes.map(universe => (
          <UniverseCard key={universe.id} universe={universe} />
        ))}
      </div>

      <FrequencyTuningSheet
        open={tuneOpen}
        onClose={() => setTuneOpen(false)}
        segments={universes.map(u => ({ id: u.id, name: u.name, value: u.value, color: u.color }))}
        onChange={handleLocalChange}
        onCommit={handleCommit}
      />
    </AuraLayout>
  );
}
