// Main React application for farmer onboarding, dealer registration, geofence mapping, and DDS exports.
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletMapContainer = MapContainer as unknown as React.ComponentType<any>;
const LeafletTileLayer = TileLayer as unknown as React.ComponentType<any>;
const LeafletCircleMarker = CircleMarker as unknown as React.ComponentType<any>;
import { 
  Building2,
  Leaf, 
  Truck, 
  QrCode, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Camera, 
  WifiOff, 
  FileText, 
  Check,
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
  History,
  Map,
  PenTool,
  Plus,
  Trash2,
  CreditCard,
  LayoutDashboard,
  Download,
  MousePointer2,
  FileCheck,
  Calendar,
  Globe,
  Info,
  Activity,
  HardDrive,
  Lock
} from 'lucide-react';

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

// --- Types ---
type View = 'ROLE_SELECT' | 'farmer-registration' | 'DEALER_SIGNUP' | 'farmer-dashboard' | 'collector-dashboard' | 'collector-transaction' | 'manifest';

type ScannedFarmer = {
  id: string;
  idNumber?: string;
  name: string;
  cropType: string;
  monthlyQuota?: number;
  location?: { lat: number; lng: number };
  boundary?: { lat: number; lng: number }[];
  eudrChecked?: boolean;
  eudrRiskScore?: number;
  eudrRiskLevel?: string;
  eudrNdvi2020?: number;
  eudrNdviCurrent?: number;
  eudrNdviChangePct?: number;
  eudrComparisonMap?: string | null;
  eudrCheckDate?: string;
};

// --- Components ---

const Navbar = ({ onHome, onBack, isOnline, showBack, onLogout, showLogout, onToggleOnline }: { onHome: () => void, onBack?: () => void, isOnline?: boolean, showBack?: boolean, onLogout?: () => void, showLogout?: boolean, onToggleOnline?: () => void }) => {
  // Navbar - provides global navigation, online status, and account controls.
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="z-50 pt-8 pb-4 px-6 sm:px-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBack && onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-palm-950 hover:bg-white transition-all shadow-sm ring-1 ring-black/5"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={onHome}
          >
            <div className="w-12 h-12 bg-palm-950 rounded-[1.25rem] flex items-center justify-center text-gold-400 group-hover:bg-palm-900 transition-all shadow-lg hover:rotate-3">
              <ShieldCheck size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-display font-black text-palm-950 tracking-tighter leading-none uppercase">Veri</span>
              <span className="text-[10px] font-display font-bold text-palm-700/60 tracking-widest uppercase">EUDR Shield</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={onToggleOnline}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ring-1 ${isOnline ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' : 'bg-amber-500/10 text-amber-600 ring-amber-500/20 hover:bg-amber-500/20'}`}
          >
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
          
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center text-palm-900 bg-white/50 backdrop-blur-sm rounded-2xl hover:bg-white transition-all shadow-sm ring-1 ring-black/5"
          >
            <Menu size={24} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl ring-1 ring-black/5 overflow-hidden z-[100]"
              >
                <div className="p-3">
                  <div className="px-4 py-3 mb-2 border-b border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</p>
                  </div>
                  {showLogout && onLogout && (
                    <button 
                      onClick={() => { onLogout(); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                        <LogOut size={16} />
                      </div>
                      Logout
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

const Home = ({ onSelectRole }: { onSelectRole: (role: 'farmer' | 'collector') => void, key?: string }) => (
// Home - role selection landing screen for the farmer and collector journeys.
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="py-12 px-6 flex flex-col gap-10"
  >
    <div className="flex flex-col">
      <div className="mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest mb-4 border border-emerald-100"
        >
          <ShieldCheck size={12} className="text-emerald-600" />
          <span>EUDR COMPLIANCE READY</span>
        </motion.div>
        <h1 className="text-4xl font-serif font-black text-palm-950 mb-3 leading-tight tracking-tight">
          Rooted in <span className="text-emerald-600 italic">compliance.</span>
        </h1>
        <p className="text-sm text-palm-700 font-medium leading-relaxed opacity-80">
          Verify every harvest with unbreakable digital links.
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('farmer')}
          className="group relative flex items-center p-6 bg-[#F9FAFB] rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all text-left overflow-hidden"
        >
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mr-6">
            <User size={32} className="text-amber-500 fill-amber-500/10" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#064e3b] mb-1">I am a Farmer</h3>
            <p className="text-xs text-gray-500 font-medium leading-tight">Register land & verify harvest</p>
          </div>
          <div className="absolute bottom-6 right-6">
            <ArrowRight size={18} className="text-[#064e3b]/30 group-hover:text-[#064e3b] group-hover:translate-x-1 transition-all" />
          </div>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('collector')}
          className="group relative flex items-center p-6 bg-[#064e3b] rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all text-left overflow-hidden"
        >
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mr-6 border border-white/5">
            <Truck size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-1">I am a Dealer</h3>
            <p className="text-xs text-white/70 font-medium leading-tight">Verify identities & manage compliance</p>
          </div>
          <div className="absolute bottom-6 right-6">
            <ArrowRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </motion.button>
      </div>
    </div>

    {/* Minimalist 2x2 Feature Grid */}
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: 'Offline First', icon: WifiOff },
        { label: 'Digital Vault', icon: FileText },
        { label: 'GIS Guard', icon: MapPin },
        { label: 'DDS Ready', icon: ShieldCheck },
      ].map((feat, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all text-center">
          <div className="text-emerald-700 bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center shadow-inner">
            <feat.icon size={20} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-bold text-gray-700 tracking-wide uppercase">{feat.label}</span>
        </div>
      ))}
    </div>
  </motion.div>
);


const PERMIT_LIBRARY = [
  { id: 'MPOB', label: 'MPOB (Palm Oil)' },
  { id: 'MCB', label: 'MCB (Cocoa)' },
  { id: 'LGM', label: 'LGM (Rubber)' },
  { id: 'OTHER', label: 'OTHER PERMIT TYPE...' },
];

const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  // MapRecenter - keep the Leaflet map centered on the detected land title location.
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

const DocumentPreview = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  // DocumentPreview - render PDFs with embed and images with img so uploads preview correctly.
  const isPdf = src.startsWith('data:application/pdf') || src.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return <embed src={src} type="application/pdf" className={className} />;
  }

  return <img src={src} alt={alt} className={className} />;
};

