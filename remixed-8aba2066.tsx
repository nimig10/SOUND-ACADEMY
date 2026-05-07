import { useState, useEffect, useRef } from "react";

const C = {
  bg:'#080808',card:'#141414',panel:'#0c0c0c',
  y:'#FFD700',yDim:'#7a5c00',yMid:'#b38a00',
  text:'#f0f0f0',muted:'#666',dim:'#1e1e1e',
  border:'#1a1a1a',borderLit:'#2e2e2e',
  green:'#00e87a',red:'#ff3355',blue:'#44aaff',
};
const iS={width:'100%',padding:'9px 12px',background:C.panel,border:'1px solid #2e2e2e',borderRadius:7,color:'#f0f0f0',fontSize:13,outline:'none',boxSizing:'border-box',direction:'rtl'};
const lS={display:'block',fontSize:10,color:'#666',marginBottom:5,letterSpacing:.5};
const BUILT_IN_TYPES=['freq','eq','effects'];
const INIT_EX_TYPES=[
  {id:'freq',label:'זיהוי תדרים',icon:'🎵',color:'#4488ff'},
  {id:'eq',label:'אימון EQ',icon:'📈',color:'#FFD700'},
  {id:'effects',label:'אפקטים',icon:'🌀',color:'#ff44bb'},
];
const INIT_STUDENTS=[
  {id:1,name:'ינאי',assignedIds:[1,2]},
  {id:2,name:'שרה',assignedIds:[1,3]},
  {id:3,name:'דוד',assignedIds:[2,3,4]},
  {id:4,name:'שגיב אוחנה',assignedIds:[1,2,3,4]},
];
const INIT_EXERCISES=[
  {id:1,type:'freq',title:'זיהוי תדרים — בסיסי',diff:'קל',description:'זהה תדרי מרכז של צלילים מסוננים',instructions:'',audioUrl:null,audioName:null,notes:''},
  {id:2,type:'eq',title:'EQ — דחיפת בסים 80Hz',diff:'בינוני',description:'כוון את ה-EQ להתאמת הטרגט',instructions:'',audioUrl:null,audioName:null,notes:''},
  {id:3,type:'effects',title:'Reverb Hall — חדר גדול',diff:'קשה',description:'כוון פרמטרי Reverb',instructions:'',audioUrl:null,audioName:null,notes:''},
  {id:4,type:'effects',title:'Delay — Quarter Note',diff:'בינוני',description:'כוון פרמטרי Delay',instructions:'',audioUrl:null,audioName:null,notes:''},
];
const INIT_MIX_CHS=Array.from({length:16},(_,i)=>({id:i,name:i===15?'Master':'Ch '+(i+1),audioUrl:null,audioName:null}));
const DIFF_COL={קל:C.green,בינוני:C.y,קשה:C.red};

// ── Knob ──
function Knob({val,min=0,max=1,onChange,label,size=52,color=C.y}){
  const pct=(val-min)/(max-min),angle=pct*270-135,rad=(angle-90)*Math.PI/180,r=size/2-7;
  const dx=size/2+r*Math.cos(rad),dy=size/2+r*Math.sin(rad);
  const onDown=e=>{e.preventDefault();const sy=e.clientY,sv=val;const mv=m=>onChange(Math.max(min,Math.min(max,sv+(sy-m.clientY)/130*(max-min))));const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);};
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,userSelect:'none'}} onMouseDown={onDown}>
      <div style={{width:size,height:size,borderRadius:'50%',background:'radial-gradient(circle at 35% 30%,#353535,#0d0d0d)',border:'1.5px solid #303030',position:'relative',cursor:'ns-resize',boxShadow:'0 3px 8px rgba(0,0,0,.7)'}}>
        <div style={{position:'absolute',width:5,height:5,borderRadius:'50%',background:color,left:dx-2.5,top:dy-2.5,boxShadow:'0 0 6px '+color+'88'}}/>
      </div>
      <span style={{fontSize:9,color:C.muted,letterSpacing:.5,textAlign:'center',maxWidth:size+8,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{label}</span>
    </div>
  );
}

// ── Fader ──
function Fader({val,onChange,ht=120}){
  const ref=useRef();
  const onDown=e=>{e.preventDefault();const mv=m=>{const rc=ref.current.getBoundingClientRect();onChange(Math.max(0,Math.min(1,1-(m.clientY-rc.top)/rc.height)));};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);};
  return(
    <div ref={ref} onMouseDown={onDown} style={{width:20,height:ht,background:'#0a0a0a',borderRadius:10,border:'1px solid #2a2a2a',position:'relative',cursor:'pointer',flexShrink:0}}>
      <div style={{position:'absolute',left:'50%',top:8,bottom:8,width:2,background:'#1e1e1e',transform:'translateX(-50%)'}}/>
      <div style={{position:'absolute',left:'50%',top:(1-val)*(ht-22),width:28,height:22,background:'linear-gradient(180deg,#454545,#1c1c1c)',border:'1.5px solid '+C.y+'55',borderRadius:4,transform:'translateX(-50%)'}}/>
    </div>
  );
}

// ── VU ──
function VU({level}){
  return(
    <div style={{display:'flex',flexDirection:'column-reverse',gap:1.5,height:76}}>
      {Array.from({length:14},(_,i)=>{const on=level>i/14,col=i>11?C.red:i>9?C.y:C.green;return <div key={i} style={{flex:1,background:on?col:'#111',borderRadius:1,transition:'background 55ms'}}/>;}) }
    </div>
  );
}

// ── LoginScreen ──
function LoginScreen({students,onLogin}){
  const [role,setRole]=useState(null);
  const [studentId,setStudentId]=useState('');
  const [adminName,setAdminName]=useState('');
  const canLogin=role==='admin'?!!adminName:!!studentId;
  const doLogin=()=>{if(role==='admin')onLogin({name:adminName,role:'admin'});else{const s=students.find(x=>x.id===+studentId);if(s)onLogin({name:s.name,role:'student',studentId:s.id});}};
  return(
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -20%,#1f1600,'+C.bg+' 55%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Segoe UI',Arial,sans-serif",direction:'rtl'}}>
      <div style={{width:380,padding:'44px 38px',background:C.card,borderRadius:20,border:'1px solid '+C.borderLit,boxShadow:'0 24px 80px rgba(0,0,0,.95)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:10}}>🎚️</div>
          <div style={{fontSize:24,fontWeight:900,color:C.y,letterSpacing:4,fontFamily:'monospace'}}>SOUND ACADEMY</div>
          <div style={{width:44,height:2,background:C.y,margin:'12px auto',borderRadius:1}}/>
          <div style={{fontSize:11,color:C.muted,letterSpacing:2}}>מרכז האימון לסאונד</div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={lS}>כניסה כ</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{r:'student',l:'🎧 תלמיד'},{r:'admin',l:'⚙️ מנהל'}].map(({r,l})=>(
              <button key={r} onClick={()=>{setRole(r);setStudentId('');setAdminName('');}}
                style={{padding:'12px',background:role===r?C.y:C.panel,color:role===r?'#000':C.muted,border:'1px solid '+(role===r?C.y:C.border),borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:14}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {role==='student'&&<div style={{marginBottom:22}}><label style={lS}>בחר תלמיד</label><select value={studentId} onChange={e=>setStudentId(e.target.value)} style={{...iS,cursor:'pointer'}}><option value="">— בחר מהרשימה —</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.assignedIds.length} תרגילים)</option>)}</select></div>}
        {role==='admin'&&<div style={{marginBottom:22}}><label style={lS}>שם מנהל</label><input value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="הכנס שמך..." style={iS}/></div>}
        {!role&&<div style={{height:22,marginBottom:22}}/>}
        <button onClick={doLogin} disabled={!canLogin} style={{width:'100%',padding:14,background:canLogin?C.y:C.yDim,color:'#000',border:'none',borderRadius:8,fontWeight:900,fontSize:15,cursor:canLogin?'pointer':'not-allowed',letterSpacing:1.5}}>כניסה למערכת ›</button>
      </div>
    </div>
  );
}

// ── ExerciseModal ──
function ExerciseModal({exercise,onSave,onClose,exTypes,setExTypes}){
  const def={title:'',type:exTypes[0]?.id||'freq',diff:'קל',description:'',instructions:'',audioUrl:null,audioName:null,notes:''};
  const [form,setForm]=useState(exercise||def);
  const [ntOpen,setNtOpen]=useState(false);
  const [nt,setNt]=useState({label:'',icon:'🎯',color:'#44aaff'});
  const f=(k,v)=>setForm(x=>({...x,[k]:v}));
  const addType=()=>{if(!nt.label)return;const id='t_'+Date.now();setExTypes(t=>[...t,{id,label:nt.label,icon:nt.icon,color:nt.color}]);f('type',id);setNtOpen(false);setNt({label:'',icon:'🎯',color:'#44aaff'});};
  const handleAudio=file=>{if(!file)return;const url=URL.createObjectURL(file);setForm(x=>({...x,audioUrl:url,audioName:file.name}));};
  const curType=exTypes.find(t=>t.id===form.type);
  const isCustom=!BUILT_IN_TYPES.includes(form.type);
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
      <div style={{width:580,maxHeight:'90vh',overflowY:'auto',background:C.card,borderRadius:16,border:'1px solid '+C.borderLit,padding:28,direction:'rtl',boxShadow:'0 32px 80px rgba(0,0,0,.9)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h2 style={{margin:0,color:C.y,fontSize:18,fontWeight:900}}>{exercise?'✏️ עריכת תרגיל':'+ תרגיל חדש'}</h2>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid '+C.borderLit,color:C.muted,fontSize:16,cursor:'pointer',borderRadius:6,padding:'4px 10px'}}>✕</button>
        </div>
        <div style={{marginBottom:14}}><label style={lS}>שם התרגיל *</label><input value={form.title} onChange={e=>f('title',e.target.value)} style={iS} placeholder="לדוגמה: זיהוי 1kHz"/></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div>
            <label style={lS}>סוג תרגיל</label>
            <div style={{display:'flex',gap:6}}>
              <select value={form.type} onChange={e=>f('type',e.target.value)} style={{...iS,flex:1}}>
                {exTypes.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              <button onClick={()=>setNtOpen(!ntOpen)} style={{padding:'0 12px',background:ntOpen?C.y+'22':C.panel,color:ntOpen?C.y:C.muted,border:'1px solid '+(ntOpen?C.y:C.borderLit),borderRadius:7,cursor:'pointer',fontSize:18,flexShrink:0}}>+</button>
            </div>
          </div>
          <div><label style={lS}>רמת קושי</label><select value={form.diff} onChange={e=>f('diff',e.target.value)} style={iS}><option>קל</option><option>בינוני</option><option>קשה</option></select></div>
        </div>
        {ntOpen&&(
          <div style={{marginBottom:14,padding:14,background:C.panel,borderRadius:8,border:'1px dashed '+C.y+'44'}}>
            <div style={{fontSize:12,color:C.y,fontWeight:700,marginBottom:10}}>🆕 הוספת סוג חדש</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 58px 52px auto',gap:8,alignItems:'flex-end'}}>
              <div><label style={lS}>שם הסוג</label><input value={nt.label} onChange={e=>setNt(n=>({...n,label:e.target.value}))} style={iS} placeholder="שם..."/></div>
              <div><label style={lS}>אייקון</label><input value={nt.icon} onChange={e=>setNt(n=>({...n,icon:e.target.value}))} style={{...iS,textAlign:'center',fontSize:18}}/></div>
              <div><label style={lS}>צבע</label><input type="color" value={nt.color} onChange={e=>setNt(n=>({...n,color:e.target.value}))} style={{width:'100%',height:38,border:'1px solid '+C.borderLit,borderRadius:7,cursor:'pointer',background:'transparent',padding:2}}/></div>
              <button onClick={addType} style={{padding:'9px 14px',background:C.y,color:'#000',border:'none',borderRadius:7,fontWeight:800,cursor:'pointer',fontSize:13,height:38,flexShrink:0}}>צור</button>
            </div>
          </div>
        )}
        {curType&&(
          <div style={{marginBottom:14,display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:curType.color+'14',border:'1px solid '+curType.color+'44',borderRadius:7}}>
            <span style={{fontSize:18}}>{curType.icon}</span>
            <span style={{fontSize:12,color:curType.color,fontWeight:700}}>{curType.label}</span>
            {isCustom&&<span style={{fontSize:10,color:C.muted,marginRight:'auto'}}>* תרגיל חופשי — התלמיד יקרא הוראות ויסמן ידנית</span>}
          </div>
        )}
        <div style={{marginBottom:12}}><label style={lS}>תיאור קצר</label><input value={form.description||''} onChange={e=>f('description',e.target.value)} style={iS} placeholder="תיאור קצר..."/></div>
        <div style={{marginBottom:12}}><label style={lS}>הוראות לתלמיד</label><textarea value={form.instructions||''} onChange={e=>f('instructions',e.target.value)} style={{...iS,height:80,resize:'vertical'}} placeholder="הסבר מפורט..."/></div>
        <div style={{marginBottom:12}}>
          <label style={lS}>קובץ אודיו</label>
          {form.audioName?(
            <div style={{display:'flex',gap:8,alignItems:'center',padding:'9px 12px',background:C.panel,border:'1px solid '+C.green+'44',borderRadius:7}}>
              <span style={{fontSize:16}}>🎵</span>
              <span style={{flex:1,fontSize:12,color:C.green,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{form.audioName}</span>
              <button onClick={()=>setForm(x=>({...x,audioUrl:null,audioName:null}))} style={{color:C.red,background:'transparent',border:'1px solid '+C.red,borderRadius:4,cursor:'pointer',fontSize:11,padding:'2px 7px'}}>הסר</button>
            </div>
          ):(
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:C.panel,border:'1px dashed '+C.borderLit,borderRadius:7,cursor:'pointer',color:C.muted,fontSize:12}}>
              📁 לחץ לבחירת קובץ אודיו
              <input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>handleAudio(e.target.files[0])}/>
            </label>
          )}
        </div>
        <div style={{marginBottom:22}}><label style={lS}>הערות פנימיות</label><textarea value={form.notes||''} onChange={e=>f('notes',e.target.value)} style={{...iS,height:52,resize:'vertical'}} placeholder="הערות למנהל בלבד..."/></div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>form.title&&onSave(form)} disabled={!form.title} style={{flex:1,padding:12,background:form.title?C.y:C.yDim,color:'#000',border:'none',borderRadius:8,fontWeight:900,fontSize:14,cursor:form.title?'pointer':'not-allowed'}}>{exercise?'עדכן תרגיל':'+ הוסף תרגיל'}</button>
          <button onClick={onClose} style={{padding:'12px 20px',background:'transparent',color:C.muted,border:'1px solid '+C.borderLit,borderRadius:8,cursor:'pointer',fontSize:13}}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── ExercisePreviewModal ──
