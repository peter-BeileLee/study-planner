import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.dates as mdates
from datetime import datetime
import numpy as np

# 自动适配中文系统字体
plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'PingFang SC', 'SimHei', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False

# 统一高级暗黑配色方案
COLORS = {
    "IELTS": "#f59e0b",   # 琥珀色
    "Math": "#06b6d4",    # 青色 (AMC)
    "BMO": "#6366f1",     # 靛蓝
    "HiMCM": "#a855f7",   # 紫色
    "NLP": "#f43f5e",     # 玫瑰红
    "School": "#10b981",  # 翠绿
    "Physical": "#64748b",# 石板灰
    "BG": "#0f172a",      # 极暗深蓝
    "Panel": "#1e293b"
}

# 创建画布：左边是周视图，右边是月度甘特图
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(24, 10), facecolor=COLORS["BG"], gridspec_kw={'width_ratios': [1, 1.2]})

# ==========================================
# 图 1：每周动态时间块分配 (Weekly Time-Blocking)
# ==========================================
ax1.set_facecolor(COLORS["BG"])
ax1.set_xlim(0, 7)
ax1.set_ylim(23, 6) # Y轴时间 06:00 到 23:00 (倒序)

days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

def add_block(ax, day_idx, start_h, end_h, title, color, text_col='white'):
    height = end_h - start_h
    # 这里的 rx 和 ry 已经被彻底去除了，绝对安全！
    rect = patches.Rectangle((day_idx, start_h), 0.95, height, linewidth=1, edgecolor=COLORS["BG"], facecolor=color, alpha=0.9)
    ax.add_patch(rect)
    if height >= 0.7:
        ax.text(day_idx + 0.475, start_h + height/2, title, color=text_col, ha='center', va='center', fontsize=9, fontweight='bold', wrap=True)

# 绘制工作日 (0-4)
for d in range(5):
    add_block(ax1, d, 6.1, 7.75, "雅思冲刺\n(R/L/S/W全集)", COLORS["IELTS"])
    add_block(ax1, d, 8.1, 12.6, "校内课程\n(Phys/Chem/CS/Math)", COLORS["Panel"], text_col="#94a3b8")
    add_block(ax1, d, 12.6, 13.5, "HiMCM 建模\n(讲义/算法)", COLORS["HiMCM"])
    add_block(ax1, d, 13.6, 16.5, "校内课程", COLORS["Panel"], text_col="#94a3b8")
    add_block(ax1, d, 16.6, 17.6, "BMO1 备考\n(1道大题+证明)", COLORS["BMO"])
    add_block(ax1, d, 17.6, 18.6, "体能/晚餐", COLORS["Physical"], text_col="#cbd5e1")
    add_block(ax1, d, 18.6, 20.0, "AMC12 极限\n(1套全卷)", COLORS["Math"])
    add_block(ax1, d, 20.0, 21.25, "AMC12 压轴\n(解析+10前十题)", COLORS["Math"])
    add_block(ax1, d, 21.25, 22.0, "校内复习闭环", COLORS["School"])

# 绘制周末 (5-6)
for d in range(5, 7):
    add_block(ax1, d, 8.0, 11.5, "数学超频压测\n(AMC套卷 + BMO)", COLORS["Math"])
    add_block(ax1, d, 12.6, 13.5, "HiMCM 建模研发", COLORS["HiMCM"])
    if d == 5: # 周六
        add_block(ax1, d, 14.0, 17.5, "数学超频压测\n(深水区复盘)", COLORS["BMO"])
        add_block(ax1, d, 18.5, 21.5, "雅思全真模考", COLORS["IELTS"])
    if d == 6: # 周日
        add_block(ax1, d, 14.0, 17.5, "NLP 实习研发\n(专属大时间块)", COLORS["NLP"])
        add_block(ax1, d, 18.5, 21.5, "全周校内总复习", COLORS["School"])

ax1.set_xticks(np.arange(7) + 0.475)
ax1.set_xticklabels(days, color="white", fontweight="bold")
ax1.set_yticks(np.arange(6, 24))
ax1.set_yticklabels([f"{h}:00" for h in range(6, 24)], color="#cbd5e1")
ax1.tick_params(left=False, bottom=False)
for spine in ax1.spines.values(): spine.set_visible(False)
ax1.grid(axis='y', color=COLORS["Panel"], linestyle='-', alpha=0.5)
ax1.set_title("WEEKLY TIME-BLOCKING OS", color="white", fontsize=16, fontweight='black', pad=20)


