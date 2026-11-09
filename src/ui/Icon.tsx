// Central icon registry: game data refers to icons by name; only these icons are bundled.
import {
  Award, BarChart3, Bed, Bell, Bolt, BookOpen, Briefcase, Building2, Calendar, Camera, Check, ChefHat, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, Circle, Code2, Coffee, Coins, Compass, Crown, Download, Eye, File, Flag, Flame, Flower2, Gem, Globe,
  GraduationCap, Heart, Home, Image, Info, KanbanSquare, LayoutTemplate, Leaf, List, Lock, Map, MapPin, Megaphone, Menu, Monitor,
  Newspaper, Palette, PanelBottom, Plus, MousePointerClick, Rocket, RotateCcw, Search, Server, Settings, Shirt, ShoppingCart,
  Smartphone, Sparkles, Star, Store, Sun, Target, Trash2, TrendingUp, Trophy, Upload, User, UserMinus, UserPlus, Users, Utensils,
  Wallet, Waves, X, Zap, AlertTriangle, ArrowRight, ExternalLink, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  award: Award, chart: BarChart3, bed: Bed, bell: Bell, bolt: Bolt, book: BookOpen, briefcase: Briefcase, building: Building2,
  calendar: Calendar, camera: Camera, check: Check, chef: ChefHat, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight, 'chevron-up': ChevronUp, circle: Circle, code: Code2, coffee: Coffee, coins: Coins, compass: Compass,
  crown: Crown, download: Download, eye: Eye, file: File, flag: Flag, flame: Flame, flower: Flower2, gem: Gem, globe: Globe,
  graduation: GraduationCap, heart: Heart, home: Home, image: Image, info: Info, kanban: KanbanSquare, template: LayoutTemplate,
  leaf: Leaf, list: List, lock: Lock, map: MapPin, mapfold: Map, megaphone: Megaphone, menu: Menu, monitor: Monitor, newspaper: Newspaper,
  palette: Palette, footer: PanelBottom, plus: Plus, pointer: MousePointerClick, rocket: Rocket, reset: RotateCcw, search: Search,
  server: Server, settings: Settings, shirt: Shirt, cart: ShoppingCart, smartphone: Smartphone, sparkles: Sparkles, star: Star,
  store: Store, sun: Sun, target: Target, trash: Trash2, trending: TrendingUp, trophy: Trophy, upload: Upload, user: User,
  'user-minus': UserMinus, 'user-plus': UserPlus, users: Users, utensils: Utensils, wallet: Wallet, waves: Waves, x: X, zap: Zap,
  warning: AlertTriangle, arrow: ArrowRight, external: ExternalLink,
  // avatar aliases
  spark: Sparkles, code2: Code2,
};

export function Icon({ name, size = 18, className, strokeWidth = 1.75 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = ICONS[name] ?? Circle;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
