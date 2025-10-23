import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { supabase } from '../utils/supabase';  
import { Users, FileText, Calendar, AlertTriangle, CheckCircle, Download, Search } from 'lucide-react';  

const Reports = () => {  
  const [debtors, setDebtors] = useState([]);  
  const [paid, setPaid] = useState([]);  
  const [selectedClientHistory, setSelectedClientHistory] = useState(null);  
  const [clients, setClients] = useState([]);  
  const [history, setHistory] = useState([]);  
  const [searchTerm, setSearchTerm] = useState('');  
  const [loading, setLoading] = useState(true);  
  const [activeTab, setActiveTab] = useState('debtors'); // 0: Deudores, 1: Pagados, 2: Historial  

  useEffect(() => {  
    fetchData();  
  }, []);  

  const fetchData = async () => {  
    setLoading(true);  
    try {  
      // Clientes para historial  
      const { data: clientsData } = await supabase.from('clients').select('*').order('name');  
      setClients(clientsData || []);  

      // Deudores: followups facturados sin pago, con clientes  
      const { data: debtorFollowups } = await supabase  
        .from('cobranza_followups')  
        .select('*, clients(name, customer_number, zone)')  
        .eq('status', 'facturado')  
        .is('payment_date', null)  
        .order('service_month', { ascending: false });  
      setDebtors(debtorFollowups || []);  

      // Pagados: con payment_date, últimos 30 días o todos  
      const { data: paidFollowups } = await supabase  
        .from('cobranza_followups')  
        .select('*, clients(name, customer_number, zone)')  
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
  };  

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
          <p className="text-xl text-gray-600">Ve deudores, pagados y historial completo por cliente. Filtra y exporta para control total.</p>  
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

        {/* Tabs simples con React state */}  
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 overflow-hidden">  
          {/* Tab Headers */}  
          <div className="flex border-b border-gray-200">  
            <button  
              onClick={() => setActiveTab('debtors')}  
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${  
                activeTab === 'debtors'  
                  ? 'bg-amber-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Deudores ({filteredDebtors.length})  
            </button>  
            <button  
              onClick={() => setActiveTab('paid')}  
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${  
                activeTab === 'paid'  
                  ? 'bg-green-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Pagados ({filteredPaid.length})  
            </button>  
            <button  
              onClick={() => setActiveTab('history')}  
              className={`flex-1 py-4 px-6 text-center font-medium transition-all ${  
                activeTab === 'history'  
                  ? 'bg-blue-500 text-white shadow-sm'  
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'  
              }`}  
            >  
              Historial por Cliente  
            </button>  
          </div>  

          {/* Tab Content: Deudores */}  
          {activeTab === 'debtors' && (  
            <div className="p-6">  
              <div className="flex justify-between items-center mb-4">  
                <h2 className="text-2xl font-bold text-gray-900">Deudores Pendientes</h2>  
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
                  <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />  
                  <p className="text-gray-500">¡Todo pagado! No hay deudores pendientes.</p>  
                </motion.div>  
              ) : (  
                <div className="space-y-4 max-h-96 overflow-y-auto">  
                  {filteredDebtors.map((followup) => (  
                    <motion.div  
                      key={followup.id}  
                      initial={{ opacity: 0, x: -20 }}  
                      animate={{ opacity: 1, x: 0 }}  
                      className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm bg-red-50"  
                    >  
                      <div className="flex items-start justify-between gap-4">  
                        <div className="flex-1">  
                          <div className="flex items-center gap-3 mb-3">  
                            <AlertTriangle className="w-5 h-5 text-red-500" />  
                            <h3 className="text-lg font-bold text-gray-900">{followup.clients.name}</h3>  
                            <span className="text-sm text-gray-600">#{followup.clients.customer_number} • {followup.clients.zone}</span>  
                          </div>  
                          <div className="grid grid-cols-2 gap-4 text-sm">  
                            <div>Mes: <span className="font-medium">{followup.service_month}</span></div>  
                            {followup.invoice_folio && <div>Folio: <span className="font-medium">{followup.invoice_folio}</span></div>}  
                            {followup.observations && <div>Notas: <span className="italic">{followup.observations}</span></div>}  
                            <div className="col-span-2 text-red-600 font-medium">¡Pendiente de pago!</div>  
                          </div>  
                        </div>  
                        <Link  
                          to={`/client/${followup.client_id}`}  
                          className="px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-all"  
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

          {/* Tab Content: Pagados */}  
          {activeTab === 'paid' && (  
            <div className="p-6">  
              <div className="flex justify-between items-center mb-4">  
                <h2 className="text-2xl font-bold text-gray-900">Cobros Pagados</h2>  
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
                  <p className="text-gray-500">No hay cobros pagados registrados aún.</p>  
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
                            <CheckCircle className="w-5 h-5 text-green-500" />  
                            <h3 className="text-lg font-bold text-gray-900">{followup.clients.name}</h3>  
                            <span className="text-sm text-gray-600">#{followup.clients.customer_number} • {followup.clients.zone}</span>  
                          </div>  
                          <div className="grid grid-cols-2 gap-4 text-sm">  
                            <div>Mes: <span className="font-medium">{followup.service_month}</span></div>  
                            {followup.invoice_folio && <div>Folio: <span className="font-medium">{followup.invoice_folio}</span></div>}  
                            <div>Pagado el: <span className="font-medium text-green-600">{new Date(followup.payment_date).toLocaleDateString()}</span></div>  
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
              <div className="flex gap-4 mb-6">  
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
                  <button  
                    onClick={() => setSelectedClientHistory(null)}  
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"  
                  >  
                    Limpiar  
                  </button>  
                )}  
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
                      {history.map((followup) => (  
                        <motion.div  
                          key={followup.id}  
                          initial={{ opacity: 0, y: 20 }}  
                          animate={{ opacity: 1, y: 0 }}  
                          className={`rounded-2xl p-4 shadow-sm ${  
                            followup.payment_date ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'  
                          }`}  
                        >  
                          <div className="flex items-center justify-between">  
                            <div className="flex items-center gap-3">  
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${  
                                followup.payment_date ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'  
                              }`}>  
                                {followup.payment_date ? 'Pagado' : followup.status}  
                              </span>  
                              <span className="font-medium">{followup.service_month}</span>  
                              {followup.invoice_folio && <span className="text-gray-600">• Folio: {followup.invoice_folio}</span>}  
                              {followup.billing_date && (  
                                <span className="text-gray-600">• Facturado: {new Date(followup.billing_date).toLocaleDateString()}</span>  
                              )}  
                            </div>  
                            {followup.payment_date && (  
                              <span className="text-green-600 text-sm">Pagado: {new Date(followup.payment_date).toLocaleDateString()}</span>  
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
      </div>  
    </div>  
  );  
};  

export default Reports;