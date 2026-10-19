import Alpine from 'alpinejs'
import { createClient } from '@supabase/supabase-js'
import './style.css'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const db = url && key ? createClient(url, key) : null
const storageKey = 'impulso-personal-v1'
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const id = () => crypto.randomUUID()
const empty = () => ({ foods: [], weights: [{ id: id(), day: localDate(), kg: 84.45 }], activities: [], supplementLogs: [], settings: { restCalories: 1800, footballCalories: 2150, protein: 160, carbs: 155, fat: 60, todayMode: 'rest' } })
const safeNumber = n => Number.isFinite(Number(n)) ? Number(n) : 0
const clean = (table, item) => {
  if (table === 'foods') return { id:item.id, day:item.day, name:String(item.name).slice(0,120), meal:String(item.meal).slice(0,30), calories:safeNumber(item.calories), protein:safeNumber(item.protein), carbs:safeNumber(item.carbs), fat:safeNumber(item.fat) }
  if (table === 'weights') return { id:item.id, day:item.day, kg:safeNumber(item.kg) }
  if (table === 'activities') return { id:item.id, day:item.day, name:String(item.name).slice(0,80), minutes:safeNumber(item.minutes), notes:String(item.notes||'').slice(0,300) }
  if (table === 'supplement_logs') return { id:item.id, day:item.day, supplement_id:item.supplement_id }
  return item
}
window.fitApp = () => ({
  tabs:[{id:'inicio',name:'Mi resumen',short:'Inicio',icon:'◫'},{id:'comidas',name:'Alimentación',short:'Comidas',icon:'🥗'},{id:'peso',name:'Mi peso',short:'Peso',icon:'⚖️'},{id:'actividad',name:'Actividad física',short:'Fútbol',icon:'⚽'},{id:'ajustes',name:'Configuración',short:'Ajustes',icon:'⚙️'}],
  tab:'inicio', showFood:false, message:'', busy:false, authError:'', auth:{email:'',password:''}, configured:!!db, connected:false, userEmail:'', userId:null,
  foods:[],weights:[],activities:[],supplementLogs:[], settings:empty().settings,
  supplements:[{id:'omega3',name:'Omega-3',note:'Con una comida · verificar EPA/DHA'},{id:'creatina',name:'Creatina',note:'3–5 g al día'},{id:'zinc',name:'Zinc',note:'Confirmar dosis elemental'},{id:'magnesio',name:'Magnesio',note:'Confirmar dosis elemental'}],
  foodForm:{name:'',meal:'Desayuno',calories:0,protein:0,carbs:0,fat:0},weightForm:84.45,activityForm:{name:'Fútbol',minutes:60,notes:''},
  async init(){ this.loadLocal(); if(db){ const {data:{session}}=await db.auth.getSession(); if(session) await this.setSession(session); db.auth.onAuthStateChange((_event,session)=>{ if(!session && this.connected){this.connected=false;this.userId=null;this.userEmail='';this.loadLocal()} }); } if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{})); },
  dateKey:localDate, todayLabel(){return new Intl.DateTimeFormat('es-CL',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}, fmt(n,d=0){return Number(n||0).toLocaleString('es-CL',{minimumFractionDigits:d,maximumFractionDigits:d})},
  loadLocal(){ let data;try{data=JSON.parse(localStorage.getItem(storageKey)||'null')}catch{};data=data||empty();this.foods=Array.isArray(data.foods)?data.foods:[];this.weights=Array.isArray(data.weights)?data.weights:[];this.activities=Array.isArray(data.activities)?data.activities:[];this.supplementLogs=Array.isArray(data.supplementLogs)?data.supplementLogs:[];this.settings={...empty().settings,...data.settings} },
  persist(){if(!this.connected)localStorage.setItem(storageKey,JSON.stringify({foods:this.foods,weights:this.weights,activities:this.activities,supplementLogs:this.supplementLogs,settings:this.settings}))},
  notify(s){this.message=s;},
  todayFoods(){return this.foods.filter(f=>f.day===localDate())},todayActivities(){return this.activities.filter(a=>a.day===localDate())},
  calories(){return this.todayFoods().reduce((n,f)=>n+safeNumber(f.calories),0)},remaining(){return this.goal().calories-this.calories()},
  goal(){return {calories:this.settings.todayMode==='football'?this.settings.footballCalories:this.settings.restCalories}},
  macroCards(){return [{label:'Proteína',value:this.todayFoods().reduce((s,f)=>s+safeNumber(f.protein),0),goal:this.settings.protein,color:'bg-emerald-500'},{label:'Carbohidratos',value:this.todayFoods().reduce((s,f)=>s+safeNumber(f.carbs),0),goal:this.settings.carbs,color:'bg-sky-500'},{label:'Grasas',value:this.todayFoods().reduce((s,f)=>s+safeNumber(f.fat),0),goal:this.settings.fat,color:'bg-amber-400'}]},
  latestWeight(){return this.sortedWeights()[0]?.kg??84.45},sortedWeights(){return [...this.weights].sort((a,b)=>b.day.localeCompare(a.day))},sortedActivities(){return [...this.activities].sort((a,b)=>b.day.localeCompare(a.day))},
  loadBreakfast(){this.foodForm={name:'2 huevos + 2 tortillas Rapiditas + aceite + café',meal:'Desayuno',calories:334,protein:17.2,carbs:26, fat:16};this.notify('Desayuno precargado como estimación. Revisa las cantidades antes de guardarlo.')},
  async addFood(){const f={...this.foodForm,id:id(),day:localDate()};if(!f.name.trim()||[f.calories,f.protein,f.carbs,f.fat].some(x=>!Number.isFinite(Number(x))||x<0))return this.notify('Revisa los valores de la comida.');await this.add('foods',f);this.foodForm={name:'',meal:'Desayuno',calories:0,protein:0,carbs:0,fat:0};this.showFood=false},
  async addWeight(){const kg=safeNumber(this.weightForm);if(kg<20||kg>400)return;await this.add('weights',{id:id(),day:localDate(),kg})},
  async addActivity(){if(this.activityForm.minutes<1||this.activityForm.minutes>600)return;await this.add('activities',{...this.activityForm,id:id(),day:localDate()});this.activityForm={name:'Fútbol',minutes:60,notes:''}},
  takenToday(sid){return this.supplementLogs.some(s=>s.day===localDate()&&s.supplement_id===sid)},
  async toggleSupplement(sid){const found=this.supplementLogs.find(s=>s.day===localDate()&&s.supplement_id===sid);if(found)await this.remove('supplement_logs',found.id);else await this.add('supplement_logs',{id:id(),day:localDate(),supplement_id:sid})},
  arr(table){return table==='supplement_logs'?'supplementLogs':table},
  async add(table,item){if(this.connected){const {error}=await db.from(table).insert({...clean(table,item),user_id:this.userId});if(error){this.notify('No se pudo guardar: '+error.message);return}}this[this.arr(table)].push(item);this.persist();this.notify('Registro guardado correctamente.')},
  async remove(table,itemId){if(this.connected){const {error}=await db.from(table).delete().eq('id',itemId).eq('user_id',this.userId);if(error){this.notify('No se pudo eliminar: '+error.message);return}}this[this.arr(table)]=this[this.arr(table)].filter(x=>x.id!==itemId);this.persist()},
  async saveGoals(){if(this.settings.restCalories<1200||this.settings.footballCalories<1200)return this.notify('Revisa tus objetivos.');if(this.connected){const {error}=await db.from('profiles').upsert({user_id:this.userId,settings:this.settings});if(error)return this.notify('Error al guardar objetivos: '+error.message)}this.persist();this.notify('Objetivos actualizados.')},
  async setSession(session){this.userId=session.user.id;this.userEmail=session.user.email;this.connected=true;await this.loadRemote()},
  async loadRemote(){const results=await Promise.all(['foods','weights','activities','supplement_logs','profiles'].map(t=>db.from(t).select('*').eq('user_id',this.userId).limit(1000)));const error=results.find(x=>x.error)?.error;if(error){this.notify('Error de sincronización: '+error.message);return}this.foods=results[0].data||[];this.weights=results[1].data||[];this.activities=results[2].data||[];this.supplementLogs=results[3].data||[];this.settings={...empty().settings,...(results[4].data?.[0]?.settings||{})};},
  async signIn(){this.authError='';this.busy=true;try{const {data,error}=await db.auth.signInWithPassword({email:this.auth.email,password:this.auth.password});if(error)throw error;await this.setSession(data.session);this.notify('Sesión iniciada. Tus datos están sincronizados.')}catch(e){this.authError=e.message}finally{this.busy=false}},
  async signUp(){this.authError='';this.busy=true;try{const {data,error}=await db.auth.signUp({email:this.auth.email,password:this.auth.password});if(error)throw error;if(data.session)await this.setSession(data.session);this.notify('Cuenta creada. Si tienes confirmación por correo habilitada, revisa tu bandeja de entrada.')}catch(e){this.authError=e.message}finally{this.busy=false}},
  async signOut(){await db.auth.signOut();this.connected=false;this.userId=null;this.userEmail='';this.loadLocal();this.notify('Sesión cerrada.')},
  exportData(){const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),foods:this.foods,weights:this.weights,activities:this.activities,supplementLogs:this.supplementLogs,settings:this.settings},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`impulso-respaldo-${localDate()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),5000)}
})
window.Alpine=Alpine
Alpine.start()
