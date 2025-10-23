import React from 'react';  
import { motion } from 'framer-motion';  
import { LayoutDashboard, Users, FileText, Home } from 'lucide-react';  
import { Link, useLocation } from 'react-router-dom';  

const Navbar = () => {  
  const location = useLocation();  
  const navItems = [  
    { path: '/', label: 'Dashboard', icon: Home },  
    { path: '/clients', label: 'Clientes', icon: Users },  
    { path: '/followups', label: 'Seguimientos', icon: LayoutDashboard },  
    { path: '/reports', label: 'Reportes', icon: FileText }  
  ];  

  return (  
    <motion.nav  
      initial={{ y: -100 }}  
      animate={{ y: 0 }}  
      className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg"  
    >  
      <div className="container mx-auto px-4 py-4">  
        <div className="flex items-center justify-between">  
          <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">  
            <LayoutDashboard className="w-6 h-6" />  
            Café Kaawa  
          </Link>  
          <div className="hidden md:flex items-center gap-6">  
            {navItems.map((item) => {  
              const Icon = item.icon;  
              const isActive = location.pathname === item.path;  
              return (  
                <Link  
                  key={item.path}  
                  to={item.path}  
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${  
                    isActive  
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'  
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'  
                  }`}  
                >  
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />  
                  {item.label}  
                </Link>  
              );  
            })}  
          </div>  
        </div>  
      </div>  
    </motion.nav>  
  );  
};  

export default Navbar;