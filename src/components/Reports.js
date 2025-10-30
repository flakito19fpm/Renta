import React, { useState, useEffect, useRef } from 'react';  
import { motion } from 'framer-motion';  
import { Link, useLocation } from 'react-router-dom';  
import { supabase } from '../utils/supabase';  
import { Users, FileText, Calendar, AlertTriangle, CheckCircle, Download, Search, Filter, Printer } from 'lucide-react';  

const Reports = () => {  
  const location = useLocation();  
  const printRef = useRef(); // Ref para sección imprimible  
  const [allPending, setAllPending] = useState([]);  
  const [debtors, setDebtors] = useState([]);  
  const [paid, setPaid] = useState([]);  
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);  
  const [clients, setClients] = useState([]);  
  const [history, setHistory] = useState([]);  
  const [searchTerm, setSearchTerm] = useState('');  
  const [pendingFilter, setPendingFilter] = useState('todos');  
  const [loading, setLoading] = useState(true);  
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'pending');  
  const [showPrintView, setShowPrintView] = useState(false); // Para vista de impresión  

  useEffect(() => {  
    fetchData();  
  }, []);  

  const fetchData = async () => {  
    setLoading(true);  
    try {  
      const { data: clientsData } = await supabase.from('clients').select('*').order('name');  
      setClients(clientsData || []);  

      const { data: pendingFollowups } = await supabase  
        .from('cobranza_followups')  
        .select('*, clients(name, customer_number, zone)')  
        .is('payment_date', null)  
        .order('service_month', { ascending: false, nullsFirst: false });  
      setAllPending(pendingFollowups || []);  

      const { data: debtorFollowups } = await supabase  
        .from('cobranza_followups')  
        .select('*, clients(name, customer_number, zone)')  
        .eq('status', 'facturado')  
        .is('payment_date', null)  
        .order('service_month', { ascending: false });  
      setDebtors(debtorFollowups || []);  

      const { data: paidFollowups } = await supabase  
        .from('cobranza_followups')  
        .select('*, clients(name, customer_number, zone)')  
        .eq('status', 'pagado')  
        .is('payment_date', 'not.null')  
        .order('payment_date', { ascending: false });  
      setPaid(paidFollowups || []);  

    } catch (error) {  
      console.error('Error cargando reportes:', error);  
      alert('Error al cargar reportes: ' + error.message);  
    } finally {  
      setLoading(false);  
    }  
  };  

  const fetchClientHistory = async (clientId) => {  
    const { data } = await supabase  
      .from('cobranza_followups')  
      .select('*')  
      .eq('client_id', clientId)  
      .order('service_month', { ascending: true });  
    setHistory(data || []);  
    setSelectedClientHistory(clients.find(c => c.id === clientId) || null);  
    setShowPrintView(false); // Reset print view al cargar nuevo  
  };  

  const filteredPending = allPending.filter(f => {  
    if (pendingFilter === 'todos') return true;  
    return f.status === pendingFilter;  
  }).filter(f =>  
    f.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    f.invoice_folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    f.service_month.includes(searchTerm) ||  
    f.status.toLowerCase().includes(searchTerm.toLowerCase())  
  );  

  const filteredDebtors = debtors.filter(f =>  
    f.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    f.invoice_folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    f.service_month.includes(searchTerm)  
  );  

  const filteredPaid = paid.filter(f =>  
    f.clients.name.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    f.invoice_folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||  
    f.payment_date?.includes(searchTerm)  
  );  

  const getStatusColor = (status) => {  
    switch (status) {  
      case 'contactado': return 'bg-yellow-100 text-yellow-800';  
      case 'pedido': return 'bg-blue-100 text-blue-800';  
      case 'en_espera': return 'bg-orange-100 text-orange-800';  
      case 'facturado': return 'bg-red-100 text-red-800';  
      default: return 'bg-gray-100 text-gray-800';  
    }  
  };  

  const getStatusLabel = (status) => {  
    switch (status) {  
      case 'contactado': return 'Contactado';  
      case 'pedido': return 'Pedido';  
      case 'en_espera': return 'En Espera';  
      case 'facturado': return 'Facturado (Pendiente Pago)';  
      default: return status;  
    }  
  };  

  // Export historial a CSV  
  const exportHistoryCSV = () => {  
    const csv = history.map(f =>  
      `${f.status},${f.service_month},${f.invoice_folio || 'N/A'},${f.billing_date ? new Date(f.billing_date).toLocaleDateString() : 'N/A'},${f.payment_date ? new Date(f.payment_date).toLocaleDateString() : 'N/A'},${f.observations || 'N/A'}`  
    ).join('\n');  
    const blob = new Blob([`Status,Mes,Folio,Fecha Facturado,Fecha Pagado,Observaciones\n${csv}`], { type: 'text/csv' });  
    const url = window.URL.createObjectURL(blob);  
    const a = document.createElement('a');  
    a.href = url;  
    a.download = `historial_${selectedClientHistory.name.replace(/\s+/g, '_')}.csv`;  
    a.click();  
    window.URL.revokeObjectURL(url);  
  };  

  // Función para imprimir  
  const handlePrint = () => {  
    setShowPrintView(true);  
    setTimeout(() => {  
      window.print();  
    }, 100); // Delay para renderizar  
  };  

  const exportPendingCSV = () => {  
    const csv = filteredPending.map(f =>  
      `${f.clients.name},${f.status},${f.service_month},${f.invoice_folio || 'N/A'},${f.observations || 'N/A'}`  
    ).join('\n');  
    const blob = new Blob([`Cliente,Status,Mes,Folio,Observaciones\n${csv}`], { type: 'text/csv' });  
    const url = window.URL.createObjectURL(blob);  
    const a = document.createElement('a');  
    a.href = url;  
    a.download = 'movimientos_pendientes.csv';  
    a.click();  
    window.URL.revokeObjectURL(url);  
  };  

  const exportDebtorsCSV = () => {  
    const csv = filteredDebtors.map(f =>  
      `${f.clients.name},${f.service_month},${f.invoice_folio || 'N/A'},${f.observations || 'N/A'}`  
    ).join('\n');  
    const blob = new Blob([`Cliente,Mes,Folio,Observaciones\n${csv}`], { type: 'text/csv' });  
    const url = window.URL.createObjectURL(blob);  
    const a = document.createElement('a');  
    a.href = url;  
    a.download = 'deudores.csv';  
    a.click();  
    window.URL.revokeObjectURL(url);  
  };  

  const exportPaidCSV = () => {  
    const csv = filteredPaid.map(f =>  
      `${f.clients.name},${f.service_month},${f.invoice_folio || 'N/A'},${f.payment_date}`  
    ).join('\n');  
    const blob = new Blob([`Cliente,Mes,Folio,Fecha Pago\n${csv}`], { type: 'text/csv' });  
    const url = window.URL.createObjectURL(blob);  
    const a = document.createElement('a');  
    a.href = url;  
    a.download = 'pagados.csv';  
    a.click();  
    window.URL.revokeObjectURL(url);  
  };  

  if (loading) {  
    return (  
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">  
        <motion.div className="p-8 bg-white rounded-3xl shadow-xl">Cargando reportes...  
        </motion.div>  
      </div>  
    );  
  }  

  return (  
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">  
      <div className="container mx-auto px-4 py-8 max-w-6xl">  
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">  
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reportes de Cobranza</h1>  
          <p className="text-xl text-gray-600">Ve todos los movimientos: pendientes, deudores específicos, pagados (cerrados y marcados) y historial completo. Filtra y exporta para control total.</p>  
        </motion.div>  

        {/* Búsqueda global */}  
        <div className="mb-6 bg-white/90 backdrop-blur-xl rounded-3xl p-4 border border-gray-200/50">  
          <div className="flex items-center gap-2">  
            <Search className="w-5 h-5 text-gray-500" />  
            <input  
              type="text"  
              placeholder="Buscar en todos los reportes..."  
              value={searchTerm}  
              onChange={(e) => setSearchTerm(e.target.value)}  
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"  
            />  
          </div>  
        </div>  

        {/* Tabs simples con React state - 4 tabs */}  
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 overflow-hidden">  
          {/* Tab Headers - grid para 4 */}  
          <div className="grid grid-cols-4 border-b border-gray-200">  
            <button  
              onClick={() => setActiveTab('pending')}  
              className={`py-3 px-2 text-center font-medium transition-all ${  
                activeTab === 'pending'  
                  ? 'bg-orange-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Pendientes ({filteredPending.length})  
            </button>  
            <button  
              onClick={() => setActiveTab('debtors')}  
              className={`py-3 px-2 text-center font-medium transition-all ${  
                activeTab === 'debtors'  
                  ? 'bg-red-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Deudores ({filteredDebtors.length})  
            </button>  
            <button  
              onClick={() => setActiveTab('paid')}  
              className={`py-3 px-2 text-center font-medium transition-all ${  
                activeTab === 'paid'  
                  ? 'bg-green-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Pagados ({filteredPaid.length})  
            </button>  
            <button  
              onClick={() => setActiveTab('history')}  
              className={`py-3 px-2 text-center font-medium transition-all ${  
                activeTab === 'history'  
                  ? 'bg-blue-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Historial Cliente  
            </button>  
          </div>  

          {/* Tab Content: Pendientes */}  
          {activeTab === 'pending' && (  
            <div className="p-6">  
              <div className="flex justify-between items-center mb-4">  
                <div className="flex items-center gap-2">  
                  <h2 className="text-2xl font-bold text-gray-900">Movimientos Pendientes</h2>  
                  <Filter className="w-5 h-5 text-gray-500" />  
                </div>  
                <motion.button  
                  onClick={exportPendingCSV}  
                  whileHover={{ scale: 1.05 }}  
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all"  
                >  
                  <Download className="w-4 h-4" /> Exportar CSV  
                </motion.button>  
              </div>  
              <div className="mb-4 bg-gray-50 rounded-xl p-3 flex gap-2 flex-wrap">  
                <select  
                  value={pendingFilter}  
                  onChange={(e) => setPendingFilter(e.target.value)}  
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"  
                >  
                  <option value="todos">Todos Pendientes</option>  
                  <option value="contactado">Contactado</option>  
                  <option value="pedido">Pedido</option>  
                  <option value="en_espera">En Espera</option>  
                  <option value="facturado">Facturado (Sin Pago)</option>  
                </select>  
              </div>  
              {filteredPending.length === 0 ? (  
                <motion.div className="text-center py-12">  
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />  
                  <p className="text-gray-500">No hay movimientos pendientes con este filtro.</p>  
                </motion.div>  
              ) : (  
                <div className="space-y-4 max-h-96 overflow-y-auto">  
                  {filteredPending.map((followup) => (  
                    <motion.div  
                      key={followup.id}  
                      initial={{ opacity: 0, x: -20 }}  
                      animate={{ opacity: 1, x: 0 }}  
                      className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all"  
                    >  
                      <div className="flex items-start justify-between gap-4">  
                        <div className="flex-1">  
                          <div className="flex items-center gap-3 mb-3">  
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(followup.status)}`}>  
                              {getStatusLabel(followup.status)}  
                            </span>  
                            <h3 className="text-lg font-bold text-gray-900">{followup.clients.name}</h3>  
                            <span className="text-sm text-gray-600">#{followup.clients.customer_number} • {followup.clients.zone}</span>  
                          </div>  
                          <div className="grid grid-cols-2 gap-4 text-sm">  
                            <div>Mes: <span className="font-medium">{followup.service_month}</span></div>  
                            {followup.invoice_folio && <div>Folio: <span className="font-medium">{followup.invoice_folio}</span></div>}  
                            {followup.billing_date && <div>Facturado: <span className="text-gray-600">{new Date(followup.billing_date).toLocaleDateString()}</span></div>}  
                            {followup.observations && <div>Notas: <span className="italic">{followup.observations}</span></div>}  
                          </div>  
                        </div>  
                        <Link  
                          to={`/client/${followup.client_id}`}  
                          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all"  
                        >  
                          Ver Cliente  
                        </Link>  
                      </div>  
                    </motion.div>  
                  ))}  
                </div>  
              )}  
            </div>  
          )}  

          {/* Tab Content: Deudores */}  
          {activeTab === 'debtors' && (  
            <div className="p-6">  
              <div className="flex justify-between items-center mb-4">  
                <h2 className="text-2xl font-bold text-gray-900">Deudores (Facturados Sin Pago)</h2>  
                <motion.button  
                  onClick={exportDebtorsCSV}  
                  whileHover={{ scale: 1.05 }}  
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all"  
                >  
                  <Download className="w-4 h-4" /> Exportar CSV  
                </motion.button>  
              </div>  
              {filteredDebtors.length === 0 ? (  
                <motion.div className="text-center py-12">  
                  <AlertTriangle className="w-16 h-16 text-green-300 mx-auto mb-4" />  
                  <p className="text-green-500">¡Excelente! No hay deudores pendientes de pago.</p>  
                </motion.div>  
              ) : (  
                <div className="space-y-4 max-h-96 overflow-y-auto">  
                  {filteredDebtors.map((followup) => (  
                    <motion.div  
                      key={followup.id}  
                      initial={{ opacity: 0, x: -20 }}  
                      animate={{ opacity: 1, x: 0 }}  
                      className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm bg-red-50 hover:shadow-md transition-all"  
                    >  
                      <div className="flex items-start justify-between gap-4">  
                        <div className="flex-1">  
                          <div className="flex items-center gap-3 mb-3">  
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800`}>  
                              Deudor  
                            </span>  
                            <h3 className="text-lg font-bold text-gray-900">{followup.clients.name}</h3>  
                            <span className="text-sm text-gray-600">#{followup.clients.customer_number} • {followup.clients.zone}</span>  
                          </div>  
                          <div className="grid grid-cols-2 gap-4 text-sm">  
                            <div>Mes: <span className="font-medium text-red-600">{followup.service_month}</span></div>  
                            {followup.invoice_folio && <div>Folio: <span className="font-medium text-red-600">{followup.invoice_folio}</span></div>}  
                            {followup.billing_date && <div>Facturado: <span className="text-gray-600">{new Date(followup.billing_date).toLocaleDateString()}</span></div>}  
                            {followup.observations && <div>Notas: <span className="italic text-red-600">{followup.observations}</span></div>}  
                          </div>  
                        </div>  
                        <Link  
                          to={`/client/${followup.client_id}`}  
                          className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all"  
                        >  
                          Cobrar Ahora  
                        </Link>  
                      </div>  
                    </motion.div>  
                  ))}  
                </div>  
              )}  
            </div>  
          )}  

          {/* Tab Content: Pagados */}  
          {activeTab === 'paid' && (  
            <div className="p-6">  
              <div className="flex justify-between items-center mb-4">  
                <h2 className="text-2xl font-bold text-gray-900">Cobros Pagados (Cerrados)</h2>  
                <motion.button  
                  onClick={exportPaidCSV}  
                  whileHover={{ scale: 1.05 }}  
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all"  
                >  
                  <Download className="w-4 h-4" /> Exportar CSV  
                </motion.button>  
              </div>  
              {filteredPaid.length === 0 ? (  
                <motion.div className="text-center py-12">  
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />  
                  <p className="text-gray-500">No hay cobros pagados y cerrados registrados aún.</p>  
                </motion.div>  
              ) : (  
                <div className="space-y-4 max-h-96 overflow-y-auto">  
                  {filteredPaid.map((followup) => (  
                    <motion.div  
                      key={followup.id}  
                      initial={{ opacity: 0, x: -20 }}  
                      animate={{ opacity: 1, x: 0 }}  
                      className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm bg-green-50"  
                    >  
                      <div className="flex items-start justify-between gap-4">  
                        <div className="flex-1">  
                          <div className="flex items-center gap-3 mb-3">  
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>  
                              Cerrado y Pagado  
                            </span>  
                            <h3 className="text-lg font-bold text-gray-900">{followup.clients.name}</h3>  
                            <span className="text-sm text-gray-600">#{followup.clients.customer_number} • {followup.clients.zone}</span>  
                          </div>  
                          <div className="grid grid-cols-2 gap-4 text-sm">  
                            <div>Mes: <span className="font-medium">{followup.service_month}</span></div>  
                            {followup.invoice_folio && <div>Folio: <span className="font-medium">{followup.invoice_folio}</span></div>}  
                            <div>Cerrado el: <span className="font-medium text-green-600">{new Date(followup.payment_date).toLocaleDateString()}</span></div>  
                            {followup.observations && <div>Notas: <span className="italic text-green-600">{followup.observations}</span></div>}  
                          </div>  
                        </div>  
                        <Link  
                          to={`/client/${followup.client_id}`}  
                          className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all"  
                        >  
                          Ver Historial  
                        </Link>  
                      </div>  
                    </motion.div>  
                  ))}  
                </div>  
              )}  
            </div>  
          )}  

          {/* Tab Content: Historial por Cliente */}  
          {activeTab === 'history' && (  
            <div className="p-6">  
              <div className="flex items-center justify-between mb-6">  
                <div className="flex gap-4">  
                  <div className="flex-1">  
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Cliente</label>  
                    <div className="relative">  
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />  
                      <select  
                        onChange={(e) => e.target.value ? fetchClientHistory(e.target.value) : setSelectedClientHistory(null)}  
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"  
                      >  
                        <option value="">Elegir cliente para historial...</option>  
                        {clients.map(client => (  
                          <option key={client.id} value={client.id}>  
                            #{client.customer_number} - {client.name} ({client.zone})  
                          </option>  
                        ))}  
                      </select>  
                    </div>  
                  </div>  
                  {selectedClientHistory && (  
                    <div className="flex gap-2">  
                      <motion.button  
                        onClick={exportHistoryCSV}  
                        whileHover={{ scale: 1.05 }}  
                        className="px-3 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all flex items-center gap-1 text-sm"  
                      >  
                        <Download className="w-3 h-3" /> CSV  
                      </motion.button>  
                      <motion.button  
                        onClick={handlePrint}  
                        whileHover={{ scale: 1.05 }}  
                        className="px-3 py-2 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all flex items-center gap-1 text-sm"  
                      >  
                        <Printer className="w-3 h-3" /> Imprimir  
                      </motion.button>  
                      <button  
                        onClick={() => setSelectedClientHistory(null)}  
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm"  
                      >  
                        Limpiar  
                      </button>  
                    </div>  
                  )}  
                </div>  
              </div>  

              {selectedClientHistory ? (  
                <div>  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Historial de {selectedClientHistory.name}</h3>  
                  {history.length === 0 ? (  
                    <motion.div className="text-center py-12">  
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />  
                      <p className="text-gray-500">No hay historial de seguimientos para este cliente.</p>  
                    </motion.div>  
                  ) : (  
                    <div className="space-y-4 max-h-96 overflow-y-auto">  
                      {history.map((followup, index) => (  
                        <motion.div  
                          key={followup.id}  
                          initial={{ opacity: 0, y: 20 }}  
                          animate={{ opacity: 1, y: 0 }}  
                          className={`rounded-2xl p-4 shadow-sm border ${  
                            followup.payment_date ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'  
                          }`}  
                        >  
                          <div className="flex items-center justify-between">  
                            <div className="flex items-center gap-3">  
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${  
                                followup.payment_date ? 'bg-green-100 text-green-800' : getStatusColor(followup.status)  
                              }`}>  
                                {followup.payment_date ? 'Pagado (Cerrado)' : getStatusLabel(followup.status)}  
                              </span>  
                              <span className="font-medium">{followup.service_month}</span>  
                              {followup.invoice_folio && <span className="text-gray-600">• Folio: {followup.invoice_folio}</span>}  
                              {followup.billing_date && (  
                                <span className="text-gray-600">• Facturado: {new Date(followup.billing_date).toLocaleDateString()}</span>  
                              )}  
                            </div>  
                            {followup.payment_date && (  
                              <span className="text-green-600 text-sm">Cerrado: {new Date(followup.payment_date).toLocaleDateString()}</span>  
                            )}  
                          </div>  
                          {followup.observations && <p className="text-sm text-gray-600 mt-2 ml-9">{followup.observations}</p>}  
                        </motion.div>  
                      ))}  
                    </div>  
                  )}  
                </div>  
              ) : (  
                <motion.div className="text-center py-12">  
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />  
                  <p className="text-gray-500">Selecciona un cliente para ver su historial completo de cobros.</p>  
                </motion.div>  
              )}  
            </div>  
          )}  
        </div>  

        {/* Vista de Imprimir (oculta por default, visible solo al imprimir) */}  
        {showPrintView && selectedClientHistory && (  
          <div  
            ref={printRef}  
            className="fixed inset-0 z-50 bg-white p-8 print:p-8 print:bg-white hidden print:block overflow-y-auto"  
            style={{ display: showPrintView ? 'block' : 'none' }}  
          >  
            <style jsx>{`  
              @media print {  
                body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }  
                .print-hide { display: none !important; }  
                .print-section { page-break-inside: avoid; margin-bottom: 20px; }  
                h1, h3 { color: #92400e !important; }  
                .status-paid { background-color: #10b981 !important; color: white !important; }  
                .status-pending { background-color: #f59e0b !important; color: white !important; }  
              }  
            `}</style>  
            <button onClick={() => setShowPrintView(false)} className="print-hide mb-4 px-4 py-2 bg-gray-300 rounded print:hidden">Cerrar Vista de Impresión</button>  
            <div className="print-section">  
              <h1 className="text-3xl font-bold mb-4">Historial de Cobranza - {selectedClientHistory.name}</h1>  
              <p className="text-lg mb-6">Cliente #{selectedClientHistory.customer_number} • Zona: {selectedClientHistory.zone}</p>  
              <div className="space-y-4">  
                {history.map((followup, index) => (  
                  <div key={followup.id} className={`p-4 border rounded-lg ${  
                    followup.payment_date ? 'border-green-300 bg-green-50 status-paid' : 'border-orange-300 bg-orange-50 status-pending'  
                  }`}>  
                    <div className="flex justify-between items-start mb-2">  
                      <div className="flex items-center gap-3">  
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${  
                          followup.payment_date ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'  
                        }`}>  
                          {followup.payment_date ? 'Pagado (Cerrado)' : getStatusLabel(followup.status)}  
                        </span>  
                        <span className="font-semibold">{followup.service_month}</span>  
                      </div>  
                      {followup.payment_date && (  
                        <span className="text-sm font-medium">Cerrado: {new Date(followup.payment_date).toLocaleDateString()}</span>  
                      )}  
                    </div>  
                    {followup.invoice_folio && <p className="text-sm mb-1">Folio: {followup.invoice_folio}</p>}  
                    {followup.billing_date && <p className="text-sm mb-1">Facturado: {new Date(followup.billing_date).toLocaleDateString()}</p>}  
                    {followup.observations && <p className="text-sm italic">Notas: {followup.observations}</p>}  
                  </div>  
                ))}  
              </div>  
              <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500 print:text-black">  
                <p>Generado el {new Date().toLocaleDateString()} - Sistema de Cobranza Café Kaawa</p>  
              </div>  
            </div>  
          </div>  
        )}  
      </div>  
    </div>  
  );  
};  

export default Reports;