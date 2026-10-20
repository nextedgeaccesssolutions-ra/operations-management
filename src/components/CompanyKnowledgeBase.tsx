import { useState } from 'react';

interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'policy' | 'procedure' | 'template' | 'project' | 'training' | 'client' | 'supplier';
  content: string;
  version: number;
  lastUpdated: Date;
  updatedBy: string;
  tags: string[];
  accessLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  verified: boolean;
  aiGenerated: boolean;
  source?: string;
}

const sampleDocuments: KnowledgeDocument[] = [
  {
    id: '1',
    title: 'NEAS Company Profile & Services',
    category: 'policy',
    content: 'NextEdge Access Solutions (NEAS) is a leading provider of industrial rope access services in the Philippines. We specialize in facade maintenance, waterproofing, wind turbine services, telecom tower maintenance, and industrial inspection.\n\nOur certified IRATA technicians deliver safe, efficient, and cost-effective solutions for challenging access situations.',
    version: 3,
    lastUpdated: new Date('2024-01-15'),
    updatedBy: 'CEO',
    tags: ['company', 'services', 'profile'],
    accessLevel: 'public',
    verified: true,
    aiGenerated: false,
    source: 'Official Company Document'
  },
  {
    id: '2',
    title: 'Standard Pricing Guidelines 2024',
    category: 'template',
    content: 'Labor Rates:\n- IRATA L1 Technician: ₱2,500/day\n- IRATA L2 Supervisor: ₱3,000/day\n- IRATA L3 Manager: ₱7,500/day\n\nEquipment Rates:\n- Rope Access Kit: ₱500/day\n- Safety Harness: ₱200/day\n- Transport: ₱3,000/day (Metro Manila)\n\nMinimum Markup: 25%\nStandard Contingency: 10%',
    version: 2,
    lastUpdated: new Date('2024-02-01'),
    updatedBy: 'Finance Manager',
    tags: ['pricing', 'rates', 'guidelines'],
    accessLevel: 'confidential',
    verified: true,
    aiGenerated: false,
    source: 'Finance Department'
  },
  {
    id: '3',
    title: 'Rope Access Method Statement Template',
    category: 'template',
    content: '1. Scope of Work\n2. Site Conditions & Hazards\n3. Equipment Requirements\n4. Personnel & Certifications\n5. Rescue Plan\n6. Emergency Procedures\n7. Quality Control\n8. Environmental Considerations\n\n[Detailed template follows...]',
    version: 5,
    lastUpdated: new Date('2024-01-20'),
    updatedBy: 'HSE Manager',
    tags: ['method-statement', 'rope-access', 'template', 'safety'],
    accessLevel: 'internal',
    verified: true,
    aiGenerated: false,
    source: 'HSE Department'
  },
  {
    id: '4',
    title: 'BGC Tower Facade Project - Lessons Learned',
    category: 'project',
    content: 'Project: BGC Tower Facade Maintenance\nDuration: 3 months\nValue: ₱2.5M\n\nKey Lessons:\n1. Weather delays accounted for 15% of schedule - build in contingency\n2. Client required daily progress photos - allocate time for documentation\n3. Anchor point inspection took longer than expected - start early\n4. Night work required special permits - plan ahead\n5. Client appreciated weekly summary reports',
    version: 1,
    lastUpdated: new Date('2024-01-10'),
    updatedBy: 'Project Manager',
    tags: ['project', 'lessons-learned', 'bgc-tower', 'facade'],
    accessLevel: 'internal',
    verified: true,
    aiGenerated: false,
    source: 'Project Closeout Report'
  },
  {
    id: '5',
    title: 'IRATA Certification Requirements',
    category: 'training',
    content: 'IRATA Level 1:\n- Minimum 4 days training\n- Basic rope access techniques\n- Rescue procedures\n- Valid for 3 years\n\nIRATA Level 2:\n- Minimum 5 days training\n- Supervision responsibilities\n- Advanced rescue\n- Requires 1 year L1 experience\n\nIRATA Level 3:\n- Minimum 6 days training\n- Management responsibilities\n- Complex rescue scenarios\n- Requires 2 years L2 experience',
    version: 2,
    lastUpdated: new Date('2024-01-05'),
    updatedBy: 'HR Manager',
    tags: ['training', 'certification', 'irata', 'requirements'],
    accessLevel: 'public',
    verified: true,
    aiGenerated: false,
    source: 'HR Department'
  },
  {
    id: '6',
    title: 'AI-Generated: Facade Cleaning Quotation Draft',
    category: 'template',
    content: 'Draft quotation for 20-story building facade cleaning:\n\nLabor: 3 technicians × 10 days = ₱45,000\nEquipment: Rope access kits = ₱15,000\nTransport: 10 days = ₱30,000\nMaterials: Cleaning solutions = ₱8,000\nSubtotal: ₱98,000\nMarkup (25%): ₱24,500\nTotal: ₱122,500\n\n⚠️ Note: This is an AI-generated estimate. Requires human verification before sending to client.',
    version: 1,
    lastUpdated: new Date('2024-02-08'),
    updatedBy: 'AI System',
    tags: ['quotation', 'facade', 'draft', 'ai-generated'],
    accessLevel: 'internal',
    verified: false,
    aiGenerated: true
  }
];

