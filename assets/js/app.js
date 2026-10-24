// 登录账号：BeileLee；完整访问密码：081130Peter；仅月度路线密码：peterli。
// 这是静态页面锁，密码仅用于本地界面访问，不是服务端身份认证。
const LOGIN_USER='BeileLee', LOGIN_PASSWORD='081130Peter', MONTH_PASSWORD='peterli';
 const STORAGE='study_os_v2';
const SCHEDULE_VERSION=13;
// 竞赛阶段结束日是可调整参数；若官方考试日期变化，只需修改这一处。
const AMC_PHASE_END='2026-11-30';
const BMO_PHASE_END='2027-02-28';
const CONTEST_PHASE_END=BMO_PHASE_END;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateObj=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d))};
const dateString=d=>d.toISOString().slice(0,10);
const addDays=(s,n)=>{const d=dateObj(s);d.setUTCDate(d.getUTCDate()+n);return dateString(d)};
const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};
const duration=e=>mins(e.end)-mins(e.start);
const dayIndex=s=>(dateObj(s).getUTCDay()+6)%7;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const weekDates=()=>{const first=addDays(today(),-dayIndex(today())+state.week*7);return DAY_NAMES.map((_,i)=>addDays(first,i))};
const overlap=(a,b)=>mins(a.start)<mins(b.end)&&mins(a.end)>mins(b.start);
const isChristmas=s=>s>=CHRISTMAS_BREAK.start&&s<=CHRISTMAS_BREAK.end;
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const state={events:[],tempTasks:[],records:{},paperChecks:{amc:{},bmo:{},ielts:{}},milestones:[],drafts:{},view:'today',week:0,month:today().slice(0,7),role:null,edit:false,selected:null,panelMode:'block'};
let saveTimer=null,panelDirty=false;
const SCHOOL_SUBJECTS=[
 {id:'chemistry',name:'Chemistry AS',short:'化学',color:'#6d8fd5',bg:'#edf4ff',icon:'C',goals:['完成课堂作业并订正','回忆本节概念与方程','整理错题与实验要点'],desc:'按课堂内容完成作业、订正与实验要点回忆'},
 {id:'computer',name:'Computer Science AS',short:'计算机',color:'#8b62c5',bg:'#f0ebff',icon:'⌘',goals:['完成编程 / 理论作业','复述数据结构或算法','整理代码错误与知识卡'],desc:'代码练习、理论回忆与错误归档'},
 {id:'physics',name:'Physics AS',short:'物理',color:'#3b9a86',bg:'#e8f7f3',icon:'P',goals:['完成公式与计算题','复述物理过程与假设','整理错题并标注单位'],desc:'公式、计算题和单位检查'},
 {id:'mathematics',name:'Mathematics AL',short:'数学',color:'#3974cf',bg:'#eaf2ff',icon:'∑',goals:['完成当天题目并订正','闭卷回忆定义 / 定理','整理错题和变式'],desc:'当天题目、定义回忆与错题变式'},
 {id:'english',name:'English Literature',short:'英语文学',color:'#b78125',bg:'#fff3d8',icon:'A',goals:['完成文本细读任务','整理引用与写作论点','完成一段英文分析'],desc:'文本细读、引用和英文分析段落'},
 {id:'pshe',name:'PSHE / PE',short:'PSHE / PE',color:'#8a98a9',bg:'#f2f5f8',icon:'•',goals:['完成课堂任务','记录本节反思或训练内容'],desc:'课堂任务与反思记录'}
];

function validEvents(x){return Array.isArray(x)&&x.every(e=>e&&typeof e.day==='number'&&/^\d\d:\d\d$/.test(e.start||'')&&/^\d\d:\d\d$/.test(e.end||''))}
function validRecords(x){return x&&typeof x==='object'&&!Array.isArray(x)}
function validMilestones(x){return Array.isArray(x)&&x.every(m=>m&&TYPES[m.track]&&/^\d{4}-\d{2}-\d{2}$/.test(m.date))}
window.validEvents=validEvents;window.validRecords=validRecords;window.validMilestones=validMilestones;
 function data(){return {version:SCHEDULE_VERSION,updatedAt:Date.now(),events:state.events,tempTasks:state.tempTasks,records:state.records,paperChecks:state.paperChecks,milestones:state.milestones,drafts:state.drafts}}
