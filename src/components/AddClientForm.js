import React, { useState, useEffect } from 'react';  
import { motion } from 'framer-motion';  
import { Plus, X, Save, MapPin, Users, Key, Coffee, CalendarDays, DollarSign } from 'lucide-react';  
import { supabase } from '../utils/supabase';  

const AddClientForm = ({ onClose, clientToEdit = null, onSuccess }) => {  
  const [formData, setFormData] = useState({  
    customer_number: '',  
    zone: '',  
    customZone: '', // Para "Otro" en zona  
    name: '',  
    rental_key: '',  
    service_type: 'renta',  
    cutoff_day: 15,  
    coffee_type: '',  
    kilos: 0,  
    service_value_with_coffee: 0  
  });  
  const [loading, setLoading] = useState(false);  
  const [isEditMode, setIsEditMode] = useState(false);  
  const [showCustomZone, setShowCustomZone] = useState(false);  

  const zoneOptions = [  
    { value: 'cancun', label: 'Cancún' },  
    { value: 'tulum', label: 'Tulum' },  
    { value: 'playa-del-carmen', label: 'Playa del Carmen' },  
    { value: 'cozumel', label: 'Cozumel' },  
    { value: 'merida', label: 'Mérida' },  
    { value: 'otro', label: 'Otro' }  
  ];  

  const coffeeOptions = [  
    { value: 'gusto-clasico', label: 'Gusto Clásico' },  
    { value: 'intenso', label: 'Intenso' },  
    { value: 'kaawa-oro', label: 'Kaawa Oro' },  
    { value: 'chiapas', label: 'Chiapas' },  
    { value: 'veracruz', label: 'Veracruz' },  
    { value: 'daramy', label: 'Daramy' },  
    { value: 'nayarit', label: 'Nayarit' },  
    { value: 'dolce-aroma', label: 'Dolce Aroma' },  
    { value: 'pluma', label: 'Pluma' },  
    { value: 'descafeinado', label: 'Descafeinado' },  
    { value: 'mezcla', label: 'Mezcla' } // Nueva opción para mezclas exclusivas  
  ];  

  useEffect(() => {  
    if (clientToEdit) {  
      const zoneValue = zoneOptions.find(opt => opt.label.toLowerCase() === clientToEdit.zone.toLowerCase())?.value || 'otro';  
      const coffeeValue = coffeeOptions.find(opt => opt.label.toLowerCase() === clientToEdit.coffee_type?.toLowerCase())?.value || '';  
      setFormData({  
        ...clientToEdit,  
        zone: zoneValue,  
        customZone: zoneValue === 'otro' ? clientToEdit.zone : '',  
        coffee_type: coffeeValue  
      });  
      setShowCustomZone(zoneValue === 'otro');  
      setIsEditMode(true);  
    } else {  
      setIsEditMode(false);  
      setShowCustomZone(false);  
    }  
  }, [clientToEdit]);  

  const handleZoneChange = (e) => {  
    const value = e.target.value;  
    setFormData(prev => ({ ...prev, zone: value }));  
    setShowCustomZone(value === 'otro');  
    if (value !== 'otro') {  
      setFormData(prev => ({ ...prev, customZone: '' }));  
    }  
  };  

  const handleCoffeeChange = (e) => {  
    const value = e.target.value;  
    setFormData(prev => ({ ...prev, coffee_type: value }));  
  };  

  const handleServiceTypeChange = (e) => {  
    const value = e.target.value;  
    setFormData(prev => ({ ...prev, service_type: value }));  
    // Si cambia a comodato y no hay coffee_type, opcional por ahora, validará en submit  
  };  

  const handleChange = (e) => {  
    const { name, value } = e.target;  
    setFormData(prev => ({ ...prev, [name]: value }));  
    // Si cambia service_type, llamar handler específico  
    if (name === 'service_type') {  
      handleServiceTypeChange(e);  
    }  
  };  

  const getFinalZone = () => {  
    return formData.zone === 'otro' ? formData.customZone : zoneOptions.find(opt => opt.value === formData.zone)?.label || '';  
  };  

  const getFinalCoffee = () => {  
    const selectedOption = coffeeOptions.find(opt => opt.value === formData.coffee_type);  
    return selectedOption ? selectedOption.label : formData.coffee_type || '';  
  };  

  const isCoffeeRequired = () => formData.service_type === 'comodato';  

  const isValid = () => {  
    if (!getFinalZone().trim()) return false;  
    if (isCoffeeRequired() && !getFinalCoffee().trim()) return false;  
    return true;  
  };  

  const handleSubmit = async (e) => {  
    e.preventDefault();  
    const finalData = {  
      ...formData,  
      zone: getFinalZone(),  
      coffee_type: getFinalCoffee()  
    };  
    // Borrar campo temporal antes de enviar  
    delete finalData.customZone;  
    if (!finalData.zone.trim()) {  
      alert('Selecciona o escribe una zona válida');  
      return;  
    }  
    if (isCoffeeRequired() && !finalData.coffee_type.trim()) {  
      alert('Para Comodato, el Tipo de Café es obligatorio. Selecciona uno.');  
      return;  
    }  
    setLoading(true);  
    try {  
      let result;  
      if (isEditMode && clientToEdit.id) {  
        const { error } = await supabase  
          .from('clients')  
          .update(finalData)  
          .eq('id', clientToEdit.id);  
        if (error) throw error;  
        alert('Cliente actualizado exitosamente.');  
      } else {  
        const { error } = await supabase  
          .from('clients')  
          .insert([finalData]);  
        if (error) throw error;  
        alert('Cliente agregado exitosamente.');  
      }  
      onClose();  
      if (onSuccess) onSuccess();  
    } catch (error) {  
      alert('Ups, algo salió mal: ' + error.message);  
    } finally {  
      setLoading(false);  
    }  
  };  

  return (  
    <motion.div  
      initial={{ opacity: 0, scale: 0.95 }}  
      animate={{ opacity: 1, scale: 1 }}  
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"  
      onClick={onClose}  
    >  
      <motion.div  
        initial={{ y: 50, opacity: 0 }}  
        animate={{ y: 0, opacity: 1 }}  
        className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200/50"  
        onClick={(e) => e.stopPropagation()}  
      >  
        <div className="flex items-center justify-between mb-6">  
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">  
            {isEditMode ? (  
              <Save className="w-6 h-6 text-blue-600" />  
            ) : (  
              <Plus className="w-6 h-6 text-green-600" />  
            )}  
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}  
          </h2>  
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">  
            <X className="w-5 h-5 text-gray-500" />  
          </button>  
        </div>  
        <form onSubmit={handleSubmit} className="space-y-6">  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <Users className="w-4 h-4" />  
                Número de Cliente  
              </label>  
              <input  
                type="text"  
                name="customer_number"  
                value={formData.customer_number}  
                onChange={handleChange}  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              />  
            </div>  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <MapPin className="w-4 h-4" />  
                Zona  
              </label>  
              <select  
                name="zone"  
                value={formData.zone}  
                onChange={handleZoneChange}  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              >  
                <option value="">Seleccionar zona...</option>  
                {zoneOptions.map(opt => (  
                  <option key={opt.value} value={opt.value}>{opt.label}</option>  
                ))}  
              </select>  
              {showCustomZone && (  
                <input  
                  type="text"  
                  name="customZone"  
                  value={formData.customZone}  
                  onChange={handleChange}  
                  placeholder="Escribe la zona personalizada..."  
                  className="w-full px-4 py-3 mt-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
                  required  
                />  
              )}  
            </div>  
            <div className="md:col-span-2">  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <Users className="w-4 h-4" />  
                Nombre  
              </label>  
              <input  
                type="text"  
                name="name"  
                value={formData.name}  
                onChange={handleChange}  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              />  
            </div>  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <Key className="w-4 h-4" />  
                Clave de Renta  
              </label>  
              <input  
                type="text"  
                name="rental_key"  
                value={formData.rental_key}  
                onChange={handleChange}  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              />  
            </div>  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Servicio</label>  
              <select  
                name="service_type"  
                value={formData.service_type}  
                onChange={handleChange}  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              >  
                <option value="renta">Renta</option>  
                <option value="comodato">Comodato</option>  
              </select>  
            </div>  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <CalendarDays className="w-4 h-4" />  
                Día de Cierre  
              </label>  
              <input  
                type="number"  
                name="cutoff_day"  
                value={formData.cutoff_day}  
                onChange={handleChange}  
                min="1"  
                max="31"  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              />  
            </div>  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <Coffee className="w-4 h-4" />  
                Tipo de Café  
              </label>  
              <select  
                name="coffee_type"  
                value={formData.coffee_type}  
                onChange={handleCoffeeChange}  
                required={isCoffeeRequired()} // Required solo si comodato  
                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all ${  
                  isCoffeeRequired() && !getFinalCoffee().trim() ? 'border-red-300 ring-red-500' : ''  
                }`}  
              >  
                <option value="">Seleccionar tipo de café... {isCoffeeRequired() ? '(Obligatorio para Comodato)' : '(Opcional para Renta)'}</option>  
                {coffeeOptions.map(opt => (  
                  <option key={opt.value} value={opt.value}>{opt.label}</option>  
                ))}  
              </select>  
              {isCoffeeRequired() && !getFinalCoffee().trim() && (  
                <p className="text-xs text-red-600 mt-1">Obligatorio para Comodato</p>  
              )}  
            </div>  
            <div>  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <Coffee className="w-4 h-4" />  
                Kilos  
              </label>  
              <input  
                type="number"  
                name="kilos"  
                value={formData.kilos}  
                onChange={handleChange}  
                step="0.01"  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              />  
            </div>  
            <div className="md:col-span-2">  
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">  
                <DollarSign className="w-4 h-4" />  
                Valor del Servicio  
              </label>  
              <input  
                type="number"  
                name="service_value_with_coffee"  
                value={formData.service_value_with_coffee}  
                onChange={handleChange}  
                step="0.01"  
                required  
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"  
              />  
            </div>  
          </div>  
          <motion.div  
            className="flex gap-4 pt-6 border-t border-gray-200/50"  
            initial={{ opacity: 0 }}  
            animate={{ opacity: 1 }}  
            transition={{ delay: 0.3 }}  
          >  
            <button  
              type="button"  
              onClick={onClose}  
              disabled={loading}  
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all disabled:opacity-50"  
            >  
              Cancelar  
            </button>  
            <button  
              type="submit"  
              disabled={loading || !isValid()}  
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${  
                isValid()  
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-lg'  
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'  
              }`}  
            >  
              {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Cliente' : 'Guardar Cliente')}  
              {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}  
            </button>  
          </motion.div>  
        </form>  
      </motion.div>  
    </motion.div>  
  );  
};  

export default AddClientForm;
