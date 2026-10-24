/* 沿用原 Supabase 项目。新版数据写入独立字段，保留旧版历史打卡。 */
window.PlannerCloud = (() => {
 const URL='https://wdndkpoajujjnpthwwjn.supabase.co', KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkbmRrcG9hanVqam5wdHR3d2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTIzMjMsImV4cCI6MjEwNDUyODMyM30.W6r5aHzaSqCC2n_4dP_PCN3BqGUTDrpiWvcUf7dvhXE';
 const SLOT='_study_os_v2';
 let enabled=localStorage.getItem('study_cloud_enabled')!=='false';
 let loading=false, writing=false, queued=null;
 const headers={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
 const badge=(msg,err=false)=>{const b=document.getElementById('sync');if(b){b.textContent=msg;b.classList.toggle('error-state',err)}};
 const updateButton=()=>{const b=document.getElementById('syncToggle');if(b){b.classList.toggle('enabled',enabled);b.textContent=enabled?'☁ 云同步开启':'☁ 云同步关闭';b.setAttribute('aria-pressed',String(enabled))}};
 const validRecords=x=>x&&typeof x==='object'&&!Array.isArray(x);
 const validMilestones=x=>Array.isArray(x)&&x.every(m=>m&&TYPES[m.track]&&typeof m.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(m.date));
 async function request(method='GET',body){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);
  try {
   const suffix=method==='GET'?'?id=eq.main_planner&select=data':'?on_conflict=id';
   const response=await fetch(URL+'/rest/v1/planner_storage'+suffix,{method,headers:{...headers,...(method==='POST'?{Prefer:'resolution=merge-duplicates,return=minimal'}:{})},signal:ctl.signal,...(body?{body:JSON.stringify(body)}:{})});
   if(!response.ok)throw Error('HTTP '+response.status);
   return method==='GET'?await response.json():null;
  } finally {clearTimeout(timer)}
 }
 async function load(){
  updateButton();if(!enabled||loading)return;
  loading=true;badge('正在读取云端…');
  const before=localStorage.getItem('study_os_v2');
  try {
   const rows=await request();const db=rows[0]?.data||{};
   localStorage.setItem('academic_cloud_v8',JSON.stringify(db));
   const remote=db[SLOT],local=JSON.parse(before||'{}');
   // 读取期间有本机编辑时不覆盖；只有经过验证的新版记录才恢复到界面。
   if((remote?.version>=7)&&validEvents(remote.events)&&validRecords(remote.records)&&validMilestones(remote.milestones)&&
     (remote.updatedAt||0)>(local.updatedAt||0)&&localStorage.getItem('study_os_v2')===before){
    if(before)localStorage.setItem('study_os_before_cloud',before);
    localStorage.setItem('study_os_v2',JSON.stringify(remote));
    state.events=upgradeSchedule(remote);state.records=remote.records;state.milestones=remote.milestones;state.tempTasks=remote.tempTasks||[];const auxiliary=window.upgradePlannerAuxiliary?.(state);if(auxiliary){state.tempTasks=auxiliary.tempTasks;state.milestones=auxiliary.milestones}state.paperChecks=remote.paperChecks||{amc:{},bmo:{},ielts:{}};state.paperChecks.ielts=state.paperChecks.ielts||{};state.drafts=remote.drafts||{};
    if(remote.version<SCHEDULE_VERSION){localStorage.setItem('study_os_before_schedule_v11',JSON.stringify(remote));localStorage.setItem('study_os_v2',JSON.stringify(data()));await save(data())}
    renderAll();
   }
   badge('云端已读取 · 本机可用');
  } catch {badge('本机可用 · 云端暂离线',true)}
  finally {loading=false}
 }
 async function save(data){
  if(!enabled||state.role!=='all')return;
  queued=data;if(writing)return;writing=true;
  while(queued&&enabled){
   const next=queued;queued=null;badge('本机已保存 · 同步中…');
   try{
    // 先获取云端最新对象，避免覆盖旧版打卡字段。
    const rows=await request(),db=rows[0]?.data||{};
    if((db[SLOT]?.updatedAt||0)>(next.updatedAt||0)){
     badge('云端有较新版本 · 本机已保留',true);
     continue;
    }
    db[SLOT]=next;
    await request('POST',{id:'main_planner',data:db,updated_at:new Date().toISOString()});
    localStorage.setItem('academic_cloud_v8',JSON.stringify(db));
    badge('已保存 · 云同步完成');
   }catch{badge('本机已保存 · 云同步失败',true)}
  }
  writing=false;
 }
 document.addEventListener('DOMContentLoaded',()=>{
  updateButton();
  document.getElementById('syncToggle')?.addEventListener('click',()=>{
   if(state.role!=='all')return;
   enabled=!enabled;localStorage.setItem('study_cloud_enabled',String(enabled));updateButton();
   if(enabled)load();else badge('已关闭云同步 · 本机保存');
  });
 });
 return {load,save};
})();