function ExercisePreviewModal({exercise,exTypes,onClose}){
  const type=exTypes.find(t=>t.id===exercise.type)||{icon:'📝',label:'תרגיל',color:C.muted};
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.93)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:16,overflowY:'auto'}}>
      <div style={{width:'min(780px,100%)',background:C.bg,borderRadius:18,border:'2px solid '+type.color+'55',direction:'rtl',boxShadow:'0 32px 80px rgba(0,0,0,.95)',display:'flex',flexDirection:'column',maxHeight:'94vh'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid '+C.dim,display:'flex',alignItems:'center',gap:12,background:C.card,borderRadius:'16px 16px 0 0',flexShrink:0}}>
          <div style={{width:38,height:38,background:type.color+'20',border:'1px solid '+type.color+'55',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{type.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,color:C.text,fontSize:15}}>{exercise.title}</div>
            <div style={{display:'flex',gap:6,marginTop:3,flexWrap:'wrap'}}>
              <span style={{fontSize:10,color:type.color,background:type.color+'18',padding:'2px 8px',borderRadius:7,border:'1px solid '+type.color+'44'}}>{type.label}</span>
              <span style={{fontSize:10,color:DIFF_COL[exercise.diff]||C.muted,background:(DIFF_COL[exercise.diff]||C.muted)+'18',padding:'2px 8px',borderRadius:7}}>{exercise.diff}</span>
            </div>
          </div>
          <div style={{padding:'4px 12px',background:type.color+'18',border:'1px solid '+type.color+'44',borderRadius:6,fontSize:10,color:type.color,fontWeight:700,letterSpacing:1}}>PREVIEW</div>
          <button onClick={onClose} style={{background:'transparent',border:'1px solid '+C.borderLit,color:C.muted,fontSize:16,cursor:'pointer',borderRadius:6,padding:'4px 10px',flexShrink:0}}>✕</button>
        </div>
        <div style={{overflowY:'auto',padding:'22px 24px',flex:1}}>
          {exercise.type==='freq'&&<FreqTrain onComplete={()=>{}}/>}
          {exercise.type==='eq'&&<EQTrain onComplete={()=>{}}/>}
          {exercise.type==='effects'&&<FXTrain onComplete={()=>{}}/>}
          {!BUILT_IN_TYPES.includes(exercise.type)&&<GenericExercise exercise={exercise} exTypes={exTypes} onComplete={()=>{}}/>}
          {exercise.notes&&(
            <div style={{marginTop:22,padding:'10px 14px',background:'rgba(255,51,85,.06)',border:'1px solid rgba(255,51,85,.2)',borderRadius:7}}>
              <div style={{fontSize:10,color:C.red,marginBottom:4,letterSpacing:.5}}>🔒 הערות פנימיות (מנהל בלבד)</div>
              <div style={{fontSize:12,color:'#cc6677'}}>{exercise.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ExerciseManager ──
function ExerciseManager({exercises,setExercises,exTypes,setExTypes}){
  const [modal,setModal]=useState(null);
  const [preview,setPreview]=useState(null);
  const save=form=>{
    if(modal==='new')setExercises(e=>[...e,{...form,id:Date.now()}]);
    else setExercises(e=>e.map(x=>x.id===modal.id?{...x,...form}:x));
    setModal(null);
  };
  const getT=id=>exTypes.find(t=>t.id===id)||{icon:'📝',label:'תרגיל',color:C.muted};
  return(
    <div>
      {modal&&<ExerciseModal exercise={modal==='new'?null:modal} onSave={save} onClose={()=>setModal(null)} exTypes={exTypes} setExTypes={setExTypes}/>}
      {preview&&<ExercisePreviewModal exercise={preview} exTypes={exTypes} onClose={()=>setPreview(null)}/>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,color:C.y,fontSize:13}}>{'📋 תרגילים ('+exercises.length+')'}</div>
        <button onClick={()=>setModal('new')} style={{padding:'9px 20px',background:C.y,color:'#000',border:'none',borderRadius:8,fontWeight:800,cursor:'pointer',fontSize:13}}>+ תרגיל חדש</button>
      </div>
      {exercises.length===0&&<div style={{background:C.card,padding:32,borderRadius:10,border:'1px solid '+C.borderLit,textAlign:'center',color:C.muted}}>אין תרגילים עדיין</div>}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {exercises.map(ex=>{
          const t=getT(ex.type);
          return(
            <div key={ex.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:C.card,borderRadius:10,border:'1px solid '+C.borderLit}}>
              <div style={{width:36,height:36,background:t.color+'18',border:'1px solid '+t.color+'44',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>{ex.title}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                  <span style={{color:t.color}}>{t.label}</span>{' · '}<span style={{color:DIFF_COL[ex.diff]||C.muted}}>{ex.diff}</span>
                  {ex.description&&(' · '+ex.description.slice(0,36)+(ex.description.length>36?'...':''))}
                  {ex.audioName&&<span style={{color:C.green}}> · 🎵</span>}
                </div>
              </div>
              <button onClick={()=>setPreview(ex)} style={{padding:'5px 12px',background:t.color+'14',color:t.color,border:'1px solid '+t.color+'55',borderRadius:6,cursor:'pointer',fontSize:12,flexShrink:0,fontWeight:700}}>👁 הצג</button>
              <button onClick={()=>setModal(ex)} style={{padding:'5px 12px',background:'transparent',color:C.blue,border:'1px solid '+C.blue,borderRadius:6,cursor:'pointer',fontSize:12,flexShrink:0}}>עריכה</button>
              <button onClick={()=>setExercises(e=>e.filter(x=>x.id!==ex.id))} style={{padding:'5px 10px',background:'transparent',color:C.red,border:'1px solid '+C.red,borderRadius:6,cursor:'pointer',fontSize:12,flexShrink:0}}>מחק</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── TypeManager ──
function TypeManager({exTypes,setExTypes}){
  return(
    <div>
      <div style={{fontWeight:700,color:C.y,marginBottom:8,fontSize:13}}>🏷️ סוגי תרגילים</div>
      <p style={{color:C.muted,fontSize:12,marginBottom:16}}>להוספת סוג חדש — לחץ + ליד בחירת הסוג בעת יצירת תרגיל.</p>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {exTypes.map(t=>{
          const isB=BUILT_IN_TYPES.includes(t.id);
          return(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',background:C.card,borderRadius:8,border:'1px solid '+t.color+'33'}}>
              <div style={{width:36,height:36,borderRadius:8,background:t.color+'20',border:'1px solid '+t.color+'55',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{t.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>{t.label}</div>
                <div style={{fontSize:10,color:isB?C.blue:C.green,marginTop:2}}>{isB?'מובנה':'מותאם אישית'}</div>
              </div>
              <div style={{width:14,height:14,borderRadius:'50%',background:t.color,flexShrink:0}}/>
              {!isB&&<button onClick={()=>setExTypes(x=>x.filter(e=>e.id!==t.id))} style={{padding:'4px 10px',background:'transparent',color:C.red,border:'1px solid '+C.red,borderRadius:5,cursor:'pointer',fontSize:11,flexShrink:0}}>מחק</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MixerSetup ──
function MixerSetup({channels,setChannels}){
  const handleFile=(idx,file)=>{if(!file)return;const url=URL.createObjectURL(file);setChannels(c=>c.map((x,i)=>i===idx?{...x,audioUrl:url,audioName:file.name}:x));};
  const clear=idx=>setChannels(c=>c.map((x,i)=>{if(i!==idx)return x;if(x.audioUrl)URL.revokeObjectURL(x.audioUrl);return{...x,audioUrl:null,audioName:null};}));
  const rename=(idx,name)=>setChannels(c=>c.map((x,i)=>i===idx?{...x,name}:x));
  const loaded=channels.filter(c=>c.audioUrl).length;
  return(
    <div>
      <div style={{fontWeight:700,color:C.y,marginBottom:4,fontSize:13}}>🎚️ הגדרת ערוצי מיקסר — 16 ערוצים</div>
      <p style={{color:C.muted,fontSize:12,marginBottom:16}}>{loaded+' מתוך 16 ערוצים טעונים עם אודיו'}</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {channels.map((ch,i)=>(
          <div key={i} style={{background:C.card,padding:12,borderRadius:8,border:'1px solid '+(i===15?C.yDim:C.borderLit)}}>
            <div style={{fontSize:10,color:i===15?C.y:C.muted,marginBottom:5,fontWeight:700}}>{'ערוץ '+(i+1)}</div>
            <input value={ch.name} onChange={e=>rename(i,e.target.value)} style={{...iS,marginBottom:8,fontSize:12,padding:'6px 8px'}} placeholder={'Ch '+(i+1)}/>
            {ch.audioName?(
              <div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 8px',background:C.panel,borderRadius:5,border:'1px solid '+C.green+'44'}}>
                <span style={{fontSize:9,color:C.green,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ch.audioName}</span>
                <button onClick={()=>clear(i)} style={{color:C.red,background:'transparent',border:'none',cursor:'pointer',fontSize:12,flexShrink:0}}>✕</button>
              </div>
            ):(
              <label style={{display:'block',padding:'7px 0',background:C.panel,border:'1px dashed '+C.borderLit,borderRadius:5,cursor:'pointer',textAlign:'center',fontSize:10,color:C.muted}}>
                + העלה אודיו
                <input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>handleFile(i,e.target.files[0])}/>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── UserManager ──
function UserManager({students,setStudents,exercises,exTypes}){
  const [newName,setNewName]=useState('');
  const [expandedId,setExpandedId]=useState(null);
  const add=()=>{if(!newName.trim())return;setStudents(s=>[...s,{id:Date.now(),name:newName.trim(),assignedIds:[]}]);setNewName('');};
  const rm=id=>setStudents(s=>s.filter(x=>x.id!==id));
  const toggle=(sId,eId)=>setStudents(s=>s.map(st=>{if(st.id!==sId)return st;const has=st.assignedIds.includes(eId);return{...st,assignedIds:has?st.assignedIds.filter(x=>x!==eId):[...st.assignedIds,eId]};}));
  const getT=id=>exTypes.find(t=>t.id===id)||{icon:'📝',color:C.muted};
  return(
    <div>
      <div style={{display:'flex',gap:10,marginBottom:20}}>
        <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="שם תלמיד חדש..." onKeyDown={e=>e.key==='Enter'&&add()} style={{...iS,flex:1}}/>
        <button onClick={add} style={{padding:'9px 20px',background:C.y,color:'#000',border:'none',borderRadius:8,fontWeight:800,cursor:'pointer',fontSize:13}}>+ הוסף</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {students.map(st=>{
          const isExp=expandedId===st.id;
          return(
            <div key={st.id} style={{background:C.card,borderRadius:10,border:'1px solid '+(isExp?C.y+'44':C.borderLit),overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:C.y+'22',border:'1px solid '+C.y+'44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:C.y,flexShrink:0}}>{st.name.charAt(0)}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,color:C.text,fontSize:14}}>{st.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{st.assignedIds.length+' תרגילים מוקצים'}</div></div>
                <button onClick={()=>setExpandedId(isExp?null:st.id)} style={{padding:'6px 14px',background:isExp?C.y+'22':'transparent',color:isExp?C.y:C.muted,border:'1px solid '+(isExp?C.y:C.borderLit),borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:700}}>{isExp?'▲ סגור':'▼ הקצה'}</button>
                <button onClick={()=>rm(st.id)} style={{padding:'6px 12px',background:'transparent',color:C.red,border:'1px solid '+C.red,borderRadius:7,cursor:'pointer',fontSize:12}}>מחק</button>
              </div>
              {isExp&&(
                <div style={{borderTop:'1px solid '+C.dim,padding:'14px 16px',background:C.panel}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:10}}>בחר תרגילים:</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
                    {exercises.map(ex=>{const checked=st.assignedIds.includes(ex.id);const t=getT(ex.type);return(
                      <div key={ex.id} onClick={()=>toggle(st.id,ex.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:checked?t.color+'14':C.card,border:'1px solid '+(checked?t.color+'55':C.borderLit),borderRadius:8,cursor:'pointer'}}>
                        <div style={{width:18,height:18,borderRadius:4,background:checked?t.color:C.dim,border:'1px solid '+(checked?t.color:C.borderLit),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0,color:'#000',fontWeight:900}}>{checked&&'✓'}</div>
                        <div><div style={{fontSize:12,fontWeight:700,color:C.text}}>{ex.title}</div><div style={{fontSize:10,color:t.color||C.muted}}>{ex.diff}</div></div>
                      </div>
                    );})}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AdminPanel ──
function AdminPanel({exercises,setExercises,students,setStudents,exTypes,setExTypes,mixerChs,setMixerChs}){
  const [tab,setTab]=useState('users');
  return(
    <div>
      <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>⚙️ ניהול</h1>
      <div style={{display:'flex',gap:6,marginBottom:22,flexWrap:'wrap'}}>
        {[{id:'users',l:'👥 משתמשים'},{id:'exercises',l:'📋 תרגילים'},{id:'types',l:'🏷️ סוגים'},{id:'mixer',l:'🎚️ הגדרת מיקסר'}].map(({id,l})=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'9px 18px',background:tab===id?C.y:C.card,color:tab===id?'#000':C.muted,border:'1px solid '+(tab===id?C.y:C.borderLit),borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13}}>{l}</button>
        ))}
      </div>
      {tab==='users'&&<UserManager students={students} setStudents={setStudents} exercises={exercises} exTypes={exTypes}/>}
      {tab==='exercises'&&<ExerciseManager exercises={exercises} setExercises={setExercises} exTypes={exTypes} setExTypes={setExTypes}/>}
      {tab==='types'&&<TypeManager exTypes={exTypes} setExTypes={setExTypes}/>}
      {tab==='mixer'&&<MixerSetup channels={mixerChs} setChannels={setMixerChs}/>}
    </div>
  );
}

// ── AdminDashboard ──
function AdminDashboard({students,exercises,exTypes}){
  const total=students.reduce((a,s)=>a+s.assignedIds.length,0);
  return(
    <div>
      <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>📊 דשבורד</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:22}}>
        {[{l:'תלמידים',v:students.length,i:'👥'},{l:'תרגילים',v:exercises.length,i:'📋'},{l:'הקצאות',v:total,i:'🔗'}].map(({l,v,i})=>(
          <div key={l} style={{background:C.card,padding:18,borderRadius:10,border:'1px solid '+C.borderLit}}>
            <div style={{fontSize:20}}>{i}</div><div style={{fontSize:26,fontWeight:900,color:C.y,margin:'7px 0 3px'}}>{v}</div>
            <div style={{fontSize:11,color:C.muted}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.card,borderRadius:12,border:'1px solid '+C.borderLit,overflow:'hidden'}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid '+C.dim,fontWeight:700,color:C.y,fontSize:13}}>תלמידים</div>
        {students.map(st=>{
          const exNames=exercises.filter(e=>st.assignedIds.includes(e.id)).map(e=>e.title);
          return(
            <div key={st.id} style={{padding:'12px 16px',borderBottom:'1px solid '+C.dim,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:C.y+'22',border:'1px solid '+C.y+'44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:C.y,flexShrink:0}}>{st.name.charAt(0)}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,color:C.text,fontSize:13}}>{st.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{exNames.length?exNames.join(' · '):'אין תרגילים מוקצים'}</div></div>
              <span style={{fontSize:11,color:C.y,background:C.y+'18',padding:'3px 10px',borderRadius:8,flexShrink:0}}>{st.assignedIds.length+' תרגילים'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FreqTrain ──
const FREQS=[63,125,250,500,1000,2000,4000,8000,16000];
const FLAB=['63Hz','125Hz','250Hz','500Hz','1kHz','2kHz','4kHz','8kHz','16kHz'];
function FreqTrain({onComplete}){
  const [phase,setPhase]=useState('idle');const [target,setTarget]=useState(null);const [choices,setChoices]=useState([]);const [sel,setSel]=useState(null);const [hist,setHist]=useState([]);
  const actx=useRef(null);
  const getCtx=()=>{if(!actx.current)actx.current=new(window.AudioContext||window.webkitAudioContext)();if(actx.current.state==='suspended')actx.current.resume();return actx.current;};
  const play=freq=>{const ctx=getCtx();const buf=ctx.createBuffer(1,ctx.sampleRate*1.5,ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=ctx.createBufferSource();src.buffer=buf;const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq;bp.Q.value=6;const g=ctx.createGain();g.gain.setValueAtTime(0,ctx.currentTime);g.gain.linearRampToValueAtTime(.55,ctx.currentTime+.05);g.gain.linearRampToValueAtTime(.55,ctx.currentTime+1.2);g.gain.linearRampToValueAtTime(0,ctx.currentTime+1.5);src.connect(bp);bp.connect(g);g.connect(ctx.destination);src.start();src.stop(ctx.currentTime+1.5);};
  const newRound=()=>{const idx=Math.floor(Math.random()*FREQS.length);const t=FREQS[idx];const oth=FREQS.filter((_,i)=>i!==idx).sort(()=>Math.random()-.5).slice(0,3);setTarget(t);setChoices([...oth,t].sort(()=>Math.random()-.5));setSel(null);setPhase('playing');play(t);};
  const answer=f=>{if(phase!=='playing')return;setSel(f);setPhase('answered');const ok=f===target;setHist(h=>[...h,{target,sel:f,ok}]);if(ok&&onComplete)onComplete(100);};
  const pct=hist.length?Math.round(hist.filter(h=>h.ok).length/hist.length*100):null;
  return(
    <div>
      <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>🎵 זיהוי תדרים</h1>
      <p style={{color:C.muted,margin:'0 0 22px',fontSize:13}}>האזן לצליל מסונן וזהה את תדר המרכז</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 220px',gap:18}}>
        <div style={{background:C.card,padding:26,borderRadius:12,border:'1px solid '+C.borderLit}}>
          {phase==='idle'&&<div style={{textAlign:'center',padding:'44px 0'}}><div style={{fontSize:46,marginBottom:14}}>🎧</div><button onClick={newRound} style={{padding:'13px 44px',background:C.y,color:'#000',border:'none',borderRadius:8,fontWeight:900,fontSize:15,cursor:'pointer'}}>▶ השמע צליל</button></div>}
          {(phase==='playing'||phase==='answered')&&(<>
            <div style={{display:'flex',gap:10,marginBottom:22}}>
              <button onClick={()=>play(target)} style={{padding:'9px 20px',background:'transparent',color:C.y,border:'2px solid '+C.y,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 שמע שוב</button>
              {phase==='answered'&&<button onClick={newRound} style={{padding:'9px 20px',background:C.y,color:'#000',border:'none',borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>הבא ›</button>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {choices.map(f=>{const isT=f===target,isS=f===sel;let bg=C.panel,bc=C.borderLit,col=C.text;if(phase==='answered'){if(isT){bg='rgba(0,232,122,.12)';bc=C.green;col=C.green;}else if(isS){bg='rgba(255,51,85,.12)';bc=C.red;col=C.red;}}return <button key={f} onClick={()=>answer(f)} disabled={phase==='answered'} style={{padding:'15px',background:bg,color:col,border:'2px solid '+bc,borderRadius:9,cursor:phase==='playing'?'pointer':'default',fontSize:16,fontWeight:700}}>{FLAB[FREQS.indexOf(f)]}</button>;})}
            </div>
            {phase==='answered'&&<div style={{marginTop:16,padding:13,background:sel===target?'rgba(0,232,122,.08)':'rgba(255,51,85,.08)',border:'1px solid '+(sel===target?C.green:C.red),borderRadius:8,textAlign:'center',color:sel===target?C.green:C.red,fontWeight:700,fontSize:14}}>{sel===target?'✅ נכון!':'❌ שגוי — התדר היה '+FLAB[FREQS.indexOf(target)]}</div>}
          </>)}
        </div>
        <div style={{background:C.card,padding:20,borderRadius:12,border:'1px solid '+C.borderLit}}>
          <div style={{fontWeight:700,color:C.y,marginBottom:12,fontSize:13}}>📊 סטטיסטיקות</div>
          <div style={{fontSize:32,fontWeight:900,color:pct!=null?C.y:C.muted}}>{pct!=null?pct+'%':'—'}</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:16}}>דיוק כולל</div>
          {[{l:'נכון',v:hist.filter(h=>h.ok).length,c:C.green},{l:'שגוי',v:hist.filter(h=>!h.ok).length,c:C.red}].map(({l,v,c})=>(<div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13,color:C.muted,marginBottom:6}}><span>{l}</span><span style={{color:c,fontWeight:700}}>{v}</span></div>))}
          <div style={{borderTop:'1px solid '+C.dim,paddingTop:14,marginTop:8,display:'flex',flexWrap:'wrap',gap:5}}>
            {hist.slice(-12).reverse().map((h,i)=>(<div key={i} style={{width:24,height:24,borderRadius:5,background:h.ok?'rgba(0,232,122,.15)':'rgba(255,51,85,.15)',border:'1px solid '+(h.ok?C.green:C.red),display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:h.ok?C.green:C.red}}>{h.ok?'✓':'✗'}</div>))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EQTrain ──
const EQ_TR_BANDS=[{f:80,l:'80Hz'},{f:200,l:'200Hz'},{f:500,l:'500Hz'},{f:1000,l:'1kHz'},{f:2500,l:'2.5k'},{f:5000,l:'5kHz'},{f:10000,l:'10kHz'},{f:16000,l:'16kHz'}];
function EQTrain({onComplete}){
  const [tgt,setTgt]=useState(EQ_TR_BANDS.map(()=>0));const [usr,setUsr]=useState(EQ_TR_BANDS.map(()=>0));const [phase,setPhase]=useState('idle');const [res,setRes]=useState(null);
  const actx=useRef(null);const srcRef=useRef(null);
  const getCtx=()=>{if(!actx.current)actx.current=new(window.AudioContext||window.webkitAudioContext)();if(actx.current.state==='suspended')actx.current.resume();return actx.current;};
  const stop=()=>{try{srcRef.current?.stop();}catch(e){}srcRef.current=null;};
  const playEQ=bands=>{stop();const ctx=getCtx();const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.22;const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;let prev=src;EQ_TR_BANDS.forEach((b,i)=>{const f=ctx.createBiquadFilter();f.type='peaking';f.frequency.value=b.f;f.Q.value=1.4;f.gain.value=bands[i];prev.connect(f);prev=f;});const g=ctx.createGain();g.gain.value=.55;prev.connect(g);g.connect(ctx.destination);src.start();srcRef.current=src;};
  const newRound=()=>{const t=EQ_TR_BANDS.map(()=>Math.random()>.45?(Math.random()*18-9):0);setTgt(t);setUsr(EQ_TR_BANDS.map(()=>0));setPhase('ready');setRes(null);setTimeout(()=>playEQ(t),100);};
  const submit=()=>{stop();const diffs=tgt.map((t,i)=>Math.abs(t-usr[i]));const sc=Math.max(0,Math.round(100-diffs.reduce((a,b)=>a+b,0)/diffs.length*5));setRes(sc);setPhase('done');if(onComplete)onComplete(sc);};
  useEffect(()=>()=>stop(),[]);
  const W=460,H=130,toY=g=>H/2-(g/12)*(H/2-12),toX=i=>24+(i/(EQ_TR_BANDS.length-1))*(W-48);
  return(
    <div>
      <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>📈 אימון EQ</h1>
      <p style={{color:C.muted,margin:'0 0 22px',fontSize:13}}>האזן לטרגט וכוון את ה-EQ להתאמה</p>
      <div style={{background:C.card,padding:24,borderRadius:12,border:'1px solid '+C.borderLit}}>
        <svg width="100%" viewBox={'0 0 '+W+' '+H} style={{background:'#090909',borderRadius:8,border:'1px solid '+C.dim,marginBottom:18,display:'block'}}>
          {[-12,-6,0,6,12].map(g=><line key={g} x1="0" y1={toY(g)} x2={W} y2={toY(g)} stroke={g===0?C.borderLit:C.border} strokeWidth={g===0?1.5:1}/>)}
          {EQ_TR_BANDS.map((_,i)=><line key={i} x1={toX(i)} y1="0" x2={toX(i)} y2={H} stroke={C.border} strokeWidth="1"/>)}
          {EQ_TR_BANDS.map((b,i)=><text key={i} x={toX(i)} y={H-4} textAnchor="middle" fill={C.muted} fontSize="8">{b.l}</text>)}
          {phase!=='idle'&&<path d={'M '+tgt.map((g,i)=>toX(i)+','+toY(g)).join(' L ')} fill="none" stroke="rgba(255,215,0,.55)" strokeWidth="2" strokeDasharray="6,4"/>}
          <path d={'M '+usr.map((g,i)=>toX(i)+','+toY(g)).join(' L ')} fill="none" stroke={C.blue} strokeWidth="2.5"/>
        </svg>
        <div style={{display:'grid',gridTemplateColumns:'repeat('+EQ_TR_BANDS.length+',1fr)',gap:4,marginBottom:20}}>
          {EQ_TR_BANDS.map((b,i)=>(<div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}><span style={{fontSize:9,color:C.blue,height:14}}>{usr[i]>0?'+':''}{usr[i].toFixed(1)}</span><div style={{position:'relative',width:24,height:76}}><input type="range" min="-12" max="12" step=".5" value={usr[i]} onChange={e=>{const v=parseFloat(e.target.value);setUsr(u=>{const n=[...u];n[i]=v;return n;})}} style={{position:'absolute',width:76,height:24,top:'50%',left:'50%',transform:'translate(-50%,-50%) rotate(-90deg)',accentColor:C.blue,cursor:'pointer'}}/></div><span style={{fontSize:8,color:C.muted}}>{b.l}</span></div>))}
        </div>
        <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
          <button onClick={newRound} style={{padding:'9px 20px',background:C.y,color:'#000',border:'none',borderRadius:7,fontWeight:800,cursor:'pointer',fontSize:13}}>🎲 תרגיל חדש</button>
          <button onClick={()=>phase!=='idle'&&playEQ(tgt)} disabled={phase==='idle'} style={{padding:'9px 18px',background:'transparent',color:phase==='idle'?C.dim:C.y,border:'2px solid '+(phase==='idle'?C.dim:C.y),borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 טרגט</button>
          <button onClick={()=>phase!=='idle'&&playEQ(usr)} disabled={phase==='idle'} style={{padding:'9px 18px',background:'transparent',color:phase==='idle'?C.dim:C.blue,border:'2px solid '+(phase==='idle'?C.dim:C.blue),borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 שלי</button>
          <button onClick={submit} disabled={phase==='idle'||phase==='done'} style={{padding:'9px 18px',background:phase==='idle'||phase==='done'?C.yDim:C.green,color:'#000',border:'none',borderRadius:7,fontWeight:800,cursor:'pointer',fontSize:13}}>✓ בדוק</button>
          <button onClick={stop} style={{padding:'9px 14px',background:'transparent',color:C.red,border:'2px solid '+C.red,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>■</button>
        </div>
        {res!=null&&<div style={{marginTop:16,padding:16,background:res>70?'rgba(0,232,122,.08)':'rgba(255,215,0,.08)',border:'1px solid '+(res>70?C.green:C.y),borderRadius:8,textAlign:'center'}}><div style={{fontSize:32,fontWeight:900,color:res>70?C.green:C.y}}>{res+'/100'}</div><div style={{color:C.muted,marginTop:3,fontSize:13}}>{res>70?'🎯 מדויק!':'💪 תמשיך!'}</div></div>}
      </div>
    </div>
  );
}

// ── MetaFlanger ──
const MF={bg:'#aaaaaa',panel:'#989898',dark:'#7a7a7a',led:'#070707',green:'#00ee44',greenDim:'#002200',text:'#111',bdr:'1px solid #505050',btnU:'linear-gradient(180deg,#d0d0d0,#8e8e8e)',btnD:'linear-gradient(180deg,#808080,#b8b8b8)'};
function MFDisp({val,w=68}){const s=typeof val==='number'?(val>=100?Math.round(val):val>=10?val.toFixed(1):val.toFixed(2)):val;return <div style={{background:MF.led,border:'2px solid #363636',borderRadius:2,color:MF.green,fontFamily:'monospace',fontSize:13,fontWeight:700,padding:'2px 5px',minWidth:w,textAlign:'center',boxShadow:'inset 0 2px 7px rgba(0,0,0,.95)',letterSpacing:.5}}>{s}</div>;}
function MFLED({on,onClick}){return <div onClick={onClick} style={{width:13,height:13,borderRadius:'50%',background:on?'radial-gradient(circle at 38% 32%,#aaffaa,#00bb33)':MF.greenDim,boxShadow:on?'0 0 5px #00ee44':'none',cursor:'pointer',border:'1px solid #333',flexShrink:0}}/>;}
function MFBtn({children,active,onClick,style={}}){return <button onClick={onClick} style={{background:active?MF.btnD:MF.btnU,border:MF.bdr,boxShadow:active?'inset 1px 1px 3px rgba(0,0,0,.55)':'1px 1px 0 rgba(255,255,255,.45) inset,-1px -1px 0 rgba(0,0,0,.25) inset',borderRadius:3,padding:'3px 8px',cursor:'pointer',fontWeight:700,fontSize:11,color:MF.text,fontFamily:'Arial',...style}}>{children}</button>;}
function MFDragNum({val,min,max,onChange,w=68}){const onDown=e=>{e.preventDefault();const sy=e.clientY,sv=val;const mv=m=>{const nv=sv+(sy-m.clientY)/90*(max-min);onChange(Math.max(min,Math.min(max,+nv.toFixed(2))));};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);};return <div onMouseDown={onDown} style={{cursor:'ns-resize',userSelect:'none'}}><MFDisp val={val} w={w}/></div>;}
function MFSec({children,style={}}){return <div style={{background:MF.panel,borderLeft:'1px solid #bcbcbc',borderTop:'1px solid #c4c4c4',borderRight:'1px solid #585858',borderBottom:'1px solid #585858',padding:'9px 10px',display:'flex',flexDirection:'column',gap:8,...style}}>{children}</div>;}
function MFLbl({children}){return <div style={{fontSize:10,color:MF.text,fontWeight:700,fontFamily:'Arial',letterSpacing:.3,marginBottom:2}}>{children}</div>;}

function MetaFlangerUI({usr,setUsr,tgt,phase,res,onNewRound,onSubmit,onPlayTarget,onPlayUser,onStop}){
  const oscRef=useRef(),modRef=useRef(),sterRef=useRef(),vuLRef=useRef(),vuRRef=useRef();
  const animRef=useRef();
  const rateRef=useRef(usr.rate||2),depthRef=useRef(usr.depth||4);
  const wfRef=useRef('Sine'),modRunRef=useRef(true);
  const [waveform,setWfSt]=useState('Sine');
  const [tape,setTape]=useState(true);
  const [syncM,setSyncM]=useState(false);
  const [link,setLink]=useState(false);
  const [freqOn,setFreqOn]=useState(true);
  const [modRun,setMrSt]=useState(true);
  const [phA,setPhA]=useState(false);
  const [phB,setPhB]=useState(false);
  useEffect(()=>{rateRef.current=usr.rate||2;},[usr.rate]);
  useEffect(()=>{depthRef.current=usr.depth||4;},[usr.depth]);
  const setWf=v=>{wfRef.current=v;setWfSt(v);};
  const setMr=v=>{const nv=typeof v==='function'?v(modRunRef.current):v;modRunRef.current=nv;setMrSt(nv);};
  const sp=(k,v)=>setUsr(u=>({...u,[k]:v}));
  const p=k=>usr[k]||0;
  const R={display:'flex',alignItems:'center',gap:5};
  const WAVEFORMS=['Sine','Triangle','Sawtooth','Square'];
  const nextWf=()=>setWf(WAVEFORMS[(WAVEFORMS.indexOf(wfRef.current)+1)%WAVEFORMS.length]);
  useEffect(()=>{
    const ss=(ref,w,h)=>{if(ref.current){ref.current.width=w;ref.current.height=h;}};
    ss(oscRef,200,52);ss(modRef,176,22);ss(sterRef,88,36);ss(vuLRef,13,88);ss(vuRRef,13,88);
    let t=0;
    const draw=()=>{
      t+=1/60;
      const rate=rateRef.current,depth=depthRef.current;
      const oc=oscRef.current&&oscRef.current.getContext('2d');
      if(oc){const W=200,H=52;oc.fillStyle='#001a00';oc.fillRect(0,0,W,H);oc.strokeStyle=MF.green;oc.lineWidth=1.8;oc.shadowColor=MF.green;oc.shadowBlur=3;oc.beginPath();const amp=Math.max(3,(depth/12)*(H/2-7));const wf=wfRef.current;for(let x=0;x<W;x++){const ph=(x/W)*Math.PI*4+t*rate*1.5;let y=wf==='Sine'?Math.sin(ph):wf==='Triangle'?(2/Math.PI)*Math.asin(Math.sin(ph)):wf==='Sawtooth'?((ph%(Math.PI*2))/(Math.PI*2))*2-1:Math.sign(Math.sin(ph));const py=H/2-y*amp;x===0?oc.moveTo(x,py):oc.lineTo(x,py);}oc.stroke();oc.shadowBlur=0;oc.strokeStyle='rgba(0,200,50,.28)';oc.lineWidth=1;oc.setLineDash([4,7]);oc.beginPath();oc.moveTo(0,H/2);oc.lineTo(W,H/2);oc.stroke();oc.setLineDash([]);}
      const mc=modRef.current&&modRef.current.getContext('2d');
      if(mc){const W=176,H=22;mc.fillStyle='#001200';mc.fillRect(0,0,W,H);mc.fillStyle='#003300';mc.fillRect(3,H/2-3,W-6,6);if(modRunRef.current){const pos=0.5+Math.sin(t*rate*Math.PI*2)*0.44*(depth/12);const x=4+Math.max(0,Math.min(1,pos))*(W-10);mc.fillStyle='#005500';mc.fillRect(Math.min(x,W/2),H/2-3,Math.abs(x-W/2),6);mc.shadowColor=MF.green;mc.shadowBlur=4;mc.fillStyle=MF.green;mc.fillRect(x-3,2,7,H-4);mc.shadowBlur=0;}}
      const sc=sterRef.current&&sterRef.current.getContext('2d');
      if(sc){const W=88,H=36,cols=14,rows=5;sc.fillStyle='#001200';sc.fillRect(0,0,W,H);const cw=W/cols,rh=H/rows;const pos=0.5+Math.sin(t*rate*Math.PI*1.4)*0.38*(depth/12);for(let r=0;r<rows;r++){for(let col=0;col<cols;col++){const norm=col/(cols-1);const bright=1-Math.abs(norm-pos)*6*(12/Math.max(0.5,depth));sc.fillStyle=bright>0.65?MF.green:bright>0.2?'#007722':'#002200';sc.fillRect(col*cw+1,r*rh+1,cw-2,rh-2);}}}
      [vuLRef,vuRRef].forEach((ref,side)=>{const vc=ref.current&&ref.current.getContext('2d');if(vc){const W=13,H=88,segs=18;vc.fillStyle='#080808';vc.fillRect(0,0,W,H);const lv=Math.max(0,Math.min(1,0.5+Math.sin(t*rate*2.1+side*1.3)*0.22*(depth/12)*0.9));for(let i=0;i<segs;i++){const pct=1-i/segs,on=pct<lv;const col=i<2?'#dd2222':i<4?'#ddaa00':MF.green;vc.fillStyle=on?col:'#181818';vc.fillRect(1,(i/segs)*H+1,W-2,(H/segs)-2);}}});
      animRef.current=requestAnimationFrame(draw);
    };
    animRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(animRef.current);
  },[]);
  return(
    <div style={{background:MF.bg,borderRadius:5,border:'2px solid #484848',padding:'8px 6px',boxShadow:'3px 4px 12px rgba(0,0,0,.8)',display:'inline-flex',gap:0,direction:'ltr',userSelect:'none',alignItems:'stretch',flexWrap:'wrap',maxWidth:'100%'}}>
      <MFSec style={{minWidth:132}}>
        <div><div style={{...R,justifyContent:'space-between'}}><MFLbl>Mix</MFLbl><MFLbl>∅</MFLbl></div><div style={{...R,marginTop:3}}><MFDragNum val={p('mix')} min={0} max={100} onChange={v=>sp('mix',v)}/><MFLED on={phA} onClick={()=>setPhA(x=>!x)}/></div></div>
        <div><div style={{...R,justifyContent:'space-between'}}><MFLbl>Feedback</MFLbl><MFLbl>∅</MFLbl></div><div style={{...R,marginTop:3}}><MFDragNum val={p('fb')} min={0} max={100} onChange={v=>sp('fb',v)}/><MFLED on={phB} onClick={()=>setPhB(x=>!x)}/></div></div>
        <div><MFLbl>Type/Freq &nbsp;&nbsp;&nbsp; on/off</MFLbl><div style={{...R,marginTop:3}}><MFBtn style={{width:26,fontSize:13,padding:'2px 0',textAlign:'center'}}>╲</MFBtn><MFDisp val="14k" w={40}/><MFLED on={freqOn} onClick={()=>setFreqOn(x=>!x)}/></div></div>
      </MFSec>
      <div style={{width:2,background:'linear-gradient(180deg,#707070,#c0c0c0,#707070)',margin:'0 1px'}}/>
      <MFSec style={{minWidth:118}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:5,alignItems:'end'}}>
          <div><MFLbl>Delay</MFLbl><div style={{marginTop:3}}><MFDragNum val={p('time')} min={0.1} max={20} onChange={v=>sp('time',v)}/></div></div>
          <div style={{paddingBottom:1}}><MFLbl>Tape</MFLbl><MFLED on={tape} onClick={()=>setTape(x=>!x)}/></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:5,alignItems:'end'}}>
          <div><MFLbl>Rate(Hz)</MFLbl>
            <div style={{...R,marginTop:3}}>
              <div style={{display:'flex',flexDirection:'column',gap:1}}>
                <button onClick={()=>sp('rate',+Math.min(15,p('rate')+0.1).toFixed(2))} style={{background:MF.btnU,border:MF.bdr,borderRadius:2,width:16,height:12,cursor:'pointer',padding:0,fontSize:7,fontWeight:700,color:MF.text,lineHeight:1}}>▲</button>
                <button onClick={()=>sp('rate',+Math.max(0.1,p('rate')-0.1).toFixed(2))} style={{background:MF.btnU,border:MF.bdr,borderRadius:2,width:16,height:12,cursor:'pointer',padding:0,fontSize:7,fontWeight:700,color:MF.text,lineHeight:1}}>▼</button>
              </div>
              <MFDragNum val={p('rate')} min={0.1} max={15} onChange={v=>sp('rate',v)}/>
            </div>
          </div>
          <div style={{paddingBottom:1}}><MFLbl>Sync</MFLbl><MFBtn active={syncM} onClick={()=>setSyncM(x=>!x)} style={{width:22,padding:'3px 0',textAlign:'center'}}>M</MFBtn></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:5,alignItems:'end'}}>
          <div><MFLbl>Depth</MFLbl><div style={{marginTop:3}}><MFDragNum val={p('depth')} min={0} max={12} onChange={v=>sp('depth',v)}/></div></div>
          <div style={{paddingBottom:1}}><MFLbl>Link</MFLbl><MFLED on={link} onClick={()=>setLink(x=>!x)}/></div>
        </div>
      </MFSec>
      <div style={{width:2,background:'linear-gradient(180deg,#707070,#c0c0c0,#707070)',margin:'0 1px'}}/>
      <MFSec style={{minWidth:258}}>
        <div><MFLbl>Waveform</MFLbl><div style={{...R,marginTop:3}}><MFBtn onClick={nextWf} style={{minWidth:62}}>{waveform}</MFBtn><div style={{background:'#001500',border:'2px solid #363636',borderRadius:2,overflow:'hidden',lineHeight:0,boxShadow:'inset 0 2px 6px rgba(0,0,0,.9)'}}><canvas ref={oscRef}/></div></div></div>
        <div><MFLbl>Modulation</MFLbl><div style={{...R,marginTop:3}}><div style={{background:'#001200',border:'2px solid #363636',borderRadius:2,overflow:'hidden',lineHeight:0,boxShadow:'inset 0 2px 6px rgba(0,0,0,.9)'}}><canvas ref={modRef}/></div><MFBtn active={!modRun} onClick={()=>setMr(x=>!x)} style={{minWidth:38}}>{modRun?'Stop':'Run'}</MFBtn></div></div>
        <div><MFLbl>Stereo</MFLbl><div style={{...R,marginTop:3}}><MFDragNum val={p('stereo')||50} min={0} max={100} onChange={v=>sp('stereo',v)} w={42}/><div style={{background:'#001200',border:'2px solid #363636',borderRadius:2,overflow:'hidden',lineHeight:0,boxShadow:'inset 0 2px 6px rgba(0,0,0,.9)'}}><canvas ref={sterRef}/></div></div></div>
      </MFSec>
      <div style={{width:2,background:'linear-gradient(180deg,#707070,#c0c0c0,#707070)',margin:'0 1px'}}/>
      <MFSec style={{flexDirection:'row',gap:10,padding:'9px 12px'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <MFLbl>Gain</MFLbl>
          <div style={{display:'flex',gap:3,alignItems:'flex-start'}}>
            <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',height:84,paddingTop:2}}>
              {['—12','— 0','—-12'].map(v=><div key={v} style={{fontSize:8,color:MF.text,whiteSpace:'nowrap',fontFamily:'Arial'}}>{v}</div>)}
            </div>
            <div style={{position:'relative',width:22,height:88}}>
              <div style={{position:'absolute',left:'50%',top:2,bottom:2,width:5,background:'linear-gradient(90deg,#848484,#c8c8c8,#848484)',borderRadius:2,transform:'translateX(-50%)'}}/>
              <div style={{position:'absolute',left:'50%',top:Math.max(0,Math.min(68,(1-(p('gain')+1)/1.5)*68)),width:22,height:18,background:'linear-gradient(180deg,#cccccc,#888)',border:'1px solid #444',borderRadius:3,transform:'translateX(-50%)',cursor:'ns-resize',boxShadow:'1px 1px 0 rgba(255,255,255,.4) inset'}}
                onMouseDown={e=>{e.preventDefault();const sy=e.clientY,sv=p('gain');const mv=m=>sp('gain',Math.max(-1,Math.min(0.5,sv+(sy-m.clientY)/80)));const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);}}
              />
            </div>
          </div>
          <MFDisp val={((p('gain')||0)*10).toFixed(1)} w={42}/>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
          <MFLbl>Output</MFLbl>
          <div style={{display:'flex',gap:3,alignItems:'flex-start'}}>
            <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',height:84,paddingTop:2}}>
              {['—12','— 0','—-12'].map(v=><div key={v} style={{fontSize:8,color:MF.text,whiteSpace:'nowrap',fontFamily:'Arial'}}>{v}</div>)}
            </div>
            <div style={{background:'#080808',border:'2px solid #363636',borderRadius:2,padding:'2px',display:'flex',gap:2,lineHeight:0}}>
              <canvas ref={vuLRef}/><canvas ref={vuRRef}/>
            </div>
          </div>
          <div style={{display:'flex',gap:3}}><MFDisp val="-9.5" w={32}/><MFDisp val="-12" w={32}/></div>
        </div>
      </MFSec>
      <div style={{width:'100%',display:'flex',gap:8,padding:'10px 0 0',direction:'rtl',flexWrap:'wrap',alignItems:'center'}}>
        <button onClick={onNewRound} style={{padding:'9px 22px',background:C.y,color:'#000',border:'none',borderRadius:7,fontWeight:900,cursor:'pointer',fontSize:13}}>🎲 תרגיל חדש</button>
        {tgt&&<>
          <button onClick={onPlayTarget} style={{padding:'9px 18px',background:'transparent',color:C.y,border:'2px solid '+C.y,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 טרגט</button>
          <button onClick={onPlayUser} style={{padding:'9px 18px',background:'transparent',color:C.blue,border:'2px solid '+C.blue,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 שלי</button>
          <button onClick={onSubmit} disabled={phase==='done'} style={{padding:'9px 18px',background:phase==='done'?C.yDim:C.green,color:'#000',border:'none',borderRadius:7,fontWeight:900,cursor:'pointer',fontSize:13}}>✓ בדוק</button>
        </>}
        <button onClick={onStop} style={{padding:'9px 14px',background:'transparent',color:C.red,border:'2px solid '+C.red,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>■</button>
        {tgt&&<div style={{fontSize:11,color:C.muted,marginRight:'auto'}}>גרור נומרים לכיוון · שמע טרגט → כוון → בדוק</div>}
      </div>
      {res!=null&&<div style={{width:'100%',marginTop:10,padding:16,background:res>70?'rgba(0,232,122,.08)':'rgba(255,215,0,.08)',border:'1px solid '+(res>70?C.green:C.y),borderRadius:8,textAlign:'center',direction:'rtl'}}><div style={{fontSize:32,fontWeight:900,color:res>70?C.green:C.y}}>{res+'/100'}</div><div style={{color:C.muted,marginTop:3,fontSize:13}}>{res>70?'🎯 מדויק! כיוון מושלם':'💪 תמשיך להתאמן!'}</div></div>}
    </div>
  );
}

// ── FXTrain ──
const FX_DEFS=[
  {id:'delay',l:'Delay',icon:'⏱️',params:[{k:'time',l:'Time (s)',mn:.05,mx:1},{k:'fb',l:'Feedback',mn:0,mx:.9},{k:'mix',l:'Mix',mn:0,mx:1}]},
  {id:'reverb',l:'Reverb',icon:'🏛️',params:[{k:'decay',l:'Decay',mn:.5,mx:6},{k:'size',l:'Size',mn:0,mx:1},{k:'mix',l:'Mix',mn:0,mx:1}]},
  {id:'chorus',l:'Chorus',icon:'🌊',params:[{k:'rate',l:'Rate Hz',mn:.1,mx:5},{k:'depth',l:'Depth',mn:0,mx:1},{k:'mix',l:'Mix',mn:0,mx:1}]},
  {id:'flanger',l:'Flanger',icon:'🔁',params:[{k:'mix',l:'Mix',mn:0,mx:100},{k:'fb',l:'Feedback',mn:0,mx:100},{k:'time',l:'Delay ms',mn:0.1,mx:20},{k:'rate',l:'Rate Hz',mn:0.1,mx:15},{k:'depth',l:'Depth',mn:0,mx:12}]},
];
function FXTrain({onComplete}){
  const [fx,setFx]=useState(FX_DEFS[0]);const [tgt,setTgt]=useState(null);const [usr,setUsr]=useState({});const [phase,setPhase]=useState('idle');const [res,setRes]=useState(null);
  const actx=useRef(null);const osRef=useRef(null);
  const getCtx=()=>{if(!actx.current)actx.current=new(window.AudioContext||window.webkitAudioContext)();if(actx.current.state==='suspended')actx.current.resume();return actx.current;};
  const stop=()=>{try{osRef.current&&osRef.current.stop();}catch(e){}osRef.current=null;};
  const playDelay=p=>{stop();const ctx=getCtx();const os=ctx.createOscillator();os.type='sawtooth';os.frequency.value=220;const env=ctx.createGain();env.gain.setValueAtTime(.4,ctx.currentTime);env.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.3);const del=ctx.createDelay(2);del.delayTime.value=p.time||.25;const fbg=ctx.createGain();fbg.gain.value=p.fb||.4;const dry=ctx.createGain();dry.gain.value=1-(p.mix||.5);const wet=ctx.createGain();wet.gain.value=p.mix||.5;const out=ctx.createGain();out.gain.value=.65;os.connect(env);env.connect(dry);env.connect(del);del.connect(fbg);fbg.connect(del);del.connect(wet);dry.connect(out);wet.connect(out);out.connect(ctx.destination);os.start();os.stop(ctx.currentTime+3);osRef.current=os;};
  const playReverb=p=>{stop();const ctx=getCtx();const decay=p.decay||2;const irLen=Math.floor(ctx.sampleRate*Math.max(.5,decay));const ir=ctx.createBuffer(2,irLen,ctx.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<irLen;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/irLen,decay*.35);}const conv=ctx.createConvolver();conv.buffer=ir;const os=ctx.createOscillator();os.type='sine';os.frequency.value=440;const env=ctx.createGain();env.gain.setValueAtTime(.5,ctx.currentTime);env.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);const dry=ctx.createGain();dry.gain.value=1-(p.mix||.5);const wet=ctx.createGain();wet.gain.value=p.mix||.5;const out=ctx.createGain();out.gain.value=.65;os.connect(env);env.connect(dry);env.connect(conv);conv.connect(wet);dry.connect(out);wet.connect(out);out.connect(ctx.destination);os.start();os.stop(ctx.currentTime+4);osRef.current=os;};
  const playChorus=p=>{stop();const ctx=getCtx();const os=ctx.createOscillator();os.type='sawtooth';os.frequency.value=330;const lfo=ctx.createOscillator();lfo.frequency.value=p.rate||.8;const lfog=ctx.createGain();lfog.gain.value=(p.depth||.5)*22;const del=ctx.createDelay(.1);del.delayTime.value=.022;const dry=ctx.createGain();dry.gain.value=1-(p.mix||.5);const wet=ctx.createGain();wet.gain.value=p.mix||.5;const out=ctx.createGain();out.gain.value=.5;lfo.connect(lfog);lfog.connect(del.delayTime);os.connect(dry);os.connect(del);del.connect(wet);dry.connect(out);wet.connect(out);out.connect(ctx.destination);os.start();lfo.start();os.stop(ctx.currentTime+3);lfo.stop(ctx.currentTime+3);osRef.current=os;};
  const playFlanger=p=>{stop();const ctx=getCtx();const os=ctx.createOscillator();os.type='sawtooth';os.frequency.value=110;const lfo=ctx.createOscillator();lfo.frequency.value=p.rate||2;const lfog=ctx.createGain();lfog.gain.value=(p.depth||4)*0.00025;const del=ctx.createDelay(.05);del.delayTime.value=(p.time||6)*0.001;const fbg=ctx.createGain();fbg.gain.value=(p.fb||50)/100;const mix=(p.mix||50)/100;const dry=ctx.createGain();dry.gain.value=1-mix;const wet=ctx.createGain();wet.gain.value=mix;const out=ctx.createGain();out.gain.value=.5;lfo.connect(lfog);lfog.connect(del.delayTime);os.connect(dry);os.connect(del);del.connect(fbg);fbg.connect(del);del.connect(wet);dry.connect(out);wet.connect(out);out.connect(ctx.destination);os.start();lfo.start();os.stop(ctx.currentTime+4);lfo.stop(ctx.currentTime+4);osRef.current=os;};
  const playFx=p=>{if(fx.id==='delay')playDelay(p);else if(fx.id==='reverb')playReverb(p);else if(fx.id==='chorus')playChorus(p);else playFlanger(p);};
  const newRound=()=>{const t={},u={};fx.params.forEach(pr=>{t[pr.k]=pr.mn+Math.random()*(pr.mx-pr.mn);u[pr.k]=(pr.mn+pr.mx)/2;});setTgt(t);setUsr(u);setPhase('playing');setRes(null);setTimeout(()=>playFx(t),100);};
  const submit=()=>{if(!tgt)return;stop();let d=0;fx.params.forEach(pr=>{d+=Math.abs((usr[pr.k]||0)-tgt[pr.k])/(pr.mx-pr.mn);});const sc=Math.max(0,Math.round((1-d/fx.params.length)*100));setRes(sc);setPhase('done');if(onComplete)onComplete(sc);};
  useEffect(()=>()=>stop(),[]);
  const tabs=(
    <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
      {FX_DEFS.map(f=>(<button key={f.id} onClick={()=>{setFx(f);setPhase('idle');setRes(null);setTgt(null);stop();}} style={{padding:'8px 16px',background:fx.id===f.id?C.y:C.card,color:fx.id===f.id?'#000':C.muted,border:'1px solid '+(fx.id===f.id?C.y:C.borderLit),borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>{f.icon+' '+f.l}</button>))}
    </div>
  );
  if(fx.id==='flanger') return(
    <div>
      <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>🌀 אימון אפקטים</h1>
      {tabs}
      <div style={{overflowX:'auto',paddingBottom:8}}>
        <MetaFlangerUI usr={usr} setUsr={setUsr} tgt={tgt} phase={phase} res={res} onNewRound={newRound} onSubmit={submit} onStop={stop} onPlayTarget={()=>playFlanger(tgt)} onPlayUser={()=>playFlanger(usr)}/>
      </div>
    </div>
  );
  return(
    <div>
      <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>🌀 אימון אפקטים</h1>
      {tabs}
      <div style={{background:C.card,padding:28,borderRadius:12,border:'1px solid '+C.borderLit}}>
        <div style={{display:'flex',justifyContent:'center',gap:52,marginBottom:28}}>
          {fx.params.map(pr=>(<div key={pr.k} style={{textAlign:'center'}}><Knob val={usr[pr.k]!=null?usr[pr.k]:(pr.mn+pr.mx)/2} min={pr.mn} max={pr.mx} onChange={v=>setUsr(u=>({...u,[pr.k]:v}))} label={pr.l} size={72}/>{tgt&&<div style={{fontSize:9,color:C.muted,marginTop:6}}>טרגט: {(tgt[pr.k]||0).toFixed(2)}</div>}</div>))}
        </div>
        <div style={{display:'flex',gap:9,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={newRound} style={{padding:'10px 24px',background:C.y,color:'#000',border:'none',borderRadius:7,fontWeight:900,cursor:'pointer',fontSize:13}}>🎲 תרגיל חדש</button>
          {tgt&&<><button onClick={()=>playFx(tgt)} style={{padding:'10px 18px',background:'transparent',color:C.y,border:'2px solid '+C.y,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 טרגט</button><button onClick={()=>playFx(usr)} style={{padding:'10px 18px',background:'transparent',color:C.blue,border:'2px solid '+C.blue,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>🔊 שלי</button><button onClick={submit} disabled={phase==='done'} style={{padding:'10px 18px',background:phase==='done'?C.yDim:C.green,color:'#000',border:'none',borderRadius:7,fontWeight:900,cursor:'pointer',fontSize:13}}>✓ בדוק</button></>}
          <button onClick={stop} style={{padding:'10px 14px',background:'transparent',color:C.red,border:'2px solid '+C.red,borderRadius:7,fontWeight:700,cursor:'pointer',fontSize:13}}>■</button>
        </div>
        {res!=null&&<div style={{marginTop:20,padding:18,background:res>70?'rgba(0,232,122,.08)':'rgba(255,215,0,.08)',border:'1px solid '+(res>70?C.green:C.y),borderRadius:8,textAlign:'center'}}><div style={{fontSize:32,fontWeight:900,color:res>70?C.green:C.y}}>{res+'/100'}</div><div style={{color:C.muted,marginTop:3,fontSize:13}}>{res>70?'🎯 מדויק!':'💪 תמשיך!'}</div></div>}
      </div>
    </div>
  );
}

// ── GenericExercise ──
function GenericExercise({exercise,exTypes,onComplete}){
  const type=exTypes.find(t=>t.id===exercise.type)||{icon:'📝',label:'תרגיל',color:C.muted};
  const actxRef=useRef(null);const srcRef=useRef(null);const [playing,setPlaying]=useState(false);const [done,setDone]=useState(false);
  const toggleAudio=async()=>{
    if(playing){try{srcRef.current&&srcRef.current.stop();}catch(e){}setPlaying(false);return;}
    if(!exercise.audioUrl)return;
    try{const ctx=actxRef.current||(actxRef.current=new(window.AudioContext||window.webkitAudioContext)());if(ctx.state==='suspended')ctx.resume();const resp=await fetch(exercise.audioUrl);const raw=await resp.arrayBuffer();const buf=await ctx.decodeAudioData(raw);const src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);src.start();src.onended=()=>setPlaying(false);srcRef.current=src;setPlaying(true);}catch(e){console.error(e);}
  };
  useEffect(()=>()=>{try{srcRef.current&&srcRef.current.stop();}catch(e){}});
  const markDone=()=>{setDone(true);if(onComplete)onComplete(100);};
  return(
    <div style={{background:C.card,padding:32,borderRadius:12,border:'1px solid '+type.color+'44',maxWidth:580}}>
      <div style={{fontSize:44,marginBottom:14}}>{type.icon}</div>
      <h2 style={{color:C.text,margin:'0 0 6px',fontSize:20,fontWeight:900}}>{exercise.title}</h2>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:11,color:type.color,background:type.color+'18',padding:'3px 10px',borderRadius:8,border:'1px solid '+type.color+'44'}}>{type.label}</span>
        <span style={{fontSize:11,color:DIFF_COL[exercise.diff]||C.muted,background:(DIFF_COL[exercise.diff]||C.muted)+'18',padding:'3px 10px',borderRadius:8}}>{exercise.diff}</span>
      </div>
      {exercise.description&&<p style={{color:C.muted,margin:'0 0 14px',fontSize:14}}>{exercise.description}</p>}
      {exercise.instructions&&<div style={{background:C.panel,padding:16,borderRadius:8,border:'1px solid '+C.borderLit,marginBottom:20,color:C.text,fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{exercise.instructions}</div>}
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        {exercise.audioUrl&&<button onClick={toggleAudio} style={{padding:'10px 20px',background:playing?C.red:C.green,color:'#000',border:'none',borderRadius:8,fontWeight:800,cursor:'pointer',fontSize:13}}>{playing?'■ עצור':'▶ השמע אודיו'}</button>}
        <button onClick={markDone} disabled={done} style={{padding:'10px 24px',background:done?C.yDim:C.y,color:'#000',border:'none',borderRadius:8,fontWeight:800,cursor:done?'not-allowed':'pointer',fontSize:13}}>{done?'✓ הושלם':'סמן כהושלם'}</button>
      </div>
    </div>
  );
}

// ── StudentHome ──
function StudentHome({student,exercises,exTypes,doneMap,onStart}){
  const assigned=exercises.filter(e=>student.assignedIds.includes(e.id));
  const doneCount=assigned.filter(e=>doneMap[e.id]!=null).length;
  const getT=id=>exTypes.find(t=>t.id===id)||{icon:'📝',label:'תרגיל',color:C.muted};
  return(
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 5px'}}>התרגילים שלי 📋</h1>
        <p style={{color:C.muted,margin:0,fontSize:13}}>{assigned.length===0?'אין תרגילים מוקצים עדיין':(doneCount+'/'+assigned.length+' תרגילים הושלמו')}</p>
      </div>
      {assigned.length===0&&<div style={{background:C.card,padding:40,borderRadius:12,border:'1px solid '+C.borderLit,textAlign:'center',color:C.muted}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div>פנה למנהל לקבלת תרגילים</div></div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:14}}>
        {assigned.map(ex=>{
          const t=getT(ex.type);const done=doneMap[ex.id]!=null;const score=doneMap[ex.id];
          return(
            <div key={ex.id} style={{background:C.card,padding:20,borderRadius:12,border:'1px solid '+(done?t.color+'44':C.borderLit),position:'relative',overflow:'hidden'}}>
              {done&&<div style={{position:'absolute',top:10,left:10,fontSize:10,background:t.color+'22',color:t.color,padding:'3px 8px',borderRadius:10,border:'1px solid '+t.color+'44',fontWeight:700}}>✓ הושלם</div>}
              <div style={{fontSize:28,marginBottom:10}}>{t.icon}</div>
              <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:4}}>{ex.title}</div>
              {ex.description&&<div style={{fontSize:12,color:C.muted,marginBottom:8}}>{ex.description}</div>}
              <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:t.color,background:t.color+'18',padding:'2px 8px',borderRadius:8}}>{t.label}</span>
                <span style={{fontSize:11,color:DIFF_COL[ex.diff]||C.muted,background:(DIFF_COL[ex.diff]||C.muted)+'18',padding:'2px 8px',borderRadius:8}}>{ex.diff}</span>
              </div>
              {done?(
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,color:score>70?C.green:score>40?C.y:C.red,fontWeight:700}}>{'ניקוד: '+score+'/100'}</span>
                  <button onClick={()=>onStart(ex)} style={{padding:'7px 14px',background:'transparent',color:C.muted,border:'1px solid '+C.borderLit,borderRadius:7,cursor:'pointer',fontSize:12}}>נסה שוב</button>
                </div>
              ):(
                <button onClick={()=>onStart(ex)} style={{width:'100%',padding:'10px',background:C.y,color:'#000',border:'none',borderRadius:7,fontWeight:800,cursor:'pointer',fontSize:13}}>▶ התחל תרגיל</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ExerciseHeader ──
function ExerciseHeader({exercise,exTypes,onBack}){
  const t=exTypes.find(x=>x.id===exercise.type)||{icon:'📝',label:'תרגיל',color:C.muted};
  return(
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22,padding:'10px 16px',background:C.card,borderRadius:10,border:'1px solid '+C.borderLit}}>
      <button onClick={onBack} style={{padding:'7px 14px',background:'transparent',color:C.muted,border:'1px solid '+C.borderLit,borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:700}}>◀ חזור</button>
      <span style={{fontSize:18}}>{t.icon}</span>
      <div><div style={{fontWeight:700,color:C.text,fontSize:14}}>{exercise.title}</div><div style={{fontSize:11,color:t.color}}>{t.label}</div></div>
    </div>
  );
}

// ── StudentMixer ──
const EQ_BANDS=[
  {type:'lowshelf', def:80,   lbl:'LOW',   fMn:40,   fMx:500,   hasQ:false, hasFilter:true },
  {type:'peaking',  def:400,  lbl:'L-MID', fMn:80,   fMx:3000,  hasQ:true,  hasFilter:false},
  {type:'peaking',  def:3500, lbl:'H-MID', fMn:500,  fMx:15000, hasQ:true,  hasFilter:false},
  {type:'highshelf',def:10000,lbl:'HIGH',  fMn:2000, fMx:20000, hasQ:false, hasFilter:true },
];
const LOW_FILTER_TYPES =['lowshelf','highpass','lowpass'];
const HIGH_FILTER_TYPES=['highshelf','highpass','lowpass'];
const FILTER_LABELS={'lowshelf':'Shelf','highshelf':'Shelf','highpass':'HP','lowpass':'LP'};
const SLOPE_OPTS=[{l:'6dB',v:0.7},{l:'12dB',v:1.4},{l:'24dB',v:2.8}];
const AUX_FX_OPTS=['Delay','Reverb','Chorus','Flanger'];
const AUX_COLORS=['#4488ff','#00e87a','#ff44bb'];
const AUX_FX_PARAMS={
  Delay:[{k:'time',l:'Time',mn:.05,mx:1.5},{k:'fb',l:'Feedback',mn:0,mx:.9},{k:'mix',l:'Mix',mn:0,mx:1}],
  Reverb:[{k:'decay',l:'Decay',mn:.3,mx:6},{k:'mix',l:'Mix',mn:0,mx:1}],
  Chorus:[{k:'rate',l:'Rate Hz',mn:.1,mx:8},{k:'depth',l:'Depth',mn:0,mx:1},{k:'mix',l:'Mix',mn:0,mx:1}],
  Flanger:[{k:'rate',l:'Rate Hz',mn:.1,mx:5},{k:'depth',l:'Depth',mn:0,mx:1},{k:'fb',l:'Feedback',mn:0,mx:.9},{k:'mix',l:'Mix',mn:0,mx:1}],
};
const mkStrip=()=>({fader:.75,pan:0,mute:false,sends:[0,0,0],eq:EQ_BANDS.map(b=>({g:0,f:b.def,q:1.0,filterType:b.type,slope:0.7}))});
const mkAuxM=(t,rl=.6)=>{
  const p=t==='Delay'?{time:.4,fb:.4,mix:.6}:t==='Reverb'?{decay:2.5,mix:.65}:t==='Chorus'?{rate:1,depth:.5,mix:.5}:{rate:.5,depth:.5,fb:.4,mix:.5};
  return{type:t,rl,open:false,params:p};
};

function EQCurve({bands}){
  const ref=useRef();
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const W=canvas.offsetWidth||600,H=200;canvas.width=W;canvas.height=H;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#050505';ctx.fillRect(0,0,W,H);
    // grid lines
    [40,100,200,500,1000,2000,5000,10000,20000].forEach(f=>{
      const x=Math.log10(f/20)/Math.log10(1000)*W;
      ctx.strokeStyle='#151515';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
      if([100,1000,10000].includes(f)){ctx.fillStyle='#2a2a2a';ctx.font='7px monospace';ctx.fillText(f>=1000?f/1000+'k':f,x+2,H-3);}
    });
    [-12,-9,-6,-3,0,3,6,9,12].forEach(g=>{
      const y=H/2-g/12*(H/2-8);
      ctx.strokeStyle=g===0?'#2e2e2e':'#111';ctx.lineWidth=g===0?1.5:1;
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
      if(g!==0&&Math.abs(g)%6===0){ctx.fillStyle='#2a2a2a';ctx.font='7px monospace';ctx.fillText(g>0?'+'+g:g,2,y-2);}
    });
    // EQ curve
    const colors=['#4488ff','#FFD700','#ff3355','#00e87a'];
    // per-band overlay
    bands.forEach((b,bi)=>{
      const bd=EQ_BANDS[bi];
      const ft=b.filterType||bd.type;
      const q=b.q||1.0;
      ctx.strokeStyle=colors[bi]+'66';ctx.lineWidth=1;ctx.setLineDash([3,4]);
      ctx.beginPath();
      for(let px=0;px<W;px++){
        const freq=20*Math.pow(1000,px/W);
        let db=0;
        if(ft==='peaking'){const bw=freq/b.f-b.f/freq;db=b.g/(1+Math.pow(bw*q,2));}
        else if(ft==='lowshelf')db=b.g/(1+Math.pow(freq/b.f,2));
        else if(ft==='highshelf')db=b.g/(1+Math.pow(b.f/freq,2));
        else if(ft==='highpass')db=-12*Math.log2(1+Math.pow(b.f/Math.max(freq,1),b.slope||0.7)*b.slope);
        else if(ft==='lowpass')db=-12*Math.log2(1+Math.pow(freq/b.f,b.slope||0.7)*b.slope);
        const y=H/2-Math.max(-14,Math.min(14,db))/14*(H/2-8);
        px===0?ctx.moveTo(0,y):ctx.lineTo(px,y);
      }
      ctx.stroke();ctx.setLineDash([]);
    });
    // sum curve
    ctx.strokeStyle=C.y;ctx.lineWidth=2.5;ctx.shadowColor=C.y;ctx.shadowBlur=6;
    ctx.beginPath();
    for(let px=0;px<W;px++){
      const freq=20*Math.pow(1000,px/W);
      let db=0;
      bands.forEach((b,bi)=>{
        const bd=EQ_BANDS[bi];const ft=b.filterType||bd.type;const q=b.q||1.0;
        if(ft==='peaking'){const bw=freq/b.f-b.f/freq;db+=b.g/(1+Math.pow(bw*q,2));}
        else if(ft==='lowshelf')db+=b.g/(1+Math.pow(freq/b.f,2));
        else if(ft==='highshelf')db+=b.g/(1+Math.pow(b.f/freq,2));
        else if(ft==='highpass')db+=-12*Math.log2(1+Math.pow(b.f/Math.max(freq,1),b.slope||0.7)*b.slope);
        else if(ft==='lowpass')db+=-12*Math.log2(1+Math.pow(freq/b.f,b.slope||0.7)*b.slope);
      });
      const y=H/2-Math.max(-14,Math.min(14,db))/14*(H/2-8);
      px===0?ctx.moveTo(0,y):ctx.lineTo(px,y);
    }
    ctx.stroke();ctx.shadowBlur=0;
  },[bands]);
  return <canvas ref={ref} style={{width:'100%',height:200,display:'block',borderRadius:6,border:'1px solid '+C.borderLit}}/>;
}

function StudentMixer({channels:chs}){
  const [strips,setStrips]=useState(()=>chs.map(mkStrip));
  const [auxMs,setAuxMs]=useState([mkAuxM('Delay'),mkAuxM('Reverb'),mkAuxM('Chorus')]);
  const [playing,setPlaying]=useState(false);
  const [loading,setLoading]=useState(false);
  const [eqIdx,setEqIdx]=useState(null);
  const [vus,setVus]=useState(Array(16).fill(0));
  const actxRef=useRef(null);const nodesRef=useRef({});const auxBusRef=useRef([]);
  const auxRetRef=useRef([]);const sendRef=useRef({});const decodedRef=useRef({});
  const animRef=useRef();const stripsRef=useRef(strips);
  useEffect(()=>{stripsRef.current=strips;},[strips]);
  const getCtx=()=>{if(!actxRef.current)actxRef.current=new(window.AudioContext||window.webkitAudioContext)();if(actxRef.current.state==='suspended')actxRef.current.resume();return actxRef.current;};
  const buildFx=(ctx,type,p)=>{
    if(type==='Delay'){const inp=ctx.createGain(),del=ctx.createDelay(2),fb=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),out=ctx.createGain();del.delayTime.value=p.time||.4;fb.gain.value=p.fb||.4;wet.gain.value=p.mix||.6;dry.gain.value=1-(p.mix||.6);inp.connect(del);del.connect(fb);fb.connect(del);del.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);return{inp,out};}
    if(type==='Reverb'){const dec=p.decay||2.5,len=Math.floor(ctx.sampleRate*dec),ir=ctx.createBuffer(2,len,ctx.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);}const conv=ctx.createConvolver();conv.buffer=ir;const wet=ctx.createGain(),dry=ctx.createGain(),inp=ctx.createGain(),out=ctx.createGain();wet.gain.value=p.mix||.65;dry.gain.value=1-(p.mix||.65);inp.connect(conv);conv.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);return{inp,out};}
    if(type==='Chorus'){const inp=ctx.createGain(),del=ctx.createDelay(.05),lfo=ctx.createOscillator(),lfoG=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),out=ctx.createGain();del.delayTime.value=.022;lfo.frequency.value=p.rate||1;lfoG.gain.value=(p.depth||.5)*.01;wet.gain.value=p.mix||.5;dry.gain.value=1-(p.mix||.5);lfo.connect(lfoG);lfoG.connect(del.delayTime);inp.connect(del);del.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);lfo.start();return{inp,out};}
    const inp=ctx.createGain(),del=ctx.createDelay(.02),lfo=ctx.createOscillator(),lfoG=ctx.createGain(),fb=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),out=ctx.createGain();del.delayTime.value=.005;lfo.frequency.value=p.rate||.5;lfoG.gain.value=(p.depth||.5)*.003;fb.gain.value=p.fb||.4;wet.gain.value=p.mix||.5;dry.gain.value=1-(p.mix||.5);lfo.connect(lfoG);lfoG.connect(del.delayTime);inp.connect(del);del.connect(fb);fb.connect(del);del.connect(wet);inp.connect(dry);wet.connect(out);dry.connect(out);lfo.start();return{inp,out};
  };
  const stopAll=()=>{cancelAnimationFrame(animRef.current);Object.values(nodesRef.current).forEach(n=>{try{n.src.stop();}catch(e){}});nodesRef.current={};sendRef.current={};setPlaying(false);setVus(Array(16).fill(0));};
  const playAll=async()=>{
    if(playing){stopAll();return;}
    const loaded=chs.filter(c=>c.audioUrl).length;if(!loaded)return;
    setLoading(true);
    try{
      const ctx=getCtx();
      const master=ctx.createGain();master.gain.value=1;master.connect(ctx.destination);
      auxBusRef.current=[];auxRetRef.current=[];
      auxMs.forEach((a,j)=>{const bus=ctx.createGain();bus.gain.value=1;const fx=buildFx(ctx,a.type,a.params);const ret=ctx.createGain();ret.gain.value=a.rl;bus.connect(fx.inp);fx.out.connect(ret);ret.connect(master);auxBusRef.current[j]=bus;auxRetRef.current[j]=ret;});
      await Promise.all(chs.map(async(ch,i)=>{
        const s=stripsRef.current[i];
        if(!ch.audioUrl||s.mute)return;
        if(!decodedRef.current[ch.audioUrl]){const r=await fetch(ch.audioUrl);decodedRef.current[ch.audioUrl]=await ctx.decodeAudioData(await r.arrayBuffer());}
        const src=ctx.createBufferSource();src.buffer=decodedRef.current[ch.audioUrl];src.loop=true;
        let prev=src;
        const eqNodes=EQ_BANDS.map((b,bi)=>{const f=ctx.createBiquadFilter();f.type=s.eq[bi].filterType||b.type;f.frequency.value=s.eq[bi].f;f.gain.value=s.eq[bi].g;f.Q.value=s.eq[bi].q||1.0;prev.connect(f);prev=f;return f;});
        const gainN=ctx.createGain();gainN.gain.value=s.fader;prev.connect(gainN);
        const panN=ctx.createStereoPanner();panN.pan.value=s.pan;gainN.connect(panN);panN.connect(master);
        if(!sendRef.current[i])sendRef.current[i]=[];
        s.sends.forEach((sv,j)=>{const sn=ctx.createGain();sn.gain.value=sv;gainN.connect(sn);sn.connect(auxBusRef.current[j]);sendRef.current[i][j]=sn;});
        src.start();nodesRef.current[i]={src,gainN,panN,eqNodes};
      }));
      setPlaying(true);
      const draw=()=>{const s=stripsRef.current;setVus(Array.from({length:16},(_,i)=>(!nodesRef.current[i]||s[i]&&s[i].mute)?0:s[i]?s[i].fader*(0.2+Math.random()*.9):0));animRef.current=requestAnimationFrame(draw);};
      animRef.current=requestAnimationFrame(draw);
    }catch(e){console.error(e);}
    setLoading(false);
  };
  const setFaderV=(i,v)=>{setStrips(s=>s.map((x,k)=>k===i?{...x,fader:v}:x));if(nodesRef.current[i])nodesRef.current[i].gainN.gain.value=v;};
  const setPanV=(i,v)=>{setStrips(s=>s.map((x,k)=>k===i?{...x,pan:v}:x));if(nodesRef.current[i])nodesRef.current[i].panN.pan.value=v;};
  const toggleMute=(i)=>{setStrips(s=>s.map((x,k)=>{if(k!==i)return x;const m=!x.mute;if(nodesRef.current[i])nodesRef.current[i].gainN.gain.value=m?0:x.fader;return{...x,mute:m};}));};
  const setSend=(i,j,v)=>{setStrips(s=>s.map((x,k)=>k===i?{...x,sends:x.sends.map((sv,sj)=>sj===j?v:sv)}:x));if(sendRef.current[i]&&sendRef.current[i][j])sendRef.current[i][j].gain.value=v;};
  const setEqBand=(i,bi,field,v)=>{setStrips(s=>s.map((x,k)=>k===i?{...x,eq:x.eq.map((b,bj)=>bj===bi?{...b,[field]:v}:b)}:x));const en=nodesRef.current[i]&&nodesRef.current[i].eqNodes&&nodesRef.current[i].eqNodes[bi];if(en){if(field==='g')en.gain.value=v;if(field==='f')en.frequency.value=v;if(field==='q')en.Q.value=v;if(field==='filterType'){en.type=v;}if(field==='slope')en.Q.value=v;}};
  const setAuxReturn=(j,v)=>{setAuxMs(a=>a.map((x,k)=>k===j?{...x,rl:v}:x));if(auxRetRef.current[j])auxRetRef.current[j].gain.value=v;};
  const cycleAuxType=(j)=>{if(playing)stopAll();setAuxMs(a=>a.map((x,k)=>{if(k!==j)return x;const nt=AUX_FX_OPTS[(AUX_FX_OPTS.indexOf(x.type)+1)%AUX_FX_OPTS.length];return mkAuxM(nt,x.rl);}));};
  useEffect(()=>()=>{stopAll();try{actxRef.current&&actxRef.current.close();}catch(e){};},[]);
  const loaded=chs.filter(c=>c.audioUrl).length;
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:16,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:23,fontWeight:900,color:C.y,margin:'0 0 2px'}}>🎚️ מיקסר — 16 ערוצים</h1>
          <p style={{color:C.muted,margin:0,fontSize:12}}>{loaded+' ערוצים עם אודיו · '+(playing?'● מנגן':'מושהה')}</p>
        </div>
        <button onClick={playAll} disabled={loading||loaded===0}
          style={{padding:'12px 40px',background:playing?C.red:loaded===0?C.yDim:C.green,color:'#000',border:'none',borderRadius:9,fontWeight:900,fontSize:16,cursor:loaded===0?'not-allowed':'pointer',letterSpacing:2,transition:'background .15s'}}>
          {loading?'⏳ טוען...':playing?'■  STOP ALL':'▶  PLAY ALL'}
        </button>
      </div>
      {/* AUX Masters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {auxMs.map((a,j)=>(
          <div key={j} style={{flex:'1 1 210px',background:C.card,borderRadius:9,border:'1px solid '+(a.open?AUX_COLORS[j]+'55':C.borderLit),overflow:'hidden'}}>
            <div style={{padding:'8px 12px',display:'flex',alignItems:'center',gap:7}}>
              <span style={{fontSize:11,fontWeight:900,color:AUX_COLORS[j],flexShrink:0,width:46}}>{'AUX '+(j+1)}</span>
              <div style={{background:'#0a0a0a',border:'1px solid '+AUX_COLORS[j]+'44',borderRadius:4,padding:'2px 8px',fontSize:11,fontFamily:'monospace',color:AUX_COLORS[j],flex:1,textAlign:'center'}}>{a.type}</div>
              <Knob val={a.rl} min={0} max={1} onChange={v=>setAuxReturn(j,v)} label="RTN" size={28} color={AUX_COLORS[j]}/>
              <button onClick={()=>cycleAuxType(j)} title="שנה אפקט" style={{width:28,height:28,background:'transparent',color:C.blue,border:'1px solid '+C.blue,borderRadius:5,cursor:'pointer',fontSize:14,fontWeight:700,flexShrink:0}}>⇄</button>
              <button onClick={()=>setAuxMs(ax=>ax.map((x,k)=>k===j?{...x,open:!x.open}:x))} style={{padding:'3px 10px',background:a.open?AUX_COLORS[j]+'22':'transparent',color:a.open?AUX_COLORS[j]:C.muted,border:'1px solid '+(a.open?AUX_COLORS[j]:C.borderLit),borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:700,flexShrink:0}}>{a.open?'▲':'▼ עריכה'}</button>
            </div>
            {a.open&&(
              <div style={{padding:'12px 16px',background:'#0a0a0a',borderTop:'1px solid '+C.dim}}>
                <div style={{fontSize:10,color:AUX_COLORS[j],fontWeight:700,marginBottom:10,letterSpacing:.5}}>{a.type+' · AUX '+(j+1)+' Parameters'}</div>
                <div style={{display:'flex',gap:28,alignItems:'center',flexWrap:'wrap'}}>
                  {(AUX_FX_PARAMS[a.type]||[]).map(function(pr){return(
                    <Knob key={pr.k} val={a.params[pr.k]!=null?a.params[pr.k]:pr.mn} min={pr.mn} max={pr.mx}
                      onChange={v=>setAuxMs(ax=>ax.map((x,i)=>i===j?{...x,params:{...x.params,[pr.k]:v}}:x))}
                      label={pr.l} size={52} color={AUX_COLORS[j]}/>
                  );})}
                </div>
                {playing&&<div style={{marginTop:8,fontSize:10,color:C.muted}}>⚠ שינויים יכנסו לתוקף בהפעלה הבאה</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Console */}
      <div style={{background:'#040404',border:'2px solid #181818',borderRadius:14,padding:'12px 8px 8px',overflowX:'auto',boxShadow:'inset 0 4px 24px rgba(0,0,0,.9)'}}>
        <div style={{display:'flex',gap:2,minWidth:16*72+15*2}}>
          {chs.map((ch,i)=>{
            const s=strips[i];const isM=i===15;
            return(
              <div key={i} style={{width:72,background:isM?'linear-gradient(180deg,#1e1800,#100d00)':'linear-gradient(180deg,#181818,#0d0d0d)',border:'1px solid '+(isM?C.yDim:'#1c1c1c'),borderRadius:7,padding:'6px 4px 5px',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <div style={{fontSize:8,fontWeight:700,color:isM?C.y:'#777',width:'100%',textAlign:'center',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'0 2px'}}>{ch.name}</div>
                <button onClick={()=>setEqIdx(eqIdx===i?null:i)} style={{width:46,height:13,background:eqIdx===i?C.y+'2a':'#0e0e0e',color:eqIdx===i?C.y:'#3a3a3a',border:'1px solid '+(eqIdx===i?C.y+'44':'#1c1c1c'),borderRadius:3,cursor:'pointer',fontSize:7,fontWeight:700,letterSpacing:1}}>4B·EQ</button>
                {/* AUX sends — stacked vertically */}
                <div style={{display:'flex',flexDirection:'column',gap:3,width:'100%',alignItems:'center',padding:'2px 0'}}>
                  {[0,1,2].map(j=>(
                    <div key={j} style={{display:'flex',alignItems:'center',gap:3,width:'100%',justifyContent:'center'}}>
                      <div style={{fontSize:6,color:AUX_COLORS[j],fontWeight:700,width:12,textAlign:'right',flexShrink:0}}>{'A'+(j+1)}</div>
                      <Knob val={s.sends[j]} min={0} max={1} onChange={v=>setSend(i,j,v)} label="" size={22} color={AUX_COLORS[j]}/>
                    </div>
                  ))}
                </div>
                <Knob val={s.pan} min={-1} max={1} onChange={v=>setPanV(i,v)} label="PAN" size={26} color={C.green}/>
                <div style={{display:'flex',gap:2,alignItems:'flex-end'}}>
                  <VU level={playing&&s&&!s.mute?vus[i]:0}/>
                  <Fader val={s.fader} onChange={v=>setFaderV(i,v)} ht={76}/>
                </div>
                <button onClick={()=>toggleMute(i)} style={{width:46,padding:'2px 0',background:s.mute?C.red:'#0e0e0e',color:s.mute?'#fff':C.muted,border:'1px solid '+(s.mute?C.red:'#1c1c1c'),borderRadius:3,fontSize:7,fontWeight:700,cursor:'pointer',letterSpacing:.5}}>MUTE</button>
              </div>
            );
          })}
        </div>
        <div style={{textAlign:'center',marginTop:8,color:'#141414',fontSize:8,letterSpacing:3,fontFamily:'monospace',fontWeight:700}}>SOUND ACADEMY · TLA SERIES · 16CH ANALOG CONSOLE</div>
      </div>
      {/* EQ Panel */}
      {eqIdx!==null&&strips[eqIdx]&&(
        <div style={{marginTop:10,background:C.card,borderRadius:10,border:'1px solid '+C.y+'44',padding:'14px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontWeight:900,color:C.y,fontSize:14}}>{'📈 4-Band Semi-Parametric EQ — '+(chs[eqIdx]&&chs[eqIdx].name||('Ch '+(eqIdx+1)))}</div>
            <button onClick={()=>setEqIdx(null)} style={{background:'transparent',border:'1px solid '+C.borderLit,color:C.muted,cursor:'pointer',fontSize:14,borderRadius:6,padding:'3px 9px'}}>✕</button>
          </div>
          <EQCurve bands={strips[eqIdx].eq}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginTop:12}}>
            {[...EQ_BANDS].reverse().map((band,ri)=>{const bi=EQ_BANDS.length-1-ri;
              const eq=strips[eqIdx].eq[bi];
              const bColor=[C.blue,C.y,C.red,C.green][bi];
              const filterOpts=bi===0?LOW_FILTER_TYPES:bi===3?HIGH_FILTER_TYPES:null;
              const curFt=eq.filterType||band.type;
              const isFilter=curFt==='highpass'||curFt==='lowpass';
              return(
                <div key={bi} style={{background:C.panel,borderRadius:8,padding:'12px 8px',border:'1px solid '+bColor+'33',display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
                  <span style={{fontSize:11,fontWeight:900,color:bColor,letterSpacing:1}}>{band.lbl}</span>

                  {/* Filter type selector for LOW / HIGH */}
                  {filterOpts&&(
                    <div style={{display:'flex',gap:3,flexWrap:'wrap',justifyContent:'center'}}>
                      {filterOpts.map(ft=>(
                        <button key={ft} onClick={()=>setEqBand(eqIdx,bi,'filterType',ft)}
                          style={{padding:'2px 7px',fontSize:9,fontWeight:700,cursor:'pointer',borderRadius:4,
                            background:curFt===ft?bColor:C.dim,
                            color:curFt===ft?'#000':C.muted,
                            border:'1px solid '+(curFt===ft?bColor:C.borderLit)}}>
                          {FILTER_LABELS[ft]||ft}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Slope selector — only when HP or LP */}
                  {filterOpts&&isFilter&&(
                    <div style={{display:'flex',gap:3,justifyContent:'center'}}>
                      {SLOPE_OPTS.map(sl=>(
                        <button key={sl.l} onClick={()=>setEqBand(eqIdx,bi,'slope',sl.v)}
                          style={{padding:'2px 6px',fontSize:9,fontWeight:700,cursor:'pointer',borderRadius:4,
                            background:Math.abs((eq.slope||0.7)-sl.v)<0.1?bColor:C.dim,
                            color:Math.abs((eq.slope||0.7)-sl.v)<0.1?'#000':C.muted,
                            border:'1px solid '+(Math.abs((eq.slope||0.7)-sl.v)<0.1?bColor:C.borderLit)}}>
                          {sl.l}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Gain knob — hide when HP/LP filter */}
                  {!isFilter&&(
                    <Knob val={eq.g} min={-12} max={12} onChange={v=>setEqBand(eqIdx,bi,'g',v)} label={(eq.g>=0?'+':'')+eq.g.toFixed(1)+'dB'} size={52} color={bColor}/>
                  )}

                  {/* Q knob — peaking bands only */}
                  {band.hasQ&&(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                      <span style={{fontSize:8,color:C.muted,letterSpacing:.5}}>Q</span>
                      <Knob val={eq.q||1} min={0.1} max={10} onChange={v=>setEqBand(eqIdx,bi,'q',v)} label={'Q '+( eq.q||1).toFixed(1)} size={42} color={bColor}/>
                    </div>
                  )}

                  {/* Frequency display */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                    <span style={{fontSize:8,color:C.muted}}>Frequency</span>
                    <div style={{background:'#0a0a0a',border:'1px solid '+bColor+'55',borderRadius:5,padding:'3px 9px',fontSize:13,color:bColor,fontFamily:'monospace',fontWeight:700,cursor:'ns-resize',userSelect:'none',minWidth:56,textAlign:'center'}}
                      onMouseDown={e=>{e.preventDefault();const sy=e.clientY,sf=eq.f,lr=Math.log(band.fMx/band.fMn);const mv=m=>{const nf=sf*Math.exp(-lr*(m.clientY-sy)/150);setEqBand(eqIdx,bi,'f',Math.max(band.fMn,Math.min(band.fMx,Math.round(nf))));};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);}}>
                      {eq.f>=1000?(eq.f/1000).toFixed(eq.f>=10000?0:1)+'k':eq.f}<span style={{fontSize:9}}>Hz</span>
                    </div>
                    <span style={{fontSize:8,color:C.muted}}>↕ גרור</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── App ──
export default function App(){
  const [students,setStudents]=useState(INIT_STUDENTS);
  const [exercises,setExercises]=useState(INIT_EXERCISES);
  const [exTypes,setExTypes]=useState(INIT_EX_TYPES);
  const [mixerChs,setMixerChs]=useState(INIT_MIX_CHS);
  const [user,setUser]=useState(null);
  const [view,setView]=useState('home');
  const [activeEx,setActiveEx]=useState(null);
  const [doneMap,setDoneMap]=useState({});
  const curStudent=user&&user.role==='student'?students.find(s=>s.id===user.studentId):null;
  const startEx=ex=>{setActiveEx(ex);setView('exercise');};
  const backHome=()=>{setActiveEx(null);setView('home');};
  const handleComplete=score=>{if(activeEx)setDoneMap(d=>({...d,[activeEx.id]:score}));};
  if(!user)return <LoginScreen students={students} onLogin={setUser}/>;
  const adminNav=[{id:'dashboard',icon:'📊',label:'דשבורד'},{id:'admin',icon:'⚙️',label:'ניהול'}];
  const studentNav=[{id:'home',icon:'📋',label:'התרגילים שלי'},{id:'mixer',icon:'🎚️',label:'מיקסר'}];
  const nav=user.role==='admin'?adminNav:studentNav;
  return(
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:"'Segoe UI',Arial,sans-serif",direction:'rtl',color:C.text}}>
      <div style={{width:196,background:C.card,borderLeft:'1px solid '+C.borderLit,display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh',flexShrink:0}}>
        <div style={{padding:'20px 16px 16px',borderBottom:'1px solid '+C.dim}}>
          <div style={{fontSize:13,fontWeight:900,color:C.y,letterSpacing:1}}>🎚️ SOUND ACADEMY</div>
          <div style={{fontSize:11,color:C.muted,marginTop:5}}>{user.name}</div>
          <div style={{fontSize:10,color:C.yMid}}>{user.role==='admin'?'⚙️ מנהל':'🎧 תלמיד'}</div>
        </div>
        <nav style={{flex:1,padding:'8px 0'}}>
          {nav.map(function(item){return(
            <button key={item.id} onClick={()=>{setView(item.id);setActiveEx(null);}}
              style={{width:'100%',padding:'10px 16px',background:view===item.id&&!activeEx?'rgba(255,215,0,.1)':'transparent',color:view===item.id&&!activeEx?C.y:C.muted,border:'none',borderRight:view===item.id&&!activeEx?'3px solid '+C.y:'3px solid transparent',cursor:'pointer',textAlign:'right',fontSize:13,display:'flex',alignItems:'center',gap:9}}>
              <span style={{fontSize:15}}>{item.icon}</span><span>{item.label}</span>
            </button>
          );})}
        </nav>
        <div style={{padding:12,borderTop:'1px solid '+C.dim}}>
          <button onClick={()=>setUser(null)} style={{width:'100%',padding:9,background:'transparent',color:C.muted,border:'1px solid '+C.dim,borderRadius:6,cursor:'pointer',fontSize:12}}>יציאה</button>
        </div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:'26px 28px'}}>
        {user.role==='admin'&&view==='dashboard'&&<AdminDashboard students={students} exercises={exercises} exTypes={exTypes}/>}
        {user.role==='admin'&&view==='admin'&&<AdminPanel exercises={exercises} setExercises={setExercises} students={students} setStudents={setStudents} exTypes={exTypes} setExTypes={setExTypes} mixerChs={mixerChs} setMixerChs={setMixerChs}/>}
        {user.role==='student'&&view==='home'&&!activeEx&&curStudent&&<StudentHome student={curStudent} exercises={exercises} exTypes={exTypes} doneMap={doneMap} onStart={startEx}/>}
        {user.role==='student'&&view==='mixer'&&<StudentMixer channels={mixerChs}/>}
        {user.role==='student'&&view==='exercise'&&activeEx&&(<>
          <ExerciseHeader exercise={activeEx} exTypes={exTypes} onBack={backHome}/>
          {activeEx.type==='freq'&&<FreqTrain onComplete={handleComplete}/>}
          {activeEx.type==='eq'&&<EQTrain onComplete={handleComplete}/>}
          {activeEx.type==='effects'&&<FXTrain onComplete={handleComplete}/>}
          {!BUILT_IN_TYPES.includes(activeEx.type)&&<GenericExercise exercise={activeEx} exTypes={exTypes} onComplete={handleComplete}/>}
        </>)}
      </div>
    </div>
  );
}