export default function CompanyKnowledgeBase() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(sampleDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccess, setFilterAccess] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const categories = ['all', 'policy', 'procedure', 'template', 'project', 'training', 'client', 'supplier'];
  const accessLevels = ['all', 'public', 'internal', 'confidential', 'restricted'];

  const filteredDocs = documents.filter(doc => {
    if (filterCategory !== 'all' && doc.category !== filterCategory) return false;
    if (filterAccess !== 'all' && doc.accessLevel !== filterAccess) return false;
    if (showVerifiedOnly && !doc.verified) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(query) ||
             doc.content.toLowerCase().includes(query) ||
             doc.tags.some(tag => tag.toLowerCase().includes(query));
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'policy': return '📋';
      case 'procedure': return '📝';
      case 'template': return '📄';
      case 'project': return '🏗️';
      case 'training': return '🎓';
      case 'client': return '👤';
      case 'supplier': return '🏭';
      default: return '📁';
    }
  };

  const getAccessColor = (access: string) => {
    switch (access) {
      case 'public': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'internal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'confidential': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'restricted': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-white">{documents.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Documents</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-green-400">{documents.filter(d => d.verified).length}</p>
          <p className="text-xs text-slate-400 mt-1">Verified Documents</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-amber-400">{documents.filter(d => d.aiGenerated).length}</p>
          <p className="text-xs text-slate-400 mt-1">AI-Generated (Unverified)</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-3xl font-bold text-[#EBC07E]">{new Set(documents.map(d => d.category)).size}</p>
          <p className="text-xs text-slate-400 mt-1">Categories</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#CA9332]/50"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterAccess}
            onChange={(e) => setFilterAccess(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-white focus:outline-none focus:border-[#CA9332]/50"
          >
            {accessLevels.map(level => (
              <option key={level} value={level}>{level === 'all' ? 'All Access Levels' : level.charAt(0).toUpperCase() + level.slice(1)}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={showVerifiedOnly}
              onChange={(e) => setShowVerifiedOnly(e.target.checked)}
              className="rounded"
            />
            Verified only
          </label>
        </div>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Documents ({filteredDocs.length})</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedDoc?.id === doc.id
                    ? 'bg-[#CA9332]/10 border border-[#CA9332]/30'
                    : 'bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/30'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(doc.category)}</span>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-white line-clamp-2">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getAccessColor(doc.accessLevel)}`}>
                        {doc.accessLevel}
                      </span>
                      {doc.verified ? (
                        <span className="text-[8px] text-green-400">✓ Verified</span>
                      ) : doc.aiGenerated ? (
                        <span className="text-[8px] text-amber-400">⚠ AI-Generated</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>v{doc.version}</span>
                  <span>{doc.lastUpdated.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          {selectedDoc ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getCategoryIcon(selectedDoc.category)}</span>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedDoc.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getAccessColor(selectedDoc.accessLevel)}`}>
                          {selectedDoc.accessLevel.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">v{selectedDoc.version}</span>
                        {selectedDoc.verified ? (
                          <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                            ✓ VERIFIED
                          </span>
                        ) : selectedDoc.aiGenerated ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            ⚠ AI-GENERATED - REQUIRES REVIEW
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Category</p>
                  <p className="text-xs text-white capitalize">{selectedDoc.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Last Updated</p>
                  <p className="text-xs text-white">{selectedDoc.lastUpdated.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Updated By</p>
                  <p className="text-xs text-white">{selectedDoc.updatedBy}</p>
                </div>
                {selectedDoc.source && (
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1">Source</p>
                    <p className="text-xs text-white">{selectedDoc.source}</p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Content</h3>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans">{selectedDoc.content}</pre>
                </div>
              </div>

              {/* Tags */}
              {selectedDoc.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDoc.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-lg bg-slate-700/50 text-xs text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning for AI-Generated */}
              {selectedDoc.aiGenerated && !selectedDoc.verified && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400 font-bold mb-1">⚠️ Important Notice</p>
                  <p className="text-xs text-slate-300">
                    This document was AI-generated and has not been verified by authorized personnel. 
                    Do not use for official communications, quotations, or contractual commitments without proper review and approval.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700/30">
                <button className="px-4 py-2 rounded-lg bg-[#CA9332]/20 text-[#EBC07E] text-xs font-medium hover:bg-[#CA9332]/30 transition-all">
                  Edit Document
                </button>
                <button className="px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all">
                  View History
                </button>
                {!selectedDoc.verified && selectedDoc.aiGenerated && (
                  <button className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all">
                    ✓ Verify Document
                  </button>
                )}
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="ml-auto px-4 py-2 rounded-lg bg-slate-700/30 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-bold text-white mb-2">Select a Document</h3>
                <p className="text-xs text-slate-400">Choose a document from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