# ==========================================
# 图 2：月度甘特推进图 (Monthly Timeline)
# ==========================================
ax2.set_facecolor(COLORS["BG"])

GANTT_TASKS = [
    ("AMC&BMO", "专项与手速拉扯", "2026-09-09", "2026-10-15", COLORS["Math"]),
    ("AMC&BMO", "高压套卷与深度证明", "2026-10-16", "2026-11-10", COLORS["Math"]),
    ("AMC&BMO", "BMO 终极模考", "2026-11-11", "2026-11-30", COLORS["BMO"]),
    ("雅思", "每日 R+L+S+W", "2026-09-09", "2026-11-30", COLORS["IELTS"]),
    ("雅思", "机考全真冲刺", "2026-12-01", "2026-12-20", COLORS["IELTS"]),
    ("HiMCM", "模型讲义学习", "2026-09-09", "2026-10-31", COLORS["HiMCM"]),
    ("HiMCM", "组队竞赛周", "2026-11-01", "2026-11-15", COLORS["HiMCM"]),
    ("NLP项目", "每周 3.5H 核心研发", "2026-09-09", "2026-11-10", COLORS["NLP"]),
    ("NLP项目", "报告与答辩", "2026-11-11", "2026-11-20", COLORS["NLP"]),
    ("校内课业", "新课推进闭环", "2026-09-09", "2026-11-30", COLORS["School"]),
    ("校内课业", "期末真题保卫战", "2026-12-01", "2026-12-31", COLORS["School"]),
]

categories = list(dict.fromkeys([t[0] for t in GANTT_TASKS]))
cat_to_y = {cat: (len(categories) - i) * 10 for i, cat in enumerate(categories)}
cat_counter = {cat: 0 for cat in categories}

for task in GANTT_TASKS:
    cat, name, start_str, end_str, color = task
    y_base = cat_to_y[cat]
    start = mdates.datestr2num(start_str)
    end = mdates.datestr2num(end_str)
    ax2.barh(y_base, end-start, left=start, height=3, color=color, alpha=0.9, edgecolor=COLORS["BG"], linewidth=1.5)
    
    text_y_offset = 3 if cat_counter[cat] % 2 == 0 else -3.5
    ax2.text(start + (end-start)/2, y_base + text_y_offset, name, color='white', 
            ha='center', va='center', fontsize=9, fontweight='bold',
            bbox=dict(facecolor=COLORS["BG"], edgecolor=color, boxstyle='round,pad=0.3', alpha=0.9))
    cat_counter[cat] += 1

ax2.set_yticks([cat_to_y[cat] for cat in categories])
ax2.set_yticklabels(categories, color='white', fontsize=12, fontweight='bold')
ax2.set_xlim(mdates.datestr2num("2026-09-01"), mdates.datestr2num("2026-12-31"))
ax2.xaxis.set_major_locator(mdates.DayLocator(interval=15))
ax2.xaxis.set_major_formatter(mdates.DateFormatter("%m-%d"))
ax2.tick_params(axis='x', colors='#94a3b8', labelsize=10, rotation=30)
ax2.tick_params(axis='y', colors='white')
for spine in ['top', 'right']: ax2.spines[spine].set_visible(False)
for spine in ['left', 'bottom']: ax2.spines[spine].set_color(COLORS["Panel"])
ax2.grid(axis='x', color=COLORS["Panel"], linestyle='--', alpha=0.8)

# 今日镭射扫描线
today = mdates.datestr2num("2026-09-10")
ax2.axvline(today, color='#ef4444', linestyle='-', linewidth=2, zorder=0)
ax2.text(today, max(cat_to_y.values()) + 8, "TODAY", color='#ef4444', fontsize=10, fontweight='bold', ha='center')

ax2.set_title("STRATEGIC GANTT CHART", color="white", fontsize=16, fontweight='black', pad=20)

plt.tight_layout()
plt.savefig('Academic_OS_DualView.png', dpi=300, bbox_inches='tight', facecolor=COLORS["BG"])
print("图表已生成完毕！请查看当前目录下的 'Academic_OS_DualView.png'")
plt.show()