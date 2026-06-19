let _counter = 0;
export const generateId = () => `id_${Date.now()}_${_counter++}`;
export const getTime = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
