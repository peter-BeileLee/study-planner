/* 课表与学习内容：课表只保留正式课内课时，课后社团已排除。 */
const DAY_NAMES=['周一','周二','周三','周四','周五','周六','周日'];
const TYPES={school:{label:'校内课程',color:'#718198',icon:'▣'},review:{label:'课内复习',color:'#27847b',icon:'▤'},amc:{label:'AMC12',color:'#3874d5',icon:'∑'},bmo:{label:'BMO1',color:'#6267c9',icon:'◇'},ielts:{label:'雅思 IELTS',color:'#b78125',icon:'A'},himcm:{label:'HiMCM',color:'#8b62c5',icon:'⌁'},nlp:{label:'NLP 实习',color:'#ca627c',icon:'⌘'},al:{label:'AL 高数',color:'#3874cf',icon:'∫'},tmua:{label:'TMUA',color:'#4d6ac8',icon:'T'},step:{label:'STEP',color:'#6267c9',icon:'S'},workout:{label:'力量训练',color:'#388c70',icon:'⚡'},run:{label:'晨跑 / 恢复',color:'#388c70',icon:'↗'},swim:{label:'游泳训练',color:'#328bc4',icon:'≈'},interest:{label:'兴趣时间',color:'#c46a42',icon:'✦'},rest:{label:'生活 / 缓冲',color:'#9ba7b6',icon:'·'}};
// 课表截图中的日期课程。它们是一次性日期事件，不会被星期模板重复生成。
const DATE_COURSE_EVENTS=[
 {date:'2026-10-22',start:'17:00',end:'18:00',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-10-26',start:'17:00',end:'18:00',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-02',start:'11:30',end:'12:30',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-05',start:'17:00',end:'19:00',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-09',start:'17:00',end:'18:00',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-12',start:'16:30',end:'18:30',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-13',start:'13:30',end:'15:30',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-14',start:'13:30',end:'15:30',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true},
 {date:'2026-11-15',start:'10:30',end:'12:30',name:'BMO线上课程',type:'bmo',note:'BMO线上课程',fixed:true}
];
const TRACKS=[
 {id:'review',name:'课内复习',icon:'▣',color:'#27847b',bg:'#e8f6f3',desc:'按科目做题、订正和回测',goals:['完成当天作业并订正','完成一科闭卷回忆','错题归档或下周预习']},
 {id:'amc',name:'AMC12',icon:'∑',color:'#3874d5',bg:'#eaf2ff',desc:'按真题年份推进 A / B 卷',goals:['完成指定年份真题','计时复盘并标记耗时','整理最后 5 题与错因']},
 {id:'bmo',name:'BMO1',icon:'◇',color:'#6267c9',bg:'#eeedff',desc:'按年份做卷，强调完整英文证明',goals:['完成指定年份题组','独立写出英文证明','对照解析修改逻辑']},
 {id:'ielts',name:'雅思 IELTS',icon:'A',color:'#b78125',bg:'#fff3d8',desc:'听力、阅读、写作、口语分别训练',goals:['完成指定分项','记录错题与表达','完成整套后继续下一套']},
 {id:'himcm',name:'HiMCM 建模',icon:'⌁',color:'#8b62c5',bg:'#f0ebff',desc:'从讲义方法到论文成品',goals:['完成一个方法练习','写出假设 / 模型 / 验证','整理图表或论文段落']},
 {id:'nlp',name:'NLP 实习项目',icon:'⌘',color:'#ca627c',bg:'#ffe9ed',desc:'第 5 周进入 Transformer / BERT',goals:['完成周任务主产出','记录实验指标与问题','提交学习日志或代码成果']}
 ,{id:'al',name:'AL 高数',icon:'∫',color:'#3974cf',bg:'#eaf2ff',desc:'按章节预习、例题演练和周测复盘',goals:['完成一节预习','独立完成例题','记录概念与错题']}
];
const ASSESSMENT_CALENDAR={
 'English Literature':[
  ['2026-08-30','2026-09-05','Unit 1 Topic Test'],['2026-09-20','2026-09-26','Essay / Extended Writing'],['2026-10-18','2026-10-24','Streetcar Critical Lens Debate'],['2026-11-08','2026-11-14','Timed Essay'],['2026-12-06','2026-12-12','Semester 1 final / log checks'],['2026-12-13','2026-12-19','End of Semester Exam']],
 'Chemistry':[
  ['2026-09-13','2026-09-19','Atomic, electronic structure and stoichiometry'],['2026-10-11','2026-10-17','Bonding, structure and states of matter'],['2026-10-18','2026-10-24','Portfolio of evidence'],['2026-11-01','2026-11-07','In class task'],['2026-11-08','2026-11-14','Energetics, equilibria and redox'],['2026-11-15','2026-11-21','BfL Checkpoint 2'],['2026-11-22','2026-11-28','Portfolio of evidence'],['2026-11-29','2026-12-05','Practical assessment'],['2026-12-06','2026-12-12','Semester 1 final'],['2026-12-13','2026-12-19','EOS exam']],
 'Physics':[
  ['2026-08-30','2026-09-05','Physical quantities, units, kinematics'],['2026-09-20','2026-09-26','Practical assessment'],['2026-10-18','2026-10-24','Portfolio of evidence'],['2026-10-25','2026-10-31','Acceleration, dynamics, work energy and power'],['2026-11-01','2026-11-07','CPAC skills'],['2026-11-22','2026-11-28','Matter, momentum, waves, superposition'],['2026-11-29','2026-12-05','Semester 1 final checkpoint'],['2026-12-06','2026-12-12','Practical / final CA'],['2026-12-13','2026-12-19','EOS examination']],
 'Computer Science':[
  ['2026-09-13','2026-09-19','Topic Test 1 and CA Weeks 1–5'],['2026-10-11','2026-10-17','Project Part 1'],['2026-10-25','2026-10-31','Topic Test 2 and CA Weeks 6–11'],['2026-11-01','2026-11-07','Project Part 2'],['2026-11-22','2026-11-28','Topic Test 3'],['2026-11-29','2026-12-05','CA Weeks 12–16 / final tasks'],['2026-12-06','2026-12-12','Semester 1 final checkpoint'],['2026-12-13','2026-12-19','EOS exam']],
 'Mathematics':[
  ['2026-09-06','2026-09-12','Topic test 1'],['2026-09-13','2026-09-19','CA Weeks 1–5'],['2026-10-04','2026-10-10','BfL Checkpoint 1 and open book test 1'],['2026-10-18','2026-10-24','Maths Investigation'],['2026-10-25','2026-10-31','CA Weeks 6–11'],['2026-11-01','2026-11-07','Topic test 2'],['2026-11-22','2026-11-28','Open book test 2'],['2026-11-29','2026-12-05','CA Weeks 12–16'],['2026-12-06','2026-12-12','BfL final semester checkpoint'],['2026-12-13','2026-12-19','EOS exam']]
};
const IELTS_SECTIONS=['听力','阅读','写作','口语'];
const IELTS_PHASES=[
 {start:'2026-12-01',end:'2026-12-07',name:'Listening · 听力专项',note:'完成听力真题，记录原始分、错因与耗时。'},
 {start:'2026-12-08',end:'2026-12-14',name:'Reading · 阅读专项',note:'完成阅读真题，记录定位方法、错因与耗时。'},
 {start:'2026-12-15',end:'2026-12-21',name:'Writing · 写作专项',note:'分别完成 Task 1 与 Task 2，整理结构和表达。'},
 {start:'2026-12-22',end:'2026-12-28',name:'Speaking · 口语专项',note:'分 Part 1、Part 2、Part 3 练习并录音复盘。'},
 {start:'2026-12-29',end:'2027-01-13',name:'四科分项轮换',note:'听力、阅读、写作、口语分开完成下一套真题。'}
];
const SCHOOL_ASSESSMENT_WEEKS=[
 {week:8,start:'2026-10-04',end:'2026-10-10',label:'4 Oct – 10 Oct',items:[['数学','BfL Checkpoint 1'],['数学','Open book test 1'],['英语文学','BfL Checkpoint 1'],['计算机','BfL Checkpoint 1']]},
 {week:9,start:'2026-10-11',end:'2026-10-17',label:'11 Oct – 17 Oct',items:[['化学','TT-2 Bonding, structure and states of matter'],['计算机','Project Part 1'],['体育','item 1 / behaviour for learning']]},
 {week:10,start:'2026-10-18',end:'2026-10-24',label:'18 Oct – 24 Oct',items:[['数学','Maths Investigation'],['英语文学','Streetcar Critical Lens Debate'],['化学','CA-2 Portfolio of evidence'],['物理','CA-3 Portfolio of evidence']]},
 {week:11,start:'2026-10-25',end:'2026-10-31',label:'25 Oct – 31 Oct',items:[['数学','CA Weeks 6–11'],['物理','TT-2 Acceleration, Dynamics, Work Energy and Power'],['计算机','Topic Test 2'],['计算机','CA Weeks 6–11']]},
 {week:12,start:'2026-11-01',end:'2026-11-07',label:'1 Nov – 7 Nov',items:[['数学','Topic test 2'],['化学','CA-3 In Class task'],['物理','CA-4 CPAC skills'],['计算机','Project Part 2']]},
 {week:13,start:'2026-11-08',end:'2026-11-14',label:'8 Nov – 14 Nov',items:[['英语文学','Timed Essay-Lear'],['化学','TT3 Energetics, equilibria and redox'],['体育','item 2']]},
 {week:14,start:'2026-11-15',end:'2026-11-21',label:'15 Nov – 21 Nov',items:[['化学','BfL Checkpoint 2'],['物理','BfL Checkpoint -2']]},
 {week:15,start:'2026-11-22',end:'2026-11-28',label:'22 Nov – 28 Nov',items:[['数学','Open book test 2'],['化学','CA-4 Portfolio of evidence'],['物理','TT-3 Matter, Momentum, Waves, Superposition'],['物理','CA-5 CPAC skills'],['计算机','Topic Test 3']]},
 {week:16,start:'2026-11-29',end:'2026-12-05',label:'29 Nov – 5 Dec',items:[['数学','CA Week 12–16'],['化学','TT4 Practical assessment'],['物理','BfL Semester-1 Final'],['计算机','CA Weeks 12–16 / final tasks']]},
 {week:17,start:'2026-12-06',end:'2026-12-12',label:'6 Dec – 12 Dec',items:[['数学','BfL Final Semester-1'],['英语文学','Streetcar Log Checks / final CA'],['化学','CA + BfL Semester-1 Final'],['物理','TT-4 Practical + final CA'],['计算机','BfL Final Semester-1'],['体育','item 3']]},
 {week:18,start:'2026-12-13',end:'2026-12-19',label:'13 Dec – 19 Dec',items:[['数学','EOS Exam'],['英语文学','End of Semester Exam'],['化学','EOS exam'],['物理','EOS examination'],['计算机','EOS Exam']]}
];
const PAPER_LISTS={amc:['AMC12 2014 A卷','AMC12 2014 B卷','AMC12 2015 A卷','AMC12 2015 B卷','AMC12 2016 A卷','AMC12 2016 B卷','AMC12 2017 A卷','AMC12 2017 B卷','AMC12 2018 A卷','AMC12 2018 B卷','AMC12 2019 A卷','AMC12 2019 B卷','AMC12 2020 A卷','AMC12 2020 B卷','AMC12 2021 A卷','AMC12 2021 B卷','AMC12 2022 A卷','AMC12 2022 B卷','AMC12 2023 A卷','AMC12 2023 B卷','AMC12 2024 A卷','AMC12 2024 B卷','AMC12 2025 A卷','AMC12 2025 B卷'],bmo:['BMO1 2010','BMO1 2011','BMO1 2012','BMO1 2013','BMO1 2014','BMO1 2015','BMO1 2016','BMO1 2017','BMO1 2018','BMO1 2019','BMO1 2020','BMO1 2021','BMO1 2022','BMO1 2023','BMO1 2024','BMO1 2025']};
for(let y=2003;y<=2025;y++){PAPER_LISTS.amc.push(`AMC12 ${y} A卷`);if(y!==2025)PAPER_LISTS.amc.push(`AMC12 ${y} B卷`)}
PAPER_LISTS.amc=PAPER_LISTS.amc.slice(0,45);
PAPER_LISTS.amc.sort((a,b)=>{const ya=+a.match(/\d{4}/)[0],yb=+b.match(/\d{4}/)[0];return ya-yb||(a.includes('A卷')?-1:1)});
PAPER_LISTS.amc=[];for(let y=2003;y<=2025;y++){PAPER_LISTS.amc.push(`AMC12 ${y} A卷`);if(y<2025)PAPER_LISTS.amc.push(`AMC12 ${y} B卷`)}
const DEFAULT_MILESTONES=[
 {id:'m1',track:'himcm',title:'建模基础：线性规划、评价模型与 LaTeX',date:'2026-10-04',done:false},
 {id:'m2',track:'nlp',title:'第 5 周：Transformer / BERT 微调启动',date:'2026-10-12',done:false},
 {id:'m3',track:'himcm',title:'HiMCM：历年真题分析与题目拆解',date:'2026-10-25',done:false},
 {id:'m4',track:'nlp',title:'第 7 周：可复现性、Demo 与结果分析',date:'2026-10-26',done:false},
 {id:'m5',track:'himcm',title:'论文结构、图表与限制讨论',date:'2026-11-08',done:false},
 {id:'m6',track:'nlp',title:'第 8 周：报告、PPT 与 GitHub 整理',date:'2026-11-02',done:false},
 {id:'m7',track:'amc',title:'AMC12：2014–2025 A/B 卷首轮完成',date:'2026-11-15',done:false},
 {id:'m8',track:'bmo',title:'BMO1：2010–2025 真题首轮完成',date:'2026-11-30',done:false},
 {id:'m9',track:'review',title:'课内：五科错题回测与期末复习',date:'2026-12-23',done:false},
 {id:'m10',track:'review',title:'圣诞假期：三周复习与项目整理',date:'2027-01-13',done:false}
];
const CHRISTMAS_BREAK={start:'2026-12-24',end:'2027-01-13',title:'圣诞假期 · 三周复习与项目整理'};
const MODEL_CURRICULUM=[
 {week:1,title:'LaTeX 与建模写作',output:'Overleaf 模板、变量表、公式与一页模型说明'},
 {week:2,title:'线性规划',output:'生产 / 分配模型，目标函数、约束与 Python 求解'},
 {week:3,title:'非线性规划',output:'凸性、梯度下降、KKT 与一个可运行小例题'},
 {week:4,title:'评价模型',output:'标准化、AHP / 熵权、CRITIC 与敏感性检查'},
 {week:5,title:'微分方程',output:'变化率模型、数值模拟与模型假设说明'},
 {week:6,title:'历年真题分析',output:'拆解历年 HiMCM 真题，梳理问题目标、约束、数据需求与可行模型'},
 {week:7,title:'综合建模',output:'选择一个 HiMCM 题目完成模型、验证、图表和限制'},
 {week:8,title:'论文交付',output:'LaTeX 论文结构、摘要、图表、参考文献与复盘'},
 {week:9,title:'敏感性与稳健性',output:'参数扰动、替代模型、误差分析和局限性段落'},
 {week:10,title:'竞赛模拟',output:'48 小时模拟拆题、分工、版本管理和交付清单'},
 {week:11,title:'论文精修',output:'摘要、图表编号、参考文献与 LaTeX 最终检查'},
 {week:12,title:'模型作品集',output:'整理模型代码、结果图和一页项目复盘'}
];
const INTERNSHIP_CURRICULUM=[
 {week:1,title:'工具链与工程环境',output:'VS Code、Python 环境、GitHub、README、第一篇学习日志'},
 {week:2,title:'数据处理与 baseline',output:'选择英文文本数据集，EDA、清洗、TF-IDF + Logistic Regression'},
 {week:3,title:'传统 NLP 与项目结构',output:'比较 Naive Bayes、Logistic Regression、SVM，补齐项目目录'},
 {week:4,title:'PyTorch 文本分类',output:'Embedding、TextCNN / BiLSTM、训练循环与 confusion matrix'},
 {week:5,title:'Transformer / BERT 微调',output:'Hugging Face 数据集、tokenizer、fine-tuning 与指标记录'},
 {week:6,title:'LLM API 与 RAG',output:'zero-shot / few-shot、prompt 记录、JSON 输出与小型 RAG Demo'},
 {week:7,title:'可复现性与 Demo',output:'配置文件、随机种子、实验表、错误分析、Streamlit / Gradio Demo'},
 {week:8,title:'报告与展示',output:'GitHub、README、5–8 页报告、15–20 页 PPT、反思总结'},
 {week:9,title:'项目迭代',output:'根据反馈修正数据处理、模型与评估脚本'},
 {week:10,title:'部署与文档',output:'推理接口、异常处理、运行说明和演示视频'},
 {week:11,title:'实习交付',output:'代码清理、实验表、最终报告和交接清单'},
 {week:12,title:'作品集复盘',output:'整理项目亮点、技术决策与可复现运行记录'}
];
function buildDefaultSchedule(){
 const r=[];const add=(day,start,end,name,type,note,fixed=false,meta={})=>r.push({id:'base-'+day+'-'+start,day,start,end,name,type,note:note||'',fixed,...meta});
 // 课表按原始 period 表逐节录入：双节课也拆成两个 40 分钟格，避免时间轴误导。
 const slots=[['08:10','08:50'],['08:50','09:30'],['09:40','10:20'],['10:20','11:00'],['11:20','12:00'],['12:00','12:40'],['13:40','14:20'],['14:20','15:00'],['15:10','15:50'],['15:50','16:30']];
 const classes=[
  ['Chemistry-AS.A.CHE1','Chemistry-AS.A.CHE1','English-A1.B.ENG.LIT','English-A1.B.ENG.LIT','','','Physics-AS.C.PHY1','Physics-AS.C.PHY1','Mathematics-AL.D.MAT3','Mathematics-AL.D.MAT3'],
  ['Computer Science-AS.E.CPU','Computer Science-AS.E.CPU','','','','','Chemistry-AS.A.CHE1','Chemistry-AS.A.CHE1','',''],
  ['Physics-AS.C.PHY1','Physics-AS.C.PHY1','Mathematics-AL.D.MAT3','Mathematics-AL.D.MAT3','PSHE-A1.Fire6.PSHE','', 'Computer Science-AS.E.CPU','Computer Science-AS.E.CPU','PE-A1.PE.W1','PE-A1.PE.W1'],
  ['','','Chemistry-AS.A.CHE1','Chemistry-AS.A.CHE1','','','English-A1.B.ENG.LIT','English-A1.B.ENG.LIT','Physics-AS.C.PHY1','Physics-AS.C.PHY1'],
  ['Mathematics-AL.D.MAT3','Mathematics-AL.D.MAT3','Computer Science-AS.E.CPU','Computer Science-AS.E.CPU','','','','','','']
 ];
 const morning=['雅思 · 听力真题练习','雅思 · 阅读真题练习','雅思 · 写作真题练习','雅思 · 口语真题练习','雅思 · 听力真题计时练习'];
 const ieltsSections=['听力','阅读','写作','口语','听力'];
 const subjects=['chemistry','computer','physics','mathematics','english'];
 for(let d=0;d<5;d++){
   add(d,'05:30','05:35','起床 · 刷牙洗脸','rest','五分钟完成洗漱准备。');
   add(d,'05:35','06:00','雅思 · 真题词汇预热','ielts','积累当前真题中的词汇与表达。',false,{ieltsSection:'词汇'});
  add(d,'06:00','06:30','晨跑 30 分钟','run','6:00 下楼跑步，回家洗澡。',true);
   add(d,'06:30','06:45','洗澡 · 补水','rest','跑后快速恢复。');
   add(d,'06:45','07:30',morning[d],'ielts','每天只练一个雅思分项；完成当前真题后直接进入下一套。',false,{ieltsSection:ieltsSections[d]});
   add(d,'07:30','07:35','早餐 · 出发准备','rest','通勤前补充早餐。',false,{meal:true});
  add(d,'07:35','07:50','通勤 · 准备上课','rest','按课表到教室。');
   if(d>=3)add(d,'07:50','08:00','Form','school','正式课表。',true);
   add(d,'08:00','08:10','课前准备','rest','到教室并准备上课。',true);
   for(let i=0;i<10;i++){const n=classes[d][i];if(n)add(d,slots[i][0],slots[i][1],n,'school','正式课表；课后社团不纳入。',true,{subject:n})}
   add(d,'09:30','09:40','课间休息 · 转场','rest','课表间隔。',true);add(d,'11:00','11:20','课间休息 · 转场','rest','课表间隔。',true);
   add(d,'12:40','13:10','午餐','rest','按课表用餐；用餐后直接开始轻量复习。',true,{meal:true});
   const middayReviews=[
    ['课前预习 · 物理公式与概念','physics','回顾下午物理课的公式与概念，标记一个待解决的问题。'],
    ['课前预习 · 化学反应与错题','chemistry','复习下午化学课相关反应与错题，整理一个易错点。'],
    ['课前预习 · 计算机科学关键词','computer','回忆下午计算机科学课的关键词与概念。'],
    ['课前预习 · 英语文学段落','english','重读下午英语文学课的段落，标记一个可讨论的问题。'],
    ['本周回顾 · 整理数学错题','mathematics','整理本周数学错题卡片，写下易错原因。']
   ][d];
   add(d,'13:10','13:30',middayReviews[0],'review',middayReviews[2],true,{subject:middayReviews[1]});
   add(d,'13:30','13:40','课前准备 · 转场','rest','整理教材并准备下午课程。',true);add(d,'15:00','15:10','课间休息 · 转场','rest','课表间隔。',true);
  add(d,'16:30','16:40','补水 · 转场','rest','放学后短暂恢复。');
  add(d,'16:40','17:20',d===1||d===3?'HiMCM · 建模方法':'NLP · 实习产出',d===1||d===3?'himcm':'nlp','按建模讲义或实习周任务完成可交付产出。');
  add(d,'17:20','18:00','课内复习 · 作业与错题','review','优先完成当天校内作业和订正。',false,{subject:subjects[d]});
  add(d,'18:00','18:20','晚餐 · 休息','rest','晚餐后再开始计时训练。',false,{meal:true});
  add(d,'18:20','19:50','AMC12 · 计时真题一套','amc','完成当前真题，记录用时与错因；下一次训练直接继续下一套。');
  add(d,'19:50','20:30','BMO1 · 计时 2 题','bmo','每天两题，完整写出证明并复盘。');
  add(d,'20:30','21:10',['引体向上 5×10 + 俯卧撑 157','仰卧起坐 404 + 拉力绳仰泳式 70×4','拉力绳蝶泳式 70×4 + 俯卧撑 157','引体向上 5×10 + 仰卧起坐 404','综合力量循环：引体、俯卧撑、拉力绳'][d],'workout','晚间 40 分钟训练；组间休息并按体能调整。');
  add(d,'21:10','21:40','兴趣时间 · 网页编写 / UI 设计 / 论文研究','interest','每天只保留 30 分钟，用于兴趣主题的小步推进。');
  add(d,'21:40','22:00','洗漱 · 拉伸 · 就寝准备','rest','22:00 前准备睡觉，保障恢复。');
 }
 for(let d=5;d<7;d++){
   add(d,'05:30','05:35','起床 · 刷牙洗脸','rest','五分钟完成准备。');add(d,'05:35','06:20','AL 高数 · 周末预习','al','预习新章节并完成例题。');add(d,'06:20','06:35','早餐','rest','游泳前补充早餐。',false,{meal:true});add(d,'06:35','06:50','出发 · 游泳准备','rest','整理训练用品。');
  add(d,'06:50','10:30','游泳训练 · 往返','swim','06:50 出发，约 10:30 回家。',true);add(d,'10:30','10:35','洗澡 · 补水','rest');add(d,'10:35','10:55','午餐','rest','午饭 20 分钟。',false,{meal:true});
  add(d,'10:55','12:40','课内复习 · 周错题闭环','review','游泳后优先复习校内科目。',false,{subject:d===5?'mathematics':'physics'});
  add(d,'12:40','14:10',d===5?'AMC12 · 计时真题一套':'课内复习 · 下周预习',d===5?'amc':'review',d===5?'完成当前真题，记录用时与错因；下一次训练直接继续下一套。':'按下周课程表逐科预习。',false,{subject:d===6?'english':'mathematics'});
  add(d,'14:10','14:50',d===5?'BMO1 · 计时 2 题':'HiMCM · 论文与验证',d===5?'bmo':'himcm','两道证明题或建模论文推进。');
  add(d,'14:50','16:20','AL 高数 · 章节练习','al','完成例题、错题与一页总结。');
  add(d,'16:20','17:50','课内复习 · 重点科目','review','安排课程复习和下一周预习。',false,{subject:d===5?'chemistry':'computer'});
  add(d,'17:50','18:30',d===5?'AL 高数 · 章节例题':'课内复习 · 下周课程预习',d===5?'al':'review',d===5?'完成本周章节例题并订正。':'检查课表，预习下周课程重点。',false,{subject:d===5?'mathematics':'chemistry'});
  add(d,'18:30','19:10','力量训练 · 当日组合','workout','40 分钟运动，按动作轮换。');
  add(d,'19:10','19:30','晚餐 · 休息','rest','训练后用餐并恢复。',false,{meal:true});
  add(d,'19:30','21:20','课内复习 · 预习与回测','review','周末多数时间用于校内科目。',false,{subject:d===5?'physics':'mathematics'});
  add(d,'21:20','21:50','兴趣时间 · 网页编写 / UI 设计 / 论文研究','interest','每天只保留 30 分钟，用于兴趣主题的小步推进。');
  add(d,'21:50','22:00','洗漱 · 就寝准备','rest','周计划收尾。');
 }
 // 较长的校内自习时段，按现有学习模块轮换；课间与用餐不填任务。
 const studyPeriods=[
  [0,'11:20','12:00','AL 高数 · 例题与预习','al'],[0,'12:00','12:40','课内复习 · 化学作业与订正','review','chemistry'],
  [1,'09:40','10:20','AL 高数 · 章节练习','al'],[1,'10:20','11:00','AMC12 · 下一套限时练习','amc'],[1,'11:20','12:00','课内复习 · 计算机作业','review','computer'],[1,'12:00','12:40','雅思 · 阅读真题限时练习','ielts',null,'阅读'],[1,'15:10','15:50','HiMCM · 方法练习','himcm'],[1,'15:50','16:30','NLP · 实验记录','nlp'],
  [2,'12:00','12:40','雅思 · 写作 Task 1 / Task 2','ielts',null,'写作'],
  [3,'08:10','08:50','AL 高数 · 概念预习','al'],[3,'08:50','09:30','课内复习 · 物理错题','review','physics'],[3,'11:20','12:00','BMO1 · 证明订正','bmo'],[3,'12:00','12:40','雅思 · 口语 Part 2 / Part 3','ielts',null,'口语'],
  [4,'11:20','12:00','课内复习 · 化学周回顾','review','chemistry'],[4,'12:00','12:40','雅思 · 听力真题专项练习','ielts',null,'听力'],[4,'13:40','14:20','HiMCM · 论文与图表','himcm'],[4,'14:20','15:00','NLP · 代码与日志','nlp'],[4,'15:10','15:50','AL 高数 · 周错题订正','al','mathematics'],[4,'15:50','16:30','课内复习 · 下周课程预习','review','physics']
 ];
 for(const [day,start,end,name,type,subject,ieltsSection] of studyPeriods)add(day,start,end,name,type,'自习课：推进当前任务，最后 5 分钟记录结果与问题。',false,{studyPeriod:true,subject,...(ieltsSection?{ieltsSection}:{})});
 return r;
}