function save(){localStorage.setItem(STORAGE,JSON.stringify(data()));$('sync').innerHTML='<span class="sync-icon">☁</span><span>Cloud synchronise · Saved</span>';clearTimeout(saveTimer);saveTimer=setTimeout(()=>window.PlannerCloud?.save(data()),500)}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
// 迁移旧模板时保留个人打卡与手动修改，并清理已取消和停学科目。
function inactiveExamReview(e){
 const ids=['chemistry','computer','physics','mathematics','english'];
 const subject=ids.includes(e.subject)?e.subject:ids[((e.day||0)%ids.length+ids.length)%ids.length];
 const short=SCHOOL_SUBJECTS.find(s=>s.id===subject)?.short||'科目';
 return {...e,type:'review',subject,name:'课内复习 · '+short+' · 错题回测',note:'完成对应科目作业、订正错题，并预习后续课程。'};
}
function upgradePlannerAuxiliary(source){
 const tempTasks=(source.tempTasks||[]).map(t=>t.type==='tmua'||t.type==='step'?inactiveExamReview(t):t);
 const milestones=(source.milestones||DEFAULT_MILESTONES).map(m=>m.track==='tmua'||m.track==='step'?{...m,track:'review',title:'课内复习：校内错题与后续课程预习'}:m.track==='himcm'&&/随机建模|随机模拟/i.test(m.title||'')?{...m,title:'HiMCM：历年真题分析与题目拆解'}:m);
 return {tempTasks,milestones};
}
window.upgradePlannerAuxiliary=upgradePlannerAuxiliary;
function upgradeSchedule(raw){
 const defaults=buildDefaultSchedule();
 if(raw.version>=SCHEDULE_VERSION)return raw.events;
 const events=raw.events.flatMap(e=>{
  const meal=e.type==='rest'&&/早餐|午餐|晚餐/.test(e.name)?{meal:true}:{};
  if(/pastoral/i.test(e.name||''))return [];
  if((e.date==='2026-11-11'||e.id?.startsWith('course-2026-11-11-'))&&e.type==='bmo')return [];
  const template=defaults.find(x=>x.id===e.id);
  if(template&&e.id?.startsWith('base-')&&(e.type==='tmua'||e.type==='step'||(e.type==='ielts'&&e.start==='05:35')||(e.day<5&&e.start==='06:45')||(e.studyPeriod&&e.type==='ielts')||(e.day<5&&e.start==='13:10'&&e.end==='13:30'&&e.type==='rest'))){
   return [{...template,...meal,id:e.id}];
  }
  if((e.type==='tmua'||e.type==='step')&&!template)return [inactiveExamReview({...e,...meal})];
  if(template&&e.id?.startsWith('base-')&&e.type==='himcm'&&/随机建模|随机模拟/i.test((e.name||'')+' '+(e.note||'')))return [{...e,...template,id:e.id}];
  return [{...e,...meal}];
 });
 for(const target of defaults.filter(e=>e.studyPeriod||e.meal||e.type==='interest')){
  if(target.type==='interest'&&events.some(e=>e.day===target.day&&e.type==='interest'))continue;
  const conflicts=events.filter(e=>e.day===target.day&&overlap(e,target));
  const canTrim=e=>!e.fixed&&e.id?.startsWith('base-')&&(
   (target.meal&&target.start==='18:00'&&e.start==='17:20'&&e.end==='18:20'&&e.type==='review'&&e.name==='课内复习 · 作业与错题')||
   (target.meal&&target.start==='19:10'&&e.start==='19:10'&&e.end==='21:20'&&e.type==='review'&&e.name==='课内复习 · 预习与回测')||
   (target.meal&&target.start==='06:20'&&e.start==='06:20'&&e.end==='06:50'&&e.type==='rest'&&e.name==='出发 · 游泳准备'));
  if(conflicts.some(e=>!canTrim(e)))continue;
  for(const e of conflicts){if(e.start<target.start)e.end=target.start;else e.start=target.end}
  events.push({...target,id:events.some(e=>e.id===target.id)?target.id+'-planned':target.id});
 }
 return events.sort((a,b)=>a.day-b.day||mins(a.start)-mins(b.start));
}
 function load(){let raw;try{raw=JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{};if(raw&&validEvents(raw.events)){Object.assign(state,{...raw,view:'today',week:0,month:today().slice(0,7),role:null,edit:false,selected:null,panelMode:'block'});state.tempTasks=state.tempTasks||[];state.records=state.records||{};state.paperChecks=state.paperChecks||{amc:{},bmo:{},ielts:{}};state.paperChecks.ielts=state.paperChecks.ielts||{};state.milestones=state.milestones||DEFAULT_MILESTONES;if(raw.version<SCHEDULE_VERSION||!raw.version){localStorage.setItem('study_os_before_schedule_v11',JSON.stringify(raw));state.events=upgradeSchedule(raw);Object.assign(state,upgradePlannerAuxiliary(state));save()}}else{state.events=buildDefaultSchedule();state.tempTasks=[];state.records={};state.paperChecks={amc:{},bmo:{},ielts:{}};state.milestones=DEFAULT_MILESTONES.slice();save()}}
function contestPaper(kind,date,sequence=0){const start='2026-10-09';if(date<start)return '';const list=PAPER_LISTS[kind]||[];const offset=Math.max(0,Math.floor((dateObj(date)-dateObj(start))/86400000));const index=(kind==='amc'?Math.floor(offset*1.5):Math.floor(offset*0.72))+sequence;return list[Math.min(index,list.length-1)]||list[list.length-1]||''}
function contestNote(kind,date,sequence=0){const paper=contestPaper(kind,date,sequence);return kind==='amc'?'完成 '+paper+' 计时练习并记录用时与错因；下一次训练直接继续下一套。':'从 '+paper+' 选 2 题计时，完整写出证明并订正。'}
function plannedItems(trackId){const end=trackId==='amc'?AMC_PHASE_END:trackId==='bmo'?BMO_PHASE_END:trackId==='ielts'?'2027-01-13':trackId==='nlp'?'2026-12-06':trackId==='himcm'?'2026-12-31':'2027-12-31';const out=[];for(let d='2026-10-09';d<=end;d=addDays(d,1)){for(const e of eventsFor(d)){if(progressTrack(e)===trackId)out.push({d,e})}}return out}
function uniqueCompleted(items,trackId){if(!['amc','bmo'].includes(trackId))return items.filter(x=>done(x.d,x.e));const seen=new Set(),out=[];for(const x of items){if(done(x.d,x.e)&&!seen.has(x.e.name)){seen.add(x.e.name);out.push(x)}}return out}
const IELTS_PRACTICE_PAPERS=Array.from({length:20},(_,i)=>`Cambridge IELTS ${16+Math.floor(i/4)} · Test ${i%4+1}`);
function nextIeltsPaper(){return IELTS_PRACTICE_PAPERS.find(p=>!state.paperChecks.ielts?.[p])||IELTS_PRACTICE_PAPERS[IELTS_PRACTICE_PAPERS.length-1]}
function ieltsTask(e){const paper=nextIeltsPaper(),section=e.ieltsSection||'听力';const name='雅思 · '+(section==='词汇'?'词汇预热':section)+' · '+paper;return {name,note:section==='词汇'?'积累当前真题中的词汇与表达。':'完成 '+paper+' 的'+section+'分项；整套完成后勾选，下一次计划自动进入下一套。'}}
const clockTime=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
function trimAround(events,block){
 return events.flatMap(e=>{
  if(!overlap(e,block))return [e];
  const parts=[];
  if(mins(e.start)<mins(block.start))parts.push({...e,end:block.start});
  if(mins(e.end)>mins(block.end))parts.push({...e,start:block.end,id:parts.length?e.id+'-after-'+block.start.replace(':',''):e.id});
  return parts.filter(p=>duration(p)>=(p.type==='rest'?5:20));
 });
}
function addDateCourses(base,courses){
 const protectedEvents=base.filter(e=>(e.fixed&&e.type!=='rest')||e.type==='school'||e.type==='interest');
 const flexible=base.filter(e=>!protectedEvents.includes(e));
 const affected=flexible.filter(e=>courses.some(c=>overlap(e,c)));
 let adjusted=courses.reduce((events,c)=>trimAround(events,c),flexible);
 adjusted.push(...protectedEvents,...courses);
 // 与线上课冲突的用餐改到课程结束后，必要时让计时训练让出 20 分钟。
 for(const meal of affected.filter(e=>e.meal)){
  if(adjusted.some(e=>e.id===meal.id&&duration(e)>=15))continue;
  const earliest=Math.max(mins(meal.start),...courses.filter(c=>overlap(c,meal)).map(c=>mins(c.end)));
  for(let start=earliest;start+20<=1260;start+=5){
   const candidate={...meal,start:clockTime(start),end:clockTime(start+20),note:meal.note+' 线上课当天顺延用餐。'};
   if(adjusted.some(e=>(e.fixed||e.type==='school'||e.type==='interest'||e.meal)&&overlap(e,candidate)))continue;
   adjusted=adjusted.filter(e=>e.id!==meal.id);adjusted=trimAround(adjusted,candidate);adjusted.push(candidate);break;
  }
 }
 // 晚间被课程挤掉的作业与项目优先挪到当天自习课，避免整块消失。
 for(const task of affected.filter(e=>!e.studyPeriod&&['review','himcm','nlp'].includes(e.type))){
  const kept=adjusted.filter(e=>e.id===task.id||e.id.startsWith(task.id+'-after-')).reduce((n,e)=>n+duration(e),0);
  if(kept>=20)continue;
  const slot=adjusted.filter(e=>e.studyPeriod&&!e.fixed&&duration(e)>=30).sort((a,b)=>(a.type===task.type?-1:0)-(b.type===task.type?-1:0)||mins(a.start)-mins(b.start))[0];
  if(!slot)continue;
  const moved={...task,start:slot.start,end:clockTime(mins(slot.start)+Math.min(duration(task),duration(slot))),note:task.note+' 线上课当天移至自习时段。'};
  adjusted=trimAround(adjusted,moved);adjusted.push(moved);
 }
 return adjusted;
}
function eventsFor(date){
 let base=isChristmas(date)?holidayEvents(date):state.events.filter(e=>e.day===dayIndex(date)).map(e=>({...e}));
 const dateCourses=DATE_COURSE_EVENTS.filter(e=>e.date===date).map(e=>({...e,day:dayIndex(date),id:`course-${date}-${e.start.replace(':','')}`,dateCourse:true}));
 if(dateCourses.length)base=addDateCourses(base,dateCourses);
 const start=new Date('2026-09-14T00:00:00Z');
 const week=Math.max(1,Math.floor((dateObj(date)-start)/604800000)+1);
 const revision=['chemistry','computer','physics','mathematics','english','chemistry','computer'];
 const enrichment=[
  {al:'AL 高数 · 指数与对数复习'},{al:'AL 高数 · 三角函数与恒等式'},
  {al:'AL 高数 · 微分基础与切线'},{al:'AL 高数 · 微分应用与优化'},
  {al:'AL 高数 · 积分与面积'},{al:'AL 高数 · 积分应用与体积'},
  {al:'AL 高数 · 数列与级数'},{al:'AL 高数 · 向量与直线'},
  {al:'AL 高数 · 微分方程预习'},{al:'AL 高数 · 统计与概率衔接'},
  {al:'AL 高数 · 综合章节练习'},{al:'AL 高数 · 期末复习与预习'}
 ][Math.min(11,Math.max(0,week-1))];
 for(const e of base){
  if((e.type==='amc'||e.type==='bmo')&&!e.dateCourse&&date>='2026-10-09'){
   const earlierAmc= e.type==='amc'&&!e.studyPeriod&&base.some(x=>x.type==='amc'&&x.studyPeriod&&mins(x.start)<mins(e.start));
   const sequence=e.type==='amc'&&earlierAmc?1:0,paper=contestPaper(e.type,date,sequence);
   if(paper){e.name=`${e.type==='amc'?'AMC12':'BMO1'} · ${paper}${e.type==='amc'&&e.studyPeriod?' · 下一套限时练习':e.type==='bmo'&&e.studyPeriod?' · 证明订正':''}`;e.note=e.type==='amc'?contestNote(e.type,date,sequence):e.studyPeriod?'自习时段独立完成证明订正与方法总结。':contestNote(e.type,date)}
  }
  if(e.type==='review'&&!e.subject){e.subject=revision[dayIndex(date)];e.name='课内复习 · '+(SCHOOL_SUBJECTS.find(s=>s.id===e.subject)?.short||'科目')+' · '+e.name.replace(/^课内复习[ ·]*/,'')}
  if(e.type==='himcm'){const c=MODEL_CURRICULUM[Math.min(MODEL_CURRICULUM.length-1,week-1)];if(c){e.name='HiMCM · '+c.title;e.note=c.output}}
  if(e.type==='nlp'&&week>=5&&week<=12){const c=INTERNSHIP_CURRICULUM[Math.min(INTERNSHIP_CURRICULUM.length-1,week-5)];if(c){e.name='NLP · '+c.title;e.note=c.output}}
  if(enrichment && date>='2026-10-09'){
   if(e.type==='al'){e.name=enrichment.al;e.note='完成章节预习、例题和 3 道变式题。'}
  }
  if(e.type==='ielts')Object.assign(e,ieltsTask(e));
  if(date>AMC_PHASE_END&&e.type==='amc'){e.type='review';e.subject=revision[dayIndex(date)];e.name='课内复习 · AMC 阶段结束后的科目回顾';e.note='AMC 阶段结束，改为课内错题回测与下周预习。'}
  else if(date>BMO_PHASE_END&&e.type==='bmo'){e.type='review';e.subject=revision[dayIndex(date)];e.name='课内复习 · BMO 阶段结束后的科目回顾';e.note='BMO 阶段结束，改为课内错题回测与下周预习。'}
  else if(date>CONTEST_PHASE_END&&['himcm','nlp'].includes(e.type)){e.type='review';e.subject=revision[dayIndex(date)];e.name='课内复习 · '+(SCHOOL_SUBJECTS.find(s=>s.id===e.subject)?.short||'科目')+' · 错题与预习';e.note='竞赛项目阶段结束，优先复习校内科目。'}
 }
 const temps=state.tempTasks.filter(t=>date>=t.startDate&&date<=t.endDate&&t.days.includes(dayIndex(date)));
 for(const t of temps){const protectedBlocks=base.filter(e=>e.fixed||e.type==='school'||e.type==='interest'||e.meal);const fragments=protectedBlocks.reduce((items,e)=>trimAround(items,e),[{...t,id:t.id+'-'+date,temp:true,fixed:false}]);for(const fragment of fragments){base=trimAround(base,fragment);base.push(fragment)}}
 // 同时保留校内课与线上课，并在三个视图中明确提示真实时间冲突。
 base.sort((a,b)=>mins(a.start)-mins(b.start));
 const conflicts=new Map();
 const record=(a,b)=>{const list=conflicts.get(a)||[];list.push(`${b.name} ${b.start}–${b.end}`);conflicts.set(a,list)};
 for(let i=0;i<base.length;i++)for(let j=i+1;j<base.length&&mins(base[j].start)<mins(base[i].end);j++){record(base[i],base[j]);record(base[j],base[i])}
 for(const [e,list] of conflicts)e.conflictNote='时间冲突：'+list.join('；');
 return base;
}
function taskKey(date,e){return date+'|'+e.id}
function done(date,e){return !!state.records[taskKey(date,e)]}
function setDone(date,e,val){if(val)state.records[taskKey(date,e)]=true;else delete state.records[taskKey(date,e)];save();renderAll()}
function subjectOf(e){const s=(e.subject||e.name||'').toLowerCase();if(s.includes('chem'))return'chemistry';if(s.includes('computer')||s.includes('comp'))return'computer';if(s.includes('phys'))return'physics';if(s.includes('math'))return'mathematics';if(s.includes('english')||s.includes('lit'))return'english';if(s.includes('pshe')||s.includes('pe'))return'pshe';return'school-other'}
function progressTrack(e){if(e.type==='school')return'school-'+subjectOf(e);if(e.type==='review'&&e.subject)return'school-'+e.subject;return e.type}
function track(id){return TRACKS.find(t=>t.id===id)||SCHOOL_SUBJECTS.find(t=>'school-'+t.id===id)}
function trackColor(id){return track(id)?.color||TYPES[id]?.color||'#2563eb'}
function eventLabel(e){return e.dateCourse?'BMO线上课程':TYPES[e.type]?.label||e.type}
function taskGoals(e){if(e.dateCourse)return ['按时参加 BMO 线上课程','记录例题、证明方法与课后练习'];if(e.type==='school')return track(progressTrack(e))?.goals||['完成课堂任务'];return track(e.type)?.goals||['完成这个时间块的计划产出']}
function paperForWeek(kind,date){const list=PAPER_LISTS[kind]||[];const start=new Date('2026-09-14T00:00:00Z');const n=Math.max(0,Math.floor((dateObj(date)-start)/604800000));return list[Math.min(list.length-1,n)]||list[0]||'待指定年份'}
function holidayEvents(date){
 const d=dayIndex(date),r=[],add=(start,end,name,type,note,meta={})=>r.push({id:'holiday-'+date+'-'+start,day:d,start,end,name,type,note:note||'',fixed:false,...meta});
 add('05:30','06:00','雅思 · 词汇预热','ielts','积累当前真题中的词汇与表达。',{ieltsSection:'词汇'});
 if(d===5||d===6){add('06:50','10:30','游泳训练 · 往返','swim','周末游泳照常。');add('10:30','11:00','洗澡 · 补水 · 补给','rest','训练后恢复。');}
 else {add('06:00','06:30','晨跑 30 分钟','run','假期保持低强度。');add('06:30','06:50','洗澡 · 早餐','rest','跑后恢复。');const section=IELTS_SECTIONS[d%IELTS_SECTIONS.length];add('06:50','07:30','雅思 · '+section+'专项练习','ielts','独立完成当前真题的'+section+'分项。',{ieltsSection:section});}
 const weekend=d===5||d===6,subject=SCHOOL_SUBJECTS[(d+dateObj(date).getUTCDate())%5];
 add(weekend?'11:00':'09:00',weekend?'12:30':'10:30','课内复习 · '+subject.short+' · 错题与作业','review','分科完成校内作业、错题订正和考点回忆。',{subject:subject.id});
 if(date<=AMC_PHASE_END)add(weekend?'13:30':'10:45',weekend?'15:00':'12:00','AMC12 · '+(contestPaper('amc',date)||paperForWeek('amc',date)),'amc',contestNote('amc',date)||'完成下一套真题并记录用时与错因。');else add(weekend?'13:30':'10:45',weekend?'15:00':'12:00','课内复习 · '+subject.short+' · 阶段复习','review','AMC 阶段结束，时段转为校内真题、作业与错题回测。',{subject:subject.id});
 if(date<=BMO_PHASE_END)add(weekend?'15:20':'13:30',weekend?'16:50':'15:00','BMO1 · '+(contestPaper('bmo',date)||paperForWeek('bmo',date)),'bmo',contestNote('bmo',date)||'假期按年份清单写完整证明。');else add(weekend?'15:20':'13:30',weekend?'16:50':'15:00','课内复习 · '+subject.short+' · 周测准备','review','BMO 阶段结束，时段转为校内复习和周测准备。',{subject:subject.id});
 add(weekend?'17:10':'15:20',weekend?'18:00':'16:30',d%2?'NLP · 项目 / 作品集':'HiMCM · 历年真题分析',d%2?'nlp':'himcm',d%2?'轻量推进实习项目并整理成果。':'拆解历年 HiMCM 真题，梳理目标、约束、数据需求与可行模型。');
 add('19:00','20:00','课内复习 · 周科目回顾','review','按进度表逐科回测',{subject:subject.id});add('20:00','20:40','AL 高数 · 章节回顾','al','假期继续预习和整理错题。');
 add('21:10','21:40','兴趣时间 · 网页编写 / UI 设计 / 论文研究','interest','每天保留 30 分钟，自选一个兴趣主题。');
 return r;
}
const QUOTES=[
 ['把今天走稳，远方自会清晰。','每一步专注，都会成为下一步的力量。'],
 ['你不必一次完成全部，只要认真完成此刻。','稳定的积累，最后会变成惊人的答案。'],
 ['今天的自律，是明天选择更多的底气。','把难题拆小，把行动做实。'],
 ['先完成，再完善；先出发，再抵达。','你正在成为那个可以解决难题的人。'],
 ['愿你今日所学，成为未来自由的底色。','专注当下，时间会替你证明。']
];
 function renderToday(){const d=today(), list=eventsFor(d), completed=list.filter(e=>done(d,e)).length, study=list.filter(e=>done(d,e)&&!['school','rest','run','swim','workout'].includes(e.type)).reduce((a,e)=>a+duration(e),0);const q=QUOTES[Math.floor(Date.now()/86400000)%QUOTES.length];$('dailyDate').textContent=new Intl.DateTimeFormat('zh-CN',{dateStyle:'full',timeZone:'Asia/Shanghai'}).format(new Date());$('quoteTitle').textContent=q[0];$('quoteSub').textContent=q[1];const pct=list.length?Math.round(completed/list.length*100):0;const learning=list.filter(e=>['amc','bmo','himcm','nlp','ielts','al','tmua','step','interest'].includes(e.type));const training=list.filter(e=>['run','swim','workout'].includes(e.type));$('todayStats').innerHTML=[['完成进度',`<div class="stat-progress"><i style="width:${pct}%"></i></div><strong class="stat-percent">${pct}%</strong>`,'已完成 '+completed+' 个时间块','progress'],['已学习时长',hours(study),'只统计已勾选的学习块','hours'],['今日分配学习内容',`${learning.length} 个模块`,'点击查看今天的竞赛、实习与进阶安排','learning'],['训练安排',`${training.length} 项训练`,'点击查看跑步、游泳与力量训练','training']].map(x=>`<button class="stat stat-action" data-today-card="${x[3]}"><div class="stat-top"><span>${x[0]}</span><span class="stat-arrow">↗</span></div><div class="stat-value">${x[1]}</div><div class="stat-note">${x[2]}</div></button>`).join('');$('todayList').innerHTML=list.map(e=>`<div class="today-item ${done(d,e)?'completed':''}"><div class="timeline-dot" style="background:${trackColor(e.type)}"></div><div class="t-time">${e.start}<span>–${e.end}</span></div><button class="task-open" data-task="${esc(e.id)}" data-date="${d}"><div class="t-name">${esc(e.name)} ${e.temp?'<span class="now-label">临时覆盖</span>':''}</div><div class="t-meta">${esc(e.note||'点击查看细分安排')}${e.conflictNote?'<span class="schedule-conflict">'+esc(e.conflictNote)+'</span>':''}</div></button><input class="check" type="checkbox" data-check="${esc(e.id)}" data-date="${d}" ${done(d,e)?'checked':''}></div>`).join('')}function hours(m){return Math.floor(m/60)+'h'+(m%60?m%60+'m':'')}
 function openTodayCard(kind){const d=today(),list=eventsFor(d);if(kind==='hours'||kind==='progress')return;const isTraining=kind==='training',items=list.filter(e=>isTraining?['run','swim','workout'].includes(e.type):['amc','bmo','himcm','nlp','ielts','al','tmua','step','interest'].includes(e.type));const title=isTraining?'今日训练安排':'今日分配学习内容';openModal(title,items.map(e=>`<div class="agenda-task"><time>${e.start}–${e.end}</time><span><b>${esc(e.name)}</b><small>${esc(e.note||'')}</small></span></div>`).join('')||'<div class="empty">今天暂无安排</div>')}
// 重叠事件分栏显示，保留原始课时，不让线上课盖住校内课。
function weekLayout(events){
 const result=[];let group=[],end=0;
 const flush=()=>{const lanes=[];for(const e of group){let lane=lanes.findIndex(until=>until<=mins(e.start));if(lane<0)lane=lanes.length;lanes[lane]=mins(e.end);e.lane=lane}for(const e of group){e.lanes=lanes.length;result.push(e)}group=[]};
 for(const event of events){if(group.length&&mins(event.start)>=end){flush();end=0}group.push({...event});end=Math.max(end,mins(event.end))}
 flush();return result;
}
function renderWeek(){
 const ds=weekDates(), dayStart=300, dayEnd=1320, pxHour=58;
 $('weekLabel').textContent=ds[0].slice(5).replace('-','/')+' — '+ds[6].slice(5).replace('-','/');
 $('weekSummary').innerHTML=ds.map((d,i)=>{const l=eventsFor(d),study=l.filter(e=>['review','amc','bmo','ielts','himcm','nlp','al','tmua','step','interest'].includes(e.type)).reduce((a,e)=>a+duration(e),0);return `<span><i style="background:${i<5?'#27847b':'#328bc4'}"></i>${DAY_NAMES[i]} <b>${hours(study)}</b></span>`}).join('');
 const trackHeight=(dayEnd-dayStart)/60*pxHour; const labels=[]; for(let m=dayStart;m<=dayEnd;m+=60){const h=String(Math.floor(m/60)).padStart(2,'0');labels.push(`<span style="top:${(m-dayStart)/60*pxHour}px">${h}:00</span>`)}
 const head=`<div class="week-corner">时间</div>`+ds.map((d,i)=>`<div class="gh ${d===today()?'today':''}">${DAY_NAMES[i]}<b>${d.slice(5).replace('-','/')}</b></div>`).join('');
 const body=`<div class="time-rail" style="--track-height:${trackHeight}px">${labels.join('')}</div>`+ds.map(d=>{const ev=weekLayout(eventsFor(d).filter(e=>e.type!=='rest'&&(duration(e)>=20||e.type==='school')));return `<div class="day-track ${d===today()?'today-track':''}" style="--hour:${pxHour}px;--track-height:${trackHeight}px">${ev.map(e=>{const top=(mins(e.start)-dayStart)/60*pxHour,height=Math.max(2,duration(e)/60*pxHour),compact=duration(e)<35;const icon=TYPES[e.type]?.icon||'•';return `<button class="event ${e.type} ${compact?'compact':''} ${e.conflictNote?'has-conflict':''} ${e.temp?'temp':''} ${state.edit&&!e.fixed?'edit-mode':''} ${done(d,e)?'done':''}" style="--event-top:${top}px;--event-height:${height}px;--event-lane:${e.lane};--event-lanes:${e.lanes}" data-event="${esc(e.id)}" data-date="${d}" title="${esc(e.name)} · ${e.start}–${e.end}${e.conflictNote?' · '+esc(e.conflictNote):''}"><div class="time">${e.start}–${e.end}</div><div class="name"><span class="event-icon">${icon}</span>${e.conflictNote?'⚠ ':''}${esc(e.name)}</div><span class="tag">${e.temp?'重点 · 临时覆盖':(eventLabel(e))}</span></button>`}).join('')}</div>`}).join('');
 $('grid').innerHTML=head+body;
}
function grouped(date){const allowed=new Set(['school','review','run','swim','workout','interest','ielts','al','amc','bmo','himcm','nlp']);const groups={};for(const e of eventsFor(date).filter(e=>allowed.has(e.type))){const key=eventLabel(e);(groups[key]||(groups[key]=[])).push(e)}return groups}function openModal(title,body){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;const m=$('modal');if(!m.open)m.showModal()}
 function renderMonth(){const [y,m]=state.month.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1)),offset=(first.getUTCDay()+6)%7,days=new Date(Date.UTC(y,m,0)).getUTCDate();$('monthLabel').textContent=y+'年'+m+'月';let h=DAY_NAMES.map(d=>`<div class="calendar-head">${d}</div>`).join('');for(let i=0;i<offset;i++)h+='<div class="calendar-cell other"></div>';for(let day=1;day<=days;day++){const d=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`,groups=grouped(d);h+=`<div class="calendar-cell ${d===today()?'cal-today':''}"><button class="calendar-day" data-date-detail="${d}">${day}</button><div class="calendar-note">${Object.keys(groups).map(k=>`${esc(k)} ${groups[k].length}`).join(' · ')||'无安排'}</div>${eventsFor(d).filter(e=>e.dateCourse).map(e=>`<div class="calendar-course">${e.start}–${e.end}<br>${esc(e.name)}</div>`).join('')}${eventsFor(d).some(e=>e.conflictNote)?'<div class="schedule-conflict">⚠ 课程时间重叠，点击查看</div>':''}</div>`}const tail=(7-((offset+days)%7))%7;for(let i=0;i<tail;i++)h+='<div class="calendar-cell other"></div>';$('calendar').innerHTML=h}function renderRoadmap(){const ids=['himcm','nlp','amc','bmo','review','ielts'];$('roadmap').innerHTML=ids.map(id=>{const t=track(id), ms=state.milestones.filter(x=>x.track===id), doneN=ms.filter(x=>x.done).length;return `<div class="phase"><div class="phase-head"><div class="phase-title" style="color:${t?.color||'#2563eb'}">${esc(t?.name||id)}</div><div class="phase-date">${doneN}/${ms.length||0} 里程碑</div></div><p>${esc(t?.desc||'按周推进，点击日期查看当天模块')}</p><div class="bar"><i style="width:${ms.length?doneN/ms.length*100:0}%;background:${t?.color||'#2563eb'}"></i></div></div>`}).join('');$('milestoneList').innerHTML=state.milestones.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(m=>`<div class="milestone-row"><input type="checkbox" data-ms="${m.id}" ${m.done?'checked':''}><label class="milestone-label ${m.done?'done':''}"><b>${esc(m.title)}</b><small>${m.date} · ${esc(track(m.track)?.name||m.track)}</small></label><button class="close" data-ms-edit="${m.id}">✎</button></div>`).join('')}
 function renderMonthAccessible(){const [y,m]=state.month.split('-').map(Number),first=new Date(Date.UTC(y,m-1,1)),offset=(first.getUTCDay()+6)%7,days=new Date(Date.UTC(y,m,0)).getUTCDate();$('monthLabel').textContent=y+'年'+m+'月';let h=DAY_NAMES.map(d=>`<div class="calendar-head">${d}</div>`).join('');for(let i=0;i<offset;i++)h+='<div class="calendar-cell other"></div>';for(let day=1;day<=days;day++){const d=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`,groups=grouped(d);h+=`<div class="calendar-cell calendar-date ${d===today()?'cal-today':''}" data-date-detail="${d}" role="button" tabindex="0"><span class="calendar-day">${day}</span><div class="calendar-note">${Object.keys(groups).map(k=>`${esc(k)} ${groups[k].length}`).join(' · ')||'无安排'}</div>${eventsFor(d).filter(e=>e.dateCourse).map(e=>`<div class="calendar-course">${e.start}–${e.end}<br>${esc(e.name)}</div>`).join('')}${eventsFor(d).some(e=>e.conflictNote)?'<div class="schedule-conflict">⚠ 课程时间重叠，点击查看</div>':''}</div>`}const tail=(7-((offset+days)%7))%7;for(let i=0;i<tail;i++)h+='<div class="calendar-cell other"></div>';$('calendar').innerHTML=h}
 renderMonth=renderMonthAccessible;
 function renderProgress(){
 const ds=weekDates(), all=ds.flatMap(d=>eventsFor(d).map(e=>({d,e}))), stats=all.filter(x=>['review','amc','bmo','ielts','himcm','nlp','al'].includes(x.e.type)), doneN=stats.filter(x=>done(x.d,x.e)).length;
 const upcoming=SCHOOL_ASSESSMENT_WEEKS.filter(w=>w.end>=today()), current=SCHOOL_ASSESSMENT_WEEKS.find(w=>today()>=w.start&&today()<=w.end);
 $('progressStats').innerHTML=[['本周学习块',stats.length,'校内课程不计入'],['本周已完成',doneN,`${stats.length?Math.round(doneN/stats.length*100):0}% · 只统计已完成学习块`],['近期校内节点',upcoming.length+' 周','考试、测验与项目提醒']].map(x=>`<div class="stat"><div class="stat-top"><span>${x[0]}</span></div><div class="stat-value">${x[1]}</div><div class="stat-note">${x[2]}</div></div>`).join('');
 const subjectItems=SCHOOL_SUBJECTS.map(t=>{const items=all.filter(x=>progressTrack(x.e)==='school-'+t.id);const key=t.id==='chemistry'?'Chemistry':t.id==='computer'?'Computer Science':t.id==='physics'?'Physics':t.id==='mathematics'?'Mathematics':'English Literature';const calendarItems=ASSESSMENT_CALENDAR[key]||[],finished=calendarItems.filter(a=>a[1]<today()).length,pct=calendarItems.length?Math.round(finished/calendarItems.length*100):0,assessments=calendarItems.filter(a=>a[1]>=today()).slice(0,4);return `<details class="subject-row"><summary class="progress-task readonly"><span class="progress-icon mini-subject" style="background:${t.bg};color:${t.color}">${t.icon}</span><span><b>${esc(t.name)}</b><small>${esc(t.desc)} · 已完成 ${finished}/${calendarItems.length} 个日历节点</small></span><strong>${pct}%</strong></summary><div class="assessment-list">${assessments.map(a=>`<div><time>${a[0].slice(5)}–${a[1].slice(5)}</time><span>${esc(a[2])}</span></div>`).join('')||'<div class="muted">本学期已完成或暂无后续安排</div>'}</div></details>`}).join('');
 const schoolOverview=`<div class="progress-card school-overview-progress" style="--progress:#27847b"><details open><summary class="progress-top"><div class="progress-title"><span class="progress-icon" style="background:#e8f6f3;color:#27847b">▣</span>课内进度 · 周考试总览</div><div class="percent">${current?'当前第 '+current.week+' 周':'学期节点'}</div></summary><p class="track-desc">按周查看校内考试、测验与项目节点。</p><div class="assessment-board">${upcoming.map(w=>`<details class="assessment-week" ${w===current?'open':''}><summary><span class="week-badge">第 ${w.week} 周</span><span>${w.label}</span><b>${w.items.length} 项</b></summary><div class="assessment-items">${w.items.map(i=>`<div class="assessment-item"><span>${esc(i[0])}</span><strong>${esc(i[1])}</strong></div>`).join('')}</div></details>`).join('')}</div></details></div>`;
 const schoolSubjects=`<div class="progress-card school-subject-progress" style="--progress:#3974cf"><details><summary class="progress-top"><div class="progress-title"><span class="progress-icon" style="background:#eaf2ff;color:#3974cf">∑</span>课内考试进度</div><div class="percent">按学科</div></summary><p class="track-desc">点开学科查看具体考试节点和完成比例。</p><div class="items subject-items">${subjectItems}</div></details></div>`;
 const cards=[schoolOverview], ieltsDone=IELTS_PRACTICE_PAPERS.filter(p=>state.paperChecks.ielts?.[p]).length, ieltsPct=Math.round(ieltsDone/IELTS_PRACTICE_PAPERS.length*100), sectionLabels=['Listening 听力','Reading 阅读','Writing 写作','Speaking 口语'];
 const ieltsCard=`<div class="progress-card compact-progress ielts-progress" style="--progress:#b78125"><details><summary class="progress-top"><div class="progress-title"><span class="progress-icon" style="background:#fff3d8;color:#b78125">A</span>雅思 IELTS · 真题进度</div><div class="percent">${ieltsDone}/${IELTS_PRACTICE_PAPERS.length} · ${ieltsPct}%</div></summary><p class="track-desc">听力、阅读、写作、口语分项安排；完成一整套后勾选，下一套自动进入计划。</p><div class="bar"><i style="width:${ieltsPct}%;background:#b78125"></i></div><div class="track-count"><span>已完成 ${ieltsDone} 套真题</span><b>计划 ${IELTS_PRACTICE_PAPERS.length} 套</b></div><div class="items paper-readonly">${IELTS_PRACTICE_PAPERS.map(p=>`<label class="item"><span class="paper-dot">${state.paperChecks.ielts?.[p]?'✓':'·'}</span><span>${esc(p)}<small>${sectionLabels.join(' · ')}</small></span><input type="checkbox" data-paper="ielts|${esc(p)}" ${state.paperChecks.ielts?.[p]?'checked':''}></label>`).join('')}</div></details></div>`;cards.push(ieltsCard);
  for(const t of TRACKS.filter(t=>['amc','bmo','himcm','nlp','al'].includes(t.id))){const items=plannedItems(t.id),completedItems=items.filter(x=>done(x.d,x.e)),total=t.id==='amc'?PAPER_LISTS.amc.length:t.id==='bmo'?PAPER_LISTS.bmo.length:items.length,pct=total?Math.round(Math.min(completedItems.length,total)/total*100):0;let desc=t.desc;if(t.id==='amc')desc=`共 ${total} 套 A / B 卷；完成当前真题后直接继续下一套。`;else if(t.id==='bmo')desc=`共 ${total} 年真题，每日计时 2 题，题目顺序排至 ${BMO_PHASE_END}。`;else if(t.id==='nlp')desc='按实习任务书 8 周项目安排推进数据、传统模型、神经网络、Transformer、API / RAG、Demo 与汇报。';else if(t.id==='himcm')desc='按建模讲义、历年真题拆解、模型验证及论文交付推进。';else if(t.id==='al')desc='按教材章节推进预习、例题、练习和错题回测。';const recent=items.filter(x=>x.d>=today());cards.push(`<div class="progress-card compact-progress" style="--progress:${t.color}"><details><summary class="progress-top"><div class="progress-title"><span class="progress-icon" style="background:${t.bg};color:${t.color}">${t.icon||'•'}</span>${esc(t.name)}</div><div class="percent">${completedItems.length}/${total} · ${pct}%</div></summary><p class="track-desc">${esc(desc)}</p><div class="bar"><i style="width:${pct}%"></i></div><div class="track-count"><span>已完成 ${completedItems.length} 个学习块</span><b>计划 ${total} 个</b></div><div class="items">${recent.map(x=>`<div class="progress-task readonly"><span class="mini-check">·</span><span>${esc(x.e.name)}<small>${esc(x.e.note||'')}</small></span><b>${x.d.slice(5)}</b></div>`).join('')||'<div class="empty">当前阶段已结束</div>'}</div></details></div>`)}
 $('progressGrid').innerHTML=cards.join('');
}
 function renderAll(){if(state.role==='month'){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='month'))}else{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===state.view))};document.querySelectorAll('.nav[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===state.view));$('topTitle').textContent={today:'今日安排',week:'周计划',month:'月度路线',progress:'进度追踪'}[state.view];$('topDate').textContent=today();renderToday();renderWeek();renderMonthAccessible();renderProgress();floatingDock?.classList.toggle('hidden',!state.role);if(state.role){$('app').classList.remove('hidden');$('login').classList.add('hidden')}else{$('app').classList.add('hidden');$('login').classList.remove('hidden')}}
function openPanel(mode='block',event=null){if($('panel').classList.contains('open'))closePanel();state.panelMode=mode;state.selected=event;$('panelTitle').textContent=mode==='temp'?'添加临时任务':'区块修改';$('panelMode').value=mode;$('repeatFields').classList.toggle('hidden',mode!=='temp');$('fixedField').classList.toggle('hidden',mode==='temp');$('fixedLabel').classList.toggle('hidden',mode==='temp');$('replaceField').classList.toggle('hidden',mode==='temp');$('start').required=mode!=='temp';$('end').required=mode!=='temp';$('day').innerHTML=DAY_NAMES.map((n,i)=>`<option value="${i}">${n}</option>`).join('');$('repeatDays').innerHTML=DAY_NAMES.map((n,i)=>`<label class="item"><input type="checkbox" value="${i}" ${mode==='temp'?(i===dayIndex(today())?'checked':''):i===event?.day?'checked':''}>${n}</label>`).join('');const e=event||{day:dayIndex(today()),start:'19:20',end:'20:20',name:'课内复习模块',type:'review',note:'',fixed:false};$('day').value=e.day;$('start').value=e.start;$('end').value=e.end;$('name').value=e.name;$('type').value=e.type;$('note').value=e.note||'';$('fixed').checked=!!e.fixed;$('tempStartDate').value=today();$('tempEndDate').value=addDays(today(),6);$('replaceEvent').innerHTML='<option value="">新增学习块并自动压缩相邻时间</option>'+state.events.filter(x=>!x.fixed&&x.day===e.day).map(x=>`<option value="${x.id}">替换：${esc(x.start)}–${esc(x.end)} ${esc(x.name)}</option>`).join('');if(event)$('replaceEvent').value=event.id;$('del').style.display='none';$('panel').classList.add('open');panelDirty=false}function closePanel(){if(!$('panel').classList.contains('open'))return true;if(panelDirty){const keep=confirm('当前编辑有未保存内容。点击“确定”保存草稿，点击“取消”放弃并关闭？');if(keep){state.drafts.editor={mode:state.panelMode,values:formValues()};save();toast('草稿已保存')}}$('panel').classList.remove('open');panelDirty=false;return true}
function formValues(){return {day:+$('day').value,start:$('start').value,end:$('end').value,name:$('name').value,type:$('type').value,note:$('note').value,fixed:$('fixed').checked,startDate:$('tempStartDate').value,endDate:$('tempEndDate').value,days:[...$('repeatDays').querySelectorAll('input:checked')].map(x=>+x.value)}}
function submitForm(ev){ev.preventDefault();const v=formValues(),err=$('formError');err.textContent='';if(!v.name||mins(v.end)<=mins(v.start)){err.textContent='请填写名称，并确保结束时间晚于开始时间。';return}if(state.panelMode==='temp'){if(!v.days.length||v.endDate<v.startDate){err.textContent='请选择至少一天，并检查日期范围。';return}const t={id:uid('temp'),...v};state.tempTasks.push(t);toast('临时任务已添加，将覆盖重叠时段');panelDirty=false;closePanel();save();renderAll();return}const e={...(state.selected||{}),id:state.selected?.id||uid('block'),day:v.day,start:v.start,end:v.end,name:v.name,type:v.type,note:v.note,fixed:false};const dayEvents=state.events.filter(x=>x.id!==e.id&&x.day===e.day).map(x=>({...x})).concat(e).sort((a,b)=>mins(a.start)-mins(b.start));for(let i=1;i<dayEvents.length;i++){const prev=dayEvents[i-1],cur=dayEvents[i];if(!overlap(prev,cur))continue;if(prev.fixed&&cur.fixed){err.textContent='与固定课表或训练冲突，无法自动调整。';return}if(cur===e){if(prev.fixed){err.textContent='与固定课表或训练冲突，请调整新区块时间。';return}const nextEnd=mins(cur.start);if(nextEnd-mins(prev.start)<15){err.textContent='与前一学习块冲突太多，请换一个时间。';return}prev.end=cur.start}else if(prev===e){if(cur.fixed){err.textContent='与固定课表或训练冲突，请调整新区块时间。';return}const nextStart=mins(prev.end),oldEnd=mins(cur.end);if(oldEnd-nextStart<15){err.textContent='与后一学习块冲突太多，请换一个时间。';return}cur.start=prev.end}else if(!prev.fixed){if(mins(cur.start)-mins(prev.start)<15){err.textContent='相邻学习块没有足够调整空间，请手动改时间。';return}prev.end=cur.start}else if(!cur.fixed){if(mins(cur.end)-mins(prev.end)<15){err.textContent='相邻学习块没有足够调整空间，请手动改时间。';return}cur.start=prev.end}}if(dayEvents.some((x,i)=>i>0&&overlap(dayEvents[i-1],x))){err.textContent='学习块仍存在时间冲突，请调整后再保存。';return}state.events=state.events.filter(x=>x.day!==e.day).concat(dayEvents);panelDirty=false;closePanel();save();renderAll();toast('区块已保存，相邻学习块已自动压缩')}
function openTask(date,id){const e=eventsFor(date).find(x=>x.id===id||x.id.startsWith(id+'-'));if(!e)return;const goals=taskGoals(e);openModal(e.name,`<div class="modal-meta">${date} · ${e.start}–${e.end} · ${esc(eventLabel(e))}</div><p class="modal-note">${esc(e.note||'为这个时间块留下清晰产出。')}</p>${e.conflictNote?'<p class="schedule-conflict">'+esc(e.conflictNote)+'</p>':''}<div class="task-checklist readonly-checklist">${goals.map(g=>`<div class="item"><span>•</span><span>${esc(g)}</span></div>`).join('')}</div><p class="modal-meta">完成状态只在“今日安排”时间线右侧记录。</p>`)}
function openDateDetail(date){const groups=grouped(date), completed=eventsFor(date).filter(e=>done(date,e));const modules=Object.entries(groups).map(([k,items])=>`<section class="month-module"><h4>${esc(k)}</h4>${items.map(e=>`<button class="agenda-task" data-agenda="${date}|${esc(e.id)}"><span><b>${e.start}–${e.end}</b>${esc(e.name)}</span><small>${esc(e.note||'点击查看安排')}${e.conflictNote?'<span class="schedule-conflict">'+esc(e.conflictNote)+'</span>':''}</small></button>`).join('')}</section>`).join('')||'<div class="empty">当天没有额外模块安排</div>';const doneHtml=completed.length?completed.map(e=>`<div class="completed-name">✓ ${esc(e.name)}</div>`).join(''):'<div class="empty">今天还没有完成的任务</div>';openModal(date+' · 学习模块',`${modules}<section class="month-completed"><h4>今日完成的任务</h4>${doneHtml}</section>`)}function openMilestone(id){const m=state.milestones.find(x=>x.id===id);if(!m)return;const title=prompt('目标名称',m.title),date=prompt('目标日期 YYYY-MM-DD',m.date);if(title&&/^\d{4}-\d{2}-\d{2}$/.test(date)){m.title=title;m.date=date;save();renderAll()}}
function navigate(view){if(!closePanel())return;if($('modal').open)$('modal').close();state.view=view;renderAll()}
document.addEventListener('DOMContentLoaded',()=>{
 load();
 $('loginForm').addEventListener('submit',e=>{e.preventDefault();const u=$('user').value,p=$('pass').value;if(u===LOGIN_USER&&(p===LOGIN_PASSWORD||p===MONTH_PASSWORD)){state.role=p===MONTH_PASSWORD?'month':'all';state.view=p===MONTH_PASSWORD?'month':'today';renderAll();window.PlannerCloud?.load()}else $('error').classList.add('show')});
 $('logout').addEventListener('click',()=>location.reload());
 document.querySelectorAll('.nav[data-view]').forEach(n=>n.addEventListener('click',()=>navigate(n.dataset.view)));
 document.querySelectorAll('[data-float-view]').forEach(n=>n.addEventListener('click',()=>navigate(n.dataset.floatView)));
 $('editNav').addEventListener('click',()=>{state.edit=true;navigate('week');toast('选择学习块后填写表单，系统会自动压缩相邻时间')});
 $('panelTemp').addEventListener('click',()=>openPanel('temp'));
 $('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('study_os_theme',document.body.classList.contains('dark')?'dark':'light');$('themeToggle').textContent=document.body.classList.contains('dark')?'☀':'☾'});
 if(localStorage.getItem('study_os_theme')==='dark'){document.body.classList.add('dark');$('themeToggle').textContent='☀'}
  const dock=$('floatingDock');const dockToggle=$('dockToggle');
  dock.style.width='';dock.style.height='';dock.style.minHeight='';dock.style.maxHeight='';
  if(localStorage.getItem('study_os_dock')!=='open')dock.classList.add('collapsed');
  try{const pos=JSON.parse(localStorage.getItem('study_os_dock_pos')||'null');if(pos){if(pos.edge==='left')dock.style.left='12px';else if(pos.edge==='right')dock.style.right='12px';else if(pos.edge==='top')dock.style.top='12px';else if(pos.edge==='bottom')dock.style.bottom='12px';else if(Number.isFinite(pos.x)&&Number.isFinite(pos.y)){dock.style.left=Math.max(8,Math.min(innerWidth-dock.offsetWidth-8,pos.x))+'px';dock.style.top=Math.max(8,Math.min(innerHeight-dock.offsetHeight-8,pos.y))+'px';dock.style.right='auto';dock.style.bottom='auto'}}}catch{}
  let dockDrag=false,dockMoved=false,dockSuppressClick=false,dockStartX=0,dockStartY=0,dockLeft=0,dockTop=0,dockPointerId=null;
  const dockPoint=(e)=>{const rect=dock.getBoundingClientRect();return {x:e.clientX-rect.left,y:e.clientY-rect.top}};
  dock.addEventListener('pointerdown',e=>{
    if(e.button!==undefined&&e.button!==0)return;
    const p=dockPoint(e);dockDrag=true;dockMoved=false;dockPointerId=e.pointerId;dockStartX=e.clientX;dockStartY=e.clientY;
    dockLeft=dock.getBoundingClientRect().left;dockTop=dock.getBoundingClientRect().top;
    dock.classList.add('drag-ready');
  });
  dock.addEventListener('pointermove',e=>{
    if(!dockDrag||e.pointerId!==dockPointerId)return;
    const dx=e.clientX-dockStartX,dy=e.clientY-dockStartY;
    if(!dockMoved&&Math.hypot(dx,dy)<5)return;
    dockMoved=true;dockSuppressClick=true;dock.classList.add('dragging');
    const x=Math.max(8,Math.min(window.innerWidth-dock.offsetWidth-8,dockLeft+dx));
    const y=Math.max(8,Math.min(window.innerHeight-dock.offsetHeight-8,dockTop+dy));
    dock.style.left=x+'px';dock.style.top=y+'px';dock.style.right='auto';dock.style.bottom='auto';
  });
  const endDockDrag=e=>{
    if(!dockDrag)return;dockDrag=false;dock.classList.remove('drag-ready','dragging');
    if(dockMoved)localStorage.setItem('study_os_dock_pos',JSON.stringify({x:dock.offsetLeft,y:dock.offsetTop}));
    if(e?.pointerId!==undefined)try{dock.releasePointerCapture?.(e.pointerId)}catch{}
  };
  dock.addEventListener('pointerup',endDockDrag);dock.addEventListener('pointercancel',endDockDrag);
  const toggleDock=()=>{dock.classList.toggle('collapsed');const open=!dock.classList.contains('collapsed');dockToggle.setAttribute('aria-expanded',String(open));dockToggle.setAttribute('aria-label',open?'收起快速导航':'展开快速导航');localStorage.setItem('study_os_dock',open?'open':'closed')};
  dockToggle.addEventListener('click',e=>{if(dockMoved){dockMoved=false;e.preventDefault();e.stopImmediatePropagation();return}e.stopPropagation();toggleDock()});
  dock.addEventListener('click',e=>{if(dockSuppressClick){e.preventDefault();e.stopImmediatePropagation();dockSuppressClick=false;dockMoved=false;return}if(dock.classList.contains('collapsed')&&!e.target.closest('.dock-toggle')){e.preventDefault();toggleDock()}});
  dock.addEventListener('click',e=>{const nav=e.target.closest('[data-float-view]');if(nav){e.preventDefault();navigate(nav.dataset.floatView);return}const edit=e.target.closest('#editNav');if(edit){e.preventDefault();state.edit=true;navigate('week');toast('选择学习块后填写表单，系统会自动压缩相邻时间');}});
 $('weekHelp').addEventListener('click',()=>openModal('周计划说明','<p class="modal-note">左侧时间轴是 05:00 起的真实分钟刻度；右侧每个学习块按开始和结束时间定位，课程、课间、午餐和训练均不会互相覆盖。</p>'));
 $('close').addEventListener('click',closePanel);$('eventForm').addEventListener('input',()=>panelDirty=true);$('eventForm').addEventListener('submit',submitForm);
 $('prev').addEventListener('click',()=>{if(closePanel()){state.week--;renderWeek()}});$('next').addEventListener('click',()=>{if(closePanel()){state.week++;renderWeek()}});$('thisWeek').addEventListener('click',()=>{if(closePanel()){state.week=0;renderWeek()}});
 $('monthPrev').addEventListener('click',()=>{if(!closePanel())return;const d=dateObj(state.month+'-01');d.setUTCMonth(d.getUTCMonth()-1);state.month=dateString(d).slice(0,7);renderMonth()});$('monthNext').addEventListener('click',()=>{if(!closePanel())return;const d=dateObj(state.month+'-01');d.setUTCMonth(d.getUTCMonth()+1);state.month=dateString(d).slice(0,7);renderMonth()});$('monthToday').addEventListener('click',()=>{if(!closePanel())return;state.month=today().slice(0,7);renderMonth()});$('modalClose').addEventListener('click',()=>$('modal').close());const clearBtn=$('clear');if(clearBtn)clearBtn.addEventListener('click',()=>{if(confirm('清空当前周已完成记录？')){for(const d of weekDates())for(const e of eventsFor(d))delete state.records[taskKey(d,e)];save();renderAll()}});
  document.addEventListener('click',e=>{const check=e.target.closest('[data-check]');if(check){const d=check.dataset.date,ev=eventsFor(d).find(x=>x.id===check.dataset.check||x.id.startsWith(check.dataset.check+'-'));if(ev)setDone(d,ev,check.checked);return}const todayCard=e.target.closest('[data-today-card]');if(todayCard){openTodayCard(todayCard.dataset.todayCard);return}const task=e.target.closest('[data-task]');if(task){openTask(task.dataset.date,task.dataset.task);return}const event=e.target.closest('[data-event]');if(event){const selected=eventsFor(event.dataset.date).find(x=>x.id===event.dataset.event);if(state.edit&&selected&&!selected.fixed&&!selected.dateCourse&&state.events.some(x=>x.id===selected.id))openPanel('block',state.events.find(x=>x.id===selected.id));else openTask(event.dataset.date,event.dataset.event);return}const date=e.target.closest('[data-date-detail]');if(date){openDateDetail(date.dataset.dateDetail);return}const agenda=e.target.closest('[data-agenda]');if(agenda){const [d,id]=agenda.dataset.agenda.split('|');$('modal').close();openTask(d,id);return}const p=e.target.closest('[data-progress]');if(p){const ev=eventsFor(p.dataset.date).find(x=>x.id===p.dataset.progress||x.id.startsWith(p.dataset.progress+'-'));if(ev)setDone(p.dataset.date,ev,!done(p.dataset.date,ev));return}const paper=e.target.closest('[data-paper]');if(paper){const [kind,...rest]=paper.dataset.paper.split('|'),name=rest.join('|');state.paperChecks[kind][name]=paper.checked;save();renderAll();return}});
 const loginBox=document.querySelector(".login-box");
 document.querySelector(".login")?.addEventListener("pointermove",e=>{const r=loginBox.getBoundingClientRect();loginBox.style.setProperty("--mx",`${e.clientX-r.left}px`);loginBox.style.setProperty("--my",`${e.clientY-r.top}px`)});
 loginBox?.addEventListener("pointerleave",()=>{loginBox.style.removeProperty("--mx");loginBox.style.removeProperty("--my")});
 dock.addEventListener("pointerup",()=>{
   if(!dockMoved)return;
   const r=dock.getBoundingClientRect(),pad=12,vw=innerWidth,vh=innerHeight;
   const distances={left:r.left,right:vw-r.right,top:r.top,bottom:vh-r.bottom};
   const edge=Object.keys(distances).sort((a,b)=>distances[a]-distances[b])[0];
   dock.style.left="";dock.style.top="";dock.style.right="";dock.style.bottom="";
   if(edge==="left")dock.style.left=pad+"px";
   if(edge==="right")dock.style.right=pad+"px";
   if(edge==="top")dock.style.top=pad+"px";
   if(edge==="bottom")dock.style.bottom=pad+"px";
   localStorage.setItem("study_os_dock_pos",JSON.stringify({edge,x:r.left,y:r.top}));
   dockMoved=false;dockSuppressClick=false;
 }); renderAll();
});