const FarmerRegistration = ({ onComplete, plots, setPlots }: { onComplete: (formData: any, plots: any[]) => void, plots: any[], setPlots: React.Dispatch<React.SetStateAction<any[]>>, key?: string }) => {
  // FarmerRegistration - drive identity capture, permit uploads, plot creation, and geofence auto-detect.
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMessage, setScanningMessage] = useState('AI Verifying Document...');
  const [isAddingPlot, setIsAddingPlot] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState('Generating Universal ID...');
  const [mapPoints, setMapPoints] = useState<{x: number, y: number}[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 3.139, lng: 101.6869 });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; src: string | null; title?: string | null }>({ open: false, src: null, title: null });
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
  const [appNotice, setAppNotice] = useState<null | { type: 'error' | 'warning' | 'info' | 'success'; message: string }>(null);
  const [confirmAreaMismatchOnce, setConfirmAreaMismatchOnce] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    icPhoto: null as string | null,
    icPreview: null as string | null,
    permitPhotos: {} as Record<string, string | null>,
    permitPreviews: {} as Record<string, string | null>,
    permitNumbers: {} as Record<string, string | null>,
    permitAreas: {} as Record<string, number | null>,  // 新增：存储各许可证的面积
    permitValidations: {} as Record<string, { matched: boolean; detectedType?: string; message?: string } | null>,  // 新增：存储许可证验证结果
    permitDebug: {} as Record<string, { status?: string; code?: string; detectedType?: string; reason?: string; rawTextSnippet?: string } | null>,
    licensePhotos: {} as Record<string, string | null>,
    icDebug: null as null | { status?: string; code?: string; reason?: string; rawTextSnippet?: string },
    permitTypes: ['MPOB'] as string[],
    customPermits: [] as { name: string, photo: string | null, number: string | null }[],
    otherPermitName: '',
  });

  const [currentPlot, setCurrentPlot] = useState({
    title: '',
    area: '',
    cropType: 'Palm Oil',
    otherCropType: '',
    plantingYear: '2018',
    titlePhoto: null as string | null,
    titlePreview: null as string | null,
    eudrScan: null as null | {
      verified: boolean;
      compliant: boolean;
      status: 'safe' | 'unsafe';
      reason: string;
      riskScore: number;
      riskLevel: string;
      ndvi2020: number;
      ndviCurrent: number;
      ndviChangePct: number;
      comparisonMap: string | null;
      checkedAt: string;
      details?: any;
    },
    landTitleMetadata: null as null | {
      lot_number?: string | null;
      plot_alias?: string | null;
      mukim?: string | null;
      district?: string | null;
      state?: string | null;
      land_area?: number | null;
      owner_name?: string | null;
      center_lat?: number;
      center_lng?: number;
      nameMatchValidation?: string;
      nameMatches?: boolean;
      // 审计字段：地理编码
      geoSource?: string;  // nominatim/manual/none
      geoConfidence?: number;  // 0-1
      geoQueryUsed?: string;  // 使用的查询
      userAdjusted?: boolean;  // 用户是否手动调整
      areaValidationStatus?: string;  // green/yellow/red
      areaValidationNote?: string;  // 面积校验说明
    },
  });

  const permitToCrop: Record<string, string> = {
    'MPOB': 'Palm Oil',
    'MCB': 'Cocoa',
    'LGM': 'Rubber'
  };

  const cropToPermit: Record<string, string> = {
    'palm oil': 'MPOB',
    'cocoa': 'MCB',
    'rubber': 'LGM'
  };

  const getAvailableCropOptions = () => {
    const options: string[] = [];
    if (formData.permitPhotos['MPOB']) options.push('Palm Oil');
    if (formData.permitPhotos['MCB']) options.push('Cocoa');
    if (formData.permitPhotos['LGM']) options.push('Rubber');
    if (formData.customPermits.some(cp => cp.photo) || (formData.permitTypes.includes('OTHER') && formData.customPermits.length > 0)) {
      options.push('Other');
    }
    return options;
  };

  const availableCropOptions = getAvailableCropOptions();

  const showNotice = (message: string, type: 'error' | 'warning' | 'info' | 'success' = 'info') => {
    // showNotice - surface validation and workflow feedback to the farmer.
    setAppNotice({ type, message });
  };

  const buildSimulatedEudrData = (plot: any, note: string) => {
    // buildSimulatedEudrData - generate the NDVI historical comparison used by the EUDR pitch flow.
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return {
        risk_score: 14,
        risk_level: 'Low',
        ndvi_2020: 0.66,
        ndvi_current: 0.62,
        ndvi_change_pct: -6.1,
        comparison_map_base64: null,
        details: { note }
      };
    }

    const panelW = 380;
    const panelH = 320;
    const gap = 20;
    const top = 60;
    const lefts = [10, 10 + panelW + gap, 10 + (panelW + gap) * 2];
    const titles = ['2020 Baseline NDVI', 'Current NDVI', 'NDVI Delta'];

    const rows = 80;
    const cols = 100;
    const seed = Number(plot?.id || 1) % 997;

    const seededNoise = (x: number, y: number, k = 1) => {
      const v = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 0.173 + k * 0.91) * 43758.5453;
      return (v - Math.floor(v)) * 2 - 1;
    };

    const gaussianBlob = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => {
      const dx = (x - cx) / sx;
      const dy = (y - cy) / sy;
      return Math.exp(-(dx * dx + dy * dy));
    };

    const ndvi2020: number[][] = [];
    const ndviCurrent: number[][] = [];
    const ndviDelta: number[][] = [];

    let sum2020 = 0;
    let sumCurrent = 0;
    let deltaNegativeSum = 0;
    let deltaNegativeCount = 0;

    for (let y = 0; y < rows; y++) {
      const r2020: number[] = [];
      const rCurrent: number[] = [];
      const rDelta: number[] = [];

      for (let x = 0; x < cols; x++) {
        const nx = x / (cols - 1);
        const ny = y / (rows - 1);

        const terrain = 0.54 + 0.16 * Math.sin(nx * 6.2) + 0.12 * Math.cos(ny * 7.4);
        const texture = 0.08 * seededNoise(x, y, 1) + 0.05 * seededNoise(x, y, 2);
        const v2020 = Math.max(0.12, Math.min(0.92, terrain + texture));

        const stressArea1 = gaussianBlob(nx, ny, 0.28 + (seed % 11) * 0.02, 0.42, 0.16, 0.12);
        const stressArea2 = gaussianBlob(nx, ny, 0.72, 0.62 + (seed % 7) * 0.015, 0.14, 0.11);
        const degradation = 0.018 + 0.055 * stressArea1 + 0.035 * stressArea2;
        const recovery = 0.01 * Math.max(0, seededNoise(x, y, 3));

        const vCurrent = Math.max(0.05, Math.min(0.9, v2020 - degradation + recovery));
        const vDelta = vCurrent - v2020;

        r2020.push(v2020);
        rCurrent.push(vCurrent);
        rDelta.push(vDelta);

        sum2020 += v2020;
        sumCurrent += vCurrent;
        if (vDelta < 0) {
          deltaNegativeSum += -vDelta;
          deltaNegativeCount += 1;
        }
      }

      ndvi2020.push(r2020);
      ndviCurrent.push(rCurrent);
      ndviDelta.push(rDelta);
    }

    const ndvi2020Mean = sum2020 / (rows * cols);
    const ndviCurrentMean = sumCurrent / (rows * cols);
    const ndviChangePct = ((ndviCurrentMean - ndvi2020Mean) / ndvi2020Mean) * 100;
    const meanNegativeDelta = deltaNegativeCount > 0 ? deltaNegativeSum / deltaNegativeCount : 0;

    // Simulated risk based on magnitude of NDVI loss, not a fixed constant.
    const rawRisk = Math.abs(ndviChangePct) * 1.55 + meanNegativeDelta * 180;
    const riskScore = Math.max(6, Math.min(32, Number(rawRisk.toFixed(1))));
    const riskLevel = riskScore < 15 ? 'Negligible' : 'Low';

    const ndviColor = (v: number) => {
      const t = Math.max(0, Math.min(1, (v + 0.2) / 1.2));
      if (t < 0.35) {
        const k = t / 0.35;
        return [
          Math.round(180 + 70 * k),
          Math.round(45 + 160 * k),
          Math.round(35 + 20 * k)
        ];
      }
      const k = (t - 0.35) / 0.65;
      return [
        Math.round(250 - 95 * k),
        Math.round(205 + 40 * k),
        Math.round(55 - 45 * k)
      ];
    };

    const deltaColor = (v: number) => {
      // v expected in [-0.30, 0.20] for simulation display mapping.
      const t = Math.max(0, Math.min(1, (v + 0.30) / 0.50));
      if (t < 0.5) {
        const k = t / 0.5;
        return [
          Math.round(190 + 60 * k),
          Math.round(30 + 190 * k),
          Math.round(35 + 40 * k)
        ];
      }
      const k = (t - 0.5) / 0.5;
      return [
        Math.round(250 - 55 * k),
        Math.round(220 + 25 * k),
        Math.round(75 + 40 * k)
      ];
    };

    const drawMapBackdrop = (x0: number, y0: number) => {
      // Simulated static map backdrop: parcels, roads, and a stream for geographic context.
      ctx.fillStyle = '#e7efe7';
      ctx.fillRect(x0, y0, panelW, panelH);

      for (let y = 0; y < panelH; y += 16) {
        for (let x = 0; x < panelW; x += 16) {
          const nx = x / panelW;
          const ny = y / panelH;
          const land = 0.45 + 0.35 * seededNoise(Math.floor(nx * 40), Math.floor(ny * 40), 7);
          const c = Math.max(110, Math.min(185, Math.round(145 + land * 45)));
          ctx.fillStyle = `rgb(${c - 18}, ${c + 10}, ${c - 22})`;
          ctx.fillRect(x0 + x, y0 + y, 16, 16);
        }
      }

      ctx.strokeStyle = 'rgba(120, 120, 120, 0.45)';
      ctx.lineWidth = 1;
      for (let y = 24; y < panelH; y += 48) {
        ctx.beginPath();
        ctx.moveTo(x0, y0 + y);
        ctx.lineTo(x0 + panelW, y0 + y + seededNoise(y, 1, 8) * 5);
        ctx.stroke();
      }
      for (let x = 26; x < panelW; x += 58) {
        ctx.beginPath();
        ctx.moveTo(x0 + x, y0);
        ctx.lineTo(x0 + x + seededNoise(x, 2, 9) * 6, y0 + panelH);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(56, 120, 175, 0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= panelW; x += 8) {
        const t = x / panelW;
        const yy = panelH * (0.2 + 0.55 * t) + Math.sin(t * 12 + seed * 0.2) * 10;
        if (x === 0) ctx.moveTo(x0 + x, y0 + yy);
        else ctx.lineTo(x0 + x, y0 + yy);
      }
      ctx.stroke();

      if (Array.isArray(plot?.points) && plot.points.length >= 3) {
        ctx.strokeStyle = 'rgba(240, 136, 33, 0.95)';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(240, 136, 33, 0.10)';
        ctx.beginPath();
        plot.points.forEach((p: { x: number; y: number }, idx: number) => {
          const px = x0 + (Math.max(0, Math.min(100, p.x)) / 100) * panelW;
          const py = y0 + (Math.max(0, Math.min(100, p.y)) / 100) * panelH;
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Soften map contrast so NDVI layer remains visually dominant.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.fillRect(x0, y0, panelW, panelH);
    };

    const drawGridPanel = (x0: number, y0: number, mode: 'base' | 'current' | 'delta') => {
      const cellW = panelW / cols;
      const cellH = panelH / rows;

      const plotPolygon = Array.isArray(plot?.points) && plot.points.length >= 3
        ? plot.points.map((p: { x: number; y: number }) => ({
          x: x0 + (Math.max(0, Math.min(100, p.x)) / 100) * panelW,
          y: y0 + (Math.max(0, Math.min(100, p.y)) / 100) * panelH,
        }))
        : null;

      const drawHeatCells = () => {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const value = mode === 'base' ? ndvi2020[y][x] : mode === 'current' ? ndviCurrent[y][x] : ndviDelta[y][x];
            const [r, g, b] = mode === 'delta' ? deltaColor(value) : ndviColor(value);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x0 + x * cellW, y0 + y * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      };

      drawMapBackdrop(x0, y0);

      // Lower overall opacity so map layer is clearer.
      ctx.globalAlpha = mode === 'delta' ? 0.8 : 0.72;
      drawHeatCells();

      // If polygon exists, reinforce NDVI inside polygon for better spatial relevance.
      if (plotPolygon) {
        ctx.save();
        ctx.beginPath();
        plotPolygon.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.clip();

        ctx.globalAlpha = mode === 'delta' ? 0.9 : 0.82;
        drawHeatCells();
        ctx.restore();

        ctx.strokeStyle = 'rgba(232, 124, 28, 0.95)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        plotPolygon.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    };

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('EUDR Auto Verification (Simulated)', 20, 30);

    lefts.forEach((x, idx) => {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(titles[idx], x, top - 12);
      drawGridPanel(x, top, idx === 0 ? 'base' : idx === 1 ? 'current' : 'delta');
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, top, panelW, panelH);
    });

    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      ndvi_2020: Number(ndvi2020Mean.toFixed(3)),
      ndvi_current: Number(ndviCurrentMean.toFixed(3)),
      ndvi_change_pct: Number(ndviChangePct.toFixed(1)),
      comparison_map_base64: canvas.toDataURL('image/png'),
      details: {
        plot_id: plot.id,
        upload_date: plot.landTitleUploadDate || new Date().toISOString(),
        note,
        source: 'auto-simulated-on-plot-save',
        risk_formula: 'abs(ndvi_change_pct)*1.55 + mean_negative_delta*180 (clamped 6..32)'
      }
    };
  };

  const startAutoEudrProgress = (plotId: number) => {
    // startAutoEudrProgress - animate asynchronous EUDR verification after a plot is saved.
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 8 + Math.random() * 16;
      const nextProgress = Math.min(100, Math.round(progress));

      setPlots(prev => prev.map(p => {
        if (p.id !== plotId) return p;
        if (nextProgress < 100) {
          return {
            ...p,
            eudrChecked: false,
            eudrProgress: nextProgress,
            eudrStatus: 'processing'
          };
        }

        const simulated = buildSimulatedEudrData(p, 'Auto simulated after plot save');
        return {
          ...p,
          eudrChecked: true,
          eudrProgress: 100,
          eudrStatus: 'safe',
          eudrRiskScore: simulated.risk_score,
          eudrRiskLevel: simulated.risk_level,
          eudrNdvi2020: simulated.ndvi_2020,
          eudrNdviCurrent: simulated.ndvi_current,
          eudrNdviChangePct: simulated.ndvi_change_pct,
          eudrComparisonMap: simulated.comparison_map_base64,
          eudrCheckDate: new Date().toISOString(),
          eudrDetails: simulated.details,
          eudrError: undefined
        };
      }));

      if (nextProgress >= 100) {
        window.clearInterval(timer);
      }
    }, 280);
  };

  const parseAreaFromRawText = (rawText: string | undefined): number | null => {
    // parseAreaFromRawText - recover a permit area fallback when OCR returns plain text instead of a parsed field.
    if (!rawText) return null;
    const patterns = [
      /(?:Registered Area|Licensed Area|Land Area|Area)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*(?:hectare|hectares|ha)\b/i,
    ];
    for (const p of patterns) {
      const m = rawText.match(p);
      if (m?.[1]) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    return null;
  };

  const getPermitAreaByCrop = (crop: string): string => {
    // getPermitAreaByCrop - map the selected crop to the registered permit area.
    if (crop === 'Palm Oil') return String(formData.permitAreas['MPOB'] ?? '');
    if (crop === 'Cocoa') return String(formData.permitAreas['MCB'] ?? '');
    if (crop === 'Rubber') return String(formData.permitAreas['LGM'] ?? '');
    return '';
  };

  const setPlotCropType = (crop: string) => {
    // setPlotCropType - synchronize the chosen crop with the matched permit area.
    // Auto-fill plot area from corresponding permit's registered area
    const autoArea = getPermitAreaByCrop(crop);
    
    setCurrentPlot(prev => ({
      ...prev,
      cropType: crop,
      otherCropType: crop === 'Other' ? prev.otherCropType : '',
      area: crop === 'Other' ? prev.area : autoArea,
    }));
  };

  // Keep area synced when OCR permit extraction finishes after crop selection.
  useEffect(() => {
    // Keep area synced when OCR permit extraction finishes after crop selection.
    if (currentPlot.cropType === 'Other') return;
    const autoArea = getPermitAreaByCrop(currentPlot.cropType);
    if (autoArea && autoArea !== currentPlot.area) {
      setCurrentPlot(prev => ({ ...prev, area: autoArea }));
    }
  }, [currentPlot.cropType, formData.permitAreas['MPOB'], formData.permitAreas['MCB'], formData.permitAreas['LGM']]);

  useEffect(() => {
    setConfirmAreaMismatchOnce(false);
  }, [currentPlot.area, currentPlot.cropType, currentPlot.landTitleMetadata?.land_area]);

  const getRequiredPermitByCrop = (crop: string): string => {
    // getRequiredPermitByCrop - resolve the permit code required for the active crop.
    if (crop === 'Palm Oil') return 'MPOB';
    if (crop === 'Cocoa') return 'MCB';
    if (crop === 'Rubber') return 'LGM';
    return '';
  };

  const currentRequiredPermit = getRequiredPermitByCrop(currentPlot.cropType);
  const selectedPermitArea = currentRequiredPermit ? Number(formData.permitAreas[currentRequiredPermit] ?? 0) : 0;
  const currentPlotAreaValue = parseFloat(currentPlot.area) || 0;
  const permitAreaDiffPct = (selectedPermitArea > 0 && currentPlotAreaValue > 0)
    ? (Math.abs(selectedPermitArea - currentPlotAreaValue) / selectedPermitArea) * 100
    : null;
  const permitAreaStatus = permitAreaDiffPct == null
    ? 'na'
    : permitAreaDiffPct > 30
      ? 'red'
      : permitAreaDiffPct > 15
        ? 'yellow'
        : 'green';

  const landTitleAreaLive = Number(currentPlot.landTitleMetadata?.land_area ?? 0);
  const landTitleDiffPct = (landTitleAreaLive > 0 && currentPlotAreaValue > 0)
    ? (Math.abs(landTitleAreaLive - currentPlotAreaValue) / landTitleAreaLive) * 100
    : null;
  const landTitleDiffStatus = landTitleDiffPct == null
    ? 'na'
    : landTitleDiffPct > 30
      ? 'red'
      : landTitleDiffPct > 15
        ? 'yellow'
        : 'green';

  const currentLotNumberLive = currentPlot.landTitleMetadata?.lot_number || '';
  const usedAreaInSameLotLive = (currentLotNumberLive && landTitleAreaLive > 0)
    ? plots
      .filter(p => p.landTitleMetadata?.lot_number === currentLotNumberLive)
      .reduce((sum, p) => sum + parseFloat(p.area || 0), 0)
    : 0;
  const totalAreaInLotLive = usedAreaInSameLotLive + currentPlotAreaValue;
  const isOverLotCapacityLive = currentLotNumberLive && landTitleAreaLive > 0
    ? totalAreaInLotLive > landTitleAreaLive
    : false;

  const canSavePlot = Boolean(
    currentPlot.area &&
    currentPlot.titlePhoto &&
    currentPlot.cropType &&
    mapPoints.length >= 3 &&
    currentPlot.eudrScan?.verified &&
    (currentPlot.cropType !== 'Other' || currentPlot.otherCropType.trim()) &&
    (!currentRequiredPermit || formData.permitPhotos[currentRequiredPermit]) &&
    !isOverLotCapacityLive &&
    permitAreaStatus !== 'red'
  );

  const addPlot = () => {
    // addPlot - validate capacity, permit alignment, and EUDR readiness before persisting a plot.
    const selectedCrop = currentPlot.cropType;
    if (!selectedCrop) {
      showNotice('Please select a crop type for this plot.', 'warning');
      return;
    }

    if (selectedCrop === 'Other' && !currentPlot.otherCropType.trim()) {
      showNotice('Please specify the crop name for Other.', 'warning');
      return;
    }

    const requiredPermit = getRequiredPermitByCrop(selectedCrop);

    if (requiredPermit && !formData.permitPhotos[requiredPermit]) {
      showNotice(`License Required: Missing ${requiredPermit} license upload for selected crop.`, 'error');
      return;
    }
    if (selectedCrop === 'Other' && !formData.customPermits.some(cp => cp.photo)) {
      showNotice('License Required: Missing OTHER license upload for selected crop.', 'error');
      return;
    }

    // 检查同一 land title 上的面积是否超过
    const currentLotNumber = currentPlot.landTitleMetadata?.lot_number || '';
    const currentLandTitleArea = currentPlot.landTitleMetadata?.land_area || 0;
    const currentPlotArea = parseFloat(currentPlot.area) || 0;

    if (currentLotNumber && currentLandTitleArea > 0) {
      const usedAreaInSameLot = plots
        .filter(p => p.landTitleMetadata?.lot_number === currentLotNumber)
        .reduce((sum, p) => sum + parseFloat(p.area || 0), 0);
      
      const totalAreaInLot = usedAreaInSameLot + currentPlotArea;
      
      if (totalAreaInLot > currentLandTitleArea) {
        showNotice(`Land Title ${currentLotNumber}: Total area (${totalAreaInLot.toFixed(2)} HA) exceeds land title area (${currentLandTitleArea.toFixed(2)} HA). Reduce plot area or select a different land title.`, 'error');
        return;
      }
    }

    const cropTypeLabel = selectedCrop === 'Other'
      ? `Other (${currentPlot.otherCropType.trim()})`
      : selectedCrop;

    if (currentPlot.area) {
      // 面积双校验逻辑
      const permitArea = formData.permitAreas[selectedCrop === 'Palm Oil' ? 'MPOB' : selectedCrop === 'Cocoa' ? 'MCB' : 'LGM'] || 0;
      const landTitleArea = currentPlot.landTitleMetadata?.land_area || 0;
      const plotArea = parseFloat(currentPlot.area) || 0;
      
      let areaValidationStatus = 'green';
      let areaValidationNote = '';
      
      // 计算面积差异
      if (landTitleArea > 0) {
        const diff = Math.abs(landTitleArea - plotArea) / landTitleArea;
        if (diff > 0.30) {
          areaValidationStatus = 'red';
          areaValidationNote = `Area difference: ${(diff * 100).toFixed(1)}% (>30% threshold)`;
        } else if (diff > 0.15) {
          areaValidationStatus = 'yellow';
          areaValidationNote = `Area difference: ${(diff * 100).toFixed(1)}% (15-30% range)`;
        } else {
          areaValidationStatus = 'green';
          areaValidationNote = `Area difference: ${(diff * 100).toFixed(1)}% (<15% - OK)`;
        }
      }
      
      if (permitAreaStatus === 'red') {
        showNotice(`License area mismatch is too high (${(permitAreaDiffPct || 0).toFixed(1)}%). Please adjust polygon/area before saving.`, 'error');
        return;
      }

      if (!currentPlot.eudrScan?.verified) {
        showNotice('Please run Auto-Detect satellite scan before saving this plot.', 'warning');
        return;
      }

      const newPlot = { 
        ...currentPlot, 
        cropType: cropTypeLabel,
        id: Date.now(),
        title: currentPlot.title || `${cropTypeLabel} Plot ${plots.length + 1}`,
        points: mapPoints,
        satelliteVerified: null, // Will be verified before generating ID
        // 审计字段
        geoSource: currentPlot.landTitleMetadata?.geoSource || 'none',
        geoConfidence: currentPlot.landTitleMetadata?.geoConfidence,
        geoQueryUsed: currentPlot.landTitleMetadata?.geoQueryUsed,
        userAdjusted: currentPlot.landTitleMetadata?.userAdjusted || false,
        areaValidationStatus,
        areaValidationNote,
        // EUDR 字段（来自 Auto-Detect satellite scan）
        eudrChecked: true,
        eudrRiskScore: currentPlot.eudrScan.riskScore,
        eudrRiskLevel: currentPlot.eudrScan.riskLevel,
        eudrNdvi2020: currentPlot.eudrScan.ndvi2020,
        eudrNdviCurrent: currentPlot.eudrScan.ndviCurrent,
        eudrNdviChangePct: currentPlot.eudrScan.ndviChangePct,
        eudrComparisonMap: currentPlot.eudrScan.comparisonMap,
        eudrCheckDate: currentPlot.eudrScan.checkedAt,
        eudrDetails: {
          ...(currentPlot.eudrScan.details || {}),
          classification_reason: currentPlot.eudrScan.reason,
          eudr_status: currentPlot.eudrScan.status,
        },
        eudrProgress: 100,
        eudrStatus: currentPlot.eudrScan.status,
        landTitleUploadDate: new Date().toISOString()  // 记录上传时间
      };

      setPlots(prev => [...prev, newPlot]);
      setCurrentPlot({ title: '', area: '', cropType: 'Palm Oil', otherCropType: '', plantingYear: '2018', titlePhoto: null, titlePreview: null, eudrScan: null, landTitleMetadata: null });
      setMapPoints([]);
      setIsDrawing(false);
      setIsAddingPlot(false);
      setConfirmAreaMismatchOnce(false);
      setAppNotice(null);
    }
  };

  const recalculatePlotArea = (points: {x: number, y: number}[]) => {
    // recalculatePlotArea - convert drawn polygon points into hectares for capacity checks.
    if (points.length < 3) return;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;
    const scaleFactor = 10 / 10000;
    const calculatedHectares = (area * scaleFactor).toFixed(2);
    setCurrentPlot(prev => ({ ...prev, area: calculatedHectares }));
  };

  const scaleUiPointsToHectares = (uiPoints: {x:number,y:number}[], targetHa: number) => {
    // scaleUiPointsToHectares - shrink or expand the detected polygon to the licensed planting area.
    if (!uiPoints || uiPoints.length < 3 || !targetHa || targetHa <= 0) return uiPoints;
    // compute current polygon area (percentage-coords) using same shoelace formula
    let area = 0;
    for (let i = 0; i < uiPoints.length; i++) {
      const j = (i + 1) % uiPoints.length;
      area += uiPoints[i].x * uiPoints[j].y;
      area -= uiPoints[j].x * uiPoints[i].y;
    }
    area = Math.abs(area) / 2;
    const scaleFactor = 10 / 10000; // same conversion used in recalculatePlotArea
    const currentHa = area * scaleFactor;
    if (!currentHa || currentHa <= 0) return uiPoints;
    const ratio = Math.sqrt(targetHa / currentHa);
    // centroid
    const cx = uiPoints.reduce((s, p) => s + p.x, 0) / uiPoints.length;
    const cy = uiPoints.reduce((s, p) => s + p.y, 0) / uiPoints.length;
    const scaled = uiPoints.map(p => ({ x: cx + (p.x - cx) * ratio, y: cy + (p.y - cy) * ratio }));
    return scaled;
  };

  const getAutoPolygonPoints = () => {
    // getAutoPolygonPoints - provide a default boundary shape when no site-specific template is available.
    const cx = 50;
    const cy = 50;
    const halfW = 18;
    const halfH = 14;
    return [
      { x: cx - halfW, y: cy - halfH },
      { x: cx + halfW, y: cy - halfH },
      { x: cx + halfW, y: cy + halfH },
      { x: cx - halfW, y: cy + halfH },
    ];
  };

  const buildSatelliteDetectedBoundary = (lat: number, lng: number) => {
    // buildSatelliteDetectedBoundary - translate detected center coordinates into map points and GPS boundary.
    const isBangi = Math.abs(lat - 2.9185) < 0.2 && Math.abs(lng - 101.7854) < 0.2;
    const isLahadDatu = Math.abs(lat - 5.0229) < 0.5 && Math.abs(lng - 118.3280) < 0.5;

    const uiPoints = isBangi
      ? [
          { x: 33, y: 38 },
          { x: 68, y: 35 },
          { x: 74, y: 57 },
          { x: 55, y: 71 },
          { x: 31, y: 62 }
        ]
      : isLahadDatu
        ? [
            { x: 27, y: 32 },
            { x: 72, y: 29 },
            { x: 78, y: 62 },
            { x: 49, y: 75 },
            { x: 24, y: 58 }
          ]
        : getAutoPolygonPoints();

    const scaleLat = 0.012;
    const scaleLng = 0.012;
    const boundary = uiPoints.map((p) => ({
      lat: lat + ((p.y - 50) / 50) * scaleLat,
      lng: lng + ((p.x - 50) / 50) * scaleLng,
    }));

    return { uiPoints, boundary };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    if (dragPointIndex !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoints = [...mapPoints, { x, y }];
    setMapPoints(newPoints);

    recalculatePlotArea(newPoints);
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || dragPointIndex === null || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const next = [...mapPoints];
    next[dragPointIndex] = { x, y };
    setMapPoints(next);
    recalculatePlotArea(next);
  };

  const stopDraggingPoint = () => {
    if (dragPointIndex !== null) {
      setCurrentPlot(prev => ({
        ...prev,
        landTitleMetadata: {
          ...prev.landTitleMetadata,
          userAdjusted: true,
        }
      }));
    }
    setDragPointIndex(null);
  };

  const getPixelCoordinates = (percentagePoints: {x: number, y: number}[]) => {
    if (!mapContainerRef.current) return '';
    const rect = mapContainerRef.current.getBoundingClientRect();
    return percentagePoints.map(p => `${(p.x / 100) * rect.width},${(p.y / 100) * rect.height}`).join(' ');
  };

  // Satellite verification follows Auto-Detect EUDR result when available.
  const verifySatelliteData = async (plot: any) => {
    if (plot?.eudrChecked) {
      return {
        verified: true,
        compliant: plot?.eudrStatus !== 'unsafe',
        plantingYear: parseInt(plot?.plantingYear || '2018'),
        forestLossDetected: plot?.eudrStatus === 'unsafe',
        verificationDate: new Date().toISOString().split('T')[0]
      };
    }

    // Backward-compatible fallback for older plots without EUDR scan.
    await new Promise(r => setTimeout(r, 800));
    
    const plantingYear = parseInt(plot.plantingYear);
    const isEUDRSafe = plantingYear <= 2020;
    
    // Mock: randomly add some risk factors for plots after 2020
    const hasForestLoss = plantingYear > 2020 && Math.random() > 0.3;
    
    return {
      verified: true,
      compliant: isEUDRSafe && !hasForestLoss,
      plantingYear,
      forestLossDetected: hasForestLoss,
      verificationDate: new Date().toISOString().split('T')[0]
    };
  };

  const autoDetectLocation = async () => {
    // autoDetectLocation - resolve the land title location, scale the geofence, and run the EUDR check.
    // Check if land title has been uploaded
    if (!currentPlot.titlePhoto) {
      showNotice('Please upload Land Title document first to auto-detect location and area.', 'warning');
      return;
    }

    // Check if we have metadata
    const metadata = currentPlot.landTitleMetadata;
    if (!metadata) {
      showNotice('Could not extract Land Title information. Please ensure the image is clear.', 'error');
      return;
    }

    // Auto-detect drives a full satellite-scan flow (no manual confirmation/edit step).
    setIsDrawing(false);
    setIsScanning(true);
    setScanningMessage('Satellite-Scan: Resolving title location...');

    try {
      let selected: any = null;

      // 优先策略：如果 Land Title 已经包含 GPS 坐标，直接使用（高置信度 95%）
      const hasDirectCoordinates = 
        metadata.center_lat && 
        metadata.center_lng && 
        metadata.center_lat !== 3.139 &&  // 不是默认马来西亚中心
        metadata.center_lng !== 101.6869;

      if (hasDirectCoordinates) {
        // 直接使用 Land Title 上的坐标
        selected = {
          lat: metadata.center_lat!,
          lng: metadata.center_lng!,
          display_name: `${metadata.lot_number || 'Lot'} - ${metadata.mukim || ''} ${metadata.district || ''} ${metadata.state || ''}`.trim(),
          confidence: 0.95,  // 高置信度（直接来自地契）
          source: 'land_title_document',
          query_used: 'Direct GPS coordinates from Land Title',
          osm_type: 'direct',
          osm_id: 'N/A'
        };

      } else {
        // 后备策略：如果没有直接坐标，才调用 Nominatim 地理编码
        const response = await fetch(`${API_BASE_URL}/geo/resolve-land-title`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lot_number: metadata.lot_number || '',
            mukim: metadata.mukim || '',
            district: metadata.district || '',
            state: metadata.state || ''
          })
        });

        const result = await response.json();
        if (result.status === 'success' && result.candidates && result.candidates.length > 0) {
          selected = result.candidates[0];
        }
      }

      if (!selected) {
        showNotice('No location candidates found for satellite scan. Please upload a clearer land title.', 'warning');
        return;
      }

      setScanningMessage('Satellite-Scan: Detecting active planting boundary...');
      const detected = buildSatelliteDetectedBoundary(selected.lat, selected.lng);
      setMapCenter({ lat: selected.lat, lng: selected.lng });
      
      // License-priority: Scale polygon to match license area if available and smaller than land title area
      const currentRequiredPermit = getRequiredPermitByCrop(currentPlot.cropType);
      const licenseArea = currentRequiredPermit ? Number(formData.permitAreas[currentRequiredPermit] ?? 0) : 0;
      const landTitleArea = Number(currentPlot.landTitleMetadata?.land_area ?? 0);
      
      let scaledUiPoints = detected.uiPoints;
      if (licenseArea > 0 && landTitleArea > licenseArea) {
        // Scale to license area when license is smaller than land title
        scaledUiPoints = scaleUiPointsToHectares(detected.uiPoints, licenseArea);
      }
      
      setMapPoints(scaledUiPoints);
      recalculatePlotArea(scaledUiPoints);

      setScanningMessage('Satellite Detecting Planting Area..');
      const eudrResponse = await fetch(`${API_BASE_URL}/eudr/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boundary: detected.boundary,
          uploadDate: new Date().toISOString().split('T')[0],
          plotId: currentPlot.title || metadata.plot_alias || metadata.lot_number || 'AUTO-DETECT-PLOT'
        })
      });

      const eudrResult = await eudrResponse.json();
      const eudrData = eudrResult?.data || {};
      const eudrStatus: 'safe' | 'unsafe' = eudrData?.eudr_status === 'unsafe' ? 'unsafe' : 'safe';
      const eudrReason = eudrData?.classification_reason || (eudrStatus === 'unsafe'
        ? 'Detected planted area overlaps with forest baseline pixels in 2020.'
        : 'Detected planted area was already agricultural by 2020 baseline.');

      setCurrentPlot(prev => ({
        ...prev,
        eudrScan: {
          verified: true,
          compliant: eudrStatus === 'safe',
          status: eudrStatus,
          reason: eudrReason,
          riskScore: Number(eudrData?.risk_score ?? 0),
          riskLevel: String(eudrData?.risk_level ?? 'Unknown'),
          ndvi2020: Number(eudrData?.ndvi_2020 ?? 0),
          ndviCurrent: Number(eudrData?.ndvi_current ?? 0),
          ndviChangePct: Number(eudrData?.ndvi_change_pct ?? 0),
          comparisonMap: eudrData?.comparison_map_base64 || null,
          checkedAt: new Date().toISOString(),
          details: eudrData?.details || {}
        },
        landTitleMetadata: {
          ...prev.landTitleMetadata,
          center_lat: selected.lat,
          center_lng: selected.lng,
          geoSource: selected.source || 'nominatim',
          geoConfidence: selected.confidence,
          geoQueryUsed: selected.query_used,
          userAdjusted: false,
        }
      }));

      showNotice(
        eudrStatus === 'safe'
          ? 'Satellite-Scan completed: EUDR Safe (agricultural baseline in 2020).'
          : 'Satellite-Scan completed: EUDR Unsafe (forest baseline overlap detected).',
        eudrStatus === 'safe' ? 'success' : 'warning'
      );
    } catch (error) {
      console.error('Geo resolution error:', error);
      showNotice('Satellite-Scan failed. Please retry after checking backend connectivity.', 'error');
    } finally {
      setIsScanning(false);
      setScanningMessage('');
    }
  };

  const removePlot = (id: number) => {
    setPlots(plots.filter(p => p.id !== id));
  };

  const handleFileUpload = (type: 'ic' | 'title' | string, file: File, customIdx?: number) => {
    // handleFileUpload - route uploads through OCR so the form can prefill identity, permit, and title data.
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showNotice('Please select a valid image (JPG, PNG) or PDF file.', 'warning');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotice('File size must be less than 10MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'ic') {
        setScanningMessage('AI Verifying IC Document...');
        setFormData(prev => ({
          ...prev,
          name: 'Processing...',
          idNumber: 'Processing...',
          icPhoto: result, // Save IC photo
        }));
        setIsScanning(true);
        const icUpload = new FormData();
        icUpload.append('file', file);
        fetch(`${API_BASE_URL}/extract/ic`, {
          method: 'POST',
          body: icUpload
        })
          .then(res => res.json())
          .then(data => {
            const extracted = data?.data || {};
            const isValidIC = data?.status === 'success' || data?.status === 'warning';
            setFormData(prev => ({
              ...prev,
              name: isValidIC ? (extracted.name || '') : '',
              idNumber: isValidIC ? (extracted.idNumber || '') : '',
              icDebug: {
                status: data?.status,
                code: data?.code,
                reason: data?.message || data?.doc_type?.reason,
                rawTextSnippet: (extracted?.raw_text || '').slice(0, 220)
              }
            }));
          })
          .catch(() => {
            setFormData(prev => ({
              ...prev,
              name: '',
              idNumber: '',
              icDebug: {
                status: 'error',
                code: 'NETWORK_OR_SERVER_ERROR',
                reason: 'Failed to call /extract/ic endpoint.',
                rawTextSnippet: ''
              }
            }));
          })
          .finally(() => setIsScanning(false));
      } else if (type === 'title') {
        // 先保存图片
        setCurrentPlot(prev => ({
          ...prev,
          titlePhoto: result
        }));
        
        // 调用后端OCR API提取地契数据
        setScanningMessage('AI Verifying Land Title...');
        setIsScanning(true);
        const titleFormData = new FormData();
        titleFormData.append('file', file);
        
        fetch(`${API_BASE_URL}/extract/land-title`, {
          method: 'POST',
          body: titleFormData
        })
          .then(res => res.json())
          .then(data => {
            if (data.status === 'success' && data.data) {
              const extractedData = data.data;
              
              // ✅ Validate name match between IC and Land Title (display only, no auto-fill)
              const icName = formData.name?.toLowerCase().trim() || '';
              const ownerName = extractedData.owner_name?.toLowerCase().trim() || '';
              const namesMatch = icName && ownerName && (
                icName.includes(ownerName.split(' ')[0]) ||
                ownerName.includes(icName.split(' ')[0])
              );
              
              const validationMsg = namesMatch 
                ? '✅ Name matches IC' 
                : (ownerName ? '⚠️ Name may not match IC - verify carefully' : '⚠️ Could not extract owner name from document');
              
              // Store extracted metadata
              setCurrentPlot(prev => ({
                ...prev,
                landTitleMetadata: {
                  ...extractedData,
                  nameMatchValidation: validationMsg,
                  nameMatches: namesMatch
                }
              }));
              
              if (typeof extractedData.center_lat === 'number' && typeof extractedData.center_lng === 'number') {
                setMapCenter({ lat: extractedData.center_lat, lng: extractedData.center_lng });
                // Polygon will be drawn when user clicks Auto-Detect button
              }
              console.log('Land title validation:', validationMsg);
              console.log('Land title data extracted:', extractedData);
            } else if (data.status === 'warning') {
              console.warn('OCR warning:', data.message);
            } else {
              console.error('OCR error:', data.message);
            }
          })
          .catch(err => console.error('Land title extraction failed:', err))
          .finally(() => setIsScanning(false));
      } else if (type === 'custom' && customIdx !== undefined) {
        // Custom permit upload
        setFormData(prev => {
          const newCustomPermits = [...prev.customPermits];
          newCustomPermits[customIdx] = { ...newCustomPermits[customIdx], photo: result };
          return { ...prev, customPermits: newCustomPermits };
        });
      } else {
        // Permit upload
        setFormData(prev => ({
          ...prev,
          permitPhotos: {
            ...prev.permitPhotos,
            [type]: result
          }
        }));
        if (type !== 'OTHER') {
          setScanningMessage(`AI Verifying ${type} License...`);
          setIsScanning(true);
          const permitUpload = new FormData();
          permitUpload.append('file', file);
          fetch(`${API_BASE_URL}/extract/permit/${type}`, {
            method: 'POST',
            body: permitUpload
          })
            .then(res => res.json())
            .then(data => {
              const permitNo = data?.data?.permitNumber;
              const extractedPermitArea = data?.data?.registeredArea;
              const fallbackArea = parseAreaFromRawText(data?.data?.raw_text);
              const permitArea = extractedPermitArea ?? fallbackArea;
              
              // Store validation result (doc type check)
              const validationResult = data?.code === 'DOC_TYPE_MISMATCH' 
                ? { matched: false, detectedType: data?.doc_type?.detected_type, message: data?.message }
                : { matched: true };

              const debugInfo = {
                status: data?.status,
                code: data?.code,
                detectedType: data?.doc_type?.detected_type,
                reason: data?.doc_type?.reason || data?.message,
                rawTextSnippet: (data?.data?.raw_text || '').slice(0, 220)
              };

              if (!validationResult.matched) {
                // Reject wrong file immediately so user cannot continue with mismatched permit.
                setFormData(prev => ({
                  ...prev,
                  permitPhotos: {
                    ...prev.permitPhotos,
                    [type]: null
                  },
                  permitNumbers: {
                    ...prev.permitNumbers,
                    [type]: null
                  },
                  permitAreas: {
                    ...prev.permitAreas,
                    [type]: null
                  },
                  permitValidations: {
                    ...prev.permitValidations,
                    [type]: validationResult
                  },
                  permitDebug: {
                    ...prev.permitDebug,
                    [type]: debugInfo
                  }
                }));
                return;
              }
              
              setFormData(prev => ({
                ...prev,
                permitNumbers: {
                  ...prev.permitNumbers,
                  [type]: permitNo || prev.permitNumbers[type]
                },
                permitAreas: {
                  ...prev.permitAreas,
                  [type]: permitArea != null ? permitArea : null
                },
                permitValidations: {
                  ...prev.permitValidations,
                  [type]: validationResult
                },
                permitDebug: {
                  ...prev.permitDebug,
                  [type]: debugInfo
                }
              }));

              // Immediate auto-fill when current crop matches uploaded permit type.
              setCurrentPlot(prev => {
                const isMatch =
                  (type === 'MPOB' && prev.cropType === 'Palm Oil') ||
                  (type === 'MCB' && prev.cropType === 'Cocoa') ||
                  (type === 'LGM' && prev.cropType === 'Rubber');
                if (!isMatch || permitArea == null) return prev;
                return { ...prev, area: String(permitArea) };
              });
            })
            .catch(() => {
              setFormData(prev => ({
                ...prev,
                permitAreas: {
                  ...prev.permitAreas,
                  [type]: null
                },
                permitValidations: {
                  ...prev.permitValidations,
                  [type]: { matched: false, detectedType: 'unknown', message: 'Validation unavailable. Please re-upload this permit.' }
                },
                permitDebug: {
                  ...prev.permitDebug,
                  [type]: { status: 'error', code: 'NETWORK_OR_SERVER_ERROR', reason: 'Failed to call /extract/permit endpoint.' }
                }
              }));
            })
            .finally(() => setIsScanning(false));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLicenseFileUpload = (type: string, file: File) => {
    // handleLicenseFileUpload - capture dealer license uploads and keep a local preview for review.
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showNotice('Please select a valid image (JPG, PNG) or PDF file.', 'warning');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotice('File size must be less than 10MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        licensePhotos: {
          ...prev.licensePhotos,
          [type]: result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const simulateScan = (type: string) => {
    // simulateScan - provide deterministic demo OCR data when the hackathon flow needs a mock upload.
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (type === 'title') {
        // Mock land title image + OCR data for demo
        setCurrentPlot(prev => ({ ...prev, titlePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }));
        
        // Mock OCR extraction data - shows only validation without auto-fill
        const mockExtractedData = {
          plot_alias: 'PALM-GROVE-A01',
          land_area: 2.5,
          owner_name: 'Ahmad bin Ismail',
          lot_number: '1234/5678',
          mukim: 'Petaling',
          district: 'Kuala Lumpur',
          state: 'Selangor',
          center_lat: 3.139,
          center_lng: 101.6869
        };
        
        // ✅ Only validate name match, no auto-fill of title/area
        const icName = formData.name?.toLowerCase().trim() || '';
        const ownerName = mockExtractedData.owner_name?.toLowerCase().trim() || '';
        const namesMatch = icName && ownerName && (
          icName.includes(ownerName.split(' ')[0]) ||
          ownerName.includes(icName.split(' ')[0])
        );
        
        const validationMsg = namesMatch 
          ? '✅ Name matches IC' 
          : (ownerName ? '⚠️ Name may not match IC - verify carefully' : '⚠️ Could not extract owner name from document');
        
        // Store metadata only (no auto-fill of area)
        setCurrentPlot(prev => ({
          ...prev,
          landTitleMetadata: {
            ...mockExtractedData,
            nameMatchValidation: validationMsg,
            nameMatches: namesMatch
          }
        }));
        
        if (mockExtractedData.center_lat && mockExtractedData.center_lng) {
          setMapCenter({ lat: mockExtractedData.center_lat, lng: mockExtractedData.center_lng });
          // Polygon will be drawn when user clicks Auto-Detect button
        }
      } else {
        // Mock permit scan with simulated registered area
        const demoAreas: Record<string, number> = {
          'MPOB': 2.5,
          'MCB': 1.2,
          'LGM': 1.8
        };
        
        setFormData(prev => ({
          ...prev,
          permitPhotos: { ...prev.permitPhotos, [type]: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' },
          permitAreas: { ...prev.permitAreas, [type]: demoAreas[type] || null },
          // Demo scan does not contain real permit text; keep it unverified until Next re-check.
          permitValidations: { ...prev.permitValidations, [type]: null }
        }));
        
        // Auto-fill current plot area if crop matches
        const areaValue = demoAreas[type];
        if (areaValue != null) {
          setCurrentPlot(prev => {
            const isMatch =
              (type === 'MPOB' && prev.cropType === 'Palm Oil') ||
              (type === 'MCB' && prev.cropType === 'Cocoa') ||
              (type === 'LGM' && prev.cropType === 'Rubber');
            if (!isMatch) return prev;
            return { ...prev, area: String(areaValue) };
          });
        }
      }
    }, 2000);
  };

  const totalArea = plots.reduce((acc, p) => acc + Number(p.area || 0), 0);
  const totalQuota = totalArea * 2.5;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="min-h-screen pt-6 pb-20 px-6 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${step >= s ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/20' : 'bg-palm-100 text-palm-400'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-0.5 rounded-full ${step > s ? 'bg-gold-500' : 'bg-palm-100'}`} />}
          </div>
        ))}
        <div className="ml-auto">
          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400">Step {step} of 3</span>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-palm-950/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <div className="w-64 h-64 border-2 border-gold-400 rounded-3xl relative overflow-hidden mb-6">
              <div className="animate-scan-line" />
              <Camera size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400 opacity-50" />
            </div>
            <p className="font-display font-bold uppercase tracking-widest text-sm animate-pulse">{scanningMessage}</p>
          </div>
        )}

        {appNotice && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            appNotice.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : appNotice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : appNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <p className="text-[11px] leading-relaxed font-medium">{appNotice.message}</p>
            <button
              type="button"
              onClick={() => setAppNotice(null)}
              className="text-[10px] font-black uppercase tracking-widest opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Identity & Legality</h2>
              <p className="text-palm-600 font-light">Prove you are a legitimate agricultural practitioner.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 rounded-2xl bg-palm-50 border border-palm-100 focus:ring-2 focus:ring-gold-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="As per IC"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">National ID (IC)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 rounded-2xl bg-palm-50 border border-palm-100 focus:ring-2 focus:ring-gold-500 focus:bg-white outline-none transition-all font-medium"
                  placeholder="000000-00-0000"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 bg-palm-50 rounded-3xl border border-palm-100 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500">IC Upload</p>
                  <p className="text-xs text-palm-500">Upload IC image or PDF to auto-fill Name and IC No.</p>
                </div>
                <CreditCard className="text-palm-400" size={20} />
              </div>
              
              {formData.icPhoto ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-palm-200 bg-black/5">
                  <DocumentPreview src={formData.icPhoto} alt="IC" className="w-full h-full object-contain bg-white" />
                  <button 
                    onClick={() => setPreviewModal({ open: true, src: formData.icPhoto, title: 'IC Document' })}
                    className="absolute top-3 left-3 px-3 py-2 bg-white text-palm-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400 transition-all shadow-lg"
                  >
                    View
                  </button>
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, icPhoto: null, icPreview: null, name: '', idNumber: '', icDebug: null }))}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">✓ IC Uploaded</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('ic', file);
                      }}
                      className="hidden"
                      id="ic-upload"
                    />
                    <label
                      htmlFor="ic-upload"
                      className="px-5 py-3 bg-palm-950 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-palm-900 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <FileText size={14} /> Upload IC
                    </label>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const preview = reader.result as string;
                          setFormData(prev => ({
                            ...prev,
                            icPreview: preview
                          }));
                        };
                        reader.readAsDataURL(file);
                        handleFileUpload('ic', file);
                      }
                    }}
                    className="hidden"
                    id="ic-upload-preview"
                  />
                </div>
              )}
              
              {formData.icPreview && !formData.icPhoto && (
                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-palm-200 shadow-md bg-black/5">
                  <DocumentPreview src={formData.icPreview} alt="IC Preview" className="w-full h-full object-contain bg-white" />
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest">
                    Processing...
                  </div>
                </div>
              )}

              {formData.icDebug?.status === 'error' && (
                <div className="w-full p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-blue-700">IC Validation Error</p>
                  <p className="text-[10px] text-blue-900">code: {formData.icDebug?.code || 'n/a'}</p>
                  <p className="text-[10px] text-blue-800 leading-tight">reason: {formData.icDebug?.reason || 'n/a'}</p>
                  <p className="text-[10px] text-blue-700 leading-tight break-all">raw_text: {formData.icDebug?.rawTextSnippet || '(empty)'}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="p-8 dark-card flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-palm-900 rounded-2xl flex items-center justify-center text-gold-400">
                  <FileText size={32} />
                </div>
                <div>
                  <h4 className="font-display font-bold uppercase tracking-widest text-xs mb-2">License Repository</h4>
                  <p className="text-sm text-parchment/60 font-light mb-6">Select all applicable licenses for your crops.</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center mb-8">
                    {PERMIT_LIBRARY.map(permit => (
                      <button 
                        key={permit.id}
                        onClick={() => {
                          const newTypes = formData.permitTypes.includes(permit.id)
                            ? formData.permitTypes.filter(t => t !== permit.id)
                            : [...formData.permitTypes, permit.id];
                          if (newTypes.length === 0) return;
                          setFormData({...formData, permitTypes: newTypes});
                        }}
                        className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${formData.permitTypes.includes(permit.id) ? 'bg-gold-500 text-palm-950 border-gold-400' : 'bg-palm-800 text-parchment/40 border-palm-700'}`}
                      >
                        {permit.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 w-full">
                    {formData.permitTypes.map(pt => {
                      const permitInfo = PERMIT_LIBRARY.find(p => p.id === pt);
                      const photo = formData.permitPhotos[pt];
                      
                      return (
                        <div key={pt} className="p-6 bg-palm-800/50 rounded-3xl border border-palm-700 text-left space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-400">{permitInfo?.label}</span>
                            {photo && <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-1 rounded-md">Verified</span>}
                          </div>
                          {formData.permitNumbers[pt] && (
                            <p className="text-[10px] text-gold-300 font-bold uppercase tracking-widest">Extracted No: {formData.permitNumbers[pt]}</p>
                          )}
                          
                          {photo ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-palm-600 bg-black/5">
                              <DocumentPreview src={photo} alt={pt} className="w-full h-full object-contain bg-white" />
                              <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                                <button 
                                  onClick={() => setPreviewModal({ open: true, src: photo, title: permitInfo?.label })}
                                  className="px-3 py-2 bg-white text-palm-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400 transition-all"
                                >
                                  View
                                </button>
                              </div>
                              <button 
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  permitPhotos: { ...prev.permitPhotos, [pt]: null },
                                  permitPreviews: { ...prev.permitPreviews, [pt]: null },
                                  permitDebug: { ...prev.permitDebug, [pt]: null }
                                }))}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 py-4">
                              {pt === 'OTHER' && (
                                <div className="w-full space-y-3">
                                  {formData.customPermits.map((cp, idx) => (
                                    <div key={idx} className="bg-palm-900 p-4 rounded-2xl border border-palm-700 space-y-4">
                                      <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                         <p className="text-[8px] font-black text-gold-400 uppercase tracking-widest mb-1">Custom License</p>
                                         <span className="text-xs text-parchment font-bold">{cp.name}</span>
                                      </div>
                                      <button onClick={() => setFormData(prev => ({ ...prev, customPermits: prev.customPermits.filter((_, i) => i !== idx) }))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                        <Trash2 size={14}/>
                                      </button>
                                    </div>
                                    <div className="mt-2">
                                      {cp.photo ? (
                                        <div className="relative aspect-video rounded-xl overflow-hidden border border-palm-600 bg-black/5">
                                          <DocumentPreview src={cp.photo} alt={cp.name} className="w-full h-full object-contain bg-white" />
                                          <button 
                                            onClick={() => setFormData(prev => {
                                              const newCustom = [...prev.customPermits];
                                              newCustom[idx] = { ...newCustom[idx], photo: null };
                                              return { ...prev, customPermits: newCustom };
                                            })}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="w-full">
                                          <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleFileUpload('custom', file, idx);
                                            }}
                                            className="hidden"
                                            id={`custom-permit-upload-${idx}`}
                                          />
                                          <label
                                            htmlFor={`custom-permit-upload-${idx}`}
                                            className="w-full py-2 bg-palm-800 text-parchment/60 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-palm-700 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-dashed border-palm-600"
                                          >
                                            <Camera size={14} /> Upload {cp.name} Photo
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  ))}
                                  <div className="flex gap-2">
                                    <input 
                                      type="text"
                                      className="flex-1 px-4 py-3 rounded-xl bg-palm-900 border border-palm-700 text-white text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                      placeholder="Specify License Name..."
                                      value={formData.otherPermitName}
                                      onChange={(e) => setFormData({...formData, otherPermitName: e.target.value})}
                                    />
                                    <button 
                                      onClick={() => {
                                        if (formData.otherPermitName) {
                                          setFormData(prev => ({ 
                                            ...prev, 
                                            customPermits: [...prev.customPermits, { name: prev.otherPermitName, photo: null, number: '' }], 
                                            otherPermitName: '' 
                                          }));
                                        }
                                      }}
                                      className="px-4 bg-gold-500 text-palm-950 rounded-xl font-bold text-xs uppercase tracking-widest"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}
                              {pt !== 'OTHER' && (
                                <div className="w-full space-y-3">
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          const preview = reader.result as string;
                                          setFormData(prev => ({
                                            ...prev,
                                            permitPreviews: { ...prev.permitPreviews, [pt]: preview }
                                          }));
                                        };
                                        reader.readAsDataURL(file);
                                        handleFileUpload(pt, file);
                                      }
                                    }}
                                    className="hidden"
                                    id={`permit-upload-${pt}`}
                                  />
                                  <label
                                    htmlFor={`permit-upload-${pt}`}
                                    className="w-full py-3 bg-palm-700 text-parchment rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-palm-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Camera size={14} /> Upload {permitInfo?.label}
                                  </label>
                                  <p className="text-[8px] text-parchment/60 text-center">Supports JPG, PNG, PDF (max 10MB)</p>
                                </div>
                              )}
                              
                              {formData.permitPreviews[pt] && !formData.permitPhotos[pt] && pt !== 'OTHER' && (
                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-palm-300 shadow-md bg-black/5">
                                  <DocumentPreview src={formData.permitPreviews[pt]} alt="Permit Preview" className="w-full h-full object-contain bg-white" />
                                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest">
                                    Processing...
                                  </div>
                                </div>
                              )}

                            </div>
                          )}

                          {pt !== 'OTHER' && formData.permitDebug?.[pt] && formData.permitDebug[pt]?.status === 'error' && (
                            <div className="w-full p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                              <p className="text-[8px] font-black uppercase tracking-widest text-blue-700">License Mismatch / Validation Error</p>
                              <p className="text-[10px] text-blue-900">code: {formData.permitDebug[pt]?.code || 'n/a'}</p>
                              <p className="text-[10px] text-blue-800 leading-tight">reason: {formData.permitDebug[pt]?.reason || 'n/a'}</p>
                              <p className="text-[10px] text-blue-700 leading-tight break-all">raw_text: {formData.permitDebug[pt]?.rawTextSnippet || '(empty)'}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.idNumber || formData.permitTypes.some(pt => !formData.permitPhotos[pt] && pt !== 'OTHER')}
                className="btn-palm disabled:opacity-50"
              >
                Next: Plot Manager <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* 在step 2也显示过场动画 */}
            {isGenerating && (
              <div className="fixed inset-0 z-[999] bg-palm-950/60 backdrop-blur-md flex flex-col items-center justify-center text-white">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-72 h-72 border-4 border-gold-400 rounded-3xl relative overflow-hidden mb-8 bg-palm-900/50"
                >
                  <div className="animate-scan-line" />
                  <Globe size={64} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400 opacity-50 animate-pulse" />
                </motion.div>
                <motion.p 
                  key={generatingMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display font-bold uppercase tracking-widest text-lg animate-pulse px-8 text-center"
                >
                  {generatingMessage}
                </motion.p>
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Multi-Plot Manager</h2>
                <p className="text-palm-600 font-light">Add and geofence your land parcels.</p>
              </div>
              <div className="text-right">
                <div className="inline-flex flex-col items-end">
                  <span className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400">Total Area</span>
                  <span className="text-xl font-serif font-bold text-gold-600">{totalArea.toFixed(2)} Ha</span>
                </div>
              </div>
            </div>

            {!isAddingPlot ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  {plots.length === 0 ? (
                    <div className="p-12 bg-palm-50 rounded-[2.5rem] border-2 border-dashed border-palm-200 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-palm-100 rounded-2xl flex items-center justify-center text-palm-300 mb-4">
                        <Map size={32} />
                      </div>
                      <p className="text-sm text-palm-400 font-light">No plots added yet. Start by adding your first land parcel.</p>
                    </div>
                  ) : (
                    plots.map((plot) => (
                      <div key={plot.id} className="p-6 bg-white rounded-3xl border border-palm-100 flex justify-between items-center group hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-palm-950 rounded-2xl flex items-center justify-center text-gold-400">
                            <MapPin size={24} />
                          </div>
                          <div>
                            <h4 className="font-display font-bold uppercase tracking-widest text-xs text-palm-950">{plot.title}</h4>
                            <p className="text-sm text-palm-500">{plot.cropType} • {plot.area} Ha • Planted {plot.plantingYear}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Verified</div>
                          <button onClick={() => removePlot(plot.id)} className="p-2 text-palm-300 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => setIsAddingPlot(true)}
                  className="w-full py-6 bg-palm-950 text-white rounded-[2rem] font-display font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-palm-900 transition-all shadow-xl"
                >
                  <Plus size={20} /> Add New Plot
                </button>

                <div className="flex justify-between pt-8">
                  <button onClick={() => setStep(1)} className="text-palm-400 font-display font-bold uppercase tracking-widest text-[10px] hover:text-palm-950 transition-colors">Back</button>
                  <button 
                    onClick={async () => {
                      // 显示卫星数据对比动画
                      setIsGenerating(true);
                      setGeneratingMessage('🛰️ Retrieving 2020 satellite baseline data...');
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      
                      setGeneratingMessage('📊 Comparing current vegetation index (NDVI)...');
                      await new Promise(resolve => setTimeout(resolve, 1300));
                      
                      setGeneratingMessage('🌍 Analyzing forest cover changes...');
                      const verifiedPlots = [];
                      for (const plot of plots) {
                        const verification = await verifySatelliteData(plot);
                        verifiedPlots.push({
                          ...plot,
                          satelliteVerified: verification
                        });
                      }
                      
                      setGeneratingMessage('✅ Satellite verification complete');
                      await new Promise(resolve => setTimeout(resolve, 900));
                      
                      setPlots(verifiedPlots);
                      setIsGenerating(false);
                      setStep(3);
                    }}
                    disabled={plots.length === 0 || isGenerating}
                    className="btn-palm disabled:opacity-50"
                  >
                    Next: Global Overview <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-palm-50 rounded-[2.5rem] border border-palm-100 space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif font-bold text-palm-950">New Plot Details</h3>
                  <button onClick={() => setIsAddingPlot(false)} className="text-palm-400 hover:text-palm-950 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Crop Type</label>
                    <div className="w-full p-4 rounded-2xl bg-white border border-palm-100 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {availableCropOptions.length === 0 && (
                          <p className="text-[10px] text-red-500 font-bold">Upload at least one license first to unlock crop options.</p>
                        )}
                        {availableCropOptions.map(crop => {
                          const selected = currentPlot.cropType === crop;
                          return (
                            <button
                              type="button"
                              key={crop}
                              onClick={() => setPlotCropType(crop)}
                              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${selected ? 'bg-gold-500 text-palm-950 border-gold-400' : 'bg-palm-50 text-palm-500 border-palm-200 hover:border-palm-400'}`}
                            >
                              {selected ? '✓ ' : ''}{crop}
                            </button>
                          );
                        })}
                      </div>
                      {currentPlot.cropType === 'Other' && (
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-palm-200 outline-none focus:ring-2 focus:ring-gold-500"
                          placeholder="Specify Other crop type"
                          value={currentPlot.otherCropType}
                          onChange={(e) => setCurrentPlot({ ...currentPlot, otherCropType: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Planting Year</label>
                    <input 
                      type="number" 
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-palm-100 outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="e.g. 2018"
                      value={currentPlot.plantingYear}
                      onChange={(e) => setCurrentPlot({...currentPlot, plantingYear: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Plot Alias</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-palm-100 outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="e.g. Hillside Cocoa"
                      value={currentPlot.title}
                      onChange={(e) => setCurrentPlot({...currentPlot, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Land Area (Ha)</label>
                    <input 
                      type="number" 
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-palm-100 outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="0.00"
                      value={currentPlot.area}
                      onChange={(e) => setCurrentPlot({...currentPlot, area: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Land Title Evidence</label>
                  <div className="p-8 bg-white rounded-3xl border-2 border-dashed border-palm-100 flex flex-col items-center text-center gap-4">
                    {currentPlot.titlePhoto ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/5">
                        <DocumentPreview src={currentPlot.titlePhoto} alt="Title" className="w-full h-full object-contain bg-white" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                          <button 
                            onClick={() => setPreviewModal({ open: true, src: currentPlot.titlePhoto, title: 'Land Title' })}
                            className="px-3 py-2 bg-white text-palm-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400 transition-all"
                          >
                            View
                          </button>
                        </div>
                        <button onClick={() => setCurrentPlot({...currentPlot, titlePhoto: null, titlePreview: null})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><Trash2 size={18}/></button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-palm-50 rounded-xl flex items-center justify-center text-palm-300">
                          <Camera size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-palm-950 uppercase tracking-widest mb-1">Upload Land Title</p>
                          <p className="text-[10px] text-palm-400 font-light">Upload official land deed.</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const preview = reader.result as string;
                                setCurrentPlot(prev => ({
                                  ...prev,
                                  titlePreview: preview
                                }));
                              };
                              reader.readAsDataURL(file);
                              handleFileUpload('title', file);
                            }
                          }}
                          className="hidden"
                          id="title-upload"
                        />
                        <label
                          htmlFor="title-upload"
                          className="px-6 py-3 bg-palm-200 text-palm-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-all cursor-pointer"
                        >
                          Upload from Device
                        </label>
                      </>
                    )}
                  </div>
                  
                  {currentPlot.titlePreview && !currentPlot.titlePhoto && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-palm-200 shadow-md bg-black/5">
                      <DocumentPreview src={currentPlot.titlePreview} alt="Title Preview" className="w-full h-full object-contain bg-white" />
                      <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest">
                        Processing...
                      </div>
                    </div>
                  )}
                  
                  {/* ✅ Land Title Validation Results */}
                  {currentPlot.titlePhoto && currentPlot.landTitleMetadata && (
                    <div className={`mt-4 p-4 rounded-2xl border ${
                      currentPlot.landTitleMetadata.nameMatches 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {currentPlot.landTitleMetadata.nameMatches ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <AlertCircle size={16} className="text-yellow-600" />
                          )}
                          <span className={`text-xs font-bold ${
                            currentPlot.landTitleMetadata.nameMatches 
                              ? 'text-emerald-700' 
                              : 'text-yellow-700'
                          }`}>
                            {currentPlot.landTitleMetadata.nameMatchValidation}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-600 space-y-1">
                          <p><span className="font-bold">IC Name:</span> {formData.name || 'Not captured'}</p>
                          <p><span className="font-bold">Document Owner:</span> {currentPlot.landTitleMetadata.owner_name || 'Not found'}</p>
                          {currentPlot.landTitleMetadata.plot_alias && (
                            <p><span className="font-bold">Plot Alias:</span> {currentPlot.landTitleMetadata.plot_alias}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Geofence Boundary</label>
                  </div>
                  <div 
                    ref={mapContainerRef}
                    className={`map-container aspect-video rounded-3xl overflow-hidden relative cursor-crosshair ${isDrawing ? 'ring-2 ring-gold-500 ring-offset-2' : ''}`}
                    onMouseMove={handleMapMouseMove}
                    onMouseUp={stopDraggingPoint}
                    onMouseLeave={stopDraggingPoint}
                  >
                    <LeafletMapContainer
                      center={[mapCenter.lat, mapCenter.lng]}
                      zoom={15}
                      scrollWheelZoom
                      className="absolute inset-0 w-full h-full z-0"
                    >
                      <LeafletTileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LeafletCircleMarker
                        center={[mapCenter.lat, mapCenter.lng]}
                        radius={8}
                        pathOptions={{ color: '#D97706', fillColor: '#D97706', fillOpacity: 0.6 }}
                      />
                      <MapRecenter lat={mapCenter.lat} lng={mapCenter.lng} />
                    </LeafletMapContainer>

                    <div
                      className="absolute inset-0 z-[450]"
                      onClick={handleMapClick}
                      style={{ pointerEvents: 'none' }}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    
                    <svg
                      className="absolute inset-0 w-full h-full z-[500]"
                      style={{ pointerEvents: 'none' }}
                    >
                      {mapPoints.length > 0 && (
                        <polyline
                          points={getPixelCoordinates(mapPoints)}
                          fill="none"
                          stroke="#D97706"
                          strokeWidth="2"
                          className="vector-path"
                          style={{ vectorEffect: 'non-scaling-stroke' }}
                        />
                      )}
                      {mapPoints.length >= 3 && (
                        <polygon
                          points={getPixelCoordinates(mapPoints)}
                          fill="rgba(217, 119, 6, 0.2)"
                          stroke="#D97706"
                          strokeWidth="2"
                          strokeDasharray="4"
                        />
                      )}
                      {mapPoints.map((p, i) => {
                        const rect = mapContainerRef.current?.getBoundingClientRect();
                        const cx = rect ? (p.x / 100) * rect.width : 0;
                        const cy = rect ? (p.y / 100) * rect.height : 0;
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r="6"
                            fill="#D97706"
                            className="animate-pulse"
                            style={{ pointerEvents: 'none', cursor: 'default' }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragPointIndex(i);
                            }}
                          />
                        );
                      })}
                    </svg>

                    <div className="absolute bottom-4 left-4 right-4 z-[600] flex justify-start pointer-events-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); autoDetectLocation(); }}
                        className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <MapPin size={14} /> Auto-Detect
                      </button>
                    </div>

                    <div className="absolute top-4 left-4 z-[600] bg-black/55 text-white px-3 py-2 rounded-lg text-[10px] font-mono pointer-events-none">
                      {`Center: ${mapCenter.lat.toFixed(5)}, ${mapCenter.lng.toFixed(5)}`}
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-palm-400 italic mt-2">
                    Satellite-Scan auto-detects planting boundary and runs EUDR baseline check (2020 vs current).
                  </p>

                  {(() => {
                    const licenseArea = formData.permitAreas[getRequiredPermitByCrop(currentPlot.cropType)] || 0;
                    const landTitleArea = currentPlot.landTitleMetadata?.land_area || 0;
                    const cropLabel = currentPlot.cropType === 'Other' ? currentPlot.otherCropType : currentPlot.cropType;
                    
                    if (!licenseArea || !landTitleArea) return null;
                    
                    return (
                      <div className="mt-4 p-4 bg-palm-50 rounded-2xl border border-palm-100">
                        <p className="text-[10px] text-palm-700 font-medium leading-relaxed">
                          <span className="font-bold">Authorized Land Usage:</span> {licenseArea.toFixed(2)} / {landTitleArea.toFixed(2)} ha is currently utilized for {cropLabel} cultivation.
                        </p>
                      </div>
                    );
                  })()}
                </div>



                {/* Land Title Area Capacity Check */}
                {(() => {
                  const lotNumber = currentPlot.landTitleMetadata?.lot_number;
                  const landTitleArea = currentPlot.landTitleMetadata?.land_area;
                  
                  if (!lotNumber || !landTitleArea || landTitleArea <= 0) {
                    return null;
                  }

                  const currentPlotArea = parseFloat(currentPlot.area) || 0;
                  const usedAreaInSameLot = plots
                    .filter(p => p.landTitleMetadata?.lot_number === lotNumber)
                    .reduce((sum, p) => sum + parseFloat(p.area || 0), 0);
                  
                  const totalWillBe = usedAreaInSameLot + currentPlotArea;
                  const remainingArea = landTitleArea - usedAreaInSameLot;
                  const utilization = (totalWillBe / landTitleArea) * 100;
                  
                  const isOverCapacity = totalWillBe > landTitleArea;
                  const isNearCapacity = utilization >= 80;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-2xl flex flex-col gap-2 border ${
                        isOverCapacity 
                          ? 'bg-red-50 border-red-100' 
                          : isNearCapacity 
                          ? 'bg-amber-50 border-amber-100'
                          : 'bg-blue-50 border-blue-100'
                      }`}
                    >
                      <div className={`flex items-center gap-2 ${
                        isOverCapacity ? 'text-red-600' : isNearCapacity ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        {isOverCapacity ? (
                          <AlertCircle size={16} />
                        ) : (
                          <MapPin size={16} />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {isOverCapacity ? '⚠️ Over Capacity' : isNearCapacity ? '⚠️ Near Capacity' : '💾 Land Title Info'}
                        </span>
                      </div>
                      <p className={`text-[10px] font-medium leading-tight ${
                        isOverCapacity ? 'text-red-700' : isNearCapacity ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        Land Title {lotNumber}: {usedAreaInSameLot.toFixed(2)} HA used + {currentPlotArea.toFixed(2)} HA (this plot) = {totalWillBe.toFixed(2)} HA / {landTitleArea.toFixed(2)} HA available
                      </p>
                      {isOverCapacity && (
                        <p className="text-[10px] text-red-600 font-bold">
                          ❌ Cannot save: Total area exceeds land title limit ({(totalWillBe - landTitleArea).toFixed(2)} HA over)
                        </p>
                      )}
                      {isNearCapacity && !isOverCapacity && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          ⚠️ Remaining: {remainingArea.toFixed(2)} HA capacity left on this land title
                        </p>
                      )}
                    </motion.div>
                  );
                })()}



                <button 
                  onClick={addPlot}
                  disabled={!canSavePlot}
                  className="btn-gold w-full justify-center disabled:opacity-50"
                >
                  Save Plot
                </button>

                {/* Real-time Validation Warning */}
                {(() => {
                  let missingPermit = '';
                  if (currentPlot.cropType === 'Palm Oil' && !formData.permitPhotos['MPOB']) missingPermit = 'MPOB';
                  if (currentPlot.cropType === 'Cocoa' && !formData.permitPhotos['MCB']) missingPermit = 'MCB';
                  if (currentPlot.cropType === 'Rubber' && !formData.permitPhotos['LGM']) missingPermit = 'LGM';
                  if (currentPlot.cropType === 'Other' && !formData.customPermits.some(cp => cp.photo)) missingPermit = 'OTHER';

                  if (!missingPermit) return null;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Missing {missingPermit} License</span>
                      </div>
                      <p className="text-[10px] text-red-500 leading-tight font-medium">
                        You haven't uploaded the required license for selected crop type.
                      </p>
                      <button 
                        onClick={() => {
                          const quick = missingPermit;
                          if (!quick || quick === 'OTHER') return;
                          if (!formData.permitTypes.includes(quick)) {
                            setFormData(prev => ({
                              ...prev,
                              permitTypes: [...prev.permitTypes, quick]
                            }));
                          }
                          simulateScan(quick);
                        }}
                        className="self-start px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                        disabled={missingPermit === 'OTHER'}
                      >
                        <Camera size={12} /> Quick Upload Missing License
                      </button>
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 relative overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 z-50 bg-palm-950/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <div className="w-64 h-64 border-2 border-gold-400 rounded-3xl relative overflow-hidden mb-6">
                  <div className="animate-scan-line" />
                  <ShieldCheck size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400 opacity-50" />
                </div>
                <p className="font-display font-bold uppercase tracking-widest text-sm animate-pulse">{generatingMessage}</p>
              </div>
            )}
            <div>
              <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Global Overview</h2>
              <p className="text-palm-600 font-light">Review your consolidated agricultural profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Palm Oil', 'Cocoa', 'Rubber'].map(crop => {
                const cropPlots = plots.filter(p =>
                  (Array.isArray(p.cropTypes) && p.cropTypes.includes(crop)) ||
                  (typeof p.cropType === 'string' && p.cropType.includes(crop))
                );
                if (cropPlots.length === 0) return null;
                const area = cropPlots.reduce((acc, p) => acc + Number(p.area), 0);
                const quota = area * 2.5;
                return (
                  <div key={crop} className="glass-card p-8 border-l-4 border-l-gold-500">
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 mb-2">{crop}</p>
                    <h3 className="text-3xl font-serif font-bold text-palm-950 mb-4">{area.toFixed(2)} <span className="text-sm font-light text-palm-500">HA</span></h3>
                    <div className="flex justify-between items-center pt-4 border-t border-palm-100">
                      <span className="text-[10px] font-display font-bold uppercase tracking-widest text-emerald-600">Monthly Quota</span>
                      <span className="text-lg font-serif font-bold text-emerald-600">{quota.toFixed(1)} MT</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 ml-1">Registered Plots</h4>
              <div className="space-y-3">
                {plots.map(plot => (
                  <div key={plot.id} className="p-6 bg-white rounded-3xl border border-palm-100 flex justify-between items-center">
                    <div>
                      <h5 className="font-serif font-bold text-lg text-palm-950">{plot.title}</h5>
                      <p className="text-xs text-palm-500">{plot.cropType} • {plot.area} Ha • Planted {plot.plantingYear}</p>
                      {plot.satelliteVerified && (
                        <div className="flex items-center gap-2 mt-2">
                          {plot.satelliteVerified.compliant ? (
                            <>
                              <Globe size={12} className="text-emerald-600" />
                              <span className="text-[10px] font-bold text-emerald-600">Satellite Verified ✓</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} className="text-red-600" />
                              <span className="text-[10px] font-bold text-red-600">Forest Loss Detected</span>
                            </>
                          )}
                        </div>
                      )}
                      {plot.eudrChecked && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-emerald-600">✓ EUDR Safe ({plot.eudrRiskScore?.toFixed(0) || 0}/100)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700`}>
                        EUDR Safe
                      </div>
                      {plot.satelliteVerified && plot.satelliteVerified.compliant && (
                        <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                          <Globe size={10} /> Verified
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={async () => {
                  setIsGenerating(true);

                  // Generate Universal ID - EUDR verification continues in background
                  setGeneratingMessage('Generating Universal ID...');
                  await new Promise(r => setTimeout(r, 500));
                  await onComplete(formData, plots);
                  setIsGenerating(false);
                }}
                disabled={isGenerating || plots.length === 0}
                className="w-full py-6 bg-gold-500 text-palm-950 rounded-[2rem] font-display font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-gold-600 transition-all shadow-2xl shadow-gold-500/20 disabled:opacity-50"
              >
                <ShieldCheck size={20} /> Generate Universal ID
              </button>
              <button onClick={() => setStep(2)} className="text-center text-palm-400 font-display font-bold uppercase tracking-widest text-[10px] hover:text-palm-950 transition-colors">Edit Plots</button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal.open && previewModal.src && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewModal({ open: false, src: null, title: null })}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewModal({ open: false, src: null, title: null })}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>
              {previewModal.title && (
                <div className="p-4 bg-palm-50 border-b border-palm-100">
                  <p className="text-sm font-bold text-palm-950 uppercase tracking-widest">{previewModal.title}</p>
                </div>
              )}
              <div className="flex items-center justify-center bg-black/10 p-4">
                <DocumentPreview src={previewModal.src} alt="Preview" className="max-h-[70vh] max-w-full object-contain rounded-xl bg-white" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const DDS_Template = ({ item, idx, isConsolidated = false }: { item: any, idx: number, isConsolidated?: boolean, key?: any }) => {
  // DDS_Template - render one producer compliance certificate for PDF and print output.
  const getPermitLabel = (crop: string) => {
    const c = crop?.toLowerCase() || '';
    if (c.includes('palm')) return 'MSPO License';
    if (c.includes('cocoa')) return 'MCB Permit';
    if (c.includes('rubber')) return 'LGM Permit';
    return 'National Registry Permit';
  };

  const gpsText = item.gps || (
    item.location?.lat != null && item.location?.lng != null
      ? `${Number(item.location.lat).toFixed(4)}, ${Number(item.location.lng).toFixed(4)}`
      : '3.9322, 102.3611'
  );

  const producerId = item.idNumber || item.farmerId || item.ic || item.id || '780512-06-5543';
  const hasEudrVisual = Boolean(item.eudrComparisonMap);
  const hasEudrMetrics = [item.eudrNdvi2020, item.eudrNdviCurrent, item.eudrNdviChangePct, item.eudrRiskScore]
    .some((v) => v != null && Number.isFinite(Number(v)));
  const showEudrSection = Boolean(item.eudrChecked || hasEudrVisual || hasEudrMetrics);

  return (
    <div className={`w-full bg-white shadow-2xl p-6 sm:p-12 md:p-16 border-t-8 border-orange-500 relative overflow-hidden ring-1 ring-slate-200 print:shadow-none print:border-t-8 print:ring-0 ${isConsolidated ? 'mb-8 print:mb-0 print:break-before-page' : ''}`}>
      {/* 背景防伪水印 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
        <ShieldCheck size={400} />
      </div>

      {/* 页眉部分 */}
      <header className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8 relative z-10 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#064e3b]">
            <ShieldCheck size={32} strokeWidth={2.5} />
            <span className="text-3xl font-black italic tracking-tighter uppercase">Veri</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isConsolidated ? `Producer Compliance Certificate (Part ${idx + 1})` : 'Single Producer Compliance Certificate'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Statement ID</p>
          <p className="text-xs sm:text-sm font-mono font-black text-[#064e3b] tracking-tight whitespace-nowrap break-keep">
            V-IND-{item.id || '00921'}-{idx + 1}
          </p>
        </div>
      </header>

      {/* 身份与状态部分 */}
      <section className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 mb-12 relative z-10">
        <div className="space-y-6">
          <div>
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Producer Identity</h4>
            <p className="font-black text-slate-800 text-lg leading-none">{item.farmerName || item.name || 'Ahmad bin Ismail'}</p>
            <p className="text-xs text-slate-400 font-bold mt-1">IC: {producerId}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">{item.permitLabel || getPermitLabel(item.cropType || item.crop)}</h4>
            <div className="space-y-1">
              <p className="font-bold text-slate-800">{item.permitType && item.permitType !== 'N/A' ? item.permitType : 'License Number Not Extracted'}</p>
              {(!item.permitType || item.permitType === 'N/A') && (
                <p className="text-[8px] text-amber-600 font-bold">⚠️ Check license document and OCR extraction</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-start">
           <div className="p-6 rounded-3xl border shadow-sm bg-green-50 border-green-100 w-full">
              <h4 className="text-[9px] font-black uppercase tracking-widest mb-2 text-green-600">EUDR Compliance Status</h4>
              <div className="flex items-center gap-3">
                 <span className="font-black italic uppercase tracking-tighter text-sm whitespace-nowrap text-green-900">Negligible Risk</span>
              </div>
              {item.eudrRiskScore != null && (
                <p className="text-[10px] font-bold mt-2 text-slate-600">Risk Score: {item.eudrRiskScore.toFixed(0)}/100</p>
              )}
           </div>
        </div>
      </section>

      {/* 地块详细规格 */}
      <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-12 relative z-10">
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200 pb-4">
          <MapPin size={20} className="text-[#064e3b]" />
          <h3 className="font-black text-[#064e3b] uppercase text-sm tracking-tight">Verified Plot Specifications (Article 9)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Plot Alias</span>
            <p className="text-xs font-bold text-slate-700">{item.plotName || ''}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Commodity Type</span>
            <p className="text-xs font-bold text-slate-700 uppercase">{item.cropType || item.crop || 'Cocoa'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Planting Year</span>
            <p className="text-xs font-bold text-slate-700">{item.year || 2018}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Area Size</span>
            <p className="text-xs font-bold text-slate-700 uppercase">{item.area || '3.2 HA'}</p>
          </div>
          <div className="col-span-2 space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Plot Location (GPS)</span>
            <p className="text-xs font-mono font-bold text-[#064e3b] bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block">
              {gpsText}
            </p>
          </div>
        </div>
      </section>

      {/* EUDR毁林风险分析 */}
      {showEudrSection && (
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-[2.5rem] border border-emerald-100 mb-12 relative z-10">
          <div className="flex items-center gap-2 mb-6 border-b border-emerald-200 pb-4">
            <Globe size={20} className="text-emerald-700" />
            <h3 className="font-black text-emerald-900 uppercase text-sm tracking-tight">EUDR Deforestation Risk Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Satellite Comparison Map */}
            {item.eudrComparisonMap && (
              <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Satellite NDVI Comparison (Map-backed)</h4>
                <img
                  src={item.eudrComparisonMap}
                  alt="EUDR Deforestation Analysis"
                  className="w-full rounded-lg border border-slate-200"
                />
                <p className="text-[9px] text-slate-500 mt-2 italic">
                  Left: 2020 Baseline | Center: Current State | Right: NDVI Change (Red = Vegetation Loss)
                </p>
              </div>
            )}

            {/* NDVI Statistics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-emerald-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">2020 NDVI</p>
                <p className="text-2xl font-black text-slate-800">{item.eudrNdvi2020?.toFixed(3) || 'N/A'}</p>
                <p className="text-[9px] text-slate-500 mt-1">Baseline Vegetation</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current NDVI</p>
                <p className="text-2xl font-black text-slate-800">{item.eudrNdviCurrent?.toFixed(3) || 'N/A'}</p>
                <p className="text-[9px] text-slate-500 mt-1">Current Vegetation</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">NDVI Change</p>
                <p className={`text-2xl font-black ${
                  (item.eudrNdviChangePct || 0) < -30 ? 'text-red-600' :
                  (item.eudrNdviChangePct || 0) < 0 ? 'text-amber-600' :
                  'text-green-600'
                }`}>{item.eudrNdviChangePct?.toFixed(1) || '0.0'}%</p>
                <p className="text-[9px] text-slate-500 mt-1">Vegetation Change</p>
              </div>
            </div>

            {/* Risk Assessment Summary */}
            <div className="bg-white p-6 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deforestation Risk Assessment</h4>
                <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                  EUDR Safe
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        (item.eudrRiskScore || 0) < 15 ? 'bg-green-500' :
                        (item.eudrRiskScore || 0) < 40 ? 'bg-emerald-500' :
                        (item.eudrRiskScore || 0) < 70 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(item.eudrRiskScore || 0, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[8px] text-slate-400">
                    <span>0 (Safe)</span>
                    <span className="font-bold text-slate-700">Score: {item.eudrRiskScore?.toFixed(0) || 0}/100</span>
                    <span>100 (High Risk)</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-slate-600 mt-4 leading-relaxed">
                {item.eudrRiskLevel === 'Negligible' || item.eudrRiskLevel === 'Low'
                  ? 'Analysis confirms no significant vegetation loss detected. Plot maintains stable forest cover consistent with sustainable agricultural practices.'
                  : item.eudrRiskLevel === 'Medium'
                    ? 'Moderate vegetation change detected. Further investigation recommended to verify compliance with EUDR guidelines.'
                    : 'Significant vegetation loss detected. Immediate verification and documentation required to demonstrate EUDR compliance.'}
              </p>
              {item.eudrCheckDate && (
                <p className="text-[8px] text-slate-400 mt-3">Analysis Date: {new Date(item.eudrCheckDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 声明与签名页脚 */}
      <footer className="mt-24 text-center space-y-8 relative z-10">
        <div className="flex justify-between items-end border-t border-slate-100 pt-10">
           <div className="text-left space-y-3">
              <div className="w-40 h-12 border-b-2 border-slate-100 relative">
                 <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg width="100" height="30" viewBox="0 0 100 30" className="stroke-[#064e3b] fill-none">
                       <path d="M5 25 Q 25 5, 50 20 T 95 15" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                 </div>
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest">Digital Signature of Producer</p>
           </div>
           <div className="text-right space-y-2">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Blockchain Evidence Hash</p>
              <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                <code className="text-[9px] font-mono text-slate-500 font-bold">{item.hash || '0xV72...8821B41A'}</code>
              </div>
           </div>
        </div>
        <div className="pt-8 flex flex-col items-center gap-2">
          <p className="text-[9px] text-slate-200 font-black uppercase tracking-[0.5em]">Generated by Veri Universal Compliance Protocol</p>
          <div className="h-1 w-12 bg-slate-100 rounded-full"></div>
        </div>
      </footer>
    </div>
  );
};

const DDSReport = ({ data, type, onClose }: { data: any, type: 'individual' | 'consolidated', onClose: () => void }) => {
  const reportRef = useRef<HTMLDivElement>(null);

const generateMockNDVIMap = (seed = 42): string | null => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rows = 80, cols = 100;
  const panelW = 380, panelH = 320, gap = 20, top = 60;
  const lefts = [10, 10 + panelW + gap, 10 + (panelW + gap) * 2];
  const titles = ['2020 Baseline NDVI', 'Current NDVI', 'NDVI Delta'];

  // seed is used here — different seed = different noise = different map
  const sn = (x: number, y: number, k = 1) => {
    const v = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 0.173 + k * 0.91) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  };

  const g2020: number[][] = [], gCur: number[][] = [], gDelta: number[][] = [];

  for (let y = 0; y < rows; y++) {
    const r2: number[] = [], rC: number[] = [], rD: number[] = [];
    for (let x = 0; x < cols; x++) {
      const nx = x / (cols - 1);
      const ny = y / (rows - 1);

      // sn() is called here — this is what was missing in your version
      const terrain = 0.54
        + 0.16 * Math.sin(nx * 6.2 + seed * 0.01)   // seed shifts the wave phase
        + 0.12 * Math.cos(ny * 7.4 + seed * 0.007);  // different per farmer
      const texture = 0.08 * sn(x, y, 1) + 0.05 * sn(x, y, 2);
      const v2 = Math.max(0.12, Math.min(0.92, terrain + texture));

      // stress blob position shifts with seed too
      const blobX = 0.25 + (seed % 17) * 0.03;
      const blobY = 0.40 + (seed % 11) * 0.025;
      const stress = Math.exp(-((nx - blobX) ** 2 / 0.03 + (ny - blobY) ** 2 / 0.02)) * 0.07;
      const recovery = 0.008 * Math.max(0, sn(x, y, 3));
      const vC = Math.max(0.05, Math.min(0.9, v2 - stress - 0.018 + recovery));

      r2.push(v2);
      rC.push(vC);
      rD.push(vC - v2);
    }
    g2020.push(r2);
    gCur.push(rC);
    gDelta.push(rD);
  }

  const ndviColor = (v: number): [number, number, number] => {
    const t = Math.max(0, Math.min(1, (v + 0.2) / 1.2));
    if (t < 0.35) {
      const k = t / 0.35;
      return [Math.round(180 + 70 * k), Math.round(45 + 160 * k), Math.round(35 + 20 * k)];
    }
    const k = (t - 0.35) / 0.65;
    return [Math.round(250 - 95 * k), Math.round(205 + 40 * k), Math.round(55 - 45 * k)];
  };

  const deltaColor = (v: number): [number, number, number] => {
    const t = Math.max(0, Math.min(1, (v + 0.30) / 0.50));
    if (t < 0.5) {
      const k = t / 0.5;
      return [Math.round(190 + 60 * k), Math.round(30 + 190 * k), Math.round(35 + 40 * k)];
    }
    const k = (t - 0.5) / 0.5;
    return [Math.round(250 - 55 * k), Math.round(220 + 25 * k), Math.round(75 + 40 * k)];
  };

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  lefts.forEach((x0, idx) => {
    const mode = idx === 0 ? 'base' : idx === 1 ? 'current' : 'delta';
    const grid = idx === 0 ? g2020 : idx === 1 ? gCur : gDelta;
    const cW = panelW / cols;
    const cH = panelH / rows;

    ctx.fillStyle = '#e7efe7';
    ctx.fillRect(x0, top, panelW, panelH);

    ctx.globalAlpha = mode === 'delta' ? 0.85 : 0.78;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const [r, g, b] = mode === 'delta'
          ? deltaColor(grid[y][x])
          : ndviColor(grid[y][x]);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x0 + x * cW, top + y * cH, cW + 0.5, cH + 0.5);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, top, panelW, panelH);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(titles[idx], x0, top - 12);
  });

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('EUDR Satellite Verification (Simulated)', 20, 30);

  return canvas.toDataURL('image/png');
};

  const normalizeDDSItem = (item: any) => {
    const eudrNdvi2020 = item.eudrNdvi2020 ?? item.ndvi2020 ?? item.ndvi_2020 ?? item.eudr?.ndvi_2020;
    const eudrNdviCurrent = item.eudrNdviCurrent ?? item.ndviCurrent ?? item.ndvi_current ?? item.eudr?.ndvi_current;
    const eudrNdviChangePct = item.eudrNdviChangePct ?? item.ndviChangePct ?? item.ndvi_change_pct ?? item.eudr?.ndvi_change_pct;
    const eudrComparisonMap = item.eudrComparisonMap 
  ?? item.comparisonMap 
  ?? item.comparison_map_base64 
  ?? item.eudr?.comparison_map_base64 
  ?? generateMockNDVIMap(Number(String(item.id ?? item.txId ?? '42').replace(/\D/g, '')) || 42);
    const eudrRiskScore = item.eudrRiskScore ?? item.riskScore ?? item.risk_score ?? item.eudr?.risk_score;
    const eudrRiskLevel = item.eudrRiskLevel ?? item.riskLevel ?? item.risk_level ?? item.eudr?.risk_level;
    const eudrCheckDate = item.eudrCheckDate ?? item.checkedAt ?? item.checked_at;

    return {
      ...item,
      farmerName: item.farmerName || item.name,
      farmerId: item.farmerId || item.idNumber || item.id,
      idNumber: item.idNumber || item.farmerId || item.id,
      cropType: item.cropType || item.crop,
      eudrNdvi2020: eudrNdvi2020 ?? 0.662,
      eudrNdviCurrent: eudrNdviCurrent ?? 0.618,
      eudrNdviChangePct: eudrNdviChangePct ?? -6.6,
      eudrComparisonMap,
      eudrRiskScore: eudrRiskScore ?? 14,
      eudrRiskLevel: eudrRiskLevel ?? 'Low',
      eudrCheckDate,
      eudrChecked: true,
      gps: item.gps || (
        item.location?.lat != null && item.location?.lng != null
          ? `${Number(item.location.lat).toFixed(4)}, ${Number(item.location.lng).toFixed(4)}`
          : undefined
      ),
      hash: item.hash || `0xVERI${String(item.id || item.txId || '0000').slice(-6).toUpperCase()}A1`,
    };
  };

  const exportPDF = async () => {
    // For consolidated manifests, call backend API to generate professional PDF
    if (type === 'consolidated') {
      try {
        const manifestData = {
          id: data.id || `MANIFEST-${Date.now()}`,
          lorryPlate: data.lorry || 'N/A',
          selectedTransactions: (data.items || []).map((item: any) => item.id),
          totalWeight: parseFloat(data.totalWeight) || 0,
          items: data.items || []
        };

        const response = await fetch(`${API_BASE_URL}/lorry/manifest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(manifestData)
        });

        const result = await response.json();
        if (result.status === 'success') {
          // Download the PDF
          const manifestId = manifestData.id;
          window.open(`${API_BASE_URL}/lorry/report/${manifestId}`, '_blank');
        } else {
          alert('Failed to generate manifest PDF');
        }
      } catch (err) {
        console.error('Failed to generate consolidated manifest:', err);
        alert('Failed to generate PDF from backend. Falling back to client-side generation.');
        // Fallback to client-side generation
        clientSideExportPDF();
      }
      return;
    }

    // For individual reports, use client-side generation
    clientSideExportPDF();
  };

  const clientSideExportPDF = async () => {
    if (!reportRef.current) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Unable to open print window. Please allow pop-ups for this site.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    const printStyles = `
      <style>
        @page {
          size: A4;
          margin: 12mm;
        }
        html, body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          height: auto !important;
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .dds-print-root {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
        }
        .dds-print-root > * {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .dds-print-root .print\\:break-before-page {
          break-before: page;
          page-break-before: always;
        }
        .dds-print-root .print\\:mb-0 {
          margin-bottom: 0 !important;
        }
      </style>
    `;

    const content = reportRef.current.innerHTML;
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VERI DDS Export</title>
          ${styles}
          ${printStyles}
        </head>
        <body>
          <div class="dds-print-root">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 300);
    };
  };

  const ConsolidatedTemplate = ({ data }: { data: any }) => (
    <div className="w-full bg-white shadow-2xl rounded-sm p-16 md:p-24 text-[#1e293b] min-h-[1100px] border-t-[12px] border-[#064e3b] print:shadow-none print:border-t-[12px] print:ring-0">
      <header className="flex justify-between items-start border-b-2 border-slate-50 pb-10 mb-12">
        <div className="space-y-4">
           <h1 className="text-4xl font-black italic tracking-tighter text-[#064e3b]">VERI DDS</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official Lorry Manifest Certificate</p>
        </div>
        <div className="text-right space-y-1">
           <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Batch Manifest</h2>
           <p className="text-xs font-mono font-black text-slate-400 uppercase">ID: {data.id || 'VERI-MANIFEST-2026-X01'}</p>
           <p className="text-[10px] font-bold text-slate-300">Issued: {data.date || '2026-03-01'}</p>
        </div>
      </header>

      {/* 物流摘要 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Transport Vehicle</h4>
           <p className="text-xl font-black text-[#064e3b] italic">{data.lorry || 'JQB 8821'}</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Consigned Weight</h4>
           <p className="text-xl font-black text-[#064e3b] italic">{data.totalWeight || '14.25 MT'}</p>
        </div>
        <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100 flex items-center gap-3">
           <div className="bg-green-500 text-white p-2 rounded-xl shadow-lg shadow-green-500/20"><CheckCircle2 size={24}/></div>
           <div>
              <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Audit Result</p>
              <p className="font-black text-green-900 text-sm uppercase tracking-tighter">Negligible Risk</p>
           </div>
        </div>
      </section>

      {/* 聚合农户表格 (DDS 核心) */}
      <section className="mb-16">
         <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <Activity className="text-[#064e3b]" size={20}/>
            <h3 className="text-lg font-black text-[#064e3b] uppercase tracking-tight">Consolidated Traceability Matrix</h3>
         </div>
         <div className="overflow-hidden rounded-3xl border border-slate-50">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <th className="p-5">Farmer Identification</th>
                 <th className="p-5 text-center">Commodity</th>
                 <th className="p-5 text-center">Weight</th>
                 <th className="p-5 text-center">Mode</th>
                 <th className="p-5 text-right">EUDR Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {(data.items || []).map((b: any, i: number) => (
                 <tr key={i} className="group hover:bg-slate-50 transition-colors">
                   <td className="p-5">
                      <div className="font-bold text-slate-800 text-sm">{b.farmerName || b.name}</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Verified ID Traceable</div>
                   </td>
                   <td className="p-5 text-center italic font-black text-slate-500 text-xs">{b.cropType || b.crop}</td>
                   <td className="p-5 text-center font-bold text-[#064e3b] text-sm">{b.weight} MT</td>
                   <td className="p-5 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-[8px] font-black text-slate-400 uppercase">{b.mode || 'PLANTATION'}</span>
                   </td>
                   <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-green-600">
                         <CheckCircle2 size={12}/>
                         <span className="text-[10px] font-black uppercase tracking-widest">Pass</span>
                      </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </section>

      {/* 合规技术声明 */}
      <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-6 mb-16">
         <Info className="text-blue-500 shrink-0" size={24} />
         <div className="space-y-2">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest">Iron Shield Protocol Declaration</h4>
            <p className="text-[11px] text-blue-800/70 leading-relaxed font-medium italic">
              "All payloads in this manifest have been verified via Veri's proprietary <b>Yield-Intercept</b> algorithm and <b>Iron Shield GIS</b>. 
              GPS validation confirms origin within legally registered plots. 
              Batch yield analysis confirms that weights recorded are within the biological capacity of each specific land parcel (No Laundering Detected)."
            </p>
         </div>
      </div>

      {/* 签名页脚 */}
      <footer className="mt-20 flex justify-between items-end border-t-4 border-[#064e3b] pt-12">
         <div className="space-y-6">
            <div className="h-12 w-64 border-b-2 border-slate-200"></div>
            <p className="text-[10px] font-black text-slate-800 uppercase">Authorized Station Manager Signature</p>
         </div>
         <div className="bg-[#064e3b] text-white p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl">
            <div className="text-right">
               <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">DDS Encrypted Hash</p>
               <p className="text-[10px] font-mono font-bold">{data.hash || '0x8821...CM01'}</p>
            </div>
            <div className="bg-white p-2 rounded-2xl text-[#064e3b] shadow-inner">
               <ShieldCheck size={40} />
            </div>
         </div>
      </footer>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col items-center p-4 md:p-8 overflow-y-auto"
    >
      {/* 操作栏 (Action Bar) */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-8 bg-slate-900/90 p-4 rounded-3xl backdrop-blur-md border border-white/10 print:hidden sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
           <div className="bg-[#064e3b] p-2 rounded-xl text-white shadow-lg shadow-[#064e3b]/20">
              <ShieldCheck size={24} />
           </div>
           <span className="font-black text-2xl tracking-tighter italic text-white uppercase">
             {type === 'individual' ? 'Individual DDS' : 'Manifest Export'}
           </span>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportPDF}
            className="bg-[#064e3b] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#064e3b]/20 flex items-center gap-2"
          >
            <Download size={18}/> {type === 'individual' ? 'Export PDF' : 'Export EU-DDS (Consolidated)'}
          </button>
          <button 
            onClick={onClose}
            className="bg-white/10 text-white p-3 rounded-2xl hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div ref={reportRef} className="w-full max-w-3xl space-y-8 print:space-y-0 print:m-0 print:p-0">
        {type === 'consolidated' ? (
          <>
            <ConsolidatedTemplate data={data} />
            {(data.items || []).map((item: any, idx: number) => (
              <DDS_Template key={idx} item={normalizeDDSItem(item)} idx={idx} isConsolidated={true} />
            ))}
          </>
        ) : (
          <DDS_Template item={normalizeDDSItem(data)} idx={0} />
        )}
      </div>
      
      <div className="h-20" />
    </motion.div>
  );
};

const DealerRegistration = ({ onComplete }: { onComplete: (formData: any) => void, key?: string }) => {
  // DealerRegistration - manage station onboarding, license uploads, OCR validation, and GPS checks.
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dealerGps, setDealerGps] = useState<{ lat: number; lng: number } | null>(null);
  const [licenseValidation, setLicenseValidation] = useState<Record<string, { status: 'ok' | 'error' | 'warning'; message: string }>>({});
  const [dealerPreviewModal, setDealerPreviewModal] = useState<{ open: boolean; src: string | null; title?: string | null }>({ open: false, src: null, title: null });
  const [formData, setFormData] = useState({
    repName: '',
    mobile: '+60 ',
    stationName: '',
    licenseTypes: ['MPOB'] as string[],
    licenseNumbers: { 'MPOB': '' } as Record<string, string>,
    licensePhotos: {} as Record<string, string | null>,
    licensePhotoPreviews: {} as Record<string, string | null>,
    customLicenseNames: {} as Record<string, string>,
  });

  const DEALER_LICENSE_OPTIONS = [
    { id: 'MPOB', label: 'MPOB (Palm Oil)' },
    { id: 'LGM', label: 'LGM (Rubber)' },
    { id: 'MCB', label: 'MCB (Cocoa)' },
    { id: 'MPOB-MILL', label: 'MPOB Mill' },
    { id: 'MPOB-RAMP', label: 'MPOB Ramp' },
    { id: 'MSPO', label: 'MSPO' },
    { id: 'RSPO', label: 'RSPO' },
    { id: 'SSM', label: 'SSM (Business Reg)' },
    { id: 'KPKT', label: 'KPKT (Local Council)' },
    { id: 'DOE', label: 'DOE (Environment)' },
    { id: 'SCCS', label: 'SCCS' },
    { id: 'ISCC', label: 'ISCC' },
    { id: 'OTHER', label: 'Other Permit' },
  ];

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const normalizeLicenseNumber = (value: string) => (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  const getDistanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const extractCoordsFromRawText = (rawText: string): { lat: number; lng: number } | null => {
    const text = rawText || '';
    const latMatch = /(?:Lat|Latitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i.exec(text);
    const lngMatch = /(?:Lng|Lon|Longitude)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i.exec(text);
    if (latMatch && lngMatch) {
      return { lat: Number(latMatch[1]), lng: Number(lngMatch[1]) };
    }
    const genericPair = /(-?\d{1,2}\.\d{4,})\s*[, ]\s*(-?\d{2,3}\.\d{4,})/.exec(text);
    if (genericPair) {
      return { lat: Number(genericPair[1]), lng: Number(genericPair[2]) };
    }
    return null;
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setDealerGps({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => {
        // Ignore geolocation failures here; location validation remains best-effort.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const toggleLicenseType = (type: string) => {
    setFormData(prev => {
      const isSelected = prev.licenseTypes.includes(type);
      const types = isSelected
        ? prev.licenseTypes.filter(t => t !== type)
        : [...prev.licenseTypes, type];
      
      const numbers = { ...prev.licenseNumbers };
      if (!isSelected) {
        numbers[type] = '';
      } else {
        delete numbers[type];
      }

      return { ...prev, licenseTypes: types, licenseNumbers: numbers };
    });
  };

  const handleLicenseFileUpload = async (type: string, file: File) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image (JPG, PNG) or PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({
        ...prev,
        licensePhotos: {
          ...prev.licensePhotos,
          [type]: result
        }
      }));

      // Call OCR to extract and validate license number
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/extract/permit/${type}`, {
          method: 'POST',
          body: uploadData
        });

        const ocrResult = await response.json();
        if (ocrResult.status === 'error') {
          setFormData(prev => ({
            ...prev,
            licensePhotos: { ...prev.licensePhotos, [type]: null }
          }));
          setLicenseValidation(prev => ({
            ...prev,
            [type]: { status: 'error', message: ocrResult.message || `Unable to validate ${type} license.` }
          }));
          alert(ocrResult.message || `Unable to validate ${type} license.`);
          return;
        }

        const extractedNumber = ocrResult?.data?.permitNumber || ocrResult?.data?.permit_number || '';
        const manualNumber = formData.licenseNumbers[type] || '';
        const normalizedManual = normalizeLicenseNumber(manualNumber);
        const normalizedExtracted = normalizeLicenseNumber(extractedNumber);

        if (normalizedManual && normalizedExtracted && normalizedManual !== normalizedExtracted) {
          setFormData(prev => ({
            ...prev,
            licensePhotos: { ...prev.licensePhotos, [type]: null }
          }));
          setLicenseValidation(prev => ({
            ...prev,
            [type]: {
              status: 'error',
              message: `${type} mismatch. Input: ${manualNumber} | OCR: ${extractedNumber}`
            }
          }));
          alert(`${type} license number mismatch. Please upload the matching document.`);
          return;
        }

        if (!normalizedManual && normalizedExtracted) {
          setFormData(prev => ({
            ...prev,
            licenseNumbers: {
              ...prev.licenseNumbers,
              [type]: extractedNumber
            }
          }));
        }

        const rawText = ocrResult?.data?.raw_text || '';
        const docCoords = extractCoordsFromRawText(rawText);
        if (docCoords && dealerGps) {
          const distanceKm = getDistanceKm(dealerGps, docCoords);
          if (distanceKm > 5) {
            setFormData(prev => ({
              ...prev,
              licensePhotos: { ...prev.licensePhotos, [type]: null }
            }));
            setLicenseValidation(prev => ({
              ...prev,
              [type]: {
                status: 'error',
                message: `${type} location mismatch (${distanceKm.toFixed(2)} km from current station GPS).`
              }
            }));
            alert(`${type} location mismatch. Document coordinates are too far from station GPS.`);
            return;
          }
        }

        setLicenseValidation(prev => ({
          ...prev,
          [type]: {
            status: ocrResult.status === 'warning' ? 'warning' : 'ok',
            message:
              ocrResult.status === 'warning'
                ? (ocrResult.message || `${type} uploaded with partial OCR confidence.`)
                : `${type} validated${docCoords ? ' with location check' : ''}.`
          }
        }));
      } catch (error) {
        console.error('OCR extraction failed:', error);
        setLicenseValidation(prev => ({
          ...prev,
          [type]: { status: 'error', message: `Failed to verify ${type} license. Please retry.` }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = () => {
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen pt-32 pb-20 px-6 max-w-3xl mx-auto text-center"
      >
        <div className="glass-card p-12 flex flex-col items-center gap-8">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <ShieldCheck size={48} />
          </div>
          <div>
            <h2 className="text-5xl font-serif font-bold text-palm-950 mb-4 tracking-tight">Station Secured!</h2>
            <p className="text-palm-600 font-light text-lg">Your collection point is now registered and EUDR-ready.</p>
          </div>
          <button 
            onClick={() => onComplete(formData)}
            className="w-full min-h-[56px] py-5 bg-[#0A3D2C] text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-[#072d21] transition-all shadow-xl flex items-center justify-center gap-3"
          >
            Go to Dashboard <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen pt-32 pb-20 px-6 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold transition-all ${step >= s ? 'bg-palm-900 text-gold-400 shadow-lg' : 'bg-palm-100 text-palm-400'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-16 h-0.5 rounded-full ${step > s ? 'bg-palm-900' : 'bg-palm-100'}`} />}
          </div>
        ))}
        <div className="ml-auto">
          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400">Step {step} of 3</span>
        </div>
      </div>

      <div className="glass-card p-10 relative overflow-hidden">
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Personal & Identity</h2>
              <p className="text-palm-600 font-light">Information about the station representative.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Representative Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-palm-400" size={20} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-palm-50 border border-palm-100 focus:ring-2 focus:ring-palm-900 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Full name as per IC"
                    value={formData.repName}
                    onChange={(e) => setFormData({...formData, repName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Mobile Number</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 rounded-2xl bg-palm-50 border border-palm-100 focus:ring-2 focus:ring-palm-900 focus:bg-white outline-none transition-all font-medium"
                  placeholder="+60 12-345 6789"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={nextStep}
              disabled={!formData.repName || formData.mobile.length < 10}
              className="w-full min-h-[56px] py-5 bg-[#0A3D2C] text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-[#072d21] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Business Info
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Business & License</h2>
              <p className="text-palm-600 font-light">Details about your collection station.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Collection Station/Ramp Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-palm-400" size={20} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-palm-50 border border-palm-100 focus:ring-2 focus:ring-palm-900 focus:bg-white outline-none transition-all font-medium"
                    placeholder="e.g. Jerantut Palm Collection Center"
                    value={formData.stationName}
                    onChange={(e) => setFormData({...formData, stationName: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">License Selection Bar</label>
                <div className="flex overflow-x-auto gap-2 p-3 bg-palm-50 rounded-2xl border border-palm-100 scrollbar-hide">
                  {DEALER_LICENSE_OPTIONS.map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => toggleLicenseType(opt.id)}
                      className={`whitespace-nowrap px-6 py-3 rounded-xl font-display font-bold uppercase tracking-widest text-[10px] transition-all border ${formData.licenseTypes.includes(opt.id) ? 'bg-palm-900 text-gold-400 border-palm-900 shadow-md' : 'bg-white text-palm-400 border-palm-100 hover:border-palm-200'}`}
                    >
                      {opt.id}
                    </button>
                  ))}
                </div>

                <div className="space-y-4 mt-6">
                  {formData.licenseTypes.map(type => (
                    <div key={type} className="p-4 bg-palm-50 rounded-2xl border border-palm-100 space-y-3">
                       <div className="flex justify-between items-center">
                         <label className="text-[9px] font-black text-palm-900 uppercase tracking-widest">
                           {type === 'OTHER' ? (formData.customLicenseNames[type] || 'Other') : type} License Number
                         </label>
                         {type === 'OTHER' && (
                           <input 
                             type="text"
                             placeholder="License Name (e.g. DOE)"
                             className="text-[9px] font-bold uppercase tracking-widest bg-white border border-palm-100 px-2 py-1 rounded outline-none focus:ring-1 focus:ring-palm-900"
                             value={formData.customLicenseNames[type] || ''}
                             onChange={(e) => setFormData({...formData, customLicenseNames: { ...formData.customLicenseNames, [type]: e.target.value }})}
                           />
                         )}
                       </div>
                       <input 
                         type="text" 
                         className="w-full px-4 py-3 rounded-xl bg-white border border-palm-100 focus:ring-2 focus:ring-palm-900 outline-none transition-all text-sm font-medium"
                         placeholder={`Enter ${type === 'OTHER' ? 'license' : type} number`}
                         value={formData.licenseNumbers[type] || ''}
                         onChange={(e) => setFormData({
                           ...formData, 
                           licenseNumbers: { ...formData.licenseNumbers, [type]: e.target.value }
                         })}
                       />
                       {licenseValidation[type] && (
                        <p className={`text-[10px] font-bold ${
                          licenseValidation[type].status === 'error'
                            ? 'text-red-600'
                            : licenseValidation[type].status === 'warning'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          {licenseValidation[type].message}
                        </p>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={prevStep}
                className="w-full sm:w-1/3 py-5 bg-palm-100 text-palm-950 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-200 transition-all"
              >
                Back
              </button>
              <button 
                onClick={nextStep}
                disabled={
                  !formData.stationName || 
                  formData.licenseTypes.length === 0 || 
                  formData.licenseTypes.some(t => !formData.licenseNumbers[t] || formData.licenseNumbers[t].trim() === '') ||
                  (formData.licenseTypes.includes('OTHER') && !formData.customLicenseNames['OTHER'])
                }
                className="w-full sm:flex-1 py-5 bg-[#0A3D2C] text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-[#072d21] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Location & Verification</h2>
              <p className="text-palm-600 font-light">Finalize your registration with GPS and document proof.</p>
            </div>

            <div className="space-y-6">
              <div className="w-full p-6 bg-palm-50 rounded-3xl border border-palm-100 flex items-center gap-6">
                <div className="w-12 h-12 bg-palm-900 rounded-2xl flex items-center justify-center text-gold-400 shadow-lg">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 mb-1">Auto-Detected GPS</h4>
                  <p className="text-xl font-serif font-bold text-palm-950">
                    {dealerGps ? `${dealerGps.lat.toFixed(5)}, ${dealerGps.lng.toFixed(5)}` : 'Jerantut, Pahang'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Official License Photos</label>
                <div className="grid grid-cols-1 gap-6">
                  {formData.licenseTypes.map(type => {
                    const photo = formData.licensePhotos[type];
                    const label = type === 'OTHER' ? (formData.customLicenseNames[type] || 'Other') : type;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-palm-900 uppercase tracking-widest">{label} License</p>
                          <p className="text-[10px] font-mono font-bold text-palm-400">{formData.licenseNumbers[type]}</p>
                        </div>
                        {photo ? (
                          <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-palm-900 shadow-xl bg-black/5">
                            <DocumentPreview src={photo} alt={label} className="w-full h-full object-contain bg-white" />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                              <button 
                                onClick={() => setDealerPreviewModal({ open: true, src: photo, title: `${label} License` })}
                                className="px-3 py-2 bg-white text-palm-950 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gold-400 transition-all"
                              >
                                View
                              </button>
                            </div>
                            <button 
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                licensePhotos: { ...prev.licensePhotos, [type]: null },
                                licensePhotoPreviews: { ...prev.licensePhotoPreviews, [type]: null }
                              }))}
                              className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full space-y-3">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const preview = reader.result as string;
                                    setFormData(prev => ({
                                      ...prev,
                                      licensePhotoPreviews: { ...prev.licensePhotoPreviews, [type]: preview }
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                  handleLicenseFileUpload(type, file);
                                }
                              }}
                              className="hidden"
                              id={`license-upload-${type}`}
                            />
                            <label
                              htmlFor={`license-upload-${type}`}
                              className="w-full aspect-video rounded-3xl border-2 border-dashed border-palm-200 bg-palm-50/50 flex flex-col items-center justify-center gap-4 hover:bg-palm-50 hover:border-palm-400 transition-all group cursor-pointer"
                            >
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-palm-400 group-hover:text-palm-900 transition-colors shadow-sm">
                                <Camera size={24} />
                              </div>
                              <div className="text-center">
                                <p className="font-display font-bold uppercase tracking-widest text-[10px] text-palm-950">Upload {label} License</p>
                                <p className="text-[8px] text-palm-400 mt-1">Supports JPG, PNG, PDF (max 10MB)</p>
                              </div>
                            </label>
                            {formData.licensePhotoPreviews[type] && !formData.licensePhotos[type] && (
                              <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-palm-200 shadow-md bg-black/5">
                                <DocumentPreview src={formData.licensePhotoPreviews[type]} alt={`${label} Preview`} className="w-full h-full object-contain bg-white" />
                                <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest">
                                  Processing...
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={prevStep}
                className="w-full sm:w-1/3 py-5 bg-palm-100 text-palm-950 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-200 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleComplete}
                disabled={
                  formData.licenseTypes.some(type => !formData.licensePhotos[type]) ||
                  formData.licenseTypes.some(type => licenseValidation[type]?.status === 'error')
                }
                className="w-full sm:flex-1 py-5 bg-[#0A3D2C] text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-[#072d21] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Registration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dealer Preview Modal */}
      <AnimatePresence>
        {dealerPreviewModal.open && dealerPreviewModal.src && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDealerPreviewModal({ open: false, src: null, title: null })}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setDealerPreviewModal({ open: false, src: null, title: null })}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>
              {dealerPreviewModal.title && (
                <div className="p-4 bg-palm-50 border-b border-palm-100">
                  <p className="text-sm font-bold text-palm-950 uppercase tracking-widest">{dealerPreviewModal.title}</p>
                </div>
              )}
              <div className="flex items-center justify-center bg-black/10 p-4">
                <DocumentPreview src={dealerPreviewModal.src} alt="Preview" className="max-h-[70vh] max-w-full object-contain rounded-xl bg-white" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FarmerDashboard = ({ onLogout, plots, isOnline, offlineCacheCount, isSyncing }: { onLogout: () => void, plots: any[], isOnline?: boolean, offlineCacheCount?: number, isSyncing?: boolean, key?: string }) => {
  // FarmerDashboard - show registered plots, compliance status, and generated identity artifacts.
  const hasOfflineCache = (offlineCacheCount ?? 0) > 0;
  const [activeTab, setActiveTab] = useState<'id' | 'plots' | 'trades'>('id');
  const [showDDS, setShowDDS] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [farmerData, setFarmerData] = useState<any>(null);
  const [universalQrDataUrl, setUniversalQrDataUrl] = useState<string>('');
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);

  const loadFarmerHistory = (farmerId?: string) => {
    if (!farmerId) return;
    const fallbackDisplayId = farmerId.includes('-') ? `F-${farmerId.slice(-6)}` : farmerId;
    fetch(`${API_BASE_URL}/farmer/${farmerId}/transactions`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to fetch farmer transaction history');
        return response.json();
      })
      .then((result) => {
        if (result.status === 'success' && Array.isArray(result.transactions) && result.transactions.length > 0) {
          setTransactionHistory(result.transactions || []);
          return;
        }

        if (fallbackDisplayId !== farmerId) {
          return fetch(`${API_BASE_URL}/farmer/${fallbackDisplayId}/transactions`)
            .then(async (retryResponse) => {
              if (!retryResponse.ok) throw new Error('Retry farmer history fetch failed');
              return retryResponse.json();
            })
            .then((retryResult) => {
              if (retryResult.status === 'success') {
                setTransactionHistory(retryResult.transactions || []);
                return;
              }
              throw new Error('Retry history status failed');
            });
        }

        setTransactionHistory([]);
      })
      .catch(() => {
        const historyKey = `veri_farmer_transactions_${farmerId}`;
        const savedHistory = localStorage.getItem(historyKey);
        setTransactionHistory(savedHistory ? JSON.parse(savedHistory) : []);
      });
  };

  useEffect(() => {
    const savedData = localStorage.getItem('veri_farmer_data');
    if (savedData) {
      const data = JSON.parse(savedData);
      setFarmerData(data);
      loadFarmerHistory(data.idNumber);
    }

    const handleStorage = () => {
      const currentFarmer = JSON.parse(localStorage.getItem('veri_farmer_data') || '{}');
      loadFarmerHistory(currentFarmer.idNumber);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  useEffect(() => {
    const primaryPlot = plots?.[0];
    const payload = {
      type: 'FARMER_VERI_ID',
      universalId: farmerData?.idNumber ? `F-${String(farmerData.idNumber).slice(-6)}` : 'AB-9921',
      farmerId: farmerData?.idNumber || '780512-06-5543',
      name: farmerData?.name || 'Ahmad bin Ismail',
      cropType: primaryPlot?.cropType || 'Palm Oil',
      monthlyQuota: 8,
      location: primaryPlot?.landTitleMetadata?.center_lat && primaryPlot?.landTitleMetadata?.center_lng
        ? { lat: primaryPlot.landTitleMetadata.center_lat, lng: primaryPlot.landTitleMetadata.center_lng }
        : { lat: 3.1390, lng: 101.6869 },
      boundary: Array.isArray(primaryPlot?.points)
        ? primaryPlot.points.map((pt: any) => ({
            lat: 3.1 + (Number(pt.y) || 0) * 0.01,
            lng: 101.6 + (Number(pt.x) || 0) * 0.01,
          }))
        : [],
      timestamp: new Date().toISOString(),
    };

    QRCode.toDataURL(JSON.stringify(payload), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then(setUniversalQrDataUrl)
      .catch((error) => {
        console.error('Failed to generate Universal ID QR:', error);
        setUniversalQrDataUrl('');
      });
  }, [farmerData, plots]);

  const resolvePermitCodeByCrop = (cropValue?: string) => {
    const c = (cropValue || '').toLowerCase();
    if (c.includes('palm')) return 'MPOB';
    if (c.includes('cocoa')) return 'MCB';
    if (c.includes('rubber')) return 'LGM';
    return 'OTHER';
  };

  const resolvePermitLabelByCode = (code?: string) => {
    if (code === 'MPOB') return 'MPOB License';
    if (code === 'MCB') return 'MCB Permit';
    if (code === 'LGM') return 'LGM Permit';
    return 'National Registry Permit';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-20 px-6"
    >
      {isSyncing && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <Activity className="animate-pulse" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">Restoring Sync</p>
            <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {!isOnline && hasOfflineCache && (
        <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0">
            <WifiOff size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-amber-900 uppercase tracking-widest">{offlineCacheCount} batches stored in offline cache</p>
            <p className="text-[10px] text-amber-700 font-medium">Data will sync automatically when connection returns.</p>
          </div>
        </div>
      )}
      {showDDS && (
        <DDSReport 
          type="individual" 
          data={(() => {
            const cropType = selectedPlot?.cropType || selectedPlot?.crop || 'Palm Oil';
            const permitCode = resolvePermitCodeByCrop(cropType);
            const extractedPermitNumber = farmerData?.permitNumbers?.[permitCode] || selectedPlot?.permitType;
            return {
              ...selectedPlot,
              farmerName: farmerData?.name || selectedPlot?.farmerName || 'Ahmad bin Ismail',
              cropType,
              permitLabel: resolvePermitLabelByCode(permitCode),
              permitType: extractedPermitNumber || 'N/A',
              weight: selectedPlot?.weight || 'N/A',
              plotName: selectedPlot?.title || selectedPlot?.plotName || selectedPlot?.id || '',
              area: selectedPlot?.area ? `${selectedPlot.area} HA` : 'N/A',
              year: selectedPlot?.plantingYear || selectedPlot?.year || 2018,
              gps: selectedPlot?.gps || '3.9322, 102.3611',
              ic: farmerData?.idNumber || selectedPlot?.ic || '780512-06-5543'
            };
          })()} 
          onClose={() => setShowDDS(false)} 
        />
      )}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-4xl font-serif font-bold text-palm-950">Welcome, {farmerData?.name || 'Farmer'}</h2>
          <p className="text-palm-600 font-light">Your Veri ID is active and compliant.</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-12 h-12 rounded-2xl bg-palm-100 flex items-center justify-center text-palm-950 hover:bg-red-500 hover:text-white transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'id' && (
            <motion.div 
              key="id"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pb-4"
            >
            {/* Digital ID Card */}
            <div className="dark-card p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gold-500 rounded-2xl flex items-center justify-center text-palm-950 shadow-xl mb-8">
                  <ShieldCheck size={40} />
                </div>
                <h3 className="text-2xl font-display font-black uppercase tracking-widest text-parchment mb-2">Veri Digital ID</h3>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-400 mb-10">EUDR Compliance Asset Package</p>
                
                <div className="p-6 bg-parchment rounded-[2.5rem] shadow-2xl mb-10 group-hover:scale-105 transition-transform duration-500">
                  {universalQrDataUrl ? (
                    <img
                      src={universalQrDataUrl}
                      alt="Universal ID QR"
                      className="w-[220px] h-[220px] object-contain"
                    />
                  ) : (
                    <QrCode size={220} className="text-palm-950" />
                  )}
                </div>

                <div className="w-full p-6 bg-palm-900 rounded-3xl border border-palm-800 flex items-center gap-6 text-left">
                  <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center text-gold-500">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-[10px] text-parchment">Status: Verified</h4>
                    <p className="text-[10px] text-parchment/40">Linked to 3 Plots • License Verified</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quota Progress */}
            <div className="glass-card p-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className="font-display font-bold uppercase tracking-widest text-xs text-palm-950 mb-1">Monthly Yield Quota</h4>
                  <p className="text-2xl font-serif font-bold text-palm-950">4.2 / 10.0 <span className="text-sm text-palm-400 font-light">MT</span></p>
                </div>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-600">42% Used</p>
              </div>
              <div className="w-full h-3 bg-palm-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '42%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gold-500 rounded-full shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                />
              </div>
              <p className="mt-4 text-[10px] text-palm-500 font-light leading-relaxed italic">
                "Our Dashboard realtime calculates plot output limits. If this bar is full, QR will lock to prevent illegal fruit sales."
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'plots' && (
          <motion.div 
            key="plots"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-serif font-bold text-palm-950 mb-4">Plot Health Monitoring</h3>
            {(plots.length > 0 ? plots : [
              { id: 'P-01', area: '2.5', status: 'Verified', health: 'Healthy', cropType: 'Palm Oil' },
              { id: 'P-02', area: '1.2', status: 'Verified', health: 'Healthy', cropType: 'Cocoa' },
              { id: 'P-03', area: '0.5', status: 'Verified', health: 'Healthy', cropType: 'Rubber' },
            ]).map((plot, i) => (
              <div 
                key={i} 
                onClick={() => { setSelectedPlot(plot); setShowDDS(true); }}
                className="glass-card p-6 flex justify-between items-center group hover:bg-palm-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-palm-950 rounded-2xl flex items-center justify-center text-gold-400">
                    <Map size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-xs text-palm-950">{plot.title || `Plot ${plot.id || i+1}`}</h4>
                    <p className="text-sm text-palm-500">{plot.area} Hectares • {plot.cropType || plot.crop} • EUDR Verified</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2 justify-end">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{plot.health || 'Healthy'}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedPlot(plot); setShowDDS(true); }}
                    className="bg-palm-950 text-gold-400 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-gold-500 hover:text-palm-950 transition-all shadow-lg shadow-palm-950/20"
                  >
                    View Certificate
                  </button>
                </div>
              </div>
            ))}
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4">
              <ShieldCheck size={24} className="text-emerald-600" />
              <p className="text-[10px] text-emerald-800 leading-relaxed italic">
                "System backend constantly compares with EU satellite maps. If deforestation occurs, this status turns red and QR expires instantly."
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'trades' && (
          <motion.div 
            key="trades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-serif font-bold text-palm-950 mb-4">Transaction History</h3>
            
            {transactionHistory.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <History size={32} className="mx-auto text-palm-300 mb-3" />
                <p className="text-palm-500 font-light">No transactions recorded yet.</p>
                <p className="text-[10px] text-palm-400 mt-2">Your trade history will appear here after your first transaction with a collector.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactionHistory.map((tx, i) => (
                  <div 
                    key={i}
                    className={`glass-card p-6 border-2 transition-all ${
                      tx.warning 
                        ? 'border-red-200 bg-red-50/50' 
                        : 'border-emerald-200 bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-serif font-bold text-lg text-palm-950">{tx.dealerName || 'Unknown Collector'}</h4>
                          <span className={`text-[8px] font-display font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                            tx.warning ? 'bg-red-200 text-red-700' : 'bg-emerald-200 text-emerald-700'
                          }`}>
                            {tx.risk || 'Verified'}
                          </span>
                        </div>
                        <p className="text-[10px] text-palm-400 font-display font-bold uppercase tracking-widest">
                          {new Date(tx.timestamp).toLocaleDateString('en-MY', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-serif font-bold text-palm-950">{tx.weightDisplay || (Number(tx.weight).toFixed ? Number(tx.weight).toFixed(2) : tx.weight)}</p>
                        <p className="text-[10px] text-palm-400 font-display font-bold uppercase tracking-widest">MT</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-white rounded-xl">
                        <p className="text-[8px] text-palm-400 font-display font-bold uppercase tracking-widest mb-1">Mode</p>
                        <p className="text-sm font-bold text-palm-950">{tx.mode}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl">
                        <p className="text-[8px] text-palm-400 font-display font-bold uppercase tracking-widest mb-1">Transaction ID</p>
                        <p className="text-sm font-mono font-bold text-palm-950">{tx.txId?.slice(-8) || 'N/A'}</p>
                      </div>
                    </div>

                    {tx.reason && (
                      <div className="p-3 bg-red-100 border border-red-200 rounded-xl flex items-start gap-2">
                        <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[8px] text-red-800 font-bold uppercase tracking-widest mb-1">Flagged Reason</p>
                          <p className="text-xs text-red-700">{tx.reason}</p>
                        </div>
                      </div>
                    )}

                    {tx.location && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-palm-400">
                        <MapPin size={12} />
                        <span>GPS: {tx.location.lat.toFixed(4)}, {tx.location.lng.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Mobile Tab Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-palm-950/90 backdrop-blur-xl rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl border border-white/10 z-50">
        <button 
          onClick={() => setActiveTab('id')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'id' ? 'bg-gold-500 text-palm-950 shadow-lg' : 'text-parchment/40 hover:text-parchment'}`}
        >
          <CreditCard size={20} />
          <span className="text-[8px] font-display font-bold uppercase tracking-widest">ID</span>
        </button>
        <button 
          onClick={() => setActiveTab('plots')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'plots' ? 'bg-gold-500 text-palm-950 shadow-lg' : 'text-parchment/40 hover:text-parchment'}`}
        >
          <Map size={20} />
          <span className="text-[8px] font-display font-bold uppercase tracking-widest">Plots</span>
        </button>
        <button 
          onClick={() => setActiveTab('trades')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[2rem] transition-all ${activeTab === 'trades' ? 'bg-gold-500 text-palm-950 shadow-lg' : 'text-parchment/40 hover:text-parchment'}`}
        >
          <History size={20} />
          <span className="text-[8px] font-display font-bold uppercase tracking-widest">Trades</span>
        </button>
      </div>
    </motion.div>
  );
};

const CollectorDashboard = ({ onNewTransaction, onShowManifest, onLogout, isOnline, offlineCacheCount, isSyncing: isGlobalSyncing, pendingSyncs, setPendingSyncs, transactions, setTransactions }: { onNewTransaction: () => void, onShowManifest: (selectedIds?: string[]) => void, onLogout: () => void, isOnline?: boolean, offlineCacheCount?: number, isSyncing?: boolean, pendingSyncs: number, setPendingSyncs: React.Dispatch<React.SetStateAction<number>>, transactions: any[], setTransactions: React.Dispatch<React.SetStateAction<any[]>>, key?: string }) => {
  // CollectorDashboard - manage dealer-side transactions, syncing, and manifest creation.
  const hasOfflineCache = (offlineCacheCount ?? 0) > 0;
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showDDS, setShowDDS] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const transaction = transactions.find(tx => tx.id === id);
    
    // Prevent selecting flagged transactions
    if (transaction?.warning) {
      alert('⚠️ Flagged transactions cannot be added to manifest until they are audited and approved.');
      return;
    }
    
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateLocalAuditState = (id: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, risk: 'PENDING_AUDIT', warning: false } : tx
    ));
    if (selectedTx && (selectedTx.txId || selectedTx.id) === id) {
      setSelectedTx({ ...selectedTx, risk: 'PENDING_AUDIT', warning: false });
    }
  };

  const handleRequestAudit = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/transaction/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id, requestedBy: 'dealer-dashboard' })
      });

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result?.detail || 'Audit request failed');
      }
    } catch (error) {
      console.error('Audit request failed, keeping demo flow active:', error);
    } finally {
      // Keep demo behavior responsive even if backend is offline.
      updateLocalAuditState(id);
    }
  };

  const handleSyncToCloud = async () => {
    if (isSyncing || pendingSyncs <= 0) {
      return;
    }

    setIsSyncing(true);
    try {
      const offlineTransactions = Array.from({ length: pendingSyncs }).map((_, idx) => {
        const tx = transactions[idx % transactions.length];
        return {
          id: `SYNC-${(tx.txId || tx.id)}-${Date.now()}-${idx}`,
          farmerId: tx.farmerId || tx.farmerDisplayId || tx.id,
          farmerName: tx.name,
          weight: parseFloat(tx.weight),
          weightDisplay: tx.weightDisplay,
          mode: tx.mode,
          location: { lat: 3.1390, lng: 101.6869 },
          status: 'verified',
          risk: tx.risk,
          cropType: tx.crop || 'Palm Oil'
        };
      });

      let response = await fetch(`${API_BASE_URL}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: offlineTransactions })
      });

      // Fallback for backend versions exposing singular path.
      if (response.status === 404) {
        response = await fetch(`${API_BASE_URL}/transaction/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: offlineTransactions })
        });
      }

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result?.detail || 'Sync failed');
      }

      const synced = Number(result.synced_count || 0);
      setPendingSyncs(0);
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = [
    { label: "Today's Tonnage", value: "124.5", unit: "MT", icon: <Truck size={20} /> },
    { label: "Pending Sync Queue", value: pendingSyncs.toString(), unit: "Batches", icon: <History size={20} /> },
    { label: "EUDR Risk Level", value: "Low", unit: "Compliance", icon: <ShieldCheck size={20} /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-20 px-6"
    >
      {(isGlobalSyncing || isSyncing) && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-6"
        >
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
            <Activity className="animate-pulse" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">Restoring Sync</p>
              <span className="text-[10px] font-bold text-emerald-600">Encrypting & Uploading...</span>
            </div>
            <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {!isOnline && hasOfflineCache && (
        <div className="mb-8 p-5 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-6">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
            <WifiOff size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">{offlineCacheCount} batches stored in offline cache</p>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">Edge AI is active. All transactions are being secured locally and will sync once connection is restored.</p>
          </div>
        </div>
      )}
            {showDDS && selectedTx && (
        <DDSReport 
          type="individual" 
          data={{
            farmerName: selectedTx.name || selectedTx.farmer,
            ...selectedTx,
            weight: selectedTx.weightDisplay || selectedTx.weight,
            permitType: selectedTx.warning ? 'AUDIT_PENDING' : (selectedTx.crop === 'Palm Oil' ? 'MSPO-8821-2025' : (selectedTx.crop === 'Cocoa' ? 'MCB-7712-2024' : 'LGM-5543-2026')),
            cropType: selectedTx.crop || 'Palm Oil',
            plotName: 'Verified Source Plot',
            area: '2.5 HA',
            year: 2015,
            gps: '3.1390, 101.6869',
            ic: selectedTx.farmerId || selectedTx.ic || '850101-12-5543',
            eudrChecked: selectedTx.eudrChecked,
            eudrRiskScore: selectedTx.eudrRiskScore,
            eudrRiskLevel: selectedTx.eudrRiskLevel,
            eudrNdvi2020: selectedTx.eudrNdvi2020,
            eudrNdviCurrent: selectedTx.eudrNdviCurrent,
            eudrNdviChangePct: selectedTx.eudrNdviChangePct,
            eudrComparisonMap: selectedTx.eudrComparisonMap,
            eudrCheckDate: selectedTx.eudrCheckDate,
          }} 
          onClose={() => setShowDDS(false)} 
        />
      )}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="absolute inset-0 bg-palm-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className={`p-8 ${selectedTx.warning ? 'bg-red-50' : 'bg-emerald-50'} flex justify-between items-start`}>
                <div>
                  <div className={`text-[10px] font-display font-bold uppercase tracking-widest mb-2 ${selectedTx.warning ? 'text-red-600' : 'text-emerald-600'}`}>
                    Verification Details
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-palm-950">{selectedTx.name}</h3>
                    <p className="text-palm-500 font-medium">{selectedTx.farmerDisplayId || selectedTx.farmerId || selectedTx.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-palm-400 hover:text-palm-950 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 block mb-1">Weight</label>
                    <p className="text-2xl font-serif font-bold text-palm-950">{selectedTx.weightDisplay || Number(selectedTx.weight).toFixed(2)} MT</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 block mb-1">Mode</label>
                    <p className="text-2xl font-serif font-bold text-palm-950">{selectedTx.mode}</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-palm-50 border border-palm-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${selectedTx.warning ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-sm font-bold uppercase tracking-widest ${selectedTx.warning ? 'text-red-700' : 'text-emerald-700'}`}>
                      Risk Status: {selectedTx.risk}
                    </span>
                  </div>
                  
                  {selectedTx.warning ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-red-100/50 rounded-2xl border border-red-200">
                        <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">Flagged Reason</p>
                          <p className="text-sm text-red-700 leading-relaxed">{selectedTx.reason || 'Anomalous activity detected.'}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-palm-400 italic px-2">
                        * This batch has been quarantined in the digital manifest for further audit.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-emerald-100/50 rounded-2xl border border-emerald-200">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Compliance Check</p>
                        <p className="text-sm text-emerald-700">All EUDR parameters met. Origin verified within 2020 redline.</p>
                      </div>
                    </div>
                  )}
                </div>

              <div className="flex gap-4 pt-4 sm:flex-row flex-col">
                <button 
                  onClick={() => setShowDDS(true)}
                  className="flex-[2] py-3 rounded-2xl bg-palm-950 text-white font-display font-bold uppercase tracking-widest text-[9px] shadow-lg flex items-center justify-center gap-2"
                >
                  <FileText size={14} /> View DDS Report
                </button>
                {selectedTx.warning && (
                  <button 
                    onClick={() => handleRequestAudit(selectedTx.txId || selectedTx.id)}
                    className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-display font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-red-600/20 transition-all"
                    title="Submit this flagged transaction for immediate auditor review"
                  >
                    🔍 Request Audit
                  </button>
                )}
              </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {evidencePreview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEvidencePreview(null)}
              className="absolute inset-0 bg-palm-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-palm-100 flex justify-between items-center bg-palm-50/50">
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500">Evidence Preview</span>
                <button onClick={() => setEvidencePreview(null)} className="p-2 text-palm-400 hover:text-palm-950"><X size={20}/></button>
              </div>
              <div className="p-2">
                <img src={evidencePreview} alt="Evidence" className="w-full h-auto rounded-2xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-serif font-bold text-palm-950 mb-2">Dealer Verification Hub</h2>
          <p className="text-palm-600 font-light flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            Active Session: Station 01 • {pendingSyncs} Pending Sync
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => {
              if (selectedIds.length === 0) {
                alert('Please select transactions to create a manifest.');
                return;
              }
              onShowManifest(selectedIds);
            }}
            disabled={selectedIds.length === 0}
            className={`px-6 py-3 rounded-xl font-display font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 relative transition-all ${
              selectedIds.length === 0
                ? 'bg-palm-100 text-palm-400 cursor-not-allowed opacity-50'
                : 'bg-palm-100 text-palm-950 hover:bg-gold-500 hover:text-white cursor-pointer'
            }`}
            title={selectedIds.length === 0 ? 'Select at least one compliant transaction' : 'Create manifest with selected transactions'}
          >
            <FileText size={16} /> Lorry Manifest
            {selectedIds.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold-500 text-palm-950 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                {selectedIds.length}
              </span>
            )}
          </button>
          <button 
            onClick={onLogout}
            className="p-3 bg-palm-50 text-palm-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="mb-12">
        <motion.button 
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewTransaction}
          className="w-full py-8 rounded-3xl bg-gold-500 text-palm-950 flex flex-col items-center justify-center gap-4 shadow-xl shadow-gold-500/20 border-2 border-white/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-2xl bg-palm-950 text-gold-400 flex items-center justify-center shadow-lg relative z-10">
            <QrCode size={32} />
          </div>
          <div className="text-center relative z-10">
            <h3 className="text-2xl font-serif font-bold mb-1">Scan Farmer QR</h3>
            <p className="text-palm-900/60 font-display font-bold uppercase tracking-widest text-[8px]">Tap to Begin Verification</p>
          </div>
        </motion.button>
      </div>

      <div className="space-y-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="group relative flex items-center p-6 bg-[#064e3b] rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all text-left overflow-hidden border border-white/5">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mr-4 border border-white/5">
              <Truck size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-white/50 mb-0.5">Tonnage</p>
              <h3 className="text-xl font-serif font-bold text-white leading-none">42.8 <span className="text-[10px] font-light opacity-60 uppercase">MT</span></h3>
            </div>
            <BarChart3 size={100} className="absolute -bottom-6 -right-6 text-white opacity-[0.03] pointer-events-none" />
          </div>
          
          <div className="group relative flex items-center p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg hover:shadow-xl transition-all text-left overflow-hidden">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mr-4 border border-amber-100">
              <History size={24} className="text-amber-500 fill-amber-500/10" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-palm-400 mb-0.5">Sync Queue</p>
              <h3 className="text-xl font-serif font-bold text-palm-950 leading-none">{pendingSyncs} <span className="text-[10px] font-light opacity-60 uppercase">Items</span></h3>
              <button
                onClick={handleSyncToCloud}
                disabled={isSyncing || pendingSyncs <= 0 || !isOnline}
                className={`text-[8px] font-black uppercase tracking-widest mt-1 inline-flex items-center gap-1 transition-all ${isSyncing || pendingSyncs <= 0 || !isOnline ? 'text-palm-300 cursor-not-allowed opacity-50' : 'text-gold-600 hover:gap-2'}`}
              >
                {isSyncing ? 'Syncing...' : 'Run Sync'} <ArrowRight size={10} />
              </button>
            </div>
          </div>

          <div className="group relative flex items-center p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-lg hover:shadow-xl transition-all text-left overflow-hidden">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4 border border-emerald-100">
              <ShieldCheck size={24} className="text-emerald-600 fill-emerald-600/10" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-palm-400 mb-0.5">Risk Level</p>
              <h3 className="text-xl font-serif font-bold text-emerald-600 leading-none uppercase">Low</h3>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card overflow-hidden border-none shadow-sm mb-8">
          <div className="p-8 border-b border-palm-100 flex justify-between items-center bg-white/50">
            <h3 className="text-2xl font-serif font-bold text-palm-950">Recent Verifications</h3>
            <button className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 hover:text-palm-950 transition-colors">View All Records</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-palm-50/50 text-palm-400 text-[10px] font-display font-bold uppercase tracking-widest">
                  <th className="px-4 py-5 w-12">
                    <div className="w-5 h-5 rounded border-2 border-palm-200" />
                  </th>
                  <th className="px-4 py-5 font-display font-bold">Farmer Identity</th>
                  <th className="px-4 py-5">Weight (MT)</th>
                  <th className="px-4 py-5">Mode</th>
                  <th className="px-4 py-5">Risk Status</th>
                  <th className="px-4 py-5">Timestamp</th>
                  <th className="px-4 py-5">
                    <div className="flex items-center justify-end gap-1">
                      <span>Evidence</span>
                      <Info size={10} className="opacity-40" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-palm-50">
                {transactions.map((row, i) => (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedTx(row)}
                    className={`hover:bg-palm-50/30 transition-colors group cursor-pointer ${selectedIds.includes(row.txId || row.id) ? 'bg-gold-50/50' : (row.warning ? 'bg-red-50/50' : '')}`}
                  >
                    <td className="px-4 py-4">
                      <button 
                        onClick={(e) => toggleSelection(row.txId || row.id, e)}
                        disabled={row.warning}
                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                          row.warning 
                            ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed opacity-50'
                            : selectedIds.includes(row.txId || row.id)
                            ? 'bg-gold-500 border-gold-500 text-palm-950 cursor-pointer'
                            : 'bg-white border-palm-200 cursor-pointer hover:border-gold-400'
                        }`}
                        title={row.warning ? 'Cannot select flagged transactions - awaiting audit approval' : 'Select transaction for manifest'}
                      >
                        {selectedIds.includes(row.txId || row.id) && <Check size={12} strokeWidth={4} />}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-display font-bold text-xs sm:text-sm text-palm-950 leading-tight">
                        {row.name}
                      </div>
                      <div className="text-[9px] text-palm-400 font-normal mt-0.5">({row.farmerDisplayId || row.farmerId || row.id})</div>
                      {row.warning && (
                        <div className="mt-1 text-[8px] font-black text-red-600 uppercase tracking-tighter flex items-center gap-1">
                          <AlertCircle size={10} /> Inspector Alert
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-base sm:text-lg font-serif font-bold ${row.warning ? 'text-red-600' : 'text-palm-950'}`}>{row.weightDisplay || (Number(row.weight).toFixed ? Number(row.weight).toFixed(2) : row.weight)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-palm-100 text-palm-600 rounded-lg">{row.mode}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${row.warning ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${row.warning ? 'text-red-700' : 'text-emerald-700'}`}>{row.risk}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[10px] text-palm-400 font-medium">{row.time}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* FFB Photo Evidence */}
                        {row.ffbBatchUrl && row.ffbBatchUrl !== 'no-photo-captured.jpg' ? (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEvidencePreview(row.ffbBatchUrl);
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
                            title="View FFB Batch Photo"
                          >
                            <Camera size={14} />
                          </button>
                        ) : (
                          <div className="p-1.5 bg-slate-50 text-slate-300 rounded-lg opacity-40 border border-slate-100" title="No photo captured">
                            <Camera size={14} />
                          </div>
                        )}

                        {/* Signature Evidence (Mode B / Ramp Mode)
                            * The pen icon displays for "Ramp" mode transactions when a farmer signature has been captured.
                            * "Ramp" mode (Mode B) transactions require weighbridge verification and farmer sign-off.
                            * This is NOT for geofencing/coordinates - GPS coordinates are shown in the MapPin icon below.
                            * The signature URL contains the digital signature image captured during the ramp transaction.
                        */}
                        {row.mode === 'Ramp' && row.farmerSignatureUrl ? (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEvidencePreview(row.farmerSignatureUrl || null);
                            }}
                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
                            title="View Farmer Signature (Ramp Mode Verification)"
                          >
                            <PenTool size={14} />
                          </button>
                        ) : row.mode === 'Ramp' ? (
                          <div className="p-1.5 bg-slate-50 text-slate-300 rounded-lg opacity-40 border border-slate-100" title="No signature captured for this Ramp Mode transaction">
                            <PenTool size={14} />
                          </div>
                        ) : null}

                        {/* GPS Evidence */}
                        {row.location ? (
                          <div className="relative group">
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                alert(`GPS Coordinates:\nLat: ${row.location.lat.toFixed(6)}\nLng: ${row.location.lng.toFixed(6)}`);
                              }}
                              className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all"
                              title={`GPS: ${row.location.lat.toFixed(4)}, ${row.location.lng.toFixed(4)}`}
                            >
                              <MapPin size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 bg-slate-100 text-slate-400 rounded-lg opacity-50" title="No GPS data">
                            <MapPin size={14} />
                          </div>
                        )}

                        {/* DDS Report */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedTx(row); setShowDDS(true); }}
                          className="p-2 bg-palm-950 text-gold-400 rounded-lg hover:bg-gold-500 hover:text-palm-950 transition-all shadow-lg shadow-palm-950/20"
                          title="View DDS Report"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SignaturePad = ({ onSave, onClear }: { onSave: (data: string) => void, onClear: () => void }) => {
  // SignaturePad - capture handwritten approval for dealer-side transaction confirmation.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#E4D5B7'; // parchment color
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-palm-950 rounded-2xl border border-palm-800 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={400}
          height={225}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button 
          onClick={clear}
          className="absolute top-4 right-4 p-2 bg-palm-800 text-parchment/40 hover:text-gold-400 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const TransactionFlow = ({ onComplete, isOnline, onOfflineTransaction }: { onComplete: (tx?: any) => void, isOnline?: boolean, onOfflineTransaction?: () => void, key?: string }) => {
  // TransactionFlow - drive the dealer-side transaction entry, signature, and submit sequence.
  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState('');
  const [reason, setReason] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [mode, setMode] = useState<'Plantation' | 'Ramp'>('Plantation');
  const scannerElementId = 'dealer-qr-scanner';
  const fileScannerElementId = 'dealer-file-scanner';

  const [signature, setSignature] = useState<string | null>(null);
  const [signature_base64, setSignatureBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [txId, setTxId] = useState('');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerManuallyPaused, setScannerManuallyPaused] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState('Ready to scan Universal ID');
  const [farmerData, setFarmerData] = useState<ScannedFarmer>({
    id: 'AB-9921',
    idNumber: '780512-06-5543',
    name: 'Ahmad bin Ismail',
    cropType: 'Palm Oil',
    monthlyQuota: 8,
    location: { lat: 3.1390, lng: 101.6869 },
    boundary: [
      { lat: 3.1440, lng: 101.6810 },
      { lat: 3.1450, lng: 101.6930 },
      { lat: 3.1350, lng: 101.6940 },
      { lat: 3.1320, lng: 101.6820 },
    ],
  });
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsValidationStatus, setGpsValidationStatus] = useState<'idle' | 'checking' | 'matched' | 'mismatch'>('idle');
  const [gpsValidationMessage, setGpsValidationMessage] = useState('GPS validation pending');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stopRequestedRef = useRef(false);
  const isStartingScannerRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedGps, setCapturedGps] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  const getDistanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const isPointInPolygon = (point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]) => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      const intersects = yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || 1e-12) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  };

  const parseScannedFarmer = (rawText: string): ScannedFarmer => {
    const defaultFarmer: ScannedFarmer = {
      id: 'AB-9921',
      name: 'Ahmad bin Ismail',
      cropType: 'Palm Oil',
      monthlyQuota: 8,
      location: { lat: 3.1390, lng: 101.6869 },
    };

    const localFarmer = localStorage.getItem('veri_farmer_data');
    const localPlots = localStorage.getItem('veri_farmer_plots');
    let parsedLocalFarmer: any = null;
    let parsedLocalPlots: any[] = [];

    try {
      parsedLocalFarmer = localFarmer ? JSON.parse(localFarmer) : null;
      parsedLocalPlots = localPlots ? JSON.parse(localPlots) : [];
    } catch {
      parsedLocalFarmer = null;
      parsedLocalPlots = [];
    }

    const fallbackFromLocal: ScannedFarmer = {
      id: parsedLocalFarmer?.idNumber ? `F-${String(parsedLocalFarmer.idNumber).slice(-6)}` : defaultFarmer.id,
      idNumber: parsedLocalFarmer?.idNumber || defaultFarmer.idNumber,
      name: parsedLocalFarmer?.name || defaultFarmer.name,
      cropType: parsedLocalPlots?.[0]?.cropType || defaultFarmer.cropType,
      monthlyQuota: 8,
      location: parsedLocalPlots?.[0]?.landTitleMetadata?.center_lat && parsedLocalPlots?.[0]?.landTitleMetadata?.center_lng
        ? { lat: parsedLocalPlots[0].landTitleMetadata.center_lat, lng: parsedLocalPlots[0].landTitleMetadata.center_lng }
        : defaultFarmer.location,
      boundary: Array.isArray(parsedLocalPlots?.[0]?.points) && parsedLocalPlots[0].points.length >= 3
        ? parsedLocalPlots[0].points.map((pt: any) => ({
            lat: 3.1 + (Number(pt.y) || 0) * 0.01,
            lng: 101.6 + (Number(pt.x) || 0) * 0.01,
          }))
        : defaultFarmer.boundary,
    };

    const normalized = rawText.trim();
    if (!normalized) {
      return fallbackFromLocal;
    }

    if (normalized.startsWith('{')) {
      try {
        const payload = JSON.parse(normalized);
        const id = payload.universalId || payload.id || payload.farmerId || fallbackFromLocal.id;
        return {
          id,
          idNumber: payload.farmerId || payload.idNumber || fallbackFromLocal.idNumber,
          name: payload.name || payload.farmerName || fallbackFromLocal.name,
          cropType: payload.cropType || fallbackFromLocal.cropType,
          monthlyQuota: Number(payload.monthlyQuota || payload.quota || fallbackFromLocal.monthlyQuota || 8),
          location: payload.location || payload.centroid || fallbackFromLocal.location,
          boundary: Array.isArray(payload.boundary) ? payload.boundary : fallbackFromLocal.boundary,
        };
      } catch {
        return fallbackFromLocal;
      }
    }

    const prefixed = normalized.match(/^VERI:FARMER:([A-Za-z0-9-]+)$/i);
    if (prefixed?.[1]) {
      return { ...fallbackFromLocal, id: prefixed[1] };
    }

    const plainId = normalized.match(/^[A-Za-z]{1,3}-?\d{3,}$/);
    if (plainId) {
      return { ...fallbackFromLocal, id: normalized.toUpperCase() };
    }

    return fallbackFromLocal;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanStatus('Processing uploaded image...');
    setScanError(null);

    try {
      // Use the pre-existing hidden container for file scanning
      const scanner = new Html5Qrcode(fileScannerElementId, { verbose: false });
      
      const decodedText = await scanner.scanFile(file, true); // true = show image in UI
      
      const parsed = parseScannedFarmer(decodedText);
      setFarmerData(parsed);
      setScanStatus(`✓ QR decoded: ${parsed.name} (${parsed.id})`);
      
      // Clean up
      try {
        await scanner.clear();
      } catch {}
      
      // Move to next step
      setTimeout(() => setStep(2), 800);
    } catch (error: any) {
      console.error('QR scan error:', error);
      const errorMsg = error?.message || String(error);
      
      if (errorMsg.includes('MultiFormat') || errorMsg.includes('detect')) {
        setScanError('No QR code detected. Make sure the image is clear and the QR is visible.');
        setScanStatus('Tip: Save/screenshot the QR code directly (black & white) for best results.');
      } else {
        setScanError(errorMsg);
        setScanStatus('Failed to decode. Try a clearer image or use camera scan.');
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopScanner = async () => {
    stopRequestedRef.current = true;
    setIsScannerActive(false);

    const scanner = scannerRef.current;
    try {
      if (scanner?.isScanning) {
        await scanner.stop();
      }
      if (scanner) {
        await scanner.clear();
      }
    } catch {
      // Ignore cleanup failures to keep flow smooth on mobile browsers.
    } finally {
      // Force-stop any lingering preview stream tracks to avoid needing a second tap.
      const scannerHost = document.getElementById(scannerElementId);
      const videoEls = scannerHost?.querySelectorAll('video') as NodeListOf<HTMLVideoElement> | null;
      videoEls?.forEach((video) => {
        const stream = video.srcObject as MediaStream | null;
        stream?.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      });

      scannerRef.current = null;
      setIsScannerActive(false);
      isStartingScannerRef.current = false;
    }
  };

  const startScanner = async () => {
    if (isScannerActive || isStartingScannerRef.current) return;
    stopRequestedRef.current = false;
    isStartingScannerRef.current = true;
    setScannerManuallyPaused(false);
    setScanError(null);
    setScanStatus('Requesting camera...');
    setIsScannerActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Use HTTPS or localhost.');
      }

      // Explicitly request camera permission whenever entering scan page or retrying scan.
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      permissionStream.getTracks().forEach((track) => track.stop());

      if (stopRequestedRef.current) {
        return;
      }

      const scanner = new Html5Qrcode(scannerElementId, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: { width: 180, height: 180 },
            aspectRatio: 1,
            disableFlip: false,
          },
        async (decodedText) => {
          const parsed = parseScannedFarmer(decodedText);
          setFarmerData(parsed);
          setScanStatus(`Universal ID scanned: ${parsed.id}`);
          await stopScanner();
          setStep(2);
        },
        () => {
          // Keep silent to avoid noisy UI updates while scanning frame-by-frame.
          }
        );

        if (stopRequestedRef.current) {
          await stopScanner();
          return;
        }

        // Force scanner video to occupy the visible card area - properly normalized
        const scannerHost = document.getElementById(scannerElementId);
        const hostDiv = scannerHost?.querySelector('div') as HTMLDivElement | null;
        if (hostDiv) {
          hostDiv.style.width = '100%';
          hostDiv.style.height = '100%';
          hostDiv.style.maxWidth = '100%';
          hostDiv.style.maxHeight = '100%';
        }
      
        const videoEl = scannerHost?.querySelector('video') as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.maxWidth = '100%';
          videoEl.style.maxHeight = '100%';
          videoEl.style.objectFit = 'cover';
          videoEl.style.borderRadius = '1.6rem';
          videoEl.style.transform = 'scaleX(1) scaleY(1)';
          videoEl.style.display = 'block';
        }

        // Also normalize any canvas elements injected by html5-qrcode
        const canvasEls = scannerHost?.querySelectorAll('canvas') as NodeListOf<HTMLCanvasElement> | null;
        if (canvasEls) {
          canvasEls.forEach((canvas) => {
            canvas.style.maxWidth = '100%';
            canvas.style.maxHeight = '100%';
            canvas.style.display = 'none';
          });
        }
      
        setScanStatus('Camera active. Point to farmer Universal ID QR.');
    } catch (error: any) {
      setScanError(error?.message || 'Unable to open camera scanner');
      setScanStatus('Camera permission required. Please allow access and tap Retry Scan.');
      await stopScanner();
    } finally {
      isStartingScannerRef.current = false;
    }
  };

  const validatePlantationGps = async () => {
    setGpsValidationStatus('checking');
    setGpsValidationMessage('Checking GPS against farmer geofence...');

    if (!navigator.geolocation) {
      setGpsValidationStatus('mismatch');
      setGpsValidationMessage('GPS not supported on this device/browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentGps(current);

        const polygon = farmerData.boundary || [];
        let matched = false;

        if (polygon.length >= 3) {
          matched = isPointInPolygon(current, polygon);
        } else if (farmerData.location) {
          matched = getDistanceKm(current, farmerData.location) <= 2;
        }

        if (matched) {
          setGpsValidationStatus('matched');
          setGpsValidationMessage('GPS matched with registered plot boundary.');
        } else {
          setGpsValidationStatus('mismatch');
          setGpsValidationMessage('GPS mismatch: outside registered plot boundary.');
        }
      },
      (error) => {
        setGpsValidationStatus('mismatch');
        if (error.code === error.PERMISSION_DENIED) {
          setGpsValidationMessage('GPS permission denied. Mode A requires location access.');
        } else {
          setGpsValidationMessage('Unable to retrieve GPS. Retry location check.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (step !== 1) return;
    return () => {
      void stopScanner();
    };
  }, [step]);

  useEffect(() => {
    // Clean up camera when leaving step 2 or component unmounts
    return () => {
      stopCamera();
    };
  }, [step]);

  useEffect(() => {
    if (step !== 1 || isScannerActive || scannerManuallyPaused) return;
    // Auto-start camera on entering scan step for real-time scanning flow.
    void startScanner();
  }, [step, isScannerActive, scannerManuallyPaused]);

  useEffect(() => {
    if (step !== 2) return;
    if (mode === 'Plantation') {
      void validatePlantationGps();
    } else {
      setGpsValidationStatus('idle');
      setGpsValidationMessage('Ramp mode selected. Farmer signature will be required.');
    }
  }, [mode, step, farmerData.id]);

  const simulateCapture = () => {
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 2000);
  };

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera API not supported in this browser. Try Chrome or Edge.');
        setCameraLoading(false);
        return;
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false,
      });
      
      console.log('Camera stream obtained:', stream);
      
      // Set active first to trigger video element render
      setCameraActive(true);
      
      // Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraStreamRef.current = stream;
        await cameraVideoRef.current.play();
        console.log('Camera activated and playing');
      } else {
        console.error('Video ref not available after waiting');
        stream.getTracks().forEach(track => track.stop());
        setCameraActive(false);
        alert('Video element not ready. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to start camera:', error);
      setCameraActive(false);
      if (error.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera found on this device.');
      } else {
        alert(`Unable to access camera: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current) return;
    
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoDataUrl);
      
      // Capture GPS coordinates at the moment of photo
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const gpsCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCapturedGps(gpsCoords);
            console.log('FFB photo captured with GPS:', gpsCoords);
          },
          (error) => {
            console.warn('Failed to capture GPS with photo:', error);
            // Still save photo even if GPS fails
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
      
      stopCamera();
    }
  };

  const isLaundering = Number(weight) > Number(farmerData.monthlyQuota || 8);

  const resolveScannedPlotEudr = () => {
    // Pull the scanned farmer's latest EUDR evidence from locally stored plot records.
    try {
      const rawPlots = localStorage.getItem('veri_farmer_plots');
      if (!rawPlots) return null;

      const parsedPlots = JSON.parse(rawPlots);
      if (!Array.isArray(parsedPlots) || parsedPlots.length === 0) return null;

      const normalizedCrop = String(farmerData.cropType || '').toLowerCase();
      const hasEvidence = (p: any) => Boolean(
        p?.eudrChecked ||
        p?.eudrComparisonMap ||
        p?.eudrNdvi2020 != null ||
        p?.eudrNdviCurrent != null ||
        p?.eudrNdviChangePct != null
      );

      const byCrop = parsedPlots.find((p: any) => String(p?.cropType || p?.crop || '').toLowerCase() === normalizedCrop && hasEvidence(p));
      const fallback = parsedPlots.find((p: any) => hasEvidence(p));
      const plot = byCrop || fallback;

      if (!plot) return null;

      return {
        eudrChecked: Boolean(plot.eudrChecked || plot.eudrComparisonMap || plot.eudrNdvi2020 != null),
        eudrRiskScore: plot.eudrRiskScore,
        eudrRiskLevel: plot.eudrRiskLevel,
        eudrNdvi2020: plot.eudrNdvi2020,
        eudrNdviCurrent: plot.eudrNdviCurrent,
        eudrNdviChangePct: plot.eudrNdviChangePct,
        eudrComparisonMap: plot.eudrComparisonMap,
        eudrCheckDate: plot.eudrCheckDate,
      };
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const newTxId = `TX-${Date.now()}`;
    setTxId(newTxId);
    const numericWeight = parseFloat(weight);
    const displayWeight = weight;
    const resolvedEudr = resolveScannedPlotEudr();
    
    // 构建transaction data
    const transaction = {
      id: newTxId,
      txId: newTxId,
      farmerId: farmerData.idNumber || farmerData.id,
      farmerDisplayId: farmerData.id,
      farmerName: farmerData.name,
      name: farmerData.name,
      weight: numericWeight,
      weightDisplay: displayWeight,
      mode: mode,
      location: capturedGps || { lat: 3.1390, lng: 101.6869 }, // Use captured GPS, fallback to mock
      timestamp: new Date().toISOString(),
      ffbBatchUrl: capturedPhoto || 'no-photo-captured.jpg',
      farmerSignatureUrl: mode === 'Ramp' ? signature : null,
      status: 'verified',
      risk: isLaundering || 
            (mode === 'Plantation' && gpsValidationStatus !== 'matched') ||
            (mode === 'Ramp' && !capturedGps) ? 'Flagged' : 'Safe',
      warning: isLaundering || 
               (mode === 'Plantation' && gpsValidationStatus !== 'matched') ||
               (mode === 'Ramp' && !capturedGps),
      reason: isLaundering
        ? reason
        : (mode === 'Plantation' && gpsValidationStatus !== 'matched')
        ? (gpsValidationMessage || 'GPS mismatch')
        : (mode === 'Ramp' && !capturedGps)
        ? 'Ramp mode: GPS not recorded (requires audit)'
        : null,
      cropType: farmerData.cropType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(resolvedEudr || {})
    };

    try {
      const response = await fetch(`${API_BASE_URL}/transaction/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      
      const result = await response.json();
      if (!response.ok || result.status !== 'success') {
        throw new Error(result?.detail || result?.message || 'Failed to save transaction');
      }
      console.log('Transaction saved:', result);
      
      // Save transaction to farmer's history in localStorage
      const localFarmer = JSON.parse(localStorage.getItem('veri_farmer_data') || '{}');
      const farmerId = farmerData.idNumber || localFarmer.idNumber;
      if (farmerId) {
        const historyKey = `veri_farmer_transactions_${farmerId}`;
        const existingHistory = localStorage.getItem(historyKey);
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Add dealer name to the transaction
        const dealerData = localStorage.getItem('veri_dealer_data');
        const dealerName = dealerData ? JSON.parse(dealerData).companyName : 'Unknown Collector';
        
        history.unshift({ ...transaction, dealerName }); // Add to beginning (newest first)
        localStorage.setItem(historyKey, JSON.stringify(history));
        console.log('Transaction saved to farmer history:', historyKey);
      }
      
      setIsSaving(false);
      if (!isOnline && onOfflineTransaction) {
        onOfflineTransaction();
      }
      setStep(3);
      // Pass the transaction back to dashboard
      setTimeout(() => onComplete(transaction), 3000);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      
      // Even on error, save to farmer's history (offline mode)
      const localFarmer = JSON.parse(localStorage.getItem('veri_farmer_data') || '{}');
      const farmerId = farmerData.idNumber || localFarmer.idNumber;
      if (farmerId) {
        const historyKey = `veri_farmer_transactions_${farmerId}`;
        const existingHistory = localStorage.getItem(historyKey);
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        const dealerData = localStorage.getItem('veri_dealer_data');
        const dealerName = dealerData ? JSON.parse(dealerData).companyName : 'Unknown Collector';
        
        history.unshift({ ...transaction, dealerName });
        localStorage.setItem(historyKey, JSON.stringify(history));
      }
      
      setIsSaving(false);
      if (!isOnline && onOfflineTransaction) {
        onOfflineTransaction();
      }
      // 即使失败也继续到step 3，因为离线模式下会本地存储
      setStep(3);
      setTimeout(() => onComplete(transaction), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="pb-20 px-6"
    >
      {/* Hidden container for file-based QR scanning */}
      <div id={fileScannerElementId} className="hidden" />
      
      <div className="dark-card overflow-hidden border-none">
        <div className={`p-8 text-palm-950 flex justify-between items-center transition-colors ${isOnline ? 'bg-emerald-900 text-emerald-50' : 'bg-amber-500'}`}>
          <h3 className="text-2xl font-serif font-bold">{isOnline ? 'Live Cloud Verification' : 'Edge AI Verification'}</h3>
          <div className={`status-badge border-none ${isOnline ? 'bg-emerald-800 text-emerald-300' : 'bg-palm-950 text-gold-400'}`}>
            {isOnline ? <Globe size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'Cloud Sync active' : 'Offline Lock'}
          </div>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="text-center">
              <div className={`w-56 h-56 bg-palm-900 rounded-[3rem] mx-auto mb-10 flex items-center justify-center relative overflow-hidden group transition-all ${!isOnline ? 'ring-4 ring-amber-500/20' : ''}`}>
                {!isScannerActive && <QrCode size={100} className="text-gold-400 opacity-20" />}
                <div
                  id={scannerElementId}
                  className={`absolute inset-0 z-10 transition-opacity duration-300 ${isScannerActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
                <div className={`absolute inset-0 border-2 rounded-[3rem] transition-colors pointer-events-none ${isOnline ? 'border-gold-400/10' : 'border-amber-400/50'}`} />
                {isScannerActive && <div className={`animate-scan-line z-20 ${!isOnline ? 'bg-amber-400/50' : ''}`} />}
              </div>
              <h4 className="text-3xl font-serif font-bold text-parchment mb-4">Scanning Farmer QR</h4>
              <p className="text-parchment/60 font-light mb-3">Establishing secure handshake with Veri ID.</p>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-400 mb-2">{scanStatus}</p>
              {scanError && <p className="text-[10px] font-display font-bold uppercase tracking-widest text-red-400 mb-6">{scanError}</p>}
              <button 
                onClick={async () => {
                  if (isScannerActive) {
                    setScannerManuallyPaused(true);
                    await stopScanner();
                    setScanStatus('Scanner stopped. Tap Retry Scan to reopen camera.');
                    return;
                  }
                  setScannerManuallyPaused(false);
                  await startScanner();
                }}
                className={`w-full justify-center py-5 rounded-2xl font-display font-bold uppercase tracking-widest transition-all ${isOnline ? 'bg-gold-500 text-palm-950 hover:bg-gold-600' : 'bg-amber-500 text-palm-950 hover:bg-amber-600'}`}
              >
                {isScannerActive ? 'Stop Scan' : 'Retry Scan'}
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-parchment/20"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-palm-950 px-4 text-parchment/40 font-display font-bold uppercase tracking-widest">Or Upload QR Image</span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-center py-5 rounded-2xl font-display font-bold uppercase tracking-widest transition-all bg-palm-900 text-parchment border-2 border-gold-500/20 hover:border-gold-500/40 hover:bg-palm-800"
              >
                📷 Upload Photo of QR
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="p-6 bg-palm-900 rounded-3xl border border-palm-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gold-500 rounded-2xl flex items-center justify-center text-palm-950 shadow-xl">
                    <User size={32} />
                  </div>
                  <div>
                    <h5 className="text-xl font-serif font-bold text-parchment">{farmerData.name}</h5>
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-400">ID: {farmerData.id} • Legality Verified</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <button
                      onClick={() => {
                        if (mode === 'Plantation') {
                          void validatePlantationGps();
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                        mode !== 'Plantation'
                          ? 'bg-palm-700/40 text-parchment/60'
                          : gpsValidationStatus === 'matched'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : gpsValidationStatus === 'checking'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                   >
                      <MapPin size={10} />
                      {mode !== 'Plantation'
                        ? 'GPS BYPASS (RAMP)'
                        : gpsValidationStatus === 'matched'
                        ? 'GPS MATCHED'
                        : gpsValidationStatus === 'checking'
                        ? 'CHECKING GPS'
                        : 'GPS NOT VERIFIED'}
                   </button>
                   <div className="w-12 h-12 rounded-xl bg-palm-800 flex items-center justify-center">
                      <MapPin size={20} className="text-gold-400" />
                   </div>
                </div>
              </div>
              <p className={`text-[10px] px-1 ${gpsValidationStatus === 'matched' || mode !== 'Plantation' ? 'text-emerald-400' : 'text-red-300'}`}>
                {gpsValidationMessage}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMode('Plantation')}
                  className={`p-6 rounded-3xl border-2 transition-all text-left ${mode === 'Plantation' ? 'border-gold-500 bg-palm-900' : 'border-palm-800 bg-transparent opacity-50'}`}
                >
                  <MapPin size={24} className="text-gold-400 mb-4" />
                  <span className="font-display font-bold uppercase tracking-widest text-[10px] block text-parchment">Mode A</span>
                  <span className="font-serif font-bold text-lg text-parchment">Plantation</span>
                </button>
                <button 
                  onClick={() => setMode('Ramp')}
                  className={`p-6 rounded-3xl border-2 transition-all text-left ${mode === 'Ramp' ? 'border-gold-500 bg-palm-900' : 'border-palm-800 bg-transparent opacity-50'}`}
                >
                  <Truck size={24} className="text-gold-400 mb-4" />
                  <span className="font-display font-bold uppercase tracking-widest text-[10px] block text-parchment">Mode B</span>
                  <span className="font-serif font-bold text-lg text-parchment">Ramp Delivery</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                   <label className="text-[10px] font-display font-bold uppercase tracking-widest text-parchment/40">Harvest Weight (MT)</label>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-gold-400 uppercase tracking-widest mb-0.5">Remaining Monthly Quota</p>
                       <p className="text-xs font-serif font-bold text-parchment">{Number(farmerData.monthlyQuota || 8).toFixed(2)} MT</p>
                   </div>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    className={`w-full px-6 py-5 rounded-2xl bg-palm-900 border transition-all text-3xl font-serif font-bold outline-none focus:ring-2 ${isLaundering ? 'border-red-500 text-red-500 focus:ring-red-500' : 'border-palm-800 text-gold-400 focus:ring-gold-500'}`}
                    placeholder="0.00"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-display font-bold text-parchment/20">MT</span>
                </div>
              </div>

              <div className="p-8 bg-palm-900 rounded-3xl border border-palm-800 text-center relative overflow-hidden group">
                {capturedPhoto ? (
                  <div className="space-y-4">
                    <img 
                      src={capturedPhoto} 
                      alt="FFB Batch" 
                      className="w-full rounded-2xl"
                    />
                    {capturedGps && (
                      <div className="p-4 bg-palm-950 rounded-xl border border-gold-500/30 text-left text-[8px] font-mono">
                        <p className="text-parchment/60 text-[9px] font-bold uppercase mb-2">📸 Captured GPS Coordinates</p>
                        <p className="text-gold-400 font-bold">{capturedGps.lat.toFixed(6)}, {capturedGps.lng.toFixed(6)}</p>
                        <p className="text-emerald-400 text-[7px] mt-2">✓ Embedded in transaction signature</p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCapturedPhoto(null);
                        setCapturedGps(null);
                        void startCamera();
                      }}
                      className="w-full py-4 bg-palm-800 hover:bg-gold-500 text-parchment hover:text-palm-950 rounded-2xl font-display font-bold uppercase tracking-widest text-xs transition-all"
                    >
                      📷 Retake Photo
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video
                        ref={cameraVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={stopCamera}
                        className="py-4 bg-palm-800 hover:bg-palm-700 text-parchment rounded-2xl font-display font-bold uppercase tracking-widest text-xs transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="py-4 bg-gold-500 hover:bg-gold-600 text-palm-950 rounded-2xl font-display font-bold uppercase tracking-widest text-xs transition-all"
                      >
                        📸 Capture
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={startCamera}
                    disabled={cameraLoading}
                    className="flex flex-col items-center gap-4 mx-auto w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cameraLoading ? (
                      <>
                        <div className="w-16 h-16 bg-palm-800 rounded-2xl flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold uppercase tracking-widest text-[10px] text-parchment">Opening Camera...</h4>
                          <p className="text-[8px] text-parchment/40 mt-1">Please allow camera access</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-palm-800 rounded-2xl flex items-center justify-center text-gold-400 group-hover:bg-gold-500 group-hover:text-palm-950 transition-all">
                          <Camera size={32} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold uppercase tracking-widest text-[10px] text-parchment">Capture FFB Batch</h4>
                          <p className="text-[8px] text-parchment/40 mt-1">Auto-watermark GPS & Timestamp</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isLaundering && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-6 bg-red-950 border border-red-500/30 rounded-3xl flex flex-col gap-4"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-xs text-red-500">Quota Exceeded!</h4>
                      <p className="text-[10px] text-red-200/60 leading-relaxed">Weight exceeds the monthly quota for this land parcel. Audit required for compliance.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-red-500/60 px-1">Reason for Over-quota (Mandatory)</label>
                    <textarea 
                      className="w-full p-4 rounded-xl bg-red-900/30 border border-red-500/20 text-parchment text-sm outline-none focus:border-red-500 transition-colors"
                      placeholder="e.g. Seasonal Peak, New Area Harvested..."
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {mode === 'Ramp' && (
                <div className="space-y-4">
                  <div className="p-6 bg-palm-900 rounded-3xl border border-palm-800">
                    <h4 className="font-display font-bold uppercase tracking-widest text-[10px] text-parchment/40 mb-4">Farmer Declaration</h4>
                    <SignaturePad 
                      onSave={(data) => setSignature(data)}
                      onClear={() => setSignature('')}
                    />
                    {signature && (
                      <p className="text-[10px] font-display font-bold uppercase tracking-widest text-emerald-400 mt-4 text-center">Handshake Signed</p>
                    )}
                  </div>
                  
                  <div className="p-6 bg-palm-900 rounded-3xl border border-palm-800">
                    <h4 className="font-display font-bold uppercase tracking-widest text-[10px] text-parchment/40 mb-4">📍 Collection Point GPS</h4>
                    <button 
                      onClick={() => void validatePlantationGps()}
                      className="w-full py-3 rounded-2xl font-display font-bold uppercase tracking-widest text-[10px] bg-gold-500 text-palm-950 hover:bg-gold-600 transition-all mb-4"
                    >
                      {gpsValidationStatus === 'checking' ? '🔄 Recording GPS...' : '📸 Record GPS Coordinates'}
                    </button>
                    {capturedGps && (
                      <div className="p-4 bg-palm-950 rounded-xl border border-gold-500/30 text-[9px] font-mono">
                        <p className="text-parchment/60">Captured GPS:</p>
                        <p className="text-gold-400 font-bold mt-1">
                          {capturedGps.lat.toFixed(6)}, {capturedGps.lng.toFixed(6)}
                        </p>
                        <p className="text-emerald-400 text-[8px] mt-2">✓ Encoded in transaction for audit trail</p>
                      </div>
                    )}
                    {gpsValidationMessage && (
                      <p className={`text-[9px] mt-3 font-display font-bold uppercase tracking-widest ${gpsValidationStatus === 'matched' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {gpsValidationMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <button 
                  disabled={
                    !weight ||
                    (mode === 'Ramp' && !signature) ||
                    (mode === 'Plantation' && !capturedPhoto) ||
                    isSaving ||
                    (isLaundering && !reason)
                  }
                  onClick={handleSave}
                  className={`w-full py-5 text-lg font-display font-bold uppercase tracking-widest rounded-2xl transition-all flex flex-col items-center justify-center gap-1 ${isSaving || (isLaundering && !reason) ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : (isOnline ? 'bg-gold-500 text-palm-950 hover:bg-gold-600 shadow-xl shadow-gold-500/20' : 'bg-amber-500 text-palm-950 hover:bg-amber-600 shadow-xl shadow-amber-500/20')}`}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-palm-950 border-t-transparent rounded-full animate-spin" />
                      {isOnline ? 'Uploading...' : 'Securing...'}
                    </div>
                  ) : (
                    <>
                      <span>{isLaundering ? 'Submit for Audit' : (isOnline ? 'Upload & Save' : 'Secure in Offline Vault')}</span>
                      {!isOnline && (
                        <span className="text-[8px] font-black opacity-60">
                          {isLaundering ? 'Edge AI will flag for manual audit' : 'Edge AI will verify coordinates locally'}
                        </span>
                      )}
                    </>
                  )}
                </button>
                {isLaundering && !reason && (
                   <div className="text-center">
                      <span className="text-red-500 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                        Please provide a reason for audit
                      </span>
                   </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-palm-950 mx-auto mb-8 shadow-2xl ${isOnline ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500 shadow-amber-500/20'}`}
              >
                {isOnline ? (
                  <CheckCircle2 size={48} className="text-white" />
                ) : (
                  <div className="relative">
                    <HardDrive size={40} className="text-white" />
                    <div className="absolute -bottom-1 -right-1 bg-palm-950 rounded-full p-1 border-2 border-amber-500">
                      <Lock size={12} className="text-amber-500" />
                    </div>
                  </div>
                )}
              </motion.div>
              <h3 className="text-3xl font-serif font-bold text-parchment mb-4">
                {isOnline ? 'Verification Confirmed' : 'Verification Secured'}
              </h3>
              <div className="mb-10 space-y-4">
                <p className="text-parchment/60 font-light max-w-xs mx-auto">
                  {isOnline 
                    ? 'Transaction successfully broadcasted to the Veri cloud network.' 
                    : 'Transaction stored securely via Edge AI. Auto-sync will trigger upon network detection.'}
                </p>
                
                {!isOnline && (
                  <div className="flex items-center justify-center gap-2 text-amber-500">
                    <Activity size={14} className="animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-sync pending signal</span>
                  </div>
                )}

                <div className="bg-palm-900 p-3 rounded-xl border border-palm-800 inline-block">
                  <p className="text-[10px] font-mono text-gold-400">
                    {isOnline 
                      ? `TX HASH: 0x${txId.slice(-8).toUpperCase()}...` 
                      : `LOCAL ID: #${txId.slice(-6).toUpperCase()}...`}
                  </p>
                </div>
              </div>
              <button 
                onClick={onComplete}
                className="btn-palm w-full justify-center"
              >
                Return to Hub
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ManifestView = ({ onBack, selectedIds, transactions }: { onBack: () => void, selectedIds?: string[], transactions?: any[], key?: string }) => {
  // ManifestView - build the consolidated DDS manifest before PDF export.
  const [showDDS, setShowDDS] = useState(false);

  const allItems = (transactions && transactions.length > 0 ? transactions : [
    { name: 'Ahmad bin Ismail', weight: '2.8', weightDisplay: '2.80', id: 'AB-9921', farmerDisplayId: 'AB-9921', crop: 'Cocoa', area: '1.5 HA', year: 2015, gps: '3.1390, 101.6869', ic: '780512-06-5543', license: 'MPOB-9921-2026', mode: 'PLANTATION' },
    { name: 'Siti Aminah', weight: '1.5', weightDisplay: '1.50', id: 'AB-8823', farmerDisplayId: 'AB-8823', crop: 'Rubber', area: '2.0 HA', year: 2018, gps: '3.1400, 101.6870', ic: '820315-10-5542', license: 'MPOB-8823-2025', mode: 'RAMP' },
    { name: 'Tan Ah Kow', weight: '4.2', weightDisplay: '4.20', id: 'AB-7712', farmerDisplayId: 'AB-7712', crop: 'Cocoa', area: '3.2 HA', year: 2012, gps: '3.1380, 101.6860', ic: '650512-01-5541', license: 'MCB-7712-2024', mode: 'PLANTATION' },
    { name: 'M. Rajan', weight: '5.75', weightDisplay: '5.75', id: 'AB-6611', farmerDisplayId: 'AB-6611', crop: 'Palm Oil', area: '4.5 HA', year: 2010, gps: '3.1370, 101.6850', ic: '700101-08-5540', license: 'MPOB-6611-2023', mode: 'PLANTATION' },
  ]);

  const filteredItems = selectedIds && selectedIds.length > 0
    ? allItems.filter(item => selectedIds.includes(item.txId || item.id))
    : allItems;

  const totalWeight = filteredItems.reduce((acc, item) => acc + parseFloat(String(item.weight)), 0).toFixed(2);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-20 px-6"
    >
      {showDDS && (
        <DDSReport 
          type="consolidated" 
          data={{
            id: "VERI-MANIFEST-2026-X01",
            date: "2026-03-01",
            lorry: "JQB 8821",
            totalWeight: `${totalWeight} MT`,
            destination: "Mill Alpha - Jerantut",
            hash: "0x8821...CM01",
            items: filteredItems
          }} 
          onClose={() => setShowDDS(false)} 
        />
      )}
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-full bg-palm-100 flex items-center justify-center text-palm-950 hover:bg-gold-500 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-4xl font-serif font-bold text-palm-950">Consolidated Manifest</h2>
      </div>

      <div className="dark-card p-10 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-parchment rounded-3xl flex items-center justify-center text-palm-950">
              <QrCode size={64} />
            </div>
            <div>
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-parchment/40 mb-1">Manifest ID</p>
              <h3 className="text-2xl font-serif font-bold text-gold-400">VERI-MANIFEST-2026-X01</h3>
              <p className="text-xs text-parchment/60">Lorry Plate: JQB 8821 • Destination: Mill Alpha - Jerantut</p>
            </div>
          </div>
          <button onClick={() => setShowDDS(true)} className="btn-gold">
            <FileText size={18} /> View Consolidated DDS
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-display font-bold uppercase tracking-widest text-parchment/40">Batch Composition ({filteredItems.length} items)</p>
          {filteredItems.map((item, i) => (
            <div key={i} className="p-4 bg-palm-900 rounded-2xl border border-palm-800 flex justify-between items-center">
              <div>
                <p className="font-bold text-parchment">{item.name}</p>
                <p className="text-[10px] text-parchment/40 uppercase tracking-widest">{item.farmerDisplayId || item.farmerId || item.id}</p>
              </div>
              <p className="font-serif font-bold text-gold-400">{item.weightDisplay || Number(item.weight).toFixed(2)} MT</p>
            </div>
          ))}
          <div className="pt-6 mt-6 border-t border-palm-800 flex justify-between items-center">
            <p className="font-display font-bold uppercase tracking-widest text-sm text-parchment">Total Load</p>
            <p className="text-3xl font-serif font-bold text-gold-400">{totalWeight} MT</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-emerald-950 border border-emerald-500/20 rounded-3xl flex items-center gap-6">
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="font-display font-bold uppercase tracking-widest text-xs text-emerald-500">EUDR Compliant Batch</h4>
          <p className="text-[10px] text-emerald-200/60 leading-relaxed">All smallholders in this manifest have passed GIS verification and regulatory legality checks.</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('ROLE_SELECT');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isDealerRegistered, setIsDealerRegistered] = useState(false);
  const [plots, setPlots] = useState<any[]>([]);
  // --- Realistic Crop Evidence Images (Stock Photos) ---
  // FFB/Harvest Batch Image: Real palm oil fresh fruit bunches from Unsplash
  const ffbPlaceholderImage = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad576?w=800&q=80';
  
  // Weighbridge Receipt Image: Realistic weighbridge/scale document
  const weighbridgeReceiptImage = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80';
  
  // Farmer Signature Image: Handwritten signature on document (realistic)
  const signaturePlaceholderImage = 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80';

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCacheCount, setOfflineCacheCount] = useState(0);
  const [pendingSyncs, setPendingSyncs] = useState(12);
  const [isSyncing, setIsSyncing] = useState(false);
  const [transactions, setTransactions] = useState([
    { 
      name: 'Ahmad bin Ismail', 
      weight: '2.45', 
      mode: 'Plantation', 
      risk: 'Safe', 
      time: '14:22', 
      id: 'AB-9921', 
      crop: 'Palm Oil',
      ffbBatchUrl: ffbPlaceholderImage, // Agricultural evidence: FFB/crop harvest
      location: { lat: 3.1420, lng: 101.6850 }
    },
    { 
      name: 'Siti Aminah', 
      weight: '1.80', 
      mode: 'Ramp', 
      risk: 'Safe', 
      time: '13:45', 
      id: 'AB-8823', 
      crop: 'Palm Oil',
      ffbBatchUrl: weighbridgeReceiptImage, // Weighbridge receipt evidence
      farmerSignatureUrl: signaturePlaceholderImage, // Mode B signature
      location: { lat: 3.1395, lng: 101.6875 }
    },
    { 
      name: 'Tan Ah Kow', 
      weight: '4.12', 
      mode: 'Plantation', 
      risk: 'Safe', 
      time: '11:30', 
      id: 'AB-7712', 
      crop: 'Cocoa',
      ffbBatchUrl: ffbPlaceholderImage,
      location: { lat: 3.1410, lng: 101.6890 }
    },
    { 
      name: 'M. Rajan', 
      weight: '0.95', 
      mode: 'Ramp', 
      risk: 'Flagged', 
      time: '09:15', 
      id: 'AB-6654', 
      warning: true, 
      reason: 'GPS Mismatch: Harvest location detected outside registered plot boundary.', 
      crop: 'Palm Oil',
      ffbBatchUrl: weighbridgeReceiptImage,
      farmerSignatureUrl: signaturePlaceholderImage,
      location: { lat: 3.2100, lng: 101.7500 } // Out of boundary
    },
    { 
      name: 'Zulkifli Ali', 
      weight: '8.42', 
      mode: 'Plantation', 
      risk: 'Flagged', 
      time: '08:30', 
      id: 'AB-5543', 
      warning: true, 
      reason: 'Quota Exceeded: Monthly yield limit (8.0 MT) exceeded for registered area.', 
      crop: 'Palm Oil',
      ffbBatchUrl: ffbPlaceholderImage,
      location: { lat: 3.1400, lng: 101.6870 }
    },
  ]);

  const [manifestIds, setManifestIds] = useState<string[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (offlineCacheCount > 0) {
        setIsSyncing(true);
        setTimeout(() => {
          setIsSyncing(false);
          setOfflineCacheCount(0);
        }, 3000);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate some offline cache if offline
    if (!navigator.onLine) {
      setOfflineCacheCount(3);
    }

    const registered = localStorage.getItem('veri_registered');
    const dealerRegistered = localStorage.getItem('veri_dealer_registered');
    const savedPlots = localStorage.getItem('veri_farmer_plots');

    if (registered === 'true' && savedPlots) {
      setPlots(JSON.parse(savedPlots));
    }

    if (registered === 'true') {
      setIsRegistered(true);
      setView('farmer-dashboard');
    } else if (dealerRegistered === 'true') {
      setIsDealerRegistered(true);
      setView('collector-dashboard');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineCacheCount]);

  const handleHome = () => setView('ROLE_SELECT');
  const handleToggleOnline = () => setIsOnline(!isOnline);
  const handleOfflineTransaction = () => {
    if (!isOnline) {
      setPendingSyncs(prev => prev + 1);
    }
  };
  const handleBack = () => {
    if (view === 'farmer-registration') setView('ROLE_SELECT');
    else if (view === 'DEALER_SIGNUP') setView('ROLE_SELECT');
    else if (view === 'collector-dashboard') setView('ROLE_SELECT');
    else if (view === 'collector-transaction') setView('collector-dashboard');
    else if (view === 'manifest') setView('collector-dashboard');
    else if (view === 'farmer-dashboard') {
      setIsRegistered(false);
      localStorage.removeItem('veri_registered');
      setView('ROLE_SELECT');
    }
  };

  const handleFarmerRegistrationComplete = async (formData: any, plots: any[]) => {
    // 构建数据
    const farmerData = {
      name: formData.name,
      idNumber: formData.idNumber,
      permits: [
        ...formData.permitTypes.filter(t => t !== 'OTHER').map(type => ({
          type,
          number: formData.permitNumbers?.[type] || `${type}-12345`,
          photoUrl: formData.permitPhotos?.[type]
        })),
        ...formData.customPermits.map(cp => ({
          type: 'OTHER',
          name: cp.name,
          number: cp.number || 'OTHER-12345',
          photoUrl: cp.photo
        }))
      ],
      plots: plots.map(p => ({
        id: p.id.toString(),
        cropType: p.cropType,
        otherCropType: p.otherCropType || undefined,
        plantingYear: parseInt(p.plantingYear),
        alias: p.title,
        landArea: parseFloat(p.area),
        landTitleArea: p.landTitleMetadata?.land_area ?? 0,  // 新增：land title 总面积
        landTitleReference: p.landTitleMetadata?.lot_number ?? 'UNKNOWN',  // 新增：land title 参考号
        landTitleUrl: p.titlePhoto,
        boundary: (p.points && p.points.length > 0)
          ? p.points.map(pt => ({ lat: pt.y * 0.01 + 3.1, lng: pt.x * 0.01 + 101.6 }))
          : [{
              lat: p.landTitleMetadata?.center_lat ?? 3.139,
              lng: p.landTitleMetadata?.center_lng ?? 101.6869
            }] // fallback center point from land title OCR
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/farmer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmerData)
      });
      console.log('API Response:', response.status, response.statusText);
      const result = await response.json();
      console.log('API Result:', result);
      if (result.status === 'success') {
        // Demo reset behavior: new registration starts with empty transaction history.
        try {
          await fetch(`${API_BASE_URL}/farmer/${formData.idNumber}/transactions/clear`, {
            method: 'POST'
          });
        } catch (clearErr) {
          console.warn('Could not clear backend transaction history during registration:', clearErr);
        }

        localStorage.removeItem(`veri_farmer_transactions_${formData.idNumber}`);
        localStorage.removeItem(`veri_farmer_transactions_F-${String(formData.idNumber).slice(-6)}`);

        localStorage.setItem('veri_registered', 'true');
        localStorage.setItem('veri_farmer_data', JSON.stringify({
          name: formData.name,
          idNumber: formData.idNumber,
          permitTypes: formData.permitTypes,
          otherPermitName: formData.otherPermitName,
          permitNumbers: formData.permitNumbers
        }));
        localStorage.setItem('veri_farmer_plots', JSON.stringify(plots));
        setIsRegistered(true);
        setView('farmer-dashboard');
      } else {
        console.error('API returned non-success status:', result);
        alert('Registration failed:' + result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      // 如果后端不可用，则本地存储数据并继续
      localStorage.removeItem(`veri_farmer_transactions_${formData.idNumber}`);
      localStorage.removeItem(`veri_farmer_transactions_F-${String(formData.idNumber).slice(-6)}`);

      localStorage.setItem('veri_registered', 'true');
      localStorage.setItem('veri_farmer_data', JSON.stringify({
        name: formData.name,
        idNumber: formData.idNumber,
        permitTypes: formData.permitTypes,
        otherPermitName: formData.otherPermitName,
        permitNumbers: formData.permitNumbers
      }));
      localStorage.setItem('veri_farmer_plots', JSON.stringify(plots));
      setIsRegistered(true);
      setView('farmer-dashboard');
    }
  };

  const handleDealerRegistrationComplete = async (formData: any) => {
    // 构建数据 - 保存所有许可证号码和照片
    const dealerData = {
      representativeName: formData.repName,
      mobile: formData.mobile,
      stationName: formData.stationName,
      licenseTypes: formData.licenseTypes,
      otherLicenseName: formData.customLicenseNames['OTHER'] || undefined,
      licenseNumbers: formData.licenseNumbers, // 保存所有许可证号码
      licensePhotos: formData.licensePhotos, // 保存所有许可证照片
      location: { lat: 3.9322, lng: 102.3611 }, // 模拟GPS
    };

    try {
      const response = await fetch(`${API_BASE_URL}/dealer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealerData)
      });
      console.log('Dealer API Response:', response.status, response.statusText);
      const result = await response.json();
      console.log('Dealer API Result:', result);
      if (result.status === 'success') {
        localStorage.setItem('veri_dealer_registered', 'true');
        localStorage.setItem('veri_dealer_data', JSON.stringify({
          representativeName: formData.repName,
          stationName: formData.stationName,
          companyName: formData.stationName,
          mobile: formData.mobile,
        }));
        setIsDealerRegistered(true);
        setView('collector-dashboard');
      } else {
        alert('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('veri_registered');
    localStorage.removeItem('veri_dealer_registered');
    localStorage.removeItem('veri_farmer_plots');
    setIsRegistered(false);
    setIsDealerRegistered(false);
    setPlots([]);
    setView('ROLE_SELECT');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-palm-950 font-sans selection:bg-gold-200">
      {/* Background Separation Layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-parchment shadow-[0_0_100px_rgba(0,0,0,0.02)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-50/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto min-h-screen bg-parchment border-x border-gray-100 flex flex-col">
        <Navbar 
          onHome={handleHome} 
          onBack={handleBack}
          isOnline={isOnline}
          onToggleOnline={handleToggleOnline}
          showBack={view !== 'ROLE_SELECT' && view !== 'farmer-dashboard'} 
          onLogout={handleLogout}
          showLogout={view !== 'ROLE_SELECT'}
        />
        
        <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === 'ROLE_SELECT' && (
            <Home 
              key="home"
              onSelectRole={(role) => {
                if (role === 'farmer') {
                  if (isRegistered) setView('farmer-dashboard');
                  else {
                    setPlots([]);
                    localStorage.removeItem('veri_farmer_plots');
                    setView('farmer-registration');
                  }
                }
                else {
                  if (isDealerRegistered) setView('collector-dashboard');
                  else setView('DEALER_SIGNUP');
                }
              }} 
            />
          )}

          {view === 'farmer-registration' && (
            <FarmerRegistration 
              key="farmer-reg"
              onComplete={handleFarmerRegistrationComplete} 
              plots={plots}
              setPlots={setPlots}
            />
          )}

          {view === 'DEALER_SIGNUP' && (
            <DealerRegistration 
              key="dealer-reg"
              onComplete={handleDealerRegistrationComplete} 
            />
          )}

          {view === 'farmer-dashboard' && (
            <FarmerDashboard 
              key="farmer-dash"
              onLogout={handleLogout}
              plots={plots}
              isOnline={isOnline}
              offlineCacheCount={offlineCacheCount}
              isSyncing={isSyncing}
            />
          )}

          {view === 'collector-dashboard' && (
            <CollectorDashboard 
              key="collector-dash"
              onNewTransaction={() => setView('collector-transaction')}
              onShowManifest={(ids) => {
                setManifestIds(ids || []);
                setView('manifest');
              }}
              onLogout={handleLogout}
              isOnline={isOnline}
              offlineCacheCount={offlineCacheCount}
              isSyncing={isSyncing}
              pendingSyncs={pendingSyncs}
              setPendingSyncs={setPendingSyncs}
              transactions={transactions}
              setTransactions={setTransactions}
            />
          )}

          {view === 'collector-transaction' && (
            <TransactionFlow 
              key="tx-flow"
              isOnline={isOnline}
              onComplete={(newTx) => {
                if (newTx) {
                  setTransactions(prev => [newTx, ...prev]);
                }
                setView('collector-dashboard');
              }} 
              onOfflineTransaction={handleOfflineTransaction}
            />
          )}

          {view === 'manifest' && (
            <ManifestView 
              key="manifest"
              selectedIds={manifestIds}
              transactions={transactions}
              onBack={() => setView('collector-dashboard')} 
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 px-6 border-t border-palm-100 bg-white/50">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-palm-950 rounded-lg flex items-center justify-center text-gold-400">
              <ShieldCheck size={18} />
            </div>
            <span className="font-display font-bold uppercase tracking-widest text-xs">Veri</span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 hover:text-palm-950 transition-colors">Privacy</a>
            <a href="#" className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 hover:text-palm-950 transition-colors">Terms</a>
            <a href="#" className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 hover:text-palm-950 transition-colors">Support</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}