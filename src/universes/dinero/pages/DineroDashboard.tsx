import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  LineChart, 
  FolderKanban, 
  LayoutDashboard,
  Plus,
  Flame,
  ArrowLeft,
  CreditCard,
  Building2,
  TrendingUp,
  Activity,
  TrendingDown,
  Loader2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

// Tipos para la base de datos
type TabType = 'dashboard' | 'billeteras' | 'inversiones' | 'proyectos';

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  is_debt: boolean;
}

interface Investment {
  id: string;
  asset_name: string;
  symbol: string;
  holdings: number;
  avg_buy_price: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  allocated_budget: number;
  monthly_burn: number;
  tech_stack: string;
}

export default function DineroDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Estados para los datos reales
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Estados para el Modal de Nueva Cuenta
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'Banco',
    currency: 'NZD',
    balance: ''
  });

  // Paleta del Universo (Verde Bosque / Salvia)
  const theme = {
    bg: '#0F1D10',
    surface: '#162918',
    border: 'rgba(72, 125, 75, 0.2)',
    accent: '#487D4B',
    accentHover: '#5C9A60',
    textMain: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.5)'
  };

  // Función de carga de datos (separada para poder recargar la pantalla)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: accs }, 
        { data: invs }, 
        { data: projs },
        { data: trans }
      ] = await Promise.all([
        supabase.from('Finanzas_accounts').select('*'),
        supabase.from('Finanzas_investments').select('*'),
        supabase.from('Finanzas_projects').select('*'),
        supabase.from('Finanzas_transactions').select('*').order('date', { ascending: false }).limit(5)
      ]);

      if (accs) setAccounts(accs);
      if (invs) setInvestments(invs);
      if (projs) setProjects(projs);
      if (trans) setTransactions(trans);
    } catch (error) {
      console.error("Error cargando finanzas:", error);
    } finally {
      setLoading(false);
    }
  };

  // FETCH INICIAL DE DATOS
  useEffect(() => {
    fetchData();
  }, []);

  // Función para guardar la cuenta en Supabase
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Verificar si el usuario está logueado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("¡Atención! Por la seguridad RLS, necesitas estar logueado para crear datos. Como aún no tenemos pantalla de Login, crea un usuario en el panel de Supabase e inicia sesión.");
        setIsSubmitting(false);
        return;
      }

      // 2. Determinar si es deuda según el tipo elegido
      const isDebt = newAccount.type === 'Tarjeta de Crédito';

      // 3. Insertar en la base de datos
      const { error } = await supabase
        .from('Finanzas_accounts')
        .insert([
          {
            user_id: user.id,
            name: newAccount.name,
            type: newAccount.type,
            currency: newAccount.currency,
            balance: Number(newAccount.balance) || 0,
            is_debt: isDebt
          }
        ]);

      if (error) throw error;

      // 4. Limpiar formulario, cerrar modal y recargar los datos
      setNewAccount({ name: '', type: 'Banco', currency: 'NZD', balance: '' });
      setIsAccountModalOpen(false);
      await fetchData();

    } catch (error: any) {
      console.error("Error al crear la cuenta:", error.message);
      alert("Hubo un error al guardar la cuenta: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos dinámicos
  const netWorth = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
  const totalInvested = investments.reduce((acc, curr) => acc + (Number(curr.holdings) * Number(curr.avg_buy_price)), 0);

  if (loading && accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bg }}>
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: theme.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans selection:bg-[#487D4B] selection:text-white relative" style={{ backgroundColor: theme.bg, color: theme.textMain }}>
      
      {/* SIDEBAR */}
      <nav 
        className="w-full md:w-64 flex flex-row md:flex-col justify-between md:justify-start border-b md:border-b-0 md:border-r p-4 md:p-6 z-20 shrink-0 overflow-x-auto hide-scrollbar"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center gap-4 mb-0 md:mb-12 shrink-0">
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-serif tracking-tight">Finanzas</h1>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: theme.accent }}>Liquidez & Capital</p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 md:gap-4 ml-8 md:ml-0 shrink-0">
          <NavItem icon={LayoutDashboard} label="Resumen" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} theme={theme} />
          <NavItem icon={Wallet} label="Cuentas" isActive={activeTab === 'billeteras'} onClick={() => setActiveTab('billeteras')} theme={theme} />
          <NavItem icon={LineChart} label="Radar Cripto" isActive={activeTab === 'inversiones'} onClick={() => setActiveTab('inversiones')} theme={theme} />
          <NavItem icon={FolderKanban} label="Proyectos" isActive={activeTab === 'proyectos'} onClick={() => setActiveTab('proyectos')} theme={theme} />
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar pb-32 md:pb-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] mb-2 font-medium" style={{ color: theme.textMuted }}>
              {activeTab === 'dashboard' ? 'Patrimonio Neto Total' : 
               activeTab === 'billeteras' ? 'Liquidez Disponible' : 
               activeTab === 'inversiones' ? 'Capital Invertido' : 'Presupuesto Asignado'}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-6xl font-light font-mono tracking-tighter">
                {activeTab === 'dashboard' ? netWorth.toLocaleString() : 
                 activeTab === 'billeteras' ? netWorth.toLocaleString() : 
                 activeTab === 'inversiones' ? totalInvested.toLocaleString() : '1,200'}
              </span>
              <span className="text-xl font-mono" style={{ color: theme.accent }}>
                {activeTab === 'inversiones' ? '.00 USD' : '.00 NZD'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (activeTab === 'billeteras') setIsAccountModalOpen(true);
              // Próximamente abriremos los otros modales
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-transform hover:scale-105 active:scale-95 text-sm" 
            style={{ backgroundColor: theme.accent, color: '#FFF' }}
          >
            <Plus size={18} />
            <span>
              {activeTab === 'proyectos' ? 'Nuevo Proyecto' : 
               activeTab === 'inversiones' ? 'Registrar Compra' : 
               activeTab === 'billeteras' ? 'Agregar Cuenta' : 'Registrar Movimiento'}
            </span>
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl border flex flex-col gap-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                  <div className="flex items-center gap-2" style={{ color: theme.textMuted }}>
                    <ArrowDownRight size={16} className="text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider">Ingresos (30d)</span>
                  </div>
                  <span className="text-2xl font-mono text-emerald-400">+ $7,200.00</span>
                </div>
                <div className="p-6 rounded-2xl border flex flex-col gap-4" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                  <div className="flex items-center gap-2" style={{ color: theme.textMuted }}>
                    <ArrowUpRight size={16} className="text-rose-400" />
                    <span className="text-xs uppercase tracking-wider">Gastos (30d)</span>
                  </div>
                  <span className="text-2xl font-mono text-rose-400">- $3,140.50</span>
                </div>
              </div>

              <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: theme.border }}>
                  <h3 className="text-sm font-medium tracking-wide">Últimos Movimientos</h3>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: theme.border, color: theme.textMuted }}>
                        <th className="p-4 font-normal text-xs uppercase tracking-widest">Concepto</th>
                        <th className="p-4 font-normal text-xs uppercase tracking-widest text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? transactions.map(t => (
                        <TransactionRow key={t.id} date={new Date(t.date).toLocaleDateString()} title={t.description} type={t.type === 'income' ? 'in' : 'out'} amount={t.amount} theme={theme} />
                      )) : (
                        <tr><td colSpan={2} className="p-10 text-center text-xs" style={{ color: theme.textMuted }}>Sin movimientos registrados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl border relative overflow-hidden group" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={18} className="text-rose-400" />
                  <h3 className="text-sm font-medium tracking-wide">Burn Rate Actual</h3>
                </div>
                <p className="text-3xl font-mono tracking-tight mb-2">$104.68 <span className="text-sm font-sans" style={{ color: theme.textMuted }}>/ día</span></p>
              </div>

              <div className="p-6 rounded-2xl border flex flex-col gap-5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <h3 className="text-sm font-medium tracking-wide flex items-center gap-2">
                  <FolderKanban size={16} style={{ color: theme.accent }} />
                  Runway de Proyectos
                </h3>
                {projects.map(p => (
                   <ProjectItem key={p.id} name={p.name} cost={p.monthly_burn} runway={p.monthly_burn > 0 ? `${(p.allocated_budget / p.monthly_burn).toFixed(0)} meses` : 'Infinito'} theme={theme} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billeteras' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {accounts.map(acc => (
              <AccountCard key={acc.id} title={acc.name} type={acc.type} amount={acc.balance} currency={acc.currency} icon={Building2} isDebt={acc.is_debt} theme={theme} />
            ))}
            {accounts.length === 0 && <p className="col-span-full text-center p-20" style={{ color: theme.textMuted }}>No has agregado cuentas todavía. Haz clic en "Agregar Cuenta".</p>}
          </div>
        )}

        {activeTab === 'inversiones' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: theme.border, color: theme.textMuted }}>
                      <th className="p-4 font-normal text-xs uppercase tracking-widest">Activo</th>
                      <th className="p-4 font-normal text-xs uppercase tracking-widest text-right">Tenencia</th>
                      <th className="p-4 font-normal text-xs uppercase tracking-widest text-right">Valor Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map(inv => (
                      <AssetRow key={inv.id} name={inv.asset_name} symbol={inv.symbol} amount={inv.holdings} value={inv.avg_buy_price} change="+0.0%" isPositive theme={theme} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {projects.map(p => (
              <ProjectDetailCard key={p.id} name={p.name} status={p.status} allocated={`${p.allocated_budget} NZD`} monthlyBurn={`${p.monthly_burn} NZD`} runway={p.monthly_burn > 0 ? `${(p.allocated_budget / p.monthly_burn).toFixed(0)} meses` : 'Infinito'} techStack={p.tech_stack} theme={theme} />
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE NUEVA CUENTA */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-serif">Agregar Cuenta</h2>
              <button 
                onClick={() => setIsAccountModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                style={{ color: theme.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-medium" style={{ color: theme.textMuted }}>Nombre de la cuenta</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Banco Santander, Binance"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border outline-none focus:border-[#487D4B] transition-colors"
                  style={{ borderColor: theme.border, color: theme.textMain }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest font-medium" style={{ color: theme.textMuted }}>Tipo</label>
                  <select 
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-transparent border outline-none appearance-none"
                    style={{ borderColor: theme.border, color: theme.textMain }}
                  >
                    <option value="Banco" className="bg-[#162918]">Banco</option>
                    <option value="Efectivo" className="bg-[#162918]">Efectivo</option>
                    <option value="Exchange Cripto" className="bg-[#162918]">Exchange Cripto</option>
                    <option value="Tarjeta de Crédito" className="bg-[#162918]">Tarjeta de Crédito</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase tracking-widest font-medium" style={{ color: theme.textMuted }}>Moneda</label>
                  <select 
                    value={newAccount.currency}
                    onChange={(e) => setNewAccount({...newAccount, currency: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-transparent border outline-none appearance-none"
                    style={{ borderColor: theme.border, color: theme.textMain }}
                  >
                    <option value="NZD" className="bg-[#162918]">NZD</option>
                    <option value="USD" className="bg-[#162918]">USD</option>
                    <option value="ARS" className="bg-[#162918]">ARS</option>
                    <option value="EUR" className="bg-[#162918]">EUR</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest font-medium" style={{ color: theme.textMuted }}>Saldo Actual</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border outline-none focus:border-[#487D4B] transition-colors font-mono"
                  style={{ borderColor: theme.border, color: theme.textMain }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 mt-2 rounded-xl font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                style={{ backgroundColor: theme.accent, color: '#FFF', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cuenta'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// COMPONENTES AUXILIARES INTACTOS
function NavItem({ icon: Icon, label, isActive, onClick, theme }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`} style={{ color: isActive ? '#FFF' : theme.textMuted }}>
      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} style={{ color: isActive ? theme.accent : 'inherit' }} />
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </button>
  );
}

function TransactionRow({ date, title, type, amount, theme }: any) {
  const isIncome = type === 'in';
  return (
    <tr className="border-b transition-colors hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
      <td className="p-4 text-xs font-mono" style={{ color: theme.textMuted }}>{date}</td>
      <td className="p-4 text-sm">{title}</td>
      <td className={`p-4 text-right font-mono text-sm ${isIncome ? 'text-emerald-400' : ''}`}>
        {isIncome ? '+' : '-'} {amount}
      </td>
    </tr>
  );
}

function ProjectItem({ name, cost, runway, theme }: any) {
  return (
    <div className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs font-mono" style={{ color: theme.textMuted }}>${cost}/mo</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-emerald-500">Runway: {runway}</span>
    </div>
  );
}

function AccountCard({ title, type, amount, currency, icon: Icon, isDebt, theme }: any) {
  return (
    <div className="p-6 rounded-2xl border flex flex-col justify-between h-40 transition-transform hover:-translate-y-1" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium mb-1">{title}</h3>
          <p className="text-xs uppercase tracking-wider" style={{ color: theme.textMuted }}>{type}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.accent }}>
          <Icon size={20} />
        </div>
      </div>
      <div className={`text-3xl font-mono ${isDebt ? 'text-rose-400' : ''}`}>
        <span className="text-sm mr-1">{currency}</span>
        ${amount.toLocaleString()}
      </div>
    </div>
  );
}

function AssetRow({ name, symbol, amount, value, change, isPositive, theme }: any) {
  return (
    <tr className="border-b transition-colors hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border" style={{ borderColor: theme.border }}>
            <Activity size={14} style={{ color: theme.accent }} />
          </div>
          <div><p className="text-sm font-medium">{name}</p><p className="text-xs font-mono mt-0.5" style={{ color: theme.textMuted }}>{symbol}</p></div>
        </div>
      </td>
      <td className="p-4 text-right font-mono text-sm">{amount}</td>
      <td className="p-4 text-right font-mono text-sm">${value}</td>
      <td className={`p-4 text-right font-mono text-sm flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <TrendingUp size={14} /> {change}
      </td>
    </tr>
  );
}

function ProjectDetailCard({ name, status, allocated, monthlyBurn, runway, techStack, theme }: any) {
  return (
    <div className="p-6 rounded-2xl border flex flex-col gap-6" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
      <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div><h3 className="text-lg font-medium">{name}</h3><p className="text-xs mt-1" style={{ color: theme.textMuted }}>Stack: {techStack}</p></div>
        <span className="px-3 py-1 text-[10px] uppercase tracking-widest rounded-full border" style={{ borderColor: theme.accent, color: theme.accent, backgroundColor: 'rgba(72, 125, 75, 0.1)' }}>{status}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Fondo Asignado</p><p className="text-lg font-mono">{allocated}</p></div>
        <div><p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Burn Mensual</p><p className="text-lg font-mono text-rose-300">{monthlyBurn}</p></div>
      </div>
      <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: theme.textMuted }}>Runway Proyectado</p>
        <div className="flex items-center justify-between"><span className="text-xl font-mono text-emerald-400">{runway}</span></div>
      </div>
    </div>
  );
}