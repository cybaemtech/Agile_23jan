import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, CheckCircle, Edit2, ChevronDown, ChevronRight, LayoutTemplate, Trash2, Copy, ArrowLeft, GripVertical } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/hooks/useAuth';

const colorPalette = [
  '#10b981','#3b82f6','#8b5cf6','#f59e0b','#ec4899',
  '#06b6d4','#ef4444','#84cc16','#f97316','#a855f7',
  '#14b8a6','#f43f5e','#22c55e','#eab308','#6366f1'
];

interface RoadmapProject {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  stream: string;
  actionPoints: string[];
}

interface Template {
  id: number;
  name: string;
  description: string;
  streams: string[];
  projects: RoadmapProject[];
}

const defaultTemplates: Template[] = [
  {
    id: 1,
    name: 'Product Roadmap',
    description: 'Core product streams for feature planning',
    streams: ['Growth', 'Retention', 'Platform', 'Infrastructure', 'Experience'],
    projects: [
      { id: 101, name: 'User Onboarding v2', startDate: '2025-01-15', endDate: '2025-03-20', stream: 'Growth', actionPoints: ['Redesign signup flow', 'Add social login', 'Create tutorial videos'] },
      { id: 102, name: 'Analytics Dashboard', startDate: '2025-02-10', endDate: '2025-05-15', stream: 'Platform', actionPoints: ['Define key metrics', 'Build data pipeline', 'Design UI mockups'] },
      { id: 103, name: 'Mobile App MVP', startDate: '2025-03-01', endDate: '2025-07-30', stream: 'Growth', actionPoints: ['iOS development', 'Android development', 'App store optimization'] },
      { id: 104, name: 'Customer Success Portal', startDate: '2025-04-05', endDate: '2025-06-25', stream: 'Retention', actionPoints: ['Self-service knowledge base', 'Ticket system', 'Live chat integration'] },
      { id: 105, name: 'Infrastructure Upgrade', startDate: '2025-06-01', endDate: '2025-09-15', stream: 'Infrastructure', actionPoints: ['Migrate to cloud', 'Implement CI/CD', 'Security audit'] },
      { id: 106, name: 'Referral Program', startDate: '2025-08-10', endDate: '2025-10-20', stream: 'Growth', actionPoints: ['Design reward structure', 'Build tracking system', 'Marketing campaign'] },
      { id: 107, name: 'Advanced Reporting', startDate: '2025-09-01', endDate: '2025-12-15', stream: 'Platform', actionPoints: ['Custom report builder', 'Data export features', 'Scheduled reports'] },
      { id: 108, name: 'Personalization Engine', startDate: '2025-10-05', endDate: '2026-01-20', stream: 'Experience', actionPoints: ['User behavior tracking', 'ML recommendation model', 'A/B testing framework'] },
      { id: 109, name: 'Enterprise SSO', startDate: '2026-01-10', endDate: '2026-03-25', stream: 'Platform', actionPoints: ['SAML implementation', 'OAuth support', 'Admin controls'] },
      { id: 110, name: 'Loyalty Program v2', startDate: '2026-02-01', endDate: '2026-05-15', stream: 'Retention', actionPoints: ['Tiered membership', 'Points engine', 'Rewards marketplace'] },
    ]
  },
  {
    id: 2,
    name: 'Digital Marketing Plan',
    description: 'Marketing channels and campaign planning',
    streams: ['SEO', 'Paid Ads', 'Social Media', 'Email Marketing', 'Content'],
    projects: [
      { id: 201, name: 'SEO Audit & Revamp', startDate: '2025-01-10', endDate: '2025-03-25', stream: 'SEO', actionPoints: ['Keyword research', 'On-page optimization', 'Backlink strategy'] },
      { id: 202, name: 'Google Ads Launch', startDate: '2025-02-05', endDate: '2025-04-15', stream: 'Paid Ads', actionPoints: ['Campaign setup', 'Ad copy creation', 'Budget allocation'] },
      { id: 203, name: 'Instagram Growth', startDate: '2025-03-01', endDate: '2025-06-20', stream: 'Social Media', actionPoints: ['Content calendar', 'Influencer outreach', 'Reels strategy'] },
      { id: 204, name: 'Newsletter Relaunch', startDate: '2025-04-10', endDate: '2025-05-30', stream: 'Email Marketing', actionPoints: ['Template redesign', 'Segmentation setup', 'A/B subject lines'] },
      { id: 205, name: 'Blog Content Hub', startDate: '2025-05-01', endDate: '2025-09-15', stream: 'Content', actionPoints: ['Editorial calendar', '10 pillar articles', 'Guest post outreach'] },
      { id: 206, name: 'YouTube Channel', startDate: '2025-07-10', endDate: '2025-12-20', stream: 'Content', actionPoints: ['Video production', 'SEO optimization', 'Community building'] },
      { id: 207, name: 'Retargeting Campaigns', startDate: '2025-08-05', endDate: '2025-11-25', stream: 'Paid Ads', actionPoints: ['Pixel setup', 'Audience segments', 'Creative assets'] },
      { id: 208, name: 'LinkedIn Strategy', startDate: '2025-09-15', endDate: '2026-01-10', stream: 'Social Media', actionPoints: ['Company page optimization', 'Thought leadership posts', 'Lead gen forms'] },
    ]
  },
  {
    id: 3,
    name: 'Sales & CRM',
    description: 'Sales pipeline and lead management',
    streams: ['Lead Generation', 'Outreach', 'Pipeline', 'Closing', 'Account Management'],
    projects: [
      { id: 301, name: 'ICP Definition', startDate: '2025-01-05', endDate: '2025-02-28', stream: 'Lead Generation', actionPoints: ['Market research', 'Persona creation', 'Scoring model'] },
      { id: 302, name: 'Cold Outreach System', startDate: '2025-02-15', endDate: '2025-04-20', stream: 'Outreach', actionPoints: ['Email sequences', 'LinkedIn automation', 'Call scripts'] },
      { id: 303, name: 'CRM Implementation', startDate: '2025-03-10', endDate: '2025-06-30', stream: 'Pipeline', actionPoints: ['HubSpot setup', 'Pipeline stages', 'Reporting dashboards'] },
      { id: 304, name: 'Demo Playbook', startDate: '2025-05-01', endDate: '2025-07-15', stream: 'Closing', actionPoints: ['Demo script', 'Objection handling', 'Follow-up templates'] },
      { id: 305, name: 'ABM Campaign', startDate: '2025-06-10', endDate: '2025-09-25', stream: 'Lead Generation', actionPoints: ['Target account list', 'Personalized content', 'Multi-channel strategy'] },
      { id: 306, name: 'Renewal Playbook', startDate: '2025-08-01', endDate: '2025-11-20', stream: 'Account Management', actionPoints: ['Health score model', 'QBR templates', 'Upsell framework'] },
      { id: 307, name: 'Partner Channel Launch', startDate: '2025-10-15', endDate: '2026-02-10', stream: 'Pipeline', actionPoints: ['Partner recruitment', 'Enablement portal', 'Commission structure'] },
    ]
  }
];

