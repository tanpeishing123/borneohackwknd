import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  Printer,
  FileCheck,
  Calendar,
  Globe,
  Info,
  Activity
} from 'lucide-react';

// --- Types ---
type View = 'ROLE_SELECT' | 'farmer-registration' | 'DEALER_SIGNUP' | 'farmer-dashboard' | 'collector-dashboard' | 'collector-transaction' | 'manifest';

// --- Components ---

const Navbar = ({ onHome, onBack, isOffline, showBack, onLogout, showLogout }: { onHome: () => void, onBack?: () => void, isOffline?: boolean, showBack?: boolean, onLogout?: () => void, showLogout?: boolean }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-parchment/80 backdrop-blur-md border-b border-palm-900/5">
      <div className="flex items-center gap-4">
        {showBack && onBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-palm-100 flex items-center justify-center text-palm-950 hover:bg-gold-500 hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={onHome}
        >
          <div className="w-10 h-10 bg-palm-950 rounded-xl flex items-center justify-center text-gold-400 group-hover:bg-palm-900 transition-colors shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold text-palm-950 tracking-tighter leading-none uppercase">Veri</span>
            <span className="text-[10px] font-display font-bold text-palm-700 tracking-widest uppercase">EUDR Shield</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 relative">
        <div className={`status-badge ${!isOffline ? 'status-online' : 'status-offline'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${!isOffline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {!isOffline ? 'Online Mode' : 'Edge Mode'}
        </div>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-palm-900 hover:bg-palm-100 rounded-full transition-colors"
        >
          <Menu size={24} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-palm-100 overflow-hidden z-[100]"
            >
              <div className="p-2">
                {showLogout && onLogout && (
                  <button 
                    onClick={() => { onLogout(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                )}
                <button 
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-palm-600 hover:bg-palm-50 rounded-xl transition-colors text-left"
                >
                  <Info size={18} /> Help & Support
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

const Home = ({ onSelectRole }: { onSelectRole: (role: 'farmer' | 'collector') => void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-20"
  >
    <div className="flex flex-col justify-center">
      <div className="max-w-4xl mb-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-palm-100 text-palm-900 text-[10px] font-display font-bold uppercase tracking-widest mb-6 border border-palm-200"
        >
          <ShieldCheck size={14} className="text-gold-600" />
          <span>Next-Gen Agri-Traceability</span>
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-palm-950 mb-6 leading-[0.85] tracking-tighter">
          Rooted in <br />
          <span className="italic text-gold-600">Compliance.</span>
        </h1>
        <p className="text-lg md:text-xl text-palm-800 font-light leading-relaxed max-w-2xl">
          Veri ensures every harvest meets the highest EUDR standards with unbreakable digital links.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        <motion.button 
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('farmer')}
          className="group relative overflow-hidden glass-card p-12 text-left border-2 border-transparent hover:border-gold-500/30 transition-all"
        >
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gold-100 text-gold-600 flex items-center justify-center mb-8 group-hover:bg-gold-500 group-hover:text-white transition-colors">
              <User size={32} />
            </div>
            <h3 className="text-4xl font-serif font-bold text-palm-950 mb-4">I am a Farmer</h3>
            <p className="text-palm-600 font-light mb-8 text-lg">Register land and verify your harvest for global markets.</p>
            <div className="flex items-center gap-2 text-gold-600 font-display font-bold uppercase tracking-widest text-xs">
              Enter Portal <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-gold-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
        </motion.button>

        <motion.button 
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelectRole('collector')}
          className="group relative overflow-hidden dark-card p-12 text-left border-2 border-transparent hover:border-palm-400/30 transition-all"
        >
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-palm-800 text-palm-200 flex items-center justify-center mb-8 group-hover:bg-palm-400 group-hover:text-palm-950 transition-colors">
              <Truck size={32} />
            </div>
            <h3 className="text-4xl font-serif font-bold text-parchment mb-4">I am a Dealer</h3>
            <p className="text-parchment/60 font-light mb-8 text-lg">Verify identities and manage compliance in real-time.</p>
            <div className="flex items-center gap-2 text-gold-400 font-display font-bold uppercase tracking-widest text-xs">
              Enter Portal <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-palm-900/50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
        </motion.button>
      </div>
    </div>

    {/* Feature Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        { label: 'Offline First', icon: WifiOff, desc: 'Works in remote plantations without signal.' },
        { label: 'Digital Vault', icon: FileText, desc: 'Unbreakable blockchain-backed records.' },
        { label: 'GIS Guard', icon: MapPin, desc: 'Real-time plot boundary verification.' },
        { label: 'DDS Ready', icon: ShieldCheck, desc: 'Automated Due Diligence Statements.' },
      ].map((feat, i) => (
        <div key={i} className="glass-card p-8 hover:bg-palm-50 transition-colors group">
          <div className="w-12 h-12 bg-palm-100 rounded-xl flex items-center justify-center text-palm-900 mb-6 group-hover:bg-gold-500 group-hover:text-white transition-all">
            <feat.icon size={24} />
          </div>
          <h4 className="font-serif font-bold text-xl text-palm-950 mb-2">{feat.label}</h4>
          <p className="text-sm text-palm-600 font-light">{feat.desc}</p>
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

const FarmerRegistration = ({ onComplete, plots, setPlots }: { onComplete: () => void, plots: any[], setPlots: (p: any[]) => void, key?: string }) => {
  const [step, setStep] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingPlot, setIsAddingPlot] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapPoints, setMapPoints] = useState<{x: number, y: number}[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    permitPhotos: {} as Record<string, string | null>,
    permitTypes: ['MPOB'] as string[],
    customPermits: [] as string[],
    otherPermitName: '',
  });

  const [currentPlot, setCurrentPlot] = useState({
    title: '',
    area: '',
    cropType: 'Palm Oil',
    plantingYear: '2018',
    titlePhoto: null as string | null,
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

  const addPlot = () => {
    const normalizedCrop = currentPlot.cropType.toLowerCase().trim();
    const requiredPermit = cropToPermit[normalizedCrop];

    // Validation: Check if crop type matches selected permits
    const isCovered = formData.permitTypes.some(pt => {
      if (pt === 'OTHER') return true; 
      return permitToCrop[pt]?.toLowerCase() === normalizedCrop;
    }) || formData.customPermits.length > 0;

    const hasPhoto = (requiredPermit && formData.permitPhotos[requiredPermit]) || 
                     formData.permitTypes.includes('OTHER') || 
                     formData.customPermits.length > 0; // Assume custom permits are verified if added

    // Special check for Palm Oil if not explicitly selected in Step 1
    const isPalmOil = normalizedCrop.includes('palm');
    const hasPalmPermit = formData.permitTypes.includes('MPOB') && formData.permitPhotos['MPOB'];

    if (isPalmOil && !hasPalmPermit) {
      alert(`License Required: You haven't uploaded the MPOB permit required for Palm Oil.`);
      return;
    }

    if (!isCovered || !hasPhoto) {
      alert(`License Required: You haven't uploaded the required permit for ${currentPlot.cropType}.`);
      return;
    }

    if (currentPlot.area) {
      setPlots([...plots, { 
        ...currentPlot, 
        id: Date.now(),
        title: currentPlot.title || `${currentPlot.cropType} Plot ${plots.length + 1}`,
        points: mapPoints
      }]);
      setCurrentPlot({ title: '', area: '', cropType: 'Palm Oil', plantingYear: '2018', titlePhoto: null });
      setMapPoints([]);
      setIsDrawing(false);
      setIsAddingPlot(false);
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newPoints = [...mapPoints, { x, y }];
    setMapPoints(newPoints);

    // Simulate area calculation if 3+ points
    if (newPoints.length >= 3) {
      const simulatedArea = (newPoints.length * 0.45).toFixed(2);
      setCurrentPlot(prev => ({ ...prev, area: simulatedArea }));
    }
  };

  const autoDetectLocation = () => {
    setIsScanning(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(() => {
        setTimeout(() => {
          setIsScanning(false);
          // Simulate map jump to a new "location"
          setMapPoints([]);
          setIsDrawing(false);
        }, 1500);
      }, () => {
        setIsScanning(false);
        alert("Location access denied. Please enable GPS.");
      });
    } else {
      setIsScanning(false);
      alert("Geolocation not supported.");
    }
  };

  const removePlot = (id: number) => {
    setPlots(plots.filter(p => p.id !== id));
  };

  const simulateScan = (type: 'ic' | 'title' | string) => {
    setIsScanning(true);
    setTimeout(() => {
      if (type === 'ic') {
        setFormData(prev => ({
          ...prev,
          name: 'Ahmad bin Ismail',
          idNumber: '820101-01-5543',
        }));
      } else if (type === 'title') {
        setCurrentPlot(prev => ({
          ...prev,
          titlePhoto: 'https://picsum.photos/seed/title/400/500'
        }));
      } else {
        // Permit upload
        setFormData(prev => ({
          ...prev,
          permitPhotos: {
            ...prev.permitPhotos,
            [type]: `https://picsum.photos/seed/${type}/400/250`
          }
        }));
      }
      setIsScanning(false);
    }, 2000);
  };

  const totalArea = plots.reduce((acc, p) => acc + Number(p.area || 0), 0);
  const totalQuota = totalArea * 2.5;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="min-h-screen pt-32 pb-32 px-6 max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-12">
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

      <div className="glass-card p-10 relative overflow-hidden">
        {isScanning && (
          <div className="absolute inset-0 z-50 bg-palm-950/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <div className="w-64 h-64 border-2 border-gold-400 rounded-3xl relative overflow-hidden mb-6">
              <div className="animate-scan-line" />
              <Camera size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold-400 opacity-50" />
            </div>
            <p className="font-display font-bold uppercase tracking-widest text-sm animate-pulse">AI Verifying Document...</p>
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
                          
                          {photo ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-palm-600">
                              <img src={photo} alt={pt} className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  permitPhotos: { ...prev.permitPhotos, [pt]: null }
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
                                    <div key={idx} className="flex items-center gap-2 bg-palm-900 p-3 rounded-xl border border-palm-700">
                                      <div className="flex-1">
                                         <p className="text-[8px] font-black text-gold-400 uppercase tracking-widest mb-1">Custom License</p>
                                         <span className="text-xs text-parchment font-bold">{cp}</span>
                                      </div>
                                      <button onClick={() => setFormData(prev => ({ ...prev, customPermits: prev.customPermits.filter((_, i) => i !== idx) }))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                        <Trash2 size={14}/>
                                      </button>
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
                                          setFormData(prev => ({ ...prev, customPermits: [...prev.customPermits, prev.otherPermitName], otherPermitName: '' }));
                                        }
                                      }}
                                      className="px-4 bg-gold-500 text-palm-950 rounded-xl font-bold text-xs uppercase tracking-widest"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              )}
                              <button 
                                onClick={() => simulateScan(pt)}
                                className="w-full py-3 bg-palm-700 text-parchment rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-palm-600 transition-colors flex items-center justify-center gap-2"
                              >
                                <Camera size={14} /> Upload {permitInfo?.label}
                              </button>
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
                    onClick={() => setStep(3)}
                    disabled={plots.length === 0}
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
                    <input 
                      type="text"
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-palm-100 outline-none focus:ring-2 focus:ring-gold-500"
                      placeholder="e.g. Palm Oil, Cocoa"
                      value={currentPlot.cropType}
                      onChange={(e) => setCurrentPlot({...currentPlot, cropType: e.target.value})}
                    />
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
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                        <img src={currentPlot.titlePhoto} alt="Title" className="w-full h-full object-cover" />
                        <button onClick={() => setCurrentPlot({...currentPlot, titlePhoto: null})} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><Trash2 size={18}/></button>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-palm-50 rounded-xl flex items-center justify-center text-palm-300">
                          <Camera size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-palm-950 uppercase tracking-widest mb-1">Upload Land Title</p>
                          <p className="text-[10px] text-palm-400 font-light">Capture or upload official land deed.</p>
                        </div>
                        <button 
                          onClick={() => simulateScan('title')}
                          className="px-6 py-3 bg-palm-100 text-palm-950 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-all"
                        >
                          Capture Document
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-500 ml-1">Geofence Boundary</label>
                  </div>
                  <div 
                    className={`map-container aspect-video rounded-3xl overflow-hidden relative cursor-crosshair ${isDrawing ? 'ring-2 ring-gold-500 ring-offset-2' : ''}`}
                    onClick={handleMapClick}
                  >
                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/101.6869,3.1390,13,0/600x400?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTAwMHozN28xeHR5Z2h6Z3IifQ.r_98_fS96_89_89_89_89')] bg-cover opacity-80" />
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {mapPoints.length > 0 && (
                        <polyline
                          points={mapPoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                          fill="none"
                          stroke="#D97706"
                          strokeWidth="2"
                          className="vector-path"
                          style={{ vectorEffect: 'non-scaling-stroke' }}
                        />
                      )}
                      {mapPoints.length >= 3 && (
                        <polygon
                          points={mapPoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
                          fill="rgba(217, 119, 6, 0.2)"
                          stroke="#D97706"
                          strokeWidth="2"
                          strokeDasharray="4"
                        />
                      )}
                      {mapPoints.map((p, i) => (
                        <circle
                          key={i}
                          cx={`${p.x}%`}
                          cy={`${p.y}%`}
                          r="4"
                          fill="#D97706"
                          className="animate-pulse"
                        />
                      ))}
                    </svg>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                      <button 
                        onClick={(e) => { e.stopPropagation(); autoDetectLocation(); }}
                        className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <MapPin size={14} /> Auto-Detect
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsDrawing(!isDrawing); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all ${isDrawing ? 'bg-gold-500 text-palm-950' : 'bg-palm-950 text-white'}`}
                      >
                        <PenTool size={14} /> {isDrawing ? 'Finish Drawing' : 'Draw Polygon'}
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={addPlot}
                  disabled={!currentPlot.area || !currentPlot.titlePhoto}
                  className="btn-gold w-full justify-center disabled:opacity-50"
                >
                  Save Plot
                </button>

                {/* Real-time Validation Warning */}
                {(() => {
                  const isPalmOil = currentPlot.cropType.toLowerCase().includes('palm');
                  const requiredPermit = isPalmOil ? 'MPOB' : cropToPermit[currentPlot.cropType];
                  const isMissing = requiredPermit && !formData.permitPhotos[requiredPermit] && !formData.permitTypes.includes('OTHER');
                  
                  if (!isMissing) return null;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Missing {requiredPermit} License</span>
                      </div>
                      <p className="text-[10px] text-red-500 leading-tight font-medium">
                        You haven't uploaded the required license for {currentPlot.cropType}. You must provide it to register this plot.
                      </p>
                      <button 
                        onClick={() => {
                          // Add to permit types if not there
                          if (!formData.permitTypes.includes(requiredPermit)) {
                            setFormData(prev => ({
                              ...prev,
                              permitTypes: [...prev.permitTypes, requiredPermit]
                            }));
                          }
                          simulateScan(requiredPermit);
                        }}
                        className="w-full py-2 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera size={12} /> Quick Upload {requiredPermit}
                      </button>
                    </motion.div>
                  );
                })()}
              </motion.div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl font-serif font-bold text-palm-950 mb-2">Global Overview</h2>
              <p className="text-palm-600 font-light">Review your consolidated agricultural profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Palm Oil', 'Cocoa', 'Rubber'].map(crop => {
                const cropPlots = plots.filter(p => p.cropType === crop);
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
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${Number(plot.plantingYear) <= 2020 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {Number(plot.plantingYear) <= 2020 ? 'EUDR Safe' : 'High Risk'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={onComplete}
                className="w-full py-6 bg-gold-500 text-palm-950 rounded-[2rem] font-display font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-gold-600 transition-all shadow-2xl shadow-gold-500/20"
              >
                <ShieldCheck size={20} /> Generate Universal ID
              </button>
              <button onClick={() => setStep(2)} className="text-center text-palm-400 font-display font-bold uppercase tracking-widest text-[10px] hover:text-palm-950 transition-colors">Edit Plots</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DDS_Template = ({ item, idx, isConsolidated = false }: { item: any, idx: number, isConsolidated?: boolean, key?: any }) => {
  const getPermitLabel = (crop: string) => {
    const c = crop?.toLowerCase() || '';
    if (c.includes('palm')) return 'MSPO License';
    if (c.includes('cocoa')) return 'MCB Permit';
    if (c.includes('rubber')) return 'LGM Permit';
    return 'National Registry Permit';
  };

  return (
    <div className={`w-full bg-white shadow-2xl p-12 md:p-16 border-t-8 border-orange-500 relative overflow-hidden ring-1 ring-slate-200 print:shadow-none print:border-t-8 print:ring-0 ${isConsolidated ? 'mb-8 print:mb-0 print:break-before-page' : ''}`}>
      {/* 背景防伪水印 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] -rotate-12 pointer-events-none">
        <ShieldCheck size={400} />
      </div>

      {/* 页眉部分 */}
      <header className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#064e3b]">
            <ShieldCheck size={32} strokeWidth={2.5} />
            <span className="text-3xl font-black italic tracking-tighter uppercase">Veri</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isConsolidated ? `Producer Compliance Certificate (Part ${idx + 1})` : 'Single Producer Compliance Certificate'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Statement ID</p>
          <p className="text-sm font-mono font-black text-[#064e3b] tracking-tight">
            V-IND-{item.id || '00921'}-{idx + 1}
          </p>
        </div>
      </header>

      {/* 身份与状态部分 */}
      <section className="grid grid-cols-2 gap-10 mb-12 relative z-10">
        <div className="space-y-6">
          <div>
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Producer Identity</h4>
            <p className="font-black text-slate-800 text-lg leading-none">{item.farmerName || item.name || 'Ahmad bin Ismail'}</p>
            <p className="text-xs text-slate-400 font-bold mt-1">IC: {item.idNumber || item.ic || '780512-06-5543'}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">{getPermitLabel(item.cropType || item.crop)}</h4>
            <p className="font-bold text-slate-800">{item.permitType || item.license || 'MCB-9921-2026'}</p>
          </div>
        </div>
        <div className="flex flex-col justify-start">
           <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
              <h4 className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">EUDR Compliance Status</h4>
              <div className="flex items-center gap-3">
                 <div className="bg-green-500 text-white p-1 rounded-lg">
                  <CheckCircle2 size={20} />
                 </div>
                 <span className="font-black text-green-900 italic uppercase tracking-tighter text-xl">Negligible Risk</span>
              </div>
           </div>
        </div>
      </section>

      {/* 地块详细规格 */}
      <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-12 relative z-10">
        <div className="flex items-center gap-2 mb-8 border-b border-slate-200 pb-4">
          <MapPin size={20} className="text-[#064e3b]" />
          <h3 className="font-black text-[#064e3b] uppercase text-sm tracking-tight">Verified Plot Specifications (Article 9)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Plot Alias</span>
            <p className="text-xs font-bold text-slate-700">{item.plotName || 'Hillside Cocoa Grove'}</p>
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
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GPS Polygon Centroid</span>
            <p className="text-xs font-mono font-bold text-[#064e3b] bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block">
              {item.gps || '3.9322, 102.3611'}
            </p>
          </div>
        </div>
      </section>

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

  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If height is more than one page, we might need to split it, 
      // but for now let's just add it to one page or scale it.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DDS_Report_${type}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF. Please try again or use the Print button.');
    }
  };

  const handlePrint = () => {
    window.print();
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
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 sticky top-0 z-[210] bg-slate-900/80 p-4 rounded-2xl backdrop-blur-sm border border-white/10 print:hidden">
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
            onClick={handlePrint}
            className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-[#064e3b] transition-all"
          >
            <Printer size={20}/>
          </button>
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

      <div ref={reportRef} className="w-full max-w-5xl space-y-8 print:space-y-0 print:m-0 print:p-0">
        {type === 'consolidated' ? (
          <>
            <ConsolidatedTemplate data={data} />
            {(data.items || []).map((item: any, idx: number) => (
              <DDS_Template key={idx} item={item} idx={idx} isConsolidated={true} />
            ))}
          </>
        ) : (
          <DDS_Template item={data} idx={0} />
        )}
      </div>
      
      <div className="h-20" />
    </motion.div>
  );
};

const DealerRegistration = ({ onComplete }: { onComplete: () => void, key?: string }) => {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    repName: '',
    mobile: '+60 ',
    stationName: '',
    licenseTypes: ['MPOB'] as string[],
    licenseNumbers: { 'MPOB': '' } as Record<string, string>,
    licensePhotos: {} as Record<string, string | null>,
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

  const simulateLicenseUpload = (type: string) => {
    setFormData(prev => ({
      ...prev,
      licensePhotos: {
        ...prev.licensePhotos,
        [type]: `https://picsum.photos/seed/license-${type}/800/450`
      }
    }));
  };

  const handleComplete = () => {
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto text-center"
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
            onClick={onComplete}
            className="w-full py-5 bg-palm-900 text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-800 transition-all shadow-xl flex items-center justify-center gap-3"
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
              className="w-full py-5 bg-palm-900 text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={prevStep}
                className="w-1/3 py-5 bg-palm-100 text-palm-950 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-200 transition-all"
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
                className="flex-1 py-5 bg-palm-900 text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="p-6 bg-palm-50 rounded-3xl border border-palm-100 flex items-center gap-6">
                <div className="w-12 h-12 bg-palm-900 rounded-2xl flex items-center justify-center text-gold-400 shadow-lg">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 mb-1">Auto-Detected GPS</h4>
                  <p className="text-xl font-serif font-bold text-palm-950">Jerantut, Pahang</p>
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
                          <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-palm-900 shadow-xl">
                            <img src={photo} alt={label} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                licensePhotos: { ...prev.licensePhotos, [type]: null }
                              }))}
                              className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => simulateLicenseUpload(type)}
                            className="w-full aspect-video rounded-3xl border-2 border-dashed border-palm-200 bg-palm-50/50 flex flex-col items-center justify-center gap-4 hover:bg-palm-50 hover:border-palm-400 transition-all group"
                          >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-palm-400 group-hover:text-palm-900 transition-colors shadow-sm">
                              <Camera size={24} />
                            </div>
                            <div className="text-center">
                              <p className="font-display font-bold uppercase tracking-widest text-[10px] text-palm-950">Upload {label} License</p>
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={prevStep}
                className="w-1/3 py-5 bg-palm-100 text-palm-950 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-200 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleComplete}
                disabled={formData.licenseTypes.some(type => !formData.licensePhotos[type])}
                className="flex-1 py-5 bg-palm-900 text-gold-400 rounded-2xl font-display font-bold uppercase tracking-widest hover:bg-palm-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Registration
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FarmerDashboard = ({ onLogout, plots }: { onLogout: () => void, plots: any[], key?: string }) => {
  const [activeTab, setActiveTab] = useState<'id' | 'plots' | 'trades'>('id');
  const [showDDS, setShowDDS] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto"
    >
      {showDDS && (
        <DDSReport 
          type="individual" 
          data={{
            farmerName: 'Ahmad bin Ismail',
            cropType: selectedPlot?.crop || 'Palm Oil',
            permitType: selectedPlot?.crop === 'Palm Oil' ? 'MSPO-9921-2026' : (selectedPlot?.crop === 'Cocoa' ? 'MCB-7712-2024' : 'LGM-5543-2026'),
            weight: 'N/A',
            plotName: selectedPlot?.id || 'Hillside Cocoa Grove',
            area: selectedPlot?.area + ' HA',
            year: 2018,
            gps: '3.9322, 102.3611',
            ic: '780512-06-5543'
          }} 
          onClose={() => setShowDDS(false)} 
        />
      )}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-4xl font-serif font-bold text-palm-950">Welcome, Ahmad</h2>
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
                  <QrCode size={180} className="text-palm-950" />
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
            {[
              { date: '24 Feb 2024', weight: '1.25 MT', crop: 'Palm Oil', status: 'Synced' },
              { date: '18 Feb 2024', weight: '2.10 MT', crop: 'Rubber', status: 'Synced' },
              { date: '10 Feb 2024', weight: '0.85 MT', crop: 'Cocoa', status: 'Synced' },
            ].map((trade, i) => (
              <div key={i} className="glass-card p-6 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-palm-100 rounded-2xl flex items-center justify-center text-palm-950">
                    <History size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-xs text-palm-950">{trade.date}</h4>
                    <p className="text-sm text-palm-500">{trade.crop} • {trade.weight}</p>
                  </div>
                </div>
                <div className="status-badge status-online">
                  {trade.status}
                </div>
              </div>
            ))}
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

const CollectorDashboard = ({ onNewTransaction, onShowManifest, onLogout }: { onNewTransaction: () => void, onShowManifest: (selectedIds?: string[]) => void, onLogout: () => void, key?: string }) => {
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showDDS, setShowDDS] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transactions, setTransactions] = useState([
    { name: 'Ahmad bin Ismail', weight: '2.45', mode: 'Plantation', risk: 'Safe', time: '14:22', id: 'AB-9921', crop: 'Palm Oil' },
    { name: 'Siti Aminah', weight: '1.80', mode: 'Ramp', risk: 'Safe', time: '13:45', id: 'AB-8823', crop: 'Palm Oil' },
    { name: 'Tan Ah Kow', weight: '4.12', mode: 'Plantation', risk: 'Safe', time: '11:30', id: 'AB-7712', crop: 'Cocoa' },
    { name: 'M. Rajan', weight: '0.95', mode: 'Ramp', risk: 'Flagged', time: '09:15', id: 'AB-6654', warning: true, reason: 'GPS Mismatch: Harvest location detected outside registered plot boundary.', crop: 'Palm Oil' },
    { name: 'Zulkifli Ali', weight: '8.42', mode: 'Plantation', risk: 'Flagged', time: '08:30', id: 'AB-5543', warning: true, reason: 'Quota Exceeded: Monthly yield limit (8.0 MT) exceeded for registered area.', crop: 'Palm Oil' },
  ]);

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRequestAudit = (id: string) => {
    setTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, risk: 'PENDING_AUDIT', warning: false } : tx
    ));
    if (selectedTx && selectedTx.id === id) {
      setSelectedTx({ ...selectedTx, risk: 'PENDING_AUDIT', warning: false });
    }
  };

  const stats = [
    { label: "Today's Tonnage", value: "124.5", unit: "MT", icon: <Truck size={20} /> },
    { label: "Pending Syncs", value: "12", unit: "Batches", icon: <History size={20} /> },
    { label: "EUDR Risk Level", value: "Low", unit: "Compliance", icon: <ShieldCheck size={20} /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto"
    >
            {showDDS && selectedTx && (
        <DDSReport 
          type="individual" 
          data={{
            farmerName: selectedTx.name || selectedTx.farmer,
            weight: selectedTx.weight,
            permitType: selectedTx.warning ? 'AUDIT_PENDING' : (selectedTx.crop === 'Palm Oil' ? 'MSPO-8821-2025' : (selectedTx.crop === 'Cocoa' ? 'MCB-7712-2024' : 'LGM-5543-2026')),
            cropType: selectedTx.crop || 'Palm Oil',
            plotName: 'Verified Source Plot',
            area: '2.5 HA',
            year: 2015,
            gps: '3.1390, 101.6869',
            ic: selectedTx.ic || '850101-12-5543'
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
                  <h3 className="text-3xl font-serif font-bold text-palm-950">{selectedTx.name || selectedTx.farmer}</h3>
                  <p className="text-palm-500 font-medium">{selectedTx.id}</p>
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
                    <p className="text-2xl font-serif font-bold text-palm-950">{selectedTx.weight} MT</p>
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

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowDDS(true)}
                    className="flex-[2] py-4 rounded-2xl bg-palm-950 text-white font-display font-bold uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> View DDS Report
                  </button>
                  {selectedTx.warning && (
                    <button 
                      onClick={() => handleRequestAudit(selectedTx.id)}
                      className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-display font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-600/20"
                    >
                      Request Audit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h2 className="text-5xl font-serif font-bold text-palm-950 mb-2">Dealer Verification Hub</h2>
          <p className="text-palm-600 font-light flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Active Session: Station 01 • 12 Pending Syncs
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onShowManifest(selectedIds)}
            className="px-6 py-3 rounded-xl bg-palm-100 text-palm-950 font-display font-bold uppercase tracking-widest text-[10px] hover:bg-gold-500 hover:text-white transition-all flex items-center gap-2 relative"
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
          className="w-full py-12 rounded-3xl bg-gold-500 text-palm-950 flex flex-col items-center justify-center gap-6 shadow-xl shadow-gold-500/20 border-2 border-white/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 rounded-2xl bg-palm-950 text-gold-400 flex items-center justify-center shadow-lg relative z-10">
            <QrCode size={40} />
          </div>
          <div className="text-center relative z-10">
            <h3 className="text-3xl font-serif font-bold mb-1">Scan Farmer QR</h3>
            <p className="text-palm-900/60 font-display font-bold uppercase tracking-widest text-[10px]">Tap to Begin Verification</p>
          </div>
        </motion.button>
      </div>

      <div className="space-y-16">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="dark-card p-8 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-parchment/40 mb-4">Today's Tonnage</p>
              <h3 className="text-5xl font-serif font-bold text-gold-400 mb-2">42.8 <span className="text-xl text-parchment/60 font-light">MT</span></h3>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <ArrowRight size={14} className="-rotate-45" /> +12% from yesterday
              </div>
            </div>
            <BarChart3 size={120} className="absolute -bottom-4 -right-4 text-parchment/5" />
          </div>
          
          <div className="glass-card p-8">
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-palm-400 mb-4">Pending Offline Syncs</p>
            <h3 className="text-5xl font-serif font-bold text-palm-950 mb-2">12</h3>
            <button className="text-xs font-bold text-gold-600 uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              Sync to Cloud Now <ArrowRight size={14} />
            </button>
          </div>

          <div className="glass-card p-8 border-gold-500/20 bg-gold-50/30">
            <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-600 mb-4">EUDR Risk Level</p>
            <h3 className="text-5xl font-serif font-bold text-emerald-600 mb-2">LOW</h3>
            <p className="text-xs text-palm-600 font-light">All batches within 2020 redline safety.</p>
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
                  <th className="px-4 py-5">Farmer Identity</th>
                  <th className="px-8 py-5">Weight (MT)</th>
                  <th className="px-8 py-5">Mode</th>
                  <th className="px-8 py-5">Risk Status</th>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-palm-50">
                {transactions.map((row, i) => (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedTx(row)}
                    className={`hover:bg-palm-50/30 transition-colors group cursor-pointer ${selectedIds.includes(row.id) ? 'bg-gold-50/50' : ''}`}
                  >
                    <td className="px-4 py-6">
                      <button 
                        onClick={(e) => toggleSelection(row.id, e)}
                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedIds.includes(row.id) ? 'bg-gold-500 border-gold-500 text-palm-950' : 'bg-white border-palm-200'}`}
                      >
                        {selectedIds.includes(row.id) && <Check size={12} strokeWidth={4} />}
                      </button>
                    </td>
                    <td className="px-4 py-6">
                      <div className="font-display font-bold text-sm text-palm-950">{row.name}</div>
                      <div className="text-[10px] text-palm-400 font-bold uppercase tracking-widest">{row.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-lg font-serif font-bold ${row.warning ? 'text-red-600' : 'text-palm-950'}`}>{row.weight}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="status-badge bg-palm-100 text-palm-700">{row.mode}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${row.warning ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${row.warning ? 'text-red-700' : 'text-emerald-700'}`}>{row.risk}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs text-palm-400 font-medium">{row.time}</td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTx(row); setShowDDS(true); }}
                        className="p-2 bg-palm-950 text-gold-400 rounded-lg hover:bg-gold-500 hover:text-palm-950 transition-all shadow-lg shadow-palm-950/20"
                      >
                        <FileText size={14} />
                      </button>
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

const TransactionFlow = ({ onComplete }: { onComplete: () => void, key?: string }) => {
  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [mode, setMode] = useState<'Plantation' | 'Ramp'>('Plantation');

  const [signature, setSignature] = useState<string | null>(null);
  const [signature_base64, setSignatureBase64] = useState<string | null>(null);

  const simulateCapture = () => {
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 2000);
  };

  const isLaundering = Number(weight) > 8;

  const handleSave = () => {
    // In a real app, you would send this to the backend
    const transaction = {
      weight,
      mode,
      timestamp: new Date().toISOString(),
      signature_base64: mode === 'Ramp' ? signature : null
    };
    console.log('Saving transaction:', transaction);
    setStep(3);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto"
    >
      <div className="dark-card overflow-hidden border-none">
        <div className="bg-gold-500 p-8 text-palm-950 flex justify-between items-center">
          <h3 className="text-2xl font-serif font-bold">Edge AI Verification</h3>
          <div className="status-badge bg-palm-950 text-gold-400 border-none">
            <WifiOff size={14} /> Offline Lock
          </div>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="text-center">
              <div className="w-56 h-56 bg-palm-900 rounded-[3rem] mx-auto mb-10 flex items-center justify-center relative overflow-hidden group">
                <QrCode size={100} className="text-gold-400 opacity-20" />
                <div className="absolute inset-0 border-2 border-gold-400/30 rounded-[3rem]" />
                <div className="animate-scan-line" />
              </div>
              <h4 className="text-3xl font-serif font-bold text-parchment mb-4">Scanning Farmer QR</h4>
              <p className="text-parchment/60 font-light mb-10">Establishing secure handshake with Veri ID.</p>
              <button 
                onClick={() => setStep(2)}
                className="btn-gold w-full justify-center"
              >
                Scan
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
                    <h5 className="text-xl font-serif font-bold text-parchment">Ahmad bin Ismail</h5>
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-400">ID: AB-9921 • Legality Verified</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                      <MapPin size={10} /> GPS MATCHED
                   </div>
                   <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden opacity-60">
                      <img src="https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/101.6869,3.1390,15,0/100x100?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTAwMHozN28xeHR5Z2h6Z3IifQ.r_98_fS96_89_89_89_89" alt="GPS" className="w-full h-full object-cover" />
                   </div>
                </div>
              </div>

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
                      <p className="text-xs font-serif font-bold text-parchment">5.80 MT</p>
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
                {isCapturing ? (
                  <div className="py-4">
                    <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-400 animate-pulse">Capturing FFB Batch...</p>
                  </div>
                ) : (
                  <button 
                    onClick={simulateCapture}
                    className="flex flex-col items-center gap-4 mx-auto"
                  >
                    <div className="w-16 h-16 bg-palm-800 rounded-2xl flex items-center justify-center text-gold-400 group-hover:bg-gold-500 group-hover:text-palm-950 transition-all">
                      <Camera size={32} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold uppercase tracking-widest text-[10px] text-parchment">Capture FFB Batch</h4>
                      <p className="text-[8px] text-parchment/40 mt-1">Auto-watermark GPS & Timestamp</p>
                    </div>
                  </button>
                )}
              </div>

              {isLaundering && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-6 bg-red-950 border border-red-500/30 rounded-3xl flex items-center gap-6"
                >
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0 animate-pulse">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold uppercase tracking-widest text-xs text-red-500">Laundering Lock!</h4>
                    <p className="text-[10px] text-red-200/60 leading-relaxed">Weight exceeds the monthly quota for this land parcel. Transaction blocked for EUDR compliance.</p>
                  </div>
                </motion.div>
              )}

              {mode === 'Ramp' && (
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
              )}

              <div className="relative">
                <button 
                  disabled={isLaundering || !weight || (mode === 'Ramp' && !signature)}
                  onClick={handleSave}
                  className={`w-full py-5 text-lg font-display font-bold uppercase tracking-widest rounded-2xl transition-all ${isLaundering ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-gold-500 text-palm-950 hover:bg-gold-600 shadow-xl shadow-gold-500/20'}`}
                >
                  {isLaundering ? 'Transaction Blocked' : 'Save'}
                </button>
                {isLaundering && (
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                      Weight exceeds monthly quota
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
                className="w-24 h-24 bg-gold-500 rounded-full flex items-center justify-center text-palm-950 mx-auto mb-8 shadow-2xl shadow-gold-500/20"
              >
                <CheckCircle2 size={48} />
              </motion.div>
              <h3 className="text-3xl font-serif font-bold text-parchment mb-4">Verification Locked</h3>
              <p className="text-parchment/60 font-light mb-10 max-w-xs mx-auto">Transaction stored securely via Edge AI. Auto-sync will trigger upon network detection.</p>
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

const ManifestView = ({ onBack, selectedIds }: { onBack: () => void, selectedIds?: string[], key?: string }) => {
  const [showDDS, setShowDDS] = useState(false);

  const allItems = [
    { farmerName: 'Ahmad bin Ismail', weight: '2.8', id: 'AB-9921', crop: 'Cocoa', area: '1.5 HA', year: 2015, gps: '3.1390, 101.6869', ic: '780512-06-5543', license: 'MPOB-9921-2026', mode: 'PLANTATION' },
    { farmerName: 'Siti Aminah', weight: '1.5', id: 'AB-8823', crop: 'Rubber', area: '2.0 HA', year: 2018, gps: '3.1400, 101.6870', ic: '820315-10-5542', license: 'MPOB-8823-2025', mode: 'RAMP' },
    { farmerName: 'Tan Ah Kow', weight: '4.2', id: 'AB-7712', crop: 'Cocoa', area: '3.2 HA', year: 2012, gps: '3.1380, 101.6860', ic: '650512-01-5541', license: 'MCB-7712-2024', mode: 'PLANTATION' },
    { farmerName: 'M. Rajan', weight: '5.75', id: 'AB-6611', crop: 'Palm Oil', area: '4.5 HA', year: 2010, gps: '3.1370, 101.6850', ic: '700101-08-5540', license: 'MPOB-6611-2023', mode: 'PLANTATION' },
  ];

  const filteredItems = selectedIds && selectedIds.length > 0
    ? allItems.filter(item => selectedIds.includes(item.id))
    : allItems;

  const totalWeight = filteredItems.reduce((acc, item) => acc + parseFloat(item.weight), 0).toFixed(2);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto"
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
                <p className="font-bold text-parchment">{item.farmerName}</p>
                <p className="text-[10px] text-parchment/40 uppercase tracking-widest">{item.id}</p>
              </div>
              <p className="font-serif font-bold text-gold-400">{item.weight} MT</p>
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

  const [manifestIds, setManifestIds] = useState<string[]>([]);

  useEffect(() => {
    const registered = localStorage.getItem('veri_registered');
    const dealerRegistered = localStorage.getItem('veri_dealer_registered');
    const savedPlots = localStorage.getItem('veri_farmer_plots');

    if (savedPlots) {
      setPlots(JSON.parse(savedPlots));
    }

    if (registered === 'true') {
      setIsRegistered(true);
      setView('farmer-dashboard');
    } else if (dealerRegistered === 'true') {
      setIsDealerRegistered(true);
      setView('collector-dashboard');
    }
  }, []);

  const handleHome = () => setView('ROLE_SELECT');
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

  const handleFarmerRegistrationComplete = () => {
    localStorage.setItem('veri_registered', 'true');
    localStorage.setItem('veri_farmer_plots', JSON.stringify(plots));
    setIsRegistered(true);
    setView('farmer-dashboard');
  };

  const handleDealerRegistrationComplete = () => {
    localStorage.setItem('veri_dealer_registered', 'true');
    setIsDealerRegistered(true);
    setView('collector-dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('veri_registered');
    localStorage.removeItem('veri_dealer_registered');
    setIsRegistered(false);
    setIsDealerRegistered(false);
    setView('ROLE_SELECT');
  };

  return (
    <div className="min-h-screen bg-parchment text-palm-950 font-sans selection:bg-gold-200 selection:text-palm-950">
      <Navbar 
        onHome={handleHome} 
        onBack={handleBack}
        showBack={view !== 'ROLE_SELECT' && view !== 'farmer-dashboard'} 
        onLogout={handleLogout}
        showLogout={view !== 'ROLE_SELECT'}
      />
      
      <main>
        <AnimatePresence mode="wait">
          {view === 'ROLE_SELECT' && (
            <Home 
              key="home"
              onSelectRole={(role) => {
                if (role === 'farmer') {
                  if (isRegistered) setView('farmer-dashboard');
                  else setView('farmer-registration');
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
            />
          )}

          {view === 'collector-transaction' && (
            <TransactionFlow 
              key="tx-flow"
              onComplete={() => setView('collector-dashboard')} 
            />
          )}

          {view === 'manifest' && (
            <ManifestView 
              key="manifest"
              selectedIds={manifestIds}
              onBack={() => setView('collector-dashboard')} 
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 px-6 border-t border-palm-100 bg-white/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
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
  );
}
