import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';  
import Navbar from './components/Navbar';  
import ClientList from './components/ClientList';  
import ClientDetails from './components/ClientDetails';  
import FollowupList from './components/FollowupList';  
import Reports from './components/Reports';  
import { Users, LayoutDashboard, AlertTriangle, Clock, Phone, RefreshCw, CheckCircle, FileText } from 'lucide-react';  
import { supabase } from './utils/supabase';  

const Dashboard = () => {  
  const [stats, setStats] = useState({  
    debtors: 0,  
    waiting: 0,  
    contacted: 0,  
    paid: 0  
  });  
  const [loading, setLoading] = useState(true);  
  const [refreshing, setRefreshing] = useState(false);  

  useEffect(() => {  
    fetchStats();  
  }, []);  

  const fetchStats = async () => {  
    setLoading(true);  
    try {  
      const { data: debtorData, error: debtorError } = await supabase  
        .from('cobranza_followups')  
        .select('client_id')  
        .eq('status', 'facturado')  
        .is('payment_date', null);  
      if (debtorError) console.error('Error en deudores:', debtorError);  
      const uniqueDebtors = [...new Set(debtorData?.map(d => d.client_id) || [])].length;  

      const { data: waitingData, error: waitingError } = await supabase  
        .from('cobranza_followups')  
        .select('client_id')  
        .eq('status', 'en_espera');  
      if (waitingError) console.error('Error en espera:', waitingError);  
      const uniqueWaiting = [...new Set(waitingData?.map(w => w.client_id) || [])].length;  

      const { data: contactedData, error: contactedError } = await supabase  
        .from('cobranza_followups')  
        .select('client_id')  
        .eq('status', 'contactado');  
      if (contactedError) console.error('Error en contactados:', contactedError);  
      const uniqueContacted = [...new Set(contactedData?.map(c => c.client_id) || [])].length;  

      const { data: paidData, error: paidError } = await supabase  
        .from('cobranza_followups')  
        .select('client_id')  
        .is('payment_date', 'not.null');  
      if (paidError) console.error('Error en pagados:', paidError);  
      const uniquePaid = [...new Set(paidData?.map(p => p.client_id) || [])].length;  

      console.log('Stats cargados correctamente:', { uniqueDebtors, uniqueWaiting, uniqueContacted, uniquePaid });  

      setStats({  
        debtors: uniqueDebtors,  
        waiting: uniqueWaiting,  
        contacted: uniqueContacted,  
        paid: uniquePaid  
      });  
    } catch (error) {  
      console.error('Error general en fetchStats:', error);  
      setStats({ debtors: 0, waiting: 0, contacted: 0, paid: 0 });  
    } finally {  
      setLoading(false);  
    }  
  };  

  const handleRefresh = async () => {  
    setRefreshing(true);  
    await fetchStats();  
    setRefreshing(false);  
  };  

  if (loading) {  
    return (  
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">  
        <motion.div className="p-8 bg-white rounded-3xl shadow-xl">Cargando dashboard...  
        </motion.div>  
      </div>  
    );  
  }  

  return (  
    <motion.div  
      initial={{ opacity: 0 }}  
      animate={{ opacity: 1 }}  
      transition={{ duration: 0.6 }}  
      className="container mx-auto px-4 py-8 max-w-6xl"  
    >  
      <motion.div  
        initial={{ scale: 0.8, opacity: 0 }}  
        animate={{ scale: 1, opacity: 1 }}  
        transition={{ duration: 0.8, delay: 0.2 }}  
        className="mb-8 text-center"  
      >  
        <LayoutDashboard className="w-24 h-24 text-amber-600 mx-auto mb-6" />  
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Sistema de Cobranza Café Kaawa</h1>  
        <p className="text-xl text-gray-600 mb-4">Resumen rápido de tus clientes y cobros pendientes. ¡Mantén el control!</p>  
        <motion.button  
          onClick={handleRefresh}  
          whileHover={{ scale: 1.05 }}  
          disabled={refreshing}  
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-all disabled:opacity-50"  
        >  
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />  
          {refreshing ? 'Actualizando...' : 'Refrescar Reportes'}  
        </motion.button>  
      </motion.div>  

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">  
        <motion.div  
          initial={{ y: 20, opacity: 0 }}  
          animate={{ y: 0, opacity: 1 }}  
          whileHover={{ scale: 1.05 }}  
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-red-200/50 bg-gradient-to-br from-red-50 to-pink-50"  
        >  
          <div className="flex items-center gap-3 mb-4">  
            <AlertTriangle className="w-8 h-8 text-red-600" />  
            <h2 className="text-xl font-bold text-gray-900">Deudores</h2>  
          </div>  
          <p className="text-3xl font-bold text-red-600">{stats.debtors}</p>  
          <p className="text-sm text-red-700 mt-2">Facturados sin pago</p>  
          <Link to="/reports" className="text-red-600 hover:underline text-sm mt-2 block">Ver →</Link>  
        </motion.div>  

        <motion.div  
          initial={{ y: 20, opacity: 0 }}  
          animate={{ y: 0, opacity: 1 }}  
          transition={{ delay: 0.1 }}  
          whileHover={{ scale: 1.05 }}  
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-orange-200/50 bg-gradient-to-br from-orange-50 to-yellow-50"  
        >  
          <div className="flex items-center gap-3 mb-4">  
            <Clock className="w-8 h-8 text-orange-600" />  
            <h2 className="text-xl font-bold text-gray-900">En Espera</h2>  
          </div>  
          <p className="text-3xl font-bold text-orange-600">{stats.waiting}</p>  
          <p className="text-sm text-orange-700 mt-2">Esperando acción</p>  
          <Link to="/reports" className="text-orange-600 hover:underline text-sm mt-2 block">Ver →</Link>  
        </motion.div>  

        <motion.div  
          initial={{ y: 20, opacity: 0 }}  
          animate={{ y: 0, opacity: 1 }}  
          transition={{ delay: 0.2 }}  
          whileHover={{ scale: 1.05 }}  
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50"  
        >  
          <div className="flex items-center gap-3 mb-4">  
            <Phone className="w-8 h-8 text-blue-600" />  
            <h2 className="text-xl font-bold text-gray-900">Contactados</h2>  
          </div>  
          <p className="text-3xl font-bold text-blue-600">{stats.contacted}</p>  
          <p className="text-sm text-blue-700 mt-2">Ya se contactó</p>  
          <Link to="/reports" className="text-blue-600 hover:underline text-sm mt-2 block">Ver →</Link>  
        </motion.div>  

        <motion.div  
          initial={{ y: 20, opacity: 0 }}  
          animate={{ y: 0, opacity: 1 }}  
          transition={{ delay: 0.3 }}  
          whileHover={{ scale: 1.05 }}  
          className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50"  
        >  
          <div className="flex items-center gap-3 mb-4">  
            <CheckCircle className="w-8 h-8 text-green-600" />  
            <h2 className="text-xl font-bold text-gray-900">Pagados</h2>  
          </div>  
          <p className="text-3xl font-bold text-green-600">{stats.paid}</p>  
          <p className="text-sm text-green-700 mt-2">Cobros cerrados</p>  
          <Link to="/reports" className="text-green-600 hover:underline text-sm mt-2 block">Ver →</Link>  
        </motion.div>  
      </div>  

      <motion.div  
        className="grid grid-cols-1 md:grid-cols-3 gap-8"  
        initial={{ y: 20, opacity: 0 }}  
        animate={{ y: 0, opacity: 1 }}  
        transition={{ delay: 0.4 }}  
      >  
        <Link  
          to="/clients"  
          className="block p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all hover:-translate-y-2"  
        >  
          <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />  
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestionar Clientes</h2>  
          <p className="text-gray-600">Agrega, edita y ve detalles de tus clientes de un vistazo.</p>  
        </Link>  
        <Link  
          to="/followups"  
          className="block p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all hover:-translate-y-2"  
        >  
          <LayoutDashboard className="w-12 h-12 text-amber-600 mx-auto mb-4" />  
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seguimientos</h2>  
          <p className="text-gray-600">Registra cobros con folio y cierra al pagar.</p>  
        </Link>  
        <Link  
          to="/reports"  
          className="block p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all hover:-translate-y-2"  
        >  
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />  
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reportes</h2>  
          <p className="text-gray-600">Deudores, pagados e historial detallado.</p>  
        </Link>  
      </motion.div>  
    </motion.div>  
  );  
};  

const App = () => {  
  return (  
    <Router>  
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">  
        <Navbar />  
        <Routes>  
          <Route path="/" element={<Dashboard />} />  
          <Route path="/clients" element={<ClientList />} />  
          <Route path="/client/:id" element={<ClientDetails />} />  
          <Route path="/followups" element={<FollowupList />} />  
          <Route path="/reports" element={<Reports />} />  
        </Routes>  
      </div>  
    </Router>  
  );  
};  

export default App;