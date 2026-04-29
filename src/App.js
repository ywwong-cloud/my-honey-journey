/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CreditCard, 
  User, 
  Plus, 
  X, 
  Camera, 
  ShoppingBag,
  Bus,
  Utensils,
  Bed,
  Trash2,
  CalendarPlus,
  Home
} from 'lucide-react';

// --- Firebase 雲端資料庫設定 ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyDmjw7jMCOQlSlwLoehq6_hmB4sEvO9Ais",
  authDomain: "my-honey-journey.firebaseapp.com",
  projectId: "my-honey-journey",
  storageBucket: "my-honey-journey.firebasestorage.app",
  messagingSenderId: "641684126962",
  appId: "1:641684126962:web:c3472691bd5f653e6f246b",
  measurementId: "G-RYZ76WMMLX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? String(__app_id).replace(/\//g, '_') : firebaseConfig.projectId;

// --- 自訂樣式與動畫 ---
const CustomStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Varela+Round&display=swap');
    
    body {
      font-family: 'Nunito', 'Varela Round', sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }

    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .bouncy-transition { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .bouncy-active:active { transform: scale(0.92); }

    .soft-shadow { box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08); }
    .glow-shadow { box-shadow: 0 0 20px rgba(255, 181, 167, 0.4); }
  `}</style>
);

// --- 貨幣設定與匯率 ---
const CURRENCIES = {
  JPY: { symbol: '¥', name: '日幣', rateToHKD: 0.052 },
  TWD: { symbol: 'NT$', name: '台幣', rateToHKD: 0.24 },
  KRW: { symbol: '₩', name: '韓元', rateToHKD: 0.0058 },
  THB: { symbol: '฿', name: '泰銖', rateToHKD: 0.22 },
  USD: { symbol: '$', name: '美金', rateToHKD: 7.8 },
  EUR: { symbol: '€', name: '歐元', rateToHKD: 8.5 },
  AUD: { symbol: 'A$', name: '澳幣', rateToHKD: 5.1 },
  HKD: { symbol: 'HK$', name: '港幣', rateToHKD: 1 },
};

const THEME_COLORS = [
  'bg-pink-100 text-pink-500',
  'bg-blue-100 text-blue-500',
  'bg-yellow-100 text-yellow-600',
  'bg-green-100 text-green-500',
  'bg-purple-100 text-purple-500',
  'bg-orange-100 text-orange-500',
];

const STYLE_PRESETS = [
  { emoji: '✨', color: 'bg-gray-100 text-gray-500' },
  { emoji: '✈️', color: 'bg-blue-100 text-blue-500' },
  { emoji: '🏨', color: 'bg-pink-100 text-pink-500' },
  { emoji: '🍜', color: 'bg-yellow-100 text-yellow-600' },
  { emoji: '⛩️', color: 'bg-green-100 text-green-500' },
  { emoji: '🛍️', color: 'bg-purple-100 text-purple-500' },
  { emoji: '☕', color: 'bg-orange-100 text-orange-500' },
  { emoji: '🚆', color: 'bg-blue-100 text-blue-600' },
];

const CATEGORIES = [
  { id: 'food', iconName: 'Utensils', label: '飲食', color: 'bg-teal-100 text-teal-600' },
  { id: 'transport', iconName: 'Bus', label: '交通', color: 'bg-blue-100 text-blue-600' },
  { id: 'shopping', iconName: 'ShoppingBag', label: '購物', color: 'bg-pink-100 text-pink-600' },
  { id: 'accommodation', iconName: 'Bed', label: '住宿', color: 'bg-orange-100 text-orange-600' },
];

const ICONS = { Utensils, Bus, ShoppingBag, Bed, Camera };

const FAB = ({ onClick, icon: Icon, color = "bg-[#FFF0A8]" }) => (
  <button 
    onClick={onClick}
    className={`absolute bottom-[100px] right-6 w-14 h-14 ${color} text-gray-700 rounded-full flex items-center justify-center soft-shadow bouncy-transition bouncy-active z-40 hover:scale-105`}
  >
    <Icon size={28} strokeWidth={2.5} />
  </button>
);

// --- 旅程儀表板 ---
const TripDashboard = ({ trips, onSelectTrip, onCreateTrip, onDeleteTrip }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '✈️', currency: 'JPY', themeIndex: 0 });

  const handleCreate = () => {
    if (!form.name) return;
    const color = THEME_COLORS[form.themeIndex % THEME_COLORS.length];
    onCreateTrip({ ...form, color });
    setShowModal(false);
    setForm({ name: '', emoji: '✈️', currency: 'JPY', themeIndex: (form.themeIndex + 1) });
  };

  return (
    <div className="h-full flex flex-col bg-[#FFFDFD] relative">
      <div className="pt-12 pb-6 px-6 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-3xl font-black text-gray-800 tracking-tight">My Honey Journey 🍯</h1>
        <p className="text-gray-400 font-bold mt-1">準備好出發了嗎？ 🌍</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 hide-scrollbar">
        {trips.length === 0 ? (
          <div className="text-center text-gray-400 mt-16 font-bold flex flex-col items-center">
            <div className="text-6xl mb-4">🧳</div>
            還沒有建立任何旅程喔！<br/>點擊右下角新增吧 ✨
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <div key={trip.id} className="relative group">
                <button 
                  onClick={() => onSelectTrip(trip.id)}
                  className="w-full bg-white rounded-[28px] p-5 soft-shadow border-2 border-gray-50 bouncy-transition hover:-translate-y-1 hover:border-pink-100 flex items-center gap-5 text-left"
                >
                  <div className={`w-16 h-16 rounded-[20px] ${trip.color} flex items-center justify-center text-3xl shadow-sm shrink-0`}>
                    {trip.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-800">{trip.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                        {CURRENCIES[trip.currency]?.name || trip.currency}
                      </span>
                      <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                        {(trip.days || []).length} 天
                      </span>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }}
                  className="absolute top-1/2 -translate-y-1/2 -right-12 w-10 h-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:-translate-x-16 bouncy-transition shadow-sm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowModal(true)}
        className="absolute bottom-8 right-6 w-14 h-14 bg-[#FFF0A8] text-gray-700 rounded-full flex items-center justify-center soft-shadow bouncy-transition bouncy-active z-40 hover:scale-105"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <div className={`absolute inset-0 z-50 flex items-end justify-center pointer-events-none ${showModal ? 'pointer-events-auto' : ''}`}>
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm bouncy-transition ${showModal ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowModal(false)}></div>
        <div className={`w-full bg-white rounded-t-[32px] p-6 pb-10 relative bouncy-transition shadow-2xl flex flex-col gap-5 ${showModal ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div>
          <h3 className="text-xl font-black text-gray-800">建立新旅程</h3>
          
          <div className="flex gap-3">
            <div className="relative w-1/4">
              <input type="text" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 font-black text-2xl text-center outline-none" placeholder="✈️" />
            </div>
            <div className="relative flex-1">
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none" placeholder="例如：日本關西之旅" />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 ml-1">選擇主要貨幣</p>
            <select 
              value={form.currency} 
              onChange={e => setForm({...form, currency: e.target.value})}
              className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none appearance-none"
            >
              {Object.entries(CURRENCIES).map(([code, data]) => (
                <option key={code} value={code}>{code} ({data.name})</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleCreate} className="w-full bg-[#A0E8AF] text-gray-800 rounded-full py-4 font-black text-lg bouncy-active shadow-sm mt-2">
            出發！
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 行程 View ---
const ItineraryView = ({ trip, updateTrip }) => {
  const days = trip.days || [];
  const itineraries = trip.itineraries || {};
  
  const [activeDayId, setActiveDayId] = useState(days[0]?.id || null);
  const [now, setNow] = useState(new Date());
  
  const [showDayModal, setShowDayModal] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ time: '10:00', title: '', note: '', emoji: '✨', color: 'bg-gray-100 text-gray-500' });

  useEffect(() => {
    if (days.length > 0 && !activeDayId) setActiveDayId(days[0].id);
  }, [days, activeDayId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const activeDay = days.find(d => d.id === activeDayId) || days[0] || {};
  const currentItinerary = itineraries[activeDayId] || [];

  const isItemCurrent = (item, index) => {
    if (!activeDay.date) return false;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (activeDay.date !== todayStr) return false;
    
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (item.time > timeStr) return false;
    
    const nextItem = currentItinerary[index + 1];
    if (nextItem && nextItem.time <= timeStr) return false;
    
    return true;
  };

  const handleAddDay = () => {
    if (!newDayDate) return;
    const newId = `Day ${days.length + 1}`;
    const newDays = [...days, { id: newId, label: newId, date: newDayDate }];
    const newItin = { ...itineraries, [newId]: [] };
    
    updateTrip({ ...trip, days: newDays, itineraries: newItin });
    setActiveDayId(newId);
    setShowDayModal(false);
  };

  const handleSaveItem = () => {
    if (!itemForm.title || !activeDayId) return;
    const dayList = itineraries[activeDayId] || [];
    let newList;
    if (editingItem) {
      newList = dayList.map(i => i.id === editingItem.id ? { ...itemForm, id: editingItem.id } : i);
    } else {
      newList = [...dayList, { ...itemForm, id: Date.now().toString() }];
    }
    newList.sort((a,b) => a.time.localeCompare(b.time));
    
    updateTrip({ ...trip, itineraries: { ...itineraries, [activeDayId]: newList } });
    setShowItemModal(false);
  };

  const handleDeleteItem = () => {
    if (!editingItem || !activeDayId) return;
    const newItin = {
      ...itineraries,
      [activeDayId]: (itineraries[activeDayId] || []).filter(i => i.id !== editingItem.id)
    };
    updateTrip({ ...trip, itineraries: newItin });
    setShowItemModal(false);
  };

  const openItemModal = (item = null) => {
    setEditingItem(item);
    setItemForm(item || { time: '10:00', title: '', note: '', emoji: '✨', color: 'bg-gray-100 text-gray-500' });
    setShowItemModal(true);
  };

  return (
    <div className="h-full flex flex-col bg-[#FFFDFD] relative">
      <div className="pt-12 pb-4 px-6 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-2xl font-black text-gray-800 mb-4 tracking-tight flex items-center gap-2">
          {trip.name} ✈️
        </h1>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-center">
          {days.map(day => {
            const isActive = activeDayId === day.id;
            return (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={`flex flex-col items-center justify-center px-5 py-2 rounded-[20px] whitespace-nowrap bouncy-transition bouncy-active border-2
                  ${isActive 
                    ? 'bg-gray-800 text-white border-gray-800 shadow-md scale-105' 
                    : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
              >
                <span className="font-bold text-sm">{day.label}</span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                  {day.date.replace(/-/g, '/')}
                </span>
              </button>
            );
          })}
          <button 
            onClick={() => { setNewDayDate(''); setShowDayModal(true); }}
            className="w-12 h-[52px] shrink-0 rounded-[20px] bg-pink-50 border-2 border-pink-100 text-pink-400 flex items-center justify-center bouncy-active hover:bg-pink-100"
          >
            <CalendarPlus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 hide-scrollbar">
        {days.length === 0 ? (
           <div className="text-center text-gray-400 mt-10 font-bold">請先點擊上方新增你的第一天行程！</div>
        ) : currentItinerary.length === 0 ? (
          <div className="text-center text-gray-400 mt-10 font-bold">這天還沒有行程喔！點擊右下角新增吧 ✨</div>
        ) : (
          <div className="relative border-l-[3px] border-dashed border-gray-200 ml-4 space-y-8">
            {currentItinerary.map((item, index) => {
              const isCurrent = isItemCurrent(item, index);
              return (
                <div key={item.id} className="relative pl-8 group">
                  <div className={`absolute -left-[14px] top-1 w-7 h-7 rounded-full border-[4px] border-white ${item.color.split(' ')[0]} flex items-center justify-center shadow-sm bouncy-transition ${isCurrent ? 'scale-125 glow-shadow' : ''}`}>
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <button 
                    onClick={() => openItemModal(item)}
                    className={`w-full text-left bg-white rounded-[24px] p-4 soft-shadow border-2 bouncy-transition text-gray-800 relative overflow-hidden
                      ${isCurrent ? 'border-pink-300 scale-[1.02] glow-shadow' : 'border-gray-50 hover:translate-x-1 hover:border-pink-100'}`}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 right-0 bg-pink-400 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-[20px]">
                        進行中
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-black ${isCurrent ? 'text-pink-500 text-base' : 'text-gray-400 text-sm'}`}>{item.time}</span>
                      <div className={`w-9 h-9 rounded-[14px] ${item.color} flex items-center justify-center text-lg shadow-sm`}>
                        {item.emoji}
                      </div>
                    </div>
                    <h3 className={`font-black ${isCurrent ? 'text-xl text-gray-900' : 'text-lg'}`}>{item.title}</h3>
                    {item.note && <p className="text-gray-500 text-sm mt-1 font-semibold">{item.note}</p>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {days.length > 0 && <FAB onClick={() => openItemModal()} icon={Plus} />}

      <div className={`absolute inset-0 z-50 flex items-end justify-center pointer-events-none ${showItemModal ? 'pointer-events-auto' : ''}`}>
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm bouncy-transition ${showItemModal ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowItemModal(false)}></div>
        <div className={`w-full bg-white rounded-t-[32px] p-6 pb-10 relative bouncy-transition shadow-2xl flex flex-col gap-4 ${showItemModal ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black text-gray-800">{editingItem ? '修改行程' : '新增行程'}</h3>
            {editingItem && (
              <button onClick={handleDeleteItem} className="text-red-400 p-2 rounded-full hover:bg-red-50"><Trash2 size={20} /></button>
            )}
          </div>
          
          <div className="flex gap-4">
            <input type="time" value={itemForm.time} onChange={e => setItemForm({...itemForm, time: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-black text-lg text-gray-800 outline-none w-1/3 text-center" />
            <input type="text" placeholder="行程標題" value={itemForm.title} onChange={e => setItemForm({...itemForm, title: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none flex-1 placeholder-gray-400" />
          </div>
          <input type="text" placeholder="備註 (選填)" value={itemForm.note} onChange={e => setItemForm({...itemForm, note: e.target.value})} className="bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none w-full placeholder-gray-400 text-sm" />
          
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 mt-2">選擇圖示與顏色</p>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {STYLE_PRESETS.map((style, idx) => (
                <button key={idx} onClick={() => setItemForm({...itemForm, emoji: style.emoji, color: style.color})} className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl bouncy-active border-2 ${style.color} ${itemForm.emoji === style.emoji ? 'border-gray-800 scale-110' : 'border-transparent'}`}>
                  {style.emoji}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSaveItem} className="w-full bg-[#FFF0A8] text-gray-800 rounded-full py-4 font-black text-lg bouncy-active mt-2 shadow-sm">儲存行程</button>
        </div>
      </div>

      <div className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none ${showDayModal ? 'pointer-events-auto' : ''}`}>
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm bouncy-transition ${showDayModal ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowDayModal(false)}></div>
        <div className={`bg-white rounded-[32px] p-6 w-[85%] relative bouncy-transition shadow-2xl ${showDayModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <h3 className="text-xl font-black text-gray-800 mb-4 text-center">新增一天</h3>
          <input type="date" value={newDayDate} onChange={e => setNewDayDate(e.target.value)} className="w-full bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none mb-6" />
          <button onClick={handleAddDay} className="w-full bg-pink-200 text-pink-800 rounded-full py-3.5 font-black text-lg bouncy-active">確認新增</button>
        </div>
      </div>
    </div>
  );
};

// --- 記帳 View ---
const ExpenseView = ({ trip, updateTrip }) => {
  const expenses = trip.expenses || [];
  const currencyInfo = CURRENCIES[trip.currency || 'JPY'];

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const defaultForm = { title: '', amount: '', category: 'food', date: getToday() };
  const [form, setForm] = useState(defaultForm);

  const totalAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalHKD = (totalAmount * currencyInfo.rateToHKD).toFixed(1);

  const chartData = CATEGORIES.map(cat => ({
    color: cat.color.split(' ')[0].replace('bg-', 'bg-').replace('100', '300'),
    width: `${(expenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount), 0) / (totalAmount || 1)) * 100}%`
  })).filter(c => parseFloat(c.width) > 0);

  const handleSave = () => {
    if (!form.title || !form.amount) return;
    const catData = CATEGORIES.find(c => c.id === form.category);
    
    const newExpense = {
      ...form,
      amount: Number(form.amount),
      iconName: catData.iconName,
      color: catData.color,
    };

    let newExp;
    if (editingExpense) {
      newExp = expenses.map(e => e.id === editingExpense.id ? { ...newExpense, id: editingExpense.id } : e);
    } else {
      newExp = [{ ...newExpense, id: Date.now().toString() }, ...expenses];
    }
    
    updateTrip({ ...trip, expenses: newExp });
    setShowModal(false);
  };

  const handleDelete = () => {
    const newExp = expenses.filter(e => e.id !== editingExpense.id);
    updateTrip({ ...trip, expenses: newExp });
    setShowModal(false);
  };

  const openModal = (expense = null) => {
    setEditingExpense(expense);
    if (expense) {
      setForm({ ...expense, date: expense.date || getToday() });
    } else {
      setForm(defaultForm);
    }
    setShowModal(true);
  };

  return (
    <div className="h-full flex flex-col bg-[#FFFDFD] relative">
      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        <div className="p-6 pt-12">
          <div className="bg-gradient-to-br from-[#FFD1DC] to-[#BDE0FE] rounded-[32px] p-8 soft-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-xl -ml-5 -mb-5"></div>
            
            <p className="text-gray-700/80 font-black mb-1 relative z-10 text-sm">
              總花費 ({trip.currency})
            </p>
            <h2 className="text-5xl font-black text-gray-900 tracking-tight relative z-10 flex items-baseline gap-2">
              <span className="text-3xl text-gray-700/60">{currencyInfo.symbol}</span>
              {totalAmount.toLocaleString()}
            </h2>
            <p className="relative z-10 mt-1 text-sm font-black text-gray-600 bg-white/40 inline-block px-3 py-1 rounded-full">
              ≈ HK$ {Number(totalHKD).toLocaleString(undefined, {minimumFractionDigits: 1})}
            </p>
            
            <div className="mt-6 relative z-10">
              <div className="flex justify-between text-[11px] font-black text-gray-600 mb-2 uppercase tracking-wide">
                <span>比例分佈</span>
              </div>
              <div className="h-3 w-full bg-white/40 rounded-full flex overflow-hidden gap-0.5">
                {chartData.length > 0 ? chartData.map((item, idx) => (
                  <div key={idx} className={`h-full ${item.color}`} style={{ width: item.width }}></div>
                )) : <div className="h-full w-full bg-gray-200/50"></div>}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6">
          <h3 className="font-black text-gray-800 text-lg mb-4">帳單明細</h3>
          {expenses.length === 0 ? (
            <div className="text-center text-gray-400 mt-6 font-bold">還沒有任何花費喔！</div>
          ) : (
            <div className="space-y-3">
              {[...expenses].sort((a,b) => (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id)).map(expense => {
                const IconComponent = ICONS[expense.iconName];
                const displayDate = expense.date ? expense.date.replace(/-/g, '/') : '';
                return (
                  <button 
                    key={expense.id} 
                    onClick={() => openModal(expense)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-[24px] soft-shadow border border-gray-50 bouncy-transition hover:scale-[1.02] hover:border-pink-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[16px] ${expense.color} flex items-center justify-center`}>
                        <IconComponent size={22} strokeWidth={2.5} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-gray-800 text-base">{expense.title}</h4>
                        <p className="text-xs font-bold text-gray-400">
                          {displayDate && <span className="mr-1">{displayDate} •</span>}
                          {CATEGORIES.find(c => c.id === expense.category)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="font-black text-gray-800 text-lg">
                      -{currencyInfo.symbol}{expense.amount.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FAB onClick={() => openModal()} icon={Plus} color="bg-[#A0E8AF]" />

      <div className={`absolute inset-0 z-50 flex items-end justify-center pointer-events-none ${showModal ? 'pointer-events-auto' : ''}`}>
        <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm bouncy-transition ${showModal ? 'opacity-100' : 'opacity-0'}`} onClick={() => setShowModal(false)}></div>
        
        <div className={`w-full bg-white rounded-t-[32px] p-6 pb-10 relative bouncy-transition shadow-2xl flex flex-col gap-5 ${showModal ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto"></div>
          
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-800">{editingExpense ? '修改帳單' : '新增花費'}</h3>
            {editingExpense && (
              <button onClick={handleDelete} className="text-red-400 p-2 rounded-full hover:bg-red-50"><Trash2 size={20} /></button>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-[24px] p-5 text-center flex justify-center items-center gap-2 relative">
            <span className="text-gray-400 font-black text-2xl">{currencyInfo.symbol}</span>
            <input 
              type="number" 
              placeholder="0" 
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className="bg-transparent border-none outline-none text-5xl font-black text-gray-800 w-full text-center"
            />
          </div>

          <div className="flex gap-3">
            <input 
              type="date" 
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none w-[140px] shrink-0" 
            />
            <input 
              type="text" 
              placeholder="項目名稱 (例如：晚餐)" 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="bg-gray-50 rounded-2xl p-4 font-bold text-gray-800 outline-none flex-1 placeholder-gray-400 min-w-0" 
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const IconComp = ICONS[cat.iconName];
              const isSelected = form.category === cat.id;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setForm({...form, category: cat.id})}
                  className="flex flex-col items-center gap-2 bouncy-active"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300
                    ${isSelected ? `${cat.color} border-gray-800 scale-110 shadow-sm` : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'}`}>
                    <IconComp size={24} strokeWidth={isSelected ? 3 : 2} />
                  </div>
                  <span className={`text-[11px] font-black ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>{cat.label}</span>
                </button>
              );
            })}
          </div>
          <button onClick={handleSave} className="w-full bg-[#A0E8AF] text-gray-800 rounded-full py-4 font-black text-lg bouncy-active mt-2 shadow-sm">儲存紀錄</button>
        </div>
      </div>
    </div>
  );
};

// --- 主應用程式 ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [authError, setAuthError] = useState(null); // 新增錯誤狀態

  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error:", e);
        setAuthError(e.message); // 記錄錯誤訊息
        setIsAppReady(true);     // 解除轉圈圈
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const tripsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'trips');
    
    const unsub = onSnapshot(tripsRef, (snapshot) => {
      const loadedTrips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrips(loadedTrips.sort((a,b) => b.createdAt - a.createdAt));
      setIsAppReady(true);
    }, (err) => {
      console.error("Data Load Error:", err);
      setAuthError("無法讀取資料庫：" + err.message); // 記錄資料庫錯誤
      setIsAppReady(true);
    });

    return () => unsub();
  }, [user]);

  const handleCreateTrip = async (tripData) => {
    if (!user) return;
    const newTrip = {
      ...tripData,
      createdAt: Date.now(),
      days: [],
      itineraries: {},
      expenses: []
    };
    const newTripId = `trip_${Date.now()}`;
    
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'trips', newTripId), newTrip);
    } catch (error) {
      console.error("Create Trip Error:", error);
      alert("建立失敗：" + error.message);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'trips', tripId));
      if (currentTripId === tripId) setCurrentTripId(null);
    } catch (error) {
      console.error("Delete Trip Error:", error);
    }
  };

  const handleUpdateTrip = async (updatedTrip) => {
    if (!user) return;
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'trips', updatedTrip.id), updatedTrip, { merge: true });
    } catch (error) {
      console.error("Update Trip Error:", error);
    }
  };

  const enterTrip = (tripId) => {
    setCurrentTripId(tripId);
    setActiveTab('itinerary');
  };

  const activeTrip = trips.find(t => t.id === currentTripId);

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce mb-4 text-2xl">✈️</div>
        <p className="text-pink-400 font-bold tracking-widest animate-pulse text-sm">正在連線至雲端資料庫...</p>
      </div>
    );
  }

  // --- 如果發生錯誤，將直接顯示在這裡 ---
  if (authError) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-3xl">⚠️</div>
        <h2 className="text-red-500 font-bold text-xl mb-2">連線發生錯誤</h2>
        <p className="text-red-400 text-sm bg-white p-4 rounded-xl shadow-sm border border-red-100 break-all w-full max-w-md">
          {authError}
        </p>
        <p className="text-gray-500 text-xs mt-6">
          💡 請確認您是否已在 <b>src/App.js</b> 第 24 行填入正確的 <b>apiKey</b>，<br/>
          或是到 Firebase 控制台開啟 <b>Authentication (匿名登入)</b>。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center sm:p-4">
      <CustomStyles />
      <div className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] bg-white sm:rounded-[40px] relative overflow-hidden sm:shadow-2xl sm:border-[8px] border-gray-800 flex flex-col">
        
        <div className="h-6 w-full absolute top-0 left-0 z-50 flex justify-between px-6 pt-2 pointer-events-none hidden sm:flex">
          <span className="text-xs font-black text-gray-800">9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-3 bg-gray-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          {!currentTripId ? (
            <TripDashboard 
              trips={trips} 
              onSelectTrip={enterTrip} 
              onCreateTrip={handleCreateTrip} 
              onDeleteTrip={handleDeleteTrip}
            />
          ) : (
            <>
              {activeTab === 'itinerary' && <ItineraryView trip={activeTrip} updateTrip={handleUpdateTrip} />}
              {activeTab === 'expense' && <ExpenseView trip={activeTrip} updateTrip={handleUpdateTrip} />}
            </>
          )}
        </div>

        {currentTripId && (
          <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 px-6 py-4 pb-6 sm:pb-8 flex justify-around items-center z-40">
            {[
              { id: 'itinerary', icon: Calendar, label: '行程' },
              { id: 'expense', icon: CreditCard, label: '記帳' },
              { id: 'home', icon: Home, label: '旅程列表' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'home') setCurrentTripId(null);
                    else setActiveTab(tab.id);
                  }}
                  className="flex flex-col items-center gap-1.5 relative w-16 bouncy-transition bouncy-active"
                >
                  {isActive && <div className="absolute -top-1 w-12 h-12 bg-pink-100/50 rounded-full blur-md"></div>}
                  <tab.icon 
                    size={24} 
                    strokeWidth={isActive ? 3 : 2.5}
                    className={`relative z-10 bouncy-transition ${isActive ? 'text-gray-900 scale-110' : 'text-gray-300'}`}
                  />
                  <span className={`text-[10px] font-black relative z-10 bouncy-transition ${isActive ? 'text-gray-900 opacity-100' : 'text-gray-300 opacity-0 translate-y-2'}`}>
                    {tab.label}
                  </span>
                  {isActive && <div className="absolute -bottom-3 w-1.5 h-1.5 bg-gray-900 rounded-full"></div>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}