function migrateDate(d: string): string {
  if (d && d.length === 7) return d + '-01';
  return d;
}

async function fetchTemplates(): Promise<Template[]> {
  try {
    const res = await fetch('/api/roadmap-templates');
    if (res.ok) {
      const data: Template[] = await res.json();
      data.forEach(t => {
        t.projects.forEach(p => {
          p.startDate = migrateDate(p.startDate);
          p.endDate = migrateDate(p.endDate);
        });
      });
      if (data.length > 0) return data;
    }
    const res2 = await fetch('/api/roadmap-templates/seed', { method: 'POST' });
    if (res2.ok) return res2.json();
  } catch {}
  return [];
}

async function apiCreateTemplate(t: { name: string; description: string; streams: string[]; projects: RoadmapProject[] }): Promise<Template> {
  const res = await fetch('/api/roadmap-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
  });
  return res.json();
}

async function apiUpdateTemplate(t: Template): Promise<Template> {
  const res = await fetch(`/api/roadmap-templates/${t.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(t),
  });
  return res.json();
}

async function apiDeleteTemplate(id: number): Promise<void> {
  await fetch(`/api/roadmap-templates/${id}`, { method: 'DELETE' });
}

const TemplateGallery = ({ templates, onSelect, onCreate, onDelete, onDuplicate }: {
  templates: Template[];
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
}) => {
  const tagColors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700'];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Roadmap Templates</h1>
          <p className="text-gray-500">Select a template to open or create a new one from scratch.</p>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          <button
            onClick={onCreate}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50 transition-all group min-h-48"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors">
              <Plus size={24} className="text-gray-400 group-hover:text-blue-500" />
            </div>
            <span className="font-semibold text-gray-600 group-hover:text-blue-600">New Template</span>
            <span className="text-sm text-gray-400 mt-1">Start from scratch</span>
          </button>

          {templates.map((tpl, ti) => (
            <div
              key={tpl.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-2 rounded-t-xl" style={{ backgroundColor: colorPalette[ti % colorPalette.length] }} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-base leading-tight">{tpl.name}</h3>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => onDuplicate(tpl.id)} title="Duplicate" className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                      <Copy size={15} />
                    </button>
                    <button onClick={() => onDelete(tpl.id)} title="Delete" className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4 flex-1">{tpl.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {tpl.streams.map((s, si) => (
                    <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[si % tagColors.length]}`}>{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{tpl.projects.length} projects</span>
                  <button
                    onClick={() => onSelect(tpl.id)}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NewTemplateModal = ({ onConfirm, onCancel }: {
  onConfirm: (data: { name: string; description: string; streams: string[] }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [streams, setStreams] = useState(['']);

  const addStream = () => setStreams([...streams, '']);
  const updateStream = (i: number, v: string) => { const s = [...streams]; s[i] = v; setStreams(s); };
  const removeStream = (i: number) => { if (streams.length > 1) setStreams(streams.filter((_, idx) => idx !== i)); };

  const handleConfirm = () => {
    const validStreams = streams.filter(s => s.trim());
    if (name.trim() && validStreams.length > 0) {
      onConfirm({ name: name.trim(), description: desc.trim(), streams: validStreams });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Template</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="e.g., Engineering Roadmap" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Short description..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Streams / Services *</label>
            <div className="space-y-2">
              {streams.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input value={s} onChange={e => updateStream(i, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder={`Stream ${i + 1}`} />
                  {streams.length > 1 && (
                    <button onClick={() => removeStream(i)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                  )}
                </div>
              ))}
              <button onClick={addStream} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Stream</button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">Cancel</button>
          <button onClick={handleConfirm} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">Create Template</button>
        </div>
      </div>
    </div>
  );
};

const RoadmapEditor = ({ template, onUpdate, onBack }: {
  template: Template;
  onUpdate: (t: Template) => void;
  onBack: () => void;
}) => {
  const [streams, setStreams] = useState(template.streams);
  const [projects, setProjects] = useState(template.projects);
  const [newStreamName, setNewStreamName] = useState('');
  const [showStreamInput, setShowStreamInput] = useState(false);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', stream: template.streams[0] || '', actionPoints: [''] });
  const [dragStreamIdx, setDragStreamIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const getStreamColor = (s: string) => colorPalette[streams.indexOf(s) % colorPalette.length];

  const addStream = () => {
    const t = newStreamName.trim();
    if (t && !streams.includes(t)) {
      const newStreams = [...streams, t];
      setStreams(newStreams);
      setFormData({ ...formData, stream: t });
      setNewStreamName('');
      setShowStreamInput(false);
      onUpdate({ ...template, streams: newStreams, projects });
    }
  };

  const deleteStream = (s: string) => {
    if (projects.some(p => p.stream === s)) {
      if (!confirm(`"${s}" has projects. Delete them too?`)) return;
    }
    const filteredProjects = projects.filter(p => p.stream !== s);
    setProjects(filteredProjects);
    const updated = streams.filter(x => x !== s);
    setStreams(updated);
    if (selectedProject && !filteredProjects.find(p => p.id === selectedProject)) {
      clearSelection();
    }
    if (formData.stream === s) setFormData({ ...formData, stream: updated[0] || '' });
    onUpdate({ ...template, streams: updated, projects: filteredProjects });
  };

  const handleStreamDragStart = (idx: number) => {
    setDragStreamIdx(idx);
  };

  const handleStreamDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleStreamDrop = (idx: number) => {
    if (dragStreamIdx === null || dragStreamIdx === idx) {
      setDragStreamIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...streams];
    const [moved] = reordered.splice(dragStreamIdx, 1);
    reordered.splice(idx, 0, moved);
    setStreams(reordered);
    onUpdate({ ...template, streams: reordered, projects });
    setDragStreamIdx(null);
    setDragOverIdx(null);
  };

  const handleStreamDragEnd = () => {
    setDragStreamIdx(null);
    setDragOverIdx(null);
  };

  const persistTemplate = (p: RoadmapProject[]) => onUpdate({ ...template, streams, projects: p });

  const addProject = () => {
    if (formData.name && formData.startDate && formData.endDate && formData.stream) {
      const ap = formData.actionPoints.filter(x => x.trim());
      const updated = [...projects, { ...formData, actionPoints: ap, id: Date.now() }];
      setProjects(updated);
      persistTemplate(updated);
      setFormData({ ...formData, name: '', startDate: '', endDate: '', actionPoints: [''] });
    }
  };

  const updateProjectHandler = () => {
    if (selectedProject) {
      const ap = formData.actionPoints.filter(x => x.trim());
      const updated = projects.map(p => p.id === selectedProject ? { ...formData, actionPoints: ap, id: selectedProject } : p);
      setProjects(updated);
      persistTemplate(updated);
      clearSelection();
    }
  };

  const deleteProject = (id: number) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    persistTemplate(updated);
    if (selectedProject === id) clearSelection();
  };

  const selectProject = (id: number) => {
    const p = projects.find(x => x.id === id);
    if (p) {
      setSelectedProject(id);
      setFormData({ name: p.name, startDate: p.startDate, endDate: p.endDate, stream: p.stream, actionPoints: p.actionPoints.length ? [...p.actionPoints] : [''] });
    }
  };

  const clearSelection = () => {
    setSelectedProject(null);
    setFormData({ name: '', startDate: '', endDate: '', stream: streams[0] || '', actionPoints: [''] });
  };

  const addAP = () => setFormData({ ...formData, actionPoints: [...formData.actionPoints, ''] });
  const updateAP = (i: number, v: string) => { const a = [...formData.actionPoints]; a[i] = v; setFormData({ ...formData, actionPoints: a }); };
  const removeAP = (i: number) => { if (formData.actionPoints.length > 1) setFormData({ ...formData, actionPoints: formData.actionPoints.filter((_, idx) => idx !== i) }); };

  const parseDate = (d: string) => {
    if (d.length === 7) return new Date(d + '-01');
    return new Date(d);
  };

  const getDateRange = () => {
    if (!projects.length) {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const months: Date[] = [];
      for (let i = 0; i < 12; i++) { months.push(new Date(now.getFullYear(), i, 1)); }
      return { start, months, totalDays: 365 };
    }
    const dates = projects.flatMap(p => [parseDate(p.startDate), parseDate(p.endDate)]);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    const months: Date[] = [];
    const cur = new Date(start);
    while (cur <= endMonth) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
    const totalDays = Math.max(1, (endMonth.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { start, months, totalDays };
  };

  const calcLayout = () => {
    const layout: Record<number, { stream: string; lane: number; totalLanes: number }> = {};
    streams.forEach(stream => {
      const sp = projects.filter(p => p.stream === stream).sort((a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime());
      const lanes: RoadmapProject[][] = [];
      sp.forEach(proj => {
        const pS = parseDate(proj.startDate);
        let li = lanes.findIndex(lane => lane.every(e => parseDate(e.endDate) < pS));
        if (li === -1) { li = lanes.length; lanes.push([]); }
        lanes[li].push(proj);
        layout[proj.id] = { stream, lane: li, totalLanes: 0 };
      });
      sp.forEach(p => { layout[p.id].totalLanes = lanes.length; });
    });
    return layout;
  };

  const { start: rangeStart, months, totalDays } = getDateRange();
  const layout = calcLayout();
  const rangeEnd = months.length > 0 ? new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 0) : rangeStart;

  const getPos = (proj: RoadmapProject) => {
    const pS = parseDate(proj.startDate);
    const pE = parseDate(proj.endDate);
    if (totalDays === 0) return { left: '0%', width: '100%' };
    const startOffset = Math.max(0, (pS.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const endOffset = Math.min(totalDays, (pE.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    const leftPct = (startOffset / totalDays) * 100;
    const widthPct = Math.max(1, ((endOffset - startOffset) / totalDays) * 100);
    return { left: `${leftPct}%`, width: `${widthPct}%` };
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors"><ArrowLeft size={20} /></button>
          <h2 className="text-lg font-bold text-gray-900 truncate">{template.name}</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5 ml-7">{template.description}</p>

        {selectedProject && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Edit2 size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">Editing project. <button onClick={clearSelection} className="underline font-medium">Cancel</button> to return.</div>
          </div>
        )}

        <div className="mb-5 pb-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900">Streams / Services</h3>
            <button onClick={() => setShowStreamInput(!showStreamInput)} className="text-blue-600 text-xs font-medium hover:text-blue-700">
              {showStreamInput ? 'Cancel' : '+ Add New'}
            </button>
          </div>
          {showStreamInput && (
            <div className="flex gap-2 mb-3">
              <input value={newStreamName} onChange={e => setNewStreamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStream()} className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md" placeholder="New stream name" autoFocus />
              <button onClick={addStream} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Add</button>
            </div>
          )}
          <div className="space-y-0.5">
            {streams.map((s, idx) => (
              <div
                key={s}
                draggable
                onDragStart={() => handleStreamDragStart(idx)}
                onDragOver={e => handleStreamDragOver(e, idx)}
                onDrop={() => handleStreamDrop(idx)}
                onDragEnd={handleStreamDragEnd}
                className={`flex items-center justify-between px-2 py-1.5 rounded group cursor-grab active:cursor-grabbing transition-all ${
                  dragStreamIdx === idx ? 'opacity-40 bg-gray-100' : dragOverIdx === idx ? 'bg-blue-50 border border-blue-300 border-dashed' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: getStreamColor(s) }} />
                  <span className="text-sm text-gray-700">{s}</span>
                </div>
                <button onClick={() => deleteStream(s)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Name</label>
            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="Enter project name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stream / Service</label>
            <select value={formData.stream} onChange={e => setFormData({ ...formData, stream: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              {streams.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Action Points</label>
            <div className="space-y-2">
              {formData.actionPoints.map((pt, i) => (
                <div key={i} className="flex gap-2">
                  <input value={pt} onChange={e => updateAP(i, e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs" placeholder={`Action point ${i + 1}`} />
                  {formData.actionPoints.length > 1 && <button onClick={() => removeAP(i)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>}
                </div>
              ))}
              <button onClick={addAP} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Action Point</button>
            </div>
          </div>

          {selectedProject ? (
            <div className="space-y-2">
              <button onClick={updateProjectHandler} className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm">
                <CheckCircle size={16} />Update Project
              </button>
              <button onClick={clearSelection} className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          ) : (
            <button onClick={addProject} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 text-sm">
              <Plus size={16} />Add Project
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded" onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              {isProjectsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Projects ({projects.length})
            </h3>
          </div>
          {isProjectsExpanded && (
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} className={`flex items-start justify-between p-2 rounded cursor-pointer transition-colors ${selectedProject === p.id ? 'bg-blue-100 border-2 border-blue-400' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => selectProject(p.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">{parseDate(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &rarr; {parseDate(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-xs font-medium mt-0.5" style={{ color: getStreamColor(p.stream) }}>{p.stream}</div>
                    {p.actionPoints?.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <CheckCircle size={10} /><span>{p.actionPoints.length} action points</span>
                      </div>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Portfolio Roadmap</h2>
          <span className="text-sm text-gray-400 flex items-center gap-1"><LayoutTemplate size={16} />{template.name}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex mb-4">
              <div className="w-40 flex-shrink-0" />
              <div className="flex-1 flex">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 text-center text-xs font-medium text-gray-600 border-l border-gray-200 px-1">
                    {m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>

            {streams.map(stream => {
              const sp = projects.filter(p => p.stream === stream);
              const maxLanes = sp.length ? Math.max(...sp.map(p => layout[p.id]?.totalLanes || 1)) : 1;
              const laneH = sp.length ? 56 + (maxLanes - 1) * 50 : 40;
              const hasHover = sp.some(p => p.id === hoveredProject);

              return (
                <div key={stream} className="mb-4 border-b border-gray-200 pb-4" style={{ position: 'relative', zIndex: hasHover ? 100 : 1 }}>
                  <div className="flex">
                    <div className="w-40 flex-shrink-0 flex items-center">
                      <span className="font-semibold text-sm" style={{ color: getStreamColor(stream) }}>{stream}</span>
                    </div>
                    <div className="flex-1 relative" style={{ height: `${laneH}px` }}>
                      <div className="absolute inset-0 flex">
                        {months.map((_, i) => <div key={i} className="flex-1 border-l border-gray-100" />)}
                      </div>

                      {sp.map(proj => {
                        const pos = getPos(proj);
                        const li = layout[proj.id];
                        const top = 10 + (li?.lane || 0) * 50;
                        const isSel = selectedProject === proj.id;
                        const isHov = hoveredProject === proj.id;
                        const fmtDate = (d: string) => {
                          const dt = parseDate(d);
                          return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        };

                        return (
                          <div key={proj.id} className="absolute" style={{ left: pos.left, width: pos.width, top, zIndex: isSel ? 30 : isHov ? 20 : 10 }}
                            onMouseEnter={() => setHoveredProject(proj.id)}
                            onMouseLeave={() => setHoveredProject(null)}
                            onClick={() => selectProject(proj.id)}
                          >
                            <div className={`rounded px-2 py-1 text-white text-xs font-medium shadow-sm hover:shadow-lg transition-all cursor-pointer ${isSel ? 'ring-4 ring-gray-900 ring-opacity-50' : ''}`}
                              style={{ height: 36, backgroundColor: getStreamColor(stream), display: 'flex', alignItems: 'center', opacity: isSel ? 1 : 0.9, transform: isSel ? 'scale(1.02)' : 'scale(1)', minWidth: 60 }}
                            >
                              <span className="truncate">{proj.name}</span>
                            </div>

                            {isHov && (
                              <div className="absolute left-0 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-3 mt-1 w-64 z-50" style={{ top: 40 }}>
                                <div className="mb-2 pb-2 border-b border-gray-200">
                                  <div className="font-bold text-gray-900 text-sm">{proj.name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">{fmtDate(proj.startDate)} &rarr; {fmtDate(proj.endDate)}</div>
                                </div>
                                {proj.actionPoints?.length > 0 && (
                                  <>
                                    <div className="font-semibold text-gray-900 text-xs mb-1.5 flex items-center gap-1.5">
                                      <CheckCircle size={12} style={{ color: getStreamColor(stream) }} />Action Points
                                    </div>
                                    <ul className="space-y-1">
                                      {proj.actionPoints.map((pt, idx) => (
                                        <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                          <span className="text-gray-400">&bull;</span><span>{pt}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {!projects.length && (
              <div className="text-center py-8 text-gray-400 text-sm">Add projects to see the roadmap</div>
            )}
          </div>
      </div>
    </div>
  );
};

export default function StrategicRoadmapPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates().then(data => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  const activeTemplate = templates.find(t => t.id === activeId);

  const handleCreate = async ({ name, description, streams }: { name: string; description: string; streams: string[] }) => {
    const created = await apiCreateTemplate({ name, description, streams, projects: [] });
    setTemplates([...templates, created]);
    setActiveId(created.id);
    setShowNewModal(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    await apiDeleteTemplate(id);
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleDuplicate = async (id: number) => {
    const src = templates.find(t => t.id === id);
    if (!src) return;
    const created = await apiCreateTemplate({
      name: `${src.name} (Copy)`,
      description: src.description,
      streams: src.streams,
      projects: src.projects,
    });
    setTemplates([...templates, created]);
  };

  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleUpdate = useCallback((updated: Template) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      apiUpdateTemplate(updated);
    }, 500);
  }, []);

  const content = loading ? (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading templates...</div>
    </div>
  ) : activeTemplate ? (
    <RoadmapEditor template={activeTemplate} onUpdate={handleUpdate} onBack={() => setActiveId(null)} />
  ) : (
    <>
      <TemplateGallery
        templates={templates}
        onSelect={setActiveId}
        onCreate={() => setShowNewModal(true)}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
      {showNewModal && <NewTemplateModal onConfirm={handleCreate} onCancel={() => setShowNewModal(false)} />}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user as any} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {content}
        </main>
      </div>
    </div>
  );
}
