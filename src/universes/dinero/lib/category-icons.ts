import type { LucideIcon } from 'lucide-react';
import {
  Home,
  ShoppingCart,
  Coffee,
  Car,
  Zap,
  Film,
  Heart,
  ShoppingBag,
  BookOpen,
  Plane,
  TrendingUp,
  Wallet,
  Briefcase,
  Gift,
  PiggyBank,
  Fuel,
  Utensils,
  Smartphone,
  Wifi,
  Dumbbell,
  Music,
  Gamepad2,
  Baby,
  PawPrint,
  Stethoscope,
  Pill,
  Plug,
  Droplets,
  Shirt,
  Scissors,
  GraduationCap,
  CreditCard,
  Banknote,
  Bitcoin,
  Building2,
  Bus,
  Train,
  Hotel,
  Camera,
  Tv,
  Users,
  HandHeart,
  Sparkles,
  Cigarette,
  Wine,
  Pizza,
  Package,
  Tag,
} from 'lucide-react';

export interface CategoryIconDef {
  icon: LucideIcon;
  color: string;
}

/**
 * Fixed Lucide icon mapping by canonical English category name.
 * Keys are normalised (lowercased + stripped) — do not edit keys without updating resolveCategoryIcon.
 */
const EXACT_MATCH: Record<string, CategoryIconDef> = {
  // Core finance categories
  'housing & utilities': { icon: Home, color: '#60A5FA' },
  'housing': { icon: Home, color: '#60A5FA' },
  'rent': { icon: Building2, color: '#60A5FA' },
  'mortgage': { icon: Building2, color: '#60A5FA' },
  'utilities': { icon: Plug, color: '#FBBF24' },
  'electricity': { icon: Zap, color: '#FBBF24' },
  'water': { icon: Droplets, color: '#38BDF8' },
  'internet': { icon: Wifi, color: '#818CF8' },
  'phone': { icon: Smartphone, color: '#A78BFA' },

  // Food
  'groceries & supermarket': { icon: ShoppingCart, color: '#34D399' },
  'groceries': { icon: ShoppingCart, color: '#34D399' },
  'supermarket': { icon: ShoppingCart, color: '#34D399' },
  'dining out': { icon: Utensils, color: '#F97316' },
  'restaurants': { icon: Utensils, color: '#F97316' },
  'coffee': { icon: Coffee, color: '#B45309' },
  'pizza': { icon: Pizza, color: '#EF4444' },
  'alcohol': { icon: Wine, color: '#BE185D' },

  // Transportation
  'transportation': { icon: Car, color: '#06B6D4' },
  'transport': { icon: Car, color: '#06B6D4' },
  'fuel': { icon: Fuel, color: '#F59E0B' },
  'gas': { icon: Fuel, color: '#F59E0B' },
  'public transport': { icon: Bus, color: '#06B6D4' },
  'train': { icon: Train, color: '#06B6D4' },

  // Bills
  'bills & fees': { icon: Zap, color: '#FBBF24' },
  'bills': { icon: Zap, color: '#FBBF24' },
  'fees': { icon: CreditCard, color: '#F472B6' },
  'taxes': { icon: Banknote, color: '#64748B' },

  // Entertainment
  'entertainment & subscriptions': { icon: Film, color: '#C084FC' },
  'entertainment': { icon: Film, color: '#C084FC' },
  'subscriptions': { icon: Tv, color: '#C084FC' },
  'music': { icon: Music, color: '#EC4899' },
  'streaming': { icon: Tv, color: '#C084FC' },
  'games': { icon: Gamepad2, color: '#22D3EE' },
  'gaming': { icon: Gamepad2, color: '#22D3EE' },

  // Health
  'health & fitness': { icon: Heart, color: '#F43F5E' },
  'health': { icon: Stethoscope, color: '#F43F5E' },
  'fitness': { icon: Dumbbell, color: '#22D3EE' },
  'gym': { icon: Dumbbell, color: '#22D3EE' },
  'medical': { icon: Stethoscope, color: '#F43F5E' },
  'pharmacy': { icon: Pill, color: '#F43F5E' },

  // Shopping
  'shopping & clothes': { icon: ShoppingBag, color: '#F472B6' },
  'shopping': { icon: ShoppingBag, color: '#F472B6' },
  'clothes': { icon: Shirt, color: '#F472B6' },
  'clothing': { icon: Shirt, color: '#F472B6' },
  'personal care': { icon: Scissors, color: '#F472B6' },

  // Education
  'education': { icon: BookOpen, color: '#8B5CF6' },
  'books': { icon: BookOpen, color: '#8B5CF6' },
  'courses': { icon: GraduationCap, color: '#8B5CF6' },

  // Travel
  'travel & flights': { icon: Plane, color: '#22D3EE' },
  'travel': { icon: Plane, color: '#22D3EE' },
  'flights': { icon: Plane, color: '#22D3EE' },
  'trips': { icon: Plane, color: '#22D3EE' },
  'hotel': { icon: Hotel, color: '#22D3EE' },
  'vacation': { icon: Plane, color: '#22D3EE' },

  // Investments / savings
  'investments & savings': { icon: TrendingUp, color: '#10B981' },
  'investments': { icon: TrendingUp, color: '#10B981' },
  'savings': { icon: PiggyBank, color: '#10B981' },
  'crypto': { icon: Bitcoin, color: '#F59E0B' },

  // People
  'family': { icon: Users, color: '#FB7185' },
  'kids': { icon: Baby, color: '#FB7185' },
  'pets': { icon: PawPrint, color: '#A78BFA' },
  'gifts': { icon: Gift, color: '#EC4899' },
  'donations': { icon: HandHeart, color: '#EC4899' },

  // Income / work
  'salary': { icon: Briefcase, color: '#10B981' },
  'income': { icon: Banknote, color: '#10B981' },
  'freelance': { icon: Briefcase, color: '#10B981' },
  'work': { icon: Briefcase, color: '#64748B' },

  // Other
  'beauty': { icon: Sparkles, color: '#F472B6' },
  'photography': { icon: Camera, color: '#A78BFA' },
  'tobacco': { icon: Cigarette, color: '#78716C' },
  'general': { icon: Wallet, color: '#A1A1AA' },
  'other': { icon: Package, color: '#A1A1AA' },
  'uncategorized': { icon: Tag, color: '#A1A1AA' },
};

