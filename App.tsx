
import React, { useState, useMemo } from 'react';
import { INITIAL_CONFIG, IVA_RATE, AVAILABLE_PRODUCTS } from './constants';
import { ProjectConfig, QuoteResult, MaterialCategory, QuoteItem, Product } from './types';
import { 
  Calculator, 
  Printer, 
  RefreshCw, 
  Tag, 
  Clock, 
  Briefcase, 
  ArrowRight, 
  Truck, 
  AlertTriangle, 
  Info, 
  HardHat, 
  TrendingUp, 
  Box, 
  Users, 
  ChevronDown, 
  Plus, 
  X, 
  Check,
  Pencil,
  Minus,
  Settings
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(INITIAL_CONFIG);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formProduct, setFormProduct] = useState({
    name: '',
    price: '',
    yield: '34',
    brand: ''
  });

  // Helper function to calculate work days based on m2
  const calculateWorkDays = (m2: number) => {
    return Math.max(1, Math.ceil(m2 / 33.3));
  };

  const allProducts = useMemo(() => {
    const customIds = new Set(customProducts.map(p => p.id));
    const filteredBase = AVAILABLE_PRODUCTS.filter(p => !customIds.has(p.id));
    return [...filteredBase, ...customProducts];
  }, [customProducts]);

  const currentProduct = useMemo(() => {
    return allProducts.find(p => p.id === config.selectedProductId) || allProducts[0];
  }, [config.selectedProductId, allProducts]);

  const isCurrentProductEditable = true; 

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => p.category === config.selectedCategory);
  }, [config.selectedCategory, allProducts]);

  const result: QuoteResult = useMemo(() => {
    const sealerMaterial = config.materials['Sellador'];
    const m2 = config.m2;
    const items: QuoteItem[] = [];

    // 1. Principal (Usando el producto seleccionado + ajuste manual)
    const baseBuckets = Math.ceil(m2 / currentProduct.yield);
    const finalBuckets = Math.max(0, baseBuckets + config.extraBuckets);
    items.push({
      concept: config.selectedCategory,
      detail: `${currentProduct.name} - Cobertura para ${m2} m²`,
      quantity: `${finalBuckets} Cub.`,
      unitPrice: currentProduct.price,
      total: finalBuckets * currentProduct.price,
      brand: currentProduct.brand,
      yieldDisplay: `${currentProduct.yield} m²/c`,
      isAdjustable: true 
    });

    // 2. Sellador (Añadiendo ajuste manual +/-)
    const baseSealerBuckets = Math.ceil(m2 / sealerMaterial.yield);
    const finalSealerBuckets = Math.max(0, baseSealerBuckets + config.extraSealerBuckets);
    items.push({
      concept: 'Sellador Primario',
      detail: 'Base de adherencia obligatoria',
      quantity: `${finalSealerBuckets} Cub.`,
      unitPrice: sealerMaterial.price,
      total: finalSealerBuckets * sealerMaterial.price,
      brand: sealerMaterial.brand,
      yieldDisplay: `${sealerMaterial.yield} m²/c`,
      isAdjustable: true 
    });

    // 3. Auxiliar (MANUAL)
    items.push({
      concept: 'Material Auxiliar',
      detail: 'Rodillos, brochas, cintas y masking',
      quantity: 'Global',
      unitPrice: config.auxMaterialTotal,
      total: config.auxMaterialTotal,
      brand: 'Varios',
      yieldDisplay: 'N/A'
    });

    // 4. Andamios
    const hasScaffold = config.scaffoldCount > 0;
    const scaffoldTotal = hasScaffold ? (config.scaffoldCount * config.scaffoldDailyRate * config.scaffoldDays) : 0;
    items.push({
      concept: 'Renta de andamio',
      detail: 'Torres certificadas para altura',
      quantity: hasScaffold ? `${config.scaffoldCount} Und.` : '0',
      unitPrice: config.scaffoldDailyRate,
      total: scaffoldTotal,
      brand: hasScaffold ? 'SÍ' : 'NO',
      yieldDisplay: hasScaffold ? `${config.scaffoldDays} Días` : '0 D'
    });

    // 5. Mano de Obra Especializada
    const workerTotal = config.numWorkers * config.workerDailyRate * config.workDays;
    items.push({
      concept: 'Mano de Obra Especializada',
      detail: 'Ejecución técnica de aplicación',
      quantity: `${config.numWorkers * config.workDays} Jorn.`,
      unitPrice: config.workerDailyRate,
      total: workerTotal,
      brand: `${config.numWorkers} Trab.`,
      yieldDisplay: `${config.workDays} Días`
    });

    // 6. Albañilería
    if (config.masonryRepairEnabled) {
      items.push({
        concept: 'Gastos por reparaciones albañilería',
        detail: 'DAÑO ESTRUCTURAL: Reparación de paredes rotas y parches.',
        quantity: '1 Serv.',
        unitPrice: config.masonryRepairCost,
        total: config.masonryRepairCost,
        brand: 'URGENTE',
        yieldDisplay: 'Pre-Obra',
        isWarning: true
      });
    }

    // 7. Utilidad
    items.push({
      concept: 'Supervisión y Administración',
      detail: 'Dirección técnica Mauro y Omar',
      quantity: `${m2} m²`,
      unitPrice: config.profitRate,
      total: m2 * config.profitRate,
      brand: 'Ingeniería',
      yieldDisplay: 'N/A'
    });

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    return { items, subtotal, iva: subtotal * IVA_RATE, total: subtotal * (1 + IVA_RATE) };
  }, [config, currentProduct]);

  const handleM2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const calculatedDays = calculateWorkDays(val);
    setConfig(p => ({ 
      ...p, 
      m2: val,
      workDays: calculatedDays
    }));
  };

  const handleCategoryChange = (category: MaterialCategory) => {
    const firstProductOfCategory = allProducts.find(p => p.category === category);
    setConfig(p => ({ 
      ...p, 
      selectedCategory: category,
      selectedProductId: firstProductOfCategory?.id || p.selectedProductId,
      extraBuckets: 0,
      extraSealerBuckets: 0
    }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig(p => ({ ...p, selectedProductId: e.target.value, extraBuckets: 0 }));
  };

  const adjustBuckets = (amount: number) => {
    setConfig(p => ({ ...p, extraBuckets: p.extraBuckets + amount }));
  };

  const adjustSealerBuckets = (amount: number) => {
    setConfig(p => ({ ...p, extraSealerBuckets: p.extraSealerBuckets + amount }));
  };

  const openFormForNew = () => {
    setEditingProductId(null);
    setFormProduct({ name: '', price: '', yield: '34', brand: '' });
    setIsFormOpen(true);
  };

  const openFormForEdit = () => {
    setEditingProductId(currentProduct.id);
    setFormProduct({
      name: currentProduct.name,
      price: currentProduct.price.toString(),
      yield: currentProduct.yield.toString(),
      brand: currentProduct.brand
    });
    setIsFormOpen(true);
  };

  const handleSaveProduct = () => {
    const priceNum = parseFloat(formProduct.price);
    const yieldNum = parseFloat(formProduct.yield);

    if (!formProduct.name || isNaN(priceNum) || priceNum <= 0) {
      alert("El Nombre y el Precio ($) son obligatorios.");
      return;
    }

    if (editingProductId) {
      setCustomProducts(prev => {
        const exists = prev.find(p => p.id === editingProductId);
        if (exists) {
          return prev.map(p => p.id === editingProductId ? {
            ...p,
            name: formProduct.name,
            price: priceNum,
            yield: isNaN(yieldNum) ? 34 : yieldNum,
            brand: formProduct.brand || 'Personalizada'
          } : p);
        } else {
          const product: Product = {
            id: editingProductId,
            name: formProduct.name,
            category: config.selectedCategory,
            yield: isNaN(yieldNum) ? 34 : yieldNum,
            price: priceNum,
            brand: formProduct.brand || 'Personalizada'
          };
          return [...prev, product];
        }
      });
    } else {
      const id = `custom-${Date.now()}`;
      const product: Product = {
        id,
        name: formProduct.name,
        category: config.selectedCategory,
        yield: isNaN(yieldNum) ? 34 : yieldNum,
        price: priceNum,
        brand: formProduct.brand || 'Personalizada'
      };
      setCustomProducts(prev => [...prev, product]);
      setConfig(p => ({ ...p, selectedProductId: id, extraBuckets: 0 }));
    }

    setIsFormOpen(false);
    setEditingProductId(null);
  };

  const workerTotalCost = config.numWorkers * config.workerDailyRate * config.workDays;
  const scaffoldTotalCost = config.scaffoldCount * config.scaffoldDailyRate * config.scaffoldDays;
  const laborMetric = workerTotalCost + scaffoldTotalCost;
  const utility = config.m2 * config.profitRate;
  const materialCost = result.subtotal - workerTotalCost - scaffoldTotalCost - utility - (config.masonryRepairEnabled ? config.masonryRepairCost : 0);

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 no-print">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100"><Briefcase className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">RENUEVA KOBA</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculador de Presupuestos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setConfig(INITIAL_CONFIG); setCustomProducts([]); }} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-sm transition-all shadow-md">
            <Printer className="w-4 h-4" /> Imprimir Cotización
          </button>
        </div>
      </header>

      <main className="space-y-6">
        <section id="printable-quote" className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-50 relative overflow-hidden print:shadow-none print:border-none print:p-0">
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-900">
            <div className="space-y-2">
              <div className="bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-black uppercase inline-block">RK-OFFICIAL</div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">PRESUPUESTO DE SERVICIO</h2>
              <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> ID: #RK-844</span>
                <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date().toLocaleDateString('es-MX')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-600 tracking-tighter leading-none">RENUEVA</div>
              <div className="text-[10px] font-black text-slate-900 tracking-widest uppercase italic">KOBA S.A. DE C.V.</div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                  <th className="p-4 rounded-l-xl">Concepto</th>
                  <th className="p-4">Detalle / Marca</th>
                  <th className="p-4">Plazo / Rend.</th>
                  <th className="p-4 text-center">Cant.</th>
                  <th className="p-4 text-right">Unitario</th>
                  <th className="p-4 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {result.items.map((item, idx) => (
                  <tr key={idx} className={`group transition-colors ${item.isWarning ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 align-top">
                      <p className={`font-black text-xs ${item.isWarning ? 'text-rose-600' : 'text-slate-900'}`}>{item.concept}</p>
                      <p className={`text-[8px] font-bold leading-tight uppercase ${item.isWarning ? 'text-rose-500 italic' : 'text-slate-400'}`}>{item.detail}</p>
                    </td>
                    <td className="p-4 align-top">
                      <div className={`px-2 py-1 rounded-lg border inline-block ${item.isWarning ? 'bg-rose-100 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                         <p className={`text-[9px] font-black uppercase ${item.isWarning ? 'text-rose-700' : 'text-slate-600'}`}>{item.brand}</p>
                      </div>
                    </td>
                    <td className="p-4 align-top whitespace-nowrap">
                      <p className={`text-[10px] font-black italic ${item.isWarning ? 'text-rose-600' : 'text-slate-500'}`}>{item.yieldDisplay}</p>
                    </td>
                    <td className="p-4 text-center align-top whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {item.isAdjustable && (
                          <button 
                            onClick={() => item.concept === 'Sellador Primario' ? adjustSealerBuckets(-1) : adjustBuckets(-1)}
                            className="no-print p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-rose-500 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${item.isWarning ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                          {item.quantity}
                        </span>
                        {item.isAdjustable && (
                          <button 
                            onClick={() => item.concept === 'Sellador Primario' ? adjustSealerBuckets(1) : adjustBuckets(1)}
                            className="no-print p-0.5 bg-slate-200 text-slate-600 rounded hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right align-top whitespace-nowrap">
                      <p className="text-[10px] font-bold text-slate-600">${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="p-4 text-right align-top whitespace-nowrap">
                      <p className={`text-xs font-black ${item.isWarning ? 'text-rose-700' : 'text-slate-900'}`}>${item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end mt-12 gap-8 print:mt-6">
            <div className="w-full md:max-w-[45%] p-4 bg-slate-50 rounded-2xl border border-slate-100 print:bg-white print:border-none">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Info className="w-3 h-3 text-indigo-500" /> Condiciones Generales</p>
              <ul className="text-[8px] font-bold text-slate-500 space-y-1">
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-indigo-500" /> Precios sujetos a cambios sin previo aviso según mercado.</li>
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-indigo-500" /> Anticipo del 50% para inicio de obra y programación.</li>
                <li className="flex gap-2"><ArrowRight className="w-2.5 h-2.5 text-indigo-500" /> Garantía certificada según material seleccionado.</li>
              </ul>
            </div>
            <div className="min-w-[320px] space-y-2">
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <span>Subtotal Neto</span>
                <span className="text-slate-900">${result.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
                <span>IVA Trasladado (16%)</span>
                <span>${result.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-1 bg-slate-900 my-4 rounded-full print:bg-slate-300"></div>
              <div className="flex justify-between items-baseline px-1 gap-4">
                <span className="text-sm font-black italic uppercase text-slate-900">Total con iva + garantía de 6 meses</span>
                <div className="text-right">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                  <span className="text-[10px] font-black text-slate-400 ml-1">MXN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-slate-100 flex justify-around items-center opacity-60 print:mt-10">
            <div className="text-center">
              <div className="h-px bg-slate-300 w-40 mb-3 mx-auto"></div>
              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">ING. MAURO / OMAR</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase">DIRECCIÓN TÉCNICA - RENUEVA</p>
            </div>
            <div className="text-center">
              <div className="h-px bg-slate-300 w-40 mb-3 mx-auto"></div>
              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">ACEPTACIÓN CLIENTE</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">FIRMA DE CONFORMIDAD</p>
            </div>
          </div>

          <div className="no-print mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-2">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2 flex items-center gap-2">
                <Calculator className="w-3 h-3 text-indigo-500" /> Panel de Ajustes Rápidos
              </h3>
            </div>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider">Dimensiones</h2>
              <div className="relative">
                <input type="number" value={config.m2} onChange={handleM2Change}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">M²</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {(['Impermeabilizante', 'Pintura'] as MaterialCategory[]).map((cat) => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`py-2 rounded-xl border-2 font-black text-[10px] transition-all ${config.selectedCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-100'}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Producto Específico</label>
                  <div className="flex gap-1">
                    {isCurrentProductEditable && (
                      <button 
                        onClick={openFormForEdit}
                        title="Editar o Corregir este material"
                        className="p-1 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    <button 
                      onClick={isFormOpen ? () => setIsFormOpen(false) : openFormForNew}
                      className="p-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      {isFormOpen ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {isFormOpen ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-indigo-100 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="text-[7px] font-black text-indigo-600 uppercase tracking-widest text-center border-b border-indigo-50 pb-1 mb-1">
                      {editingProductId ? 'Corrigiendo Material' : 'Nuevo Material'}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Nombre del material" 
                      value={formProduct.name}
                      onChange={e => setFormProduct(p => ({ ...p, name: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input 
                      type="text" 
                      placeholder="Marca" 
                      value={formProduct.brand}
                      onChange={e => setFormProduct(p => ({ ...p, brand: e.target.value }))}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input 
                          type="number" 
                          placeholder="Precio ($)" 
                          value={formProduct.price}
                          onChange={e => setFormProduct(p => ({ ...p, price: e.target.value }))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          placeholder="M²/Cub." 
                          value={formProduct.yield}
                          onChange={e => setFormProduct(p => ({ ...p, yield: e.target.value }))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-300">M²</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveProduct}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                      <Check className="w-3 h-3" /> Guardar Correcciones
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select 
                      value={config.selectedProductId} 
                      onChange={handleProductChange}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs appearance-none focus:ring-2 focus:ring-indigo-100 outline-none pr-10"
                    >
                      {filteredProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </section>

            {/* Material Auxiliar Manual */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider">
                <Settings className="w-3 h-3 text-indigo-500" /> Material Auxiliar
              </h2>
              <div className="relative">
                <input 
                  type="number" 
                  value={config.auxMaterialTotal} 
                  onChange={(e) => setConfig(p => ({ ...p, auxMaterialTotal: Number(e.target.value) }))}
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-black text-xl outline-none focus:ring-2 focus:ring-indigo-100" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
              </div>
              <p className="text-[7px] font-black text-slate-400 uppercase leading-tight italic">Costo manual para rodillos, brochas, etc.</p>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><Truck className="w-3 h-3 text-indigo-500" /> Andamiaje</h2>
              <div className="space-y-2">
                <select value={config.scaffoldCount > 0 ? "SI" : "NO"} 
                  onChange={(e) => setConfig(p => ({ ...p, scaffoldCount: e.target.value === "SI" ? 1 : 0 }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                  <option value="NO">APLICA RENTA: NO</option>
                  <option value="SI">APLICA RENTA: SÍ</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={config.scaffoldDays} disabled={config.scaffoldCount === 0}
                    onChange={(e) => setConfig(p => ({ ...p, scaffoldDays: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs">
                    {[1,2,3,4,5,7,10,15,30].map(d => <option key={d} value={d}>{d} Días</option>)}
                  </select>
                  <select value={config.scaffoldDailyRate} disabled={config.scaffoldCount === 0}
                    onChange={(e) => setConfig(p => ({ ...p, scaffoldDailyRate: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs">
                    {[100,150,200,250,300,350,400,450,500].map(c => <option key={c} value={c}>${c}/día</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className={`p-6 rounded-2xl border transition-all space-y-3 ${config.masonryRepairEnabled ? 'bg-rose-50 border-rose-100 ring-1 ring-rose-200 shadow-md shadow-rose-100' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><AlertTriangle className="w-3 h-3 text-rose-500" /> Albañilería</h2>
                <button onClick={() => setConfig(p => ({ ...p, masonryRepairEnabled: !p.masonryRepairEnabled }))}
                  className={`px-3 py-1 rounded-full text-[9px] font-black transition-all ${config.masonryRepairEnabled ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                  {config.masonryRepairEnabled ? "ACTIVO" : "INACTIVO"}
                </button>
              </div>
              {config.masonryRepairEnabled && (
                <div className="relative">
                  <input type="number" placeholder="Costo reparación" 
                    value={config.masonryRepairCost === 0 ? '' : config.masonryRepairCost} 
                    onChange={(e) => setConfig(p => ({ ...p, masonryRepairCost: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    className="w-full p-3 bg-white border border-rose-200 rounded-xl font-black text-rose-900 text-lg outline-none focus:ring-2 focus:ring-rose-200" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300 font-bold">$</span>
                </div>
              )}
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
              <h2 className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-800 tracking-wider"><Users className="w-3 h-3 text-indigo-500" /> Trabajadores</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Trabajadores</label>
                  <select value={config.numWorkers} onChange={(e) => setConfig(p => ({ ...p, numWorkers: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs outline-none">
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Trabajadores</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Días</label>
                    <select value={config.workDays} onChange={(e) => setConfig(p => ({ ...p, workDays: Number(e.target.value) }))}
                      className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs">
                      {Array.from({length: 20}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d} Días</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pago Diario</label>
                    <select value={config.workerDailyRate} onChange={(e) => setConfig(p => ({ ...p, workerDailyRate: Number(e.target.value) }))}
                      className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg font-bold text-xs">
                      {[500, 600, 700, 800, 900, 1000].map(r => <option key={r} value={r}>${r}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer className="no-print bg-slate-900/95 backdrop-blur-xl p-4 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center sticky bottom-4 z-50 ring-1 ring-white/10 max-w-6xl mx-auto shadow-2xl border border-white/5 gap-4 md:gap-0">
        <div className="flex flex-wrap items-center gap-6 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg"><HardHat className="w-4 h-4 text-amber-400" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Mano de Obra + Andamios</p>
              <p className="text-sm font-black text-white">${laborMetric.toLocaleString()}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg"><TrendingUp className="w-4 h-4 text-indigo-400" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Utilidad</p>
              <p className="text-sm font-black text-white">${utility.toLocaleString()}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg"><Box className="w-4 h-4 text-emerald-400" /></div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Material</p>
              <p className="text-sm font-black text-white">${materialCost.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        
        <div className="pr-4 text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Liquidación Final Estimada</p>
          <p className="text-3xl font-black text-white tracking-tighter leading-none">
            ${result.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })} 
            <span className="text-[10px] text-slate-500 font-bold ml-1 tracking-normal">MXN</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