/**
 * Keyword → icon fallback. Ordered: first match wins, so put more specific keywords first.
 */
const KEYWORD_FALLBACK: Array<{ keywords: string[]; def: CategoryIconDef }> = [
  { keywords: ['rent', 'alquiler', 'renta', 'hipoteca', 'mortgage'], def: { icon: Building2, color: '#60A5FA' } },
  { keywords: ['casa', 'home', 'house', 'hogar', 'vivienda'], def: { icon: Home, color: '#60A5FA' } },
  { keywords: ['luz', 'electric', 'gas bill', 'utility', 'servicio'], def: { icon: Zap, color: '#FBBF24' } },
  { keywords: ['agua', 'water'], def: { icon: Droplets, color: '#38BDF8' } },
  { keywords: ['internet', 'wifi', 'fibra'], def: { icon: Wifi, color: '#818CF8' } },
  { keywords: ['phone', 'celular', 'movil', 'telefono', 'smartphone'], def: { icon: Smartphone, color: '#A78BFA' } },
  { keywords: ['super', 'mercado', 'grocer', 'almacen'], def: { icon: ShoppingCart, color: '#34D399' } },
  { keywords: ['coffee', 'cafe', 'starbucks'], def: { icon: Coffee, color: '#B45309' } },
  { keywords: ['pizza'], def: { icon: Pizza, color: '#EF4444' } },
  { keywords: ['wine', 'vino', 'alcohol', 'cerveza', 'beer'], def: { icon: Wine, color: '#BE185D' } },
  { keywords: ['restaurant', 'dining', 'comida', 'food', 'delivery'], def: { icon: Utensils, color: '#F97316' } },
  { keywords: ['fuel', 'gasolina', 'nafta', 'combustible'], def: { icon: Fuel, color: '#F59E0B' } },
  { keywords: ['bus', 'colectivo'], def: { icon: Bus, color: '#06B6D4' } },
  { keywords: ['train', 'tren', 'metro', 'subway'], def: { icon: Train, color: '#06B6D4' } },
  { keywords: ['uber', 'taxi', 'lyft', 'cabify', 'auto', 'car', 'transport'], def: { icon: Car, color: '#06B6D4' } },
  { keywords: ['fly', 'flight', 'vuelo', 'avion', 'plane', 'airline'], def: { icon: Plane, color: '#22D3EE' } },
  { keywords: ['hotel', 'airbnb', 'hostel'], def: { icon: Hotel, color: '#22D3EE' } },
  { keywords: ['travel', 'viaje', 'trip', 'vacation', 'vacaciones'], def: { icon: Plane, color: '#22D3EE' } },
  { keywords: ['music', 'spotify', 'musica'], def: { icon: Music, color: '#EC4899' } },
  { keywords: ['netflix', 'hbo', 'prime', 'disney', 'streaming', 'tv'], def: { icon: Tv, color: '#C084FC' } },
  { keywords: ['game', 'gaming', 'steam', 'playstation', 'xbox', 'nintendo'], def: { icon: Gamepad2, color: '#22D3EE' } },
  { keywords: ['movie', 'cine', 'cinema', 'film', 'entertain'], def: { icon: Film, color: '#C084FC' } },
  { keywords: ['subscription', 'subscrip', 'saas'], def: { icon: Tv, color: '#C084FC' } },
  { keywords: ['gym', 'fitness', 'workout'], def: { icon: Dumbbell, color: '#22D3EE' } },
  { keywords: ['pharma', 'farmacia', 'drug', 'pill', 'medicina'], def: { icon: Pill, color: '#F43F5E' } },
  { keywords: ['doctor', 'medical', 'health', 'salud', 'hospital', 'clinic'], def: { icon: Stethoscope, color: '#F43F5E' } },
  { keywords: ['clothes', 'clothing', 'ropa', 'shirt', 'zapato', 'zapatilla'], def: { icon: Shirt, color: '#F472B6' } },
  { keywords: ['salon', 'peluqueria', 'haircut', 'beauty'], def: { icon: Scissors, color: '#F472B6' } },
  { keywords: ['shopping', 'compra', 'store', 'tienda'], def: { icon: ShoppingBag, color: '#F472B6' } },
  { keywords: ['book', 'libro', 'amazon kindle'], def: { icon: BookOpen, color: '#8B5CF6' } },
  { keywords: ['course', 'curso', 'udemy', 'school', 'college', 'universidad', 'education', 'class'], def: { icon: GraduationCap, color: '#8B5CF6' } },
  { keywords: ['crypto', 'bitcoin', 'btc', 'eth', 'ethereum'], def: { icon: Bitcoin, color: '#F59E0B' } },
  { keywords: ['save', 'saving', 'ahorro'], def: { icon: PiggyBank, color: '#10B981' } },
  { keywords: ['invest', 'stock', 'bond', 'inversion', 'portfolio'], def: { icon: TrendingUp, color: '#10B981' } },
  { keywords: ['salary', 'sueldo', 'salario', 'paycheck'], def: { icon: Briefcase, color: '#10B981' } },
  { keywords: ['income', 'ingreso', 'revenue'], def: { icon: Banknote, color: '#10B981' } },
  { keywords: ['work', 'trabajo', 'office', 'freelance'], def: { icon: Briefcase, color: '#64748B' } },
  { keywords: ['kid', 'baby', 'hijo', 'niño', 'nino'], def: { icon: Baby, color: '#FB7185' } },
  { keywords: ['pet', 'mascota', 'dog', 'cat', 'perro', 'gato'], def: { icon: PawPrint, color: '#A78BFA' } },
  { keywords: ['gift', 'regalo'], def: { icon: Gift, color: '#EC4899' } },
  { keywords: ['donation', 'donacion', 'charity'], def: { icon: HandHeart, color: '#EC4899' } },
  { keywords: ['family', 'familia'], def: { icon: Users, color: '#FB7185' } },
  { keywords: ['tax', 'impuesto', 'afip'], def: { icon: Banknote, color: '#64748B' } },
  { keywords: ['fee', 'comision', 'bank', 'banco'], def: { icon: CreditCard, color: '#F472B6' } },
  { keywords: ['camera', 'photo'], def: { icon: Camera, color: '#A78BFA' } },
];

const DEFAULT_ICON: CategoryIconDef = { icon: Wallet, color: '#A1A1AA' };

function normalise(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 &]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve a category name (English or Spanish, any casing) to a Lucide icon + accent color.
 * Tries exact match, then keyword fallback, finally a neutral default.
 */
export function resolveCategoryIcon(name?: string | null): CategoryIconDef {
  if (!name) return DEFAULT_ICON;
  const key = normalise(name);
  if (EXACT_MATCH[key]) return EXACT_MATCH[key];
  for (const { keywords, def } of KEYWORD_FALLBACK) {
    if (keywords.some((k) => key.includes(k))) return def;
  }
  return DEFAULT_ICON;
}

/**
 * Canonical ordered list of category names for pickers / "new category" forms.
 */
export const CANONICAL_CATEGORIES: string[] = [
  'Housing & Utilities',
  'Groceries & Supermarket',
  'Dining out',
  'Transportation',
  'Bills & Fees',
  'Entertainment & Subscriptions',
  'Health & Fitness',
  'Shopping & Clothes',
  'Education',
  'Travel & Flights',
  'Investments & Savings',
  'Gifts',
  'Family',
  'Pets',
  'Salary',
  'Freelance',
  'General',
];
