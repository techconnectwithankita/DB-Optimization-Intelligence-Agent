import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://127.0.0.1:8010'
    : window.location.origin);

const sources = [
  { id: 'azure', name: 'Azure DevOps', desc: 'Boards / Wiki / PRD', color: '#dbeafe', icon: 'azure' },
  { id: 'jira', name: 'Jira', desc: 'Stories / Epics', color: '#e0f2fe', icon: 'diamond' },
  { id: 'confluence', name: 'Confluence', desc: 'Pages / Docs', color: '#dbeafe', icon: 'waves' },
  { id: 'files', name: 'Local Files', desc: '.txt, .md, .docx, .pdf', color: '#fef3c7', icon: 'folder' },
  { id: 'excel', name: 'Excel / CSV', desc: '.xlsx, .csv', color: '#dcfce7', icon: 'sheet' }
];

const initialRequirements = [];

const artifacts = [
  ['OpenAPI Specification (YAML/JSON)', 'Complete OpenAPI 3.0 specification', 'doc', '#ccfbf1', 'openapi', 'openapi.yaml'],
  ['Swagger / API Documentation', 'Interactive API documentation notes', 'globe', '#e0f2fe', 'swagger', 'swagger-documentation.md'],
  ['API Endpoints Summary (Markdown)', 'Human-readable API summary', 'file', '#dbeafe', 'summary', 'endpoint-summary.md'],
  ['Data Models / Schemas (JSON)', 'Request & response schemas', 'cube', '#ede9fe', 'schemas', 'schemas.json'],
  ['Postman Collection', 'Ready-to-use collection for testing', 'rocket', '#ffedd5', 'postman', 'postman-collection.json'],
  ['Sequence Diagrams (Mermaid)', 'API flow and interactions', 'flow', '#e0e7ff', 'sequence', 'sequence-diagram.mmd'],
  ['API Design Review', 'Review checklist and guidelines', 'checkfile', '#ccfbf1', 'review', 'design-review.md'],
  ['API Development Kit', 'Server stubs, DTOs, validators, README', 'cloud', '#dcfce7', 'devkit', 'api-development-kit.json'],
  ['Testing Package', 'Unit, API, schema and performance tests', 'shield', '#fef3c7', 'tests', 'testing-package.json'],
  ['Deployment Package', 'Docker, CI/CD, config and startup assets', 'sync', '#fee2e2', 'deployment', 'deployment-package.json'],
  ['Gateway / Hosting Setup', 'Routing, auth, rate limits, versioning', 'plug', '#ede9fe', 'gateway', 'gateway-setup.json'],
  ['Deploy & Monitor', 'Health, logs, metrics, alerts readiness', 'history', '#dbeafe', 'monitoring', 'monitoring-readiness.json']
];

const actions = [
  ['Generate / Regenerate', 'Generate API design from requirement', 'spark'],
  ['Validate OpenAPI Spec', 'Validate spec for errors, standards & best practices', 'shield'],
  ['Generate Dev Kit', 'Create server stubs, DTOs and validators', 'cloud'],
  ['Generate Tests', 'Create unit, API and schema validation tests', 'checkfile'],
  ['Prepare Deployment', 'Create Docker, CI/CD and environment config', 'sync'],
  ['Prepare Gateway', 'Create APIM, Kong and NGINX setup assets', 'plug'],
  ['Monitoring Readiness', 'Create health, logging, metrics and alert plan', 'history']
];

const features = [
  ['1. Sources', ['Excel/CSV upload', 'Jira, ADO, Confluence ready', 'Local docs and PDFs'], 'file'],
  ['2. Extraction', ['Requirements and user stories', 'Rules, entities, validations', 'Priorities and dependencies'], 'flow'],
  ['3. Selection', ['Review extracted items', 'Select requirement for generation', 'Trace to original source'], 'check'],
  ['4. OpenAPI YAML', ['Endpoints and schemas', 'Errors and validations', 'Design notes'], 'spark'],
  ['5. Swagger Docs', ['Interactive contract review', 'Request/response inspection', 'Try-it-ready documentation'], 'globe'],
  ['6. Artifacts', ['Schemas and Postman', 'Sequence diagrams', 'Review checklist'], 'doc'],
  ['7. Dev Kit', ['Server stubs', 'DTOs and validators', 'README and env config'], 'cloud'],
  ['8. Testing', ['Unit test templates', 'API and schema tests', 'Performance setup'], 'shield'],
  ['9. Deployment', ['Dockerfile', 'CI/CD pipeline', 'Cloud config scripts'], 'sync'],
  ['10. Gateway', ['Routing and auth hooks', 'Rate limits', 'Versioning options'], 'plug'],
  ['11. Monitor', ['Health checks', 'Logs and metrics', 'Alerts readiness'], 'history']
];

function Icon({ name, size = 18 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const filled = { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor' };

  const icons = {
    logo: <svg {...props}><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="3" y="16" width="6" height="4" rx="1" /><rect x="15" y="16" width="6" height="4" rx="1" /><path d="M12 7v6M6 16v-3h12v3" /></svg>,
    spark: <svg {...filled}><path d="m12 2 1.7 5.2L19 9l-5.3 1.8L12 16l-1.7-5.2L5 9l5.3-1.8L12 2ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Zm14-1 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" /></svg>,
    plug: <svg {...props}><path d="M9 7V2M15 7V2M7 7h10v4a5 5 0 0 1-10 0V7ZM12 16v6" /></svg>,
    globe: <svg {...props}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></svg>,
    diamond: <svg {...filled}><path d="m12 2 10 10-10 10L2 12 12 2Zm0 6-4 4 4 4 4-4-4-4Z" /></svg>,
    waves: <svg {...filled}><path d="M4 4h9l7 5-5 4 5 4-4 3-7-5H4l5-4-5-4Z" /></svg>,
    folder: <svg {...filled}><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4L12 6h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z" /></svg>,
    sheet: <svg {...filled}><path d="M5 3h10l4 4v14H5V3Zm9 1v4h4M8 9h8M8 13h8M8 17h8" /></svg>,
    azure: <svg {...filled}><path d="M13.4 3 4 6.7v8.6L13.4 21 20 17.8V6.1L13.4 3Zm0 2.7v12.6L7 14.6V8.3l6.4-2.6Z" /></svg>,
    check: <svg {...props}><path d="m20 6-11 11-5-5" /></svg>,
    search: <svg {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    filter: <svg {...props}><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3Z" /></svg>,
    arrow: <svg {...props}><path d="M5 12h14M12 5l7 7-7 7" /></svg>,
    eye: <svg {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>,
    download: <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>,
    refresh: <svg {...props}><path d="M21 12a9 9 0 0 1-15.6 6.1M3 12A9 9 0 0 1 18.6 5.9M3 18v-6h6M21 6v6h-6" /></svg>,
    doc: <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>,
    file: <svg {...props}><path d="M14 2H7a2 2 0 0 0-2 2v16h14V7Z" /><path d="M14 2v5h5M8 12h8M8 16h6" /></svg>,
    cube: <svg {...props}><path d="m21 16-9 5-9-5V8l9-5 9 5v8Z" /><path d="m3.3 7.8 8.7 5 8.7-5M12 22v-9" /></svg>,
    rocket: <svg {...filled}><path d="M13 3c4.7.5 7.5 3.3 8 8l-5 5-6-6 3-7ZM6 14l4 4-4 3-3-3 3-4Zm4-4-5 1-3 5 6-2 2-4Zm4 4-1 5-5 3 2-6 4-2Z" /></svg>,
    flow: <svg {...props}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="9" y="15" width="6" height="6" rx="1" /><path d="M7 10v2.5h5V15M17 10v2.5h-5" /></svg>,
    checkfile: <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16h14V8Z" /><path d="M14 2v6h6M8 15l2 2 5-5" /></svg>,
    shield: <svg {...filled}><path d="M12 2 20 5v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5l8-3Zm-1 13.5 6-6-1.4-1.4L11 12.7 8.4 10.1 7 11.5l4 4Z" /></svg>,
    cloud: <svg {...filled}><path d="M19 18H7a5 5 0 0 1-.7-10A6.5 6.5 0 0 1 19 10.5 3.8 3.8 0 0 1 19 18Zm-8-7-4 4h3v3h2v-3h3l-4-4Z" /></svg>,
    sync: <svg {...props}><path d="M21 7v6h-6M3 17v-6h6" /><path d="M21 13A8 8 0 0 0 7.5 7.1L3 11M3 11a8 8 0 0 0 13.5 5.9L21 13" /></svg>,
    history: <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>,
    bot: <svg {...props}><rect x="5" y="8" width="14" height="10" rx="3" /><path d="M12 8V4M8 12h.01M16 12h.01M9 18l-2 3M15 18l2 3" /></svg>,
    plus: <svg {...props}><path d="M12 5v14M5 12h14" /></svg>
  };

  return icons[name] || icons.doc;
}

function SectionHeader({ number, title, subtitle, tone = 'blue' }) {
  return (
    <div className="card-header">
      <div className="title-row">
        <span className={`section-num ${tone}`}>{number}</span>
        <span className={`section-title ${tone}`}>{title}</span>
      </div>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function buildSpec(req) {
  if (!req) {
    return '';
  }

  const requestSchema = req.title.replace(/[^A-Za-z]/g, '');
  const bodyVerb = req.method === 'get' ? 'retrieving' : req.method === 'patch' ? 'updating' : 'creating';
  return [
    'openapi: 3.0.3',
    'info:',
    '  title: Policy Management API',
    '  version: 1.0.0',
    `  description: API for ${bodyVerb} and managing policies`,
    'servers:',
    '  - url: https://api.company.com/v1',
    'paths:',
    `  ${req.path}:`,
    `    ${req.method}:`,
    `      summary: ${req.summary}`,
    '      tags:',
    '        - Policies',
    ...(req.method === 'get'
      ? []
      : [
          '      requestBody:',
          '        required: true',
          '        content:',
          '          application/json:',
          '            schema:',
          `              $ref: '#/components/schemas/${requestSchema}Request'`
        ]),
    '      responses:',
    req.method === 'post' ? "        '201':" : "        '200':",
    `          description: ${req.title} completed successfully`,
    '          content:',
    '            application/json:',
    '              schema:',
    "                $ref: '#/components/schemas/PolicyResponse'",
    'components:',
    '  schemas:',
    `    ${requestSchema}Request:`,
    '      type: object',
    '      required: [policyNumber]',
    '      properties:',
    '        policyNumber:',
    '          type: string',
    '    PolicyResponse:',
    '      type: object',
    '      properties:',
    '        status:',
    '          type: string'
  ].join('\n');
}

function getStructuredPreview(design, requirement) {
  if (!design || !requirement) {
    return null;
  }

  const schemaNames = Object.keys(design.schemas_json || {});

  return {
    title: requirement.summary || requirement.title,
    endpoint: `${(requirement.method || 'post').toUpperCase()} ${requirement.path || '/generated-resource'}`,
    requestSchema: schemaNames.find((name) => name.endsWith('Request')) || schemaNames[0] || 'Request',
    responseSchema: schemaNames.find((name) => name.endsWith('Response')) || schemaNames[1] || 'Response',
    errorSchema: schemaNames.find((name) => name.toLowerCase().includes('error')) || 'ErrorResponse',
    statusCode: (requirement.method || 'post').toLowerCase() === 'post' ? '201' : '200',
    notes: [
      'OpenAPI 3.0.3 contract generated from the selected source requirement.',
      'Reusable request, response, and error schemas are included.',
      'Bearer authentication placeholder is included for gateway integration.'
    ]
  };
}

function App() {
  const [selectedSourceIds, setSelectedSourceIds] = useState(sources.map((source) => source.id));
  const [requirements, setRequirements] = useState(initialRequirements);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [tab, setTab] = useState('Extracted');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('Upload an Excel or CSV source to extract requirements');
  const [activity, setActivity] = useState([{ label: 'Generated by', value: 'API Designer Agent' }]);
  const [lastGeneratedAt, setLastGeneratedAt] = useState('12:45:30 PM');
  const [design, setDesign] = useState(null);
  const [rawSourceText, setRawSourceText] = useState('');
  const [sourceSummary, setSourceSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(null);
  const fileInputRef = useRef(null);

  const spec = useMemo(() => design?.openapi_yaml || buildSpec(selectedRequirement), [design, selectedRequirement]);
  const structuredPreview = useMemo(() => getStructuredPreview(design, selectedRequirement), [design, selectedRequirement]);
  const visibleRequirements = requirements.filter((req) => `${req.id} ${req.title} ${req.desc}`.toLowerCase().includes(search.toLowerCase()));

  const toggleSource = (id) => {
    if (id === 'files' || id === 'excel') {
      fileInputRef.current?.click();
      return;
    }

    setSelectedSourceIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setToast('Source selection updated');
  };

  const uploadRequirements = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsUploading(true);
    setToast(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/requirements/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload returned ${response.status}`);
      }

      const result = await response.json();
      if (!result.requirements?.length) {
        throw new Error('No requirements found in the file');
      }

      setRequirements(result.requirements);
      setSelectedRequirement(result.requirements[0]);
      setRawSourceText(result.raw_text || '');
      setSourceSummary(result.summary || null);
      setDesign(null);
      setTab('Extracted');
      setIsBackendOnline(true);
      setSelectedSourceIds((current) => Array.from(new Set([...current, 'files', 'excel'])));
      setToast(`Loaded ${result.count} requirements from ${result.filename}`);
      setActivity((current) => [{ label: 'Uploaded', value: result.filename }, ...current.slice(0, 2)]);
    } catch (error) {
      setIsBackendOnline(false);
      setToast(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedRequirement) {
      setToast('Upload a source and select a requirement first');
      return;
    }

    setIsGenerating(true);
    setToast(`API Designer Agent is generating ${selectedRequirement.id}...`);

    try {
      const response = await fetch(`${API_BASE}/api/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement: selectedRequirement,
          sources: selectedSourceIds,
          domain: 'Policy Management',
          style: 'REST'
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result = await response.json();
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setDesign(result);
      setLastGeneratedAt(now);
      setIsBackendOnline(true);
      setToast(result.mocked ? `Generated fallback design for ${selectedRequirement.id}` : `Generated AI design for ${selectedRequirement.id}`);
      setActivity((current) => [
        { label: 'Requirement', value: `${selectedRequirement.id}: ${selectedRequirement.title}` },
        { label: 'Model', value: result.model || 'API Designer Agent' },
        ...current.slice(0, 1)
      ]);
    } catch (error) {
      const fallback = { openapi_yaml: buildSpec(selectedRequirement), mocked: true, model: 'frontend fallback' };
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setDesign(fallback);
      setLastGeneratedAt(now);
      setIsBackendOnline(false);
      setToast(`Backend unavailable, used local fallback for ${selectedRequirement.id}`);
      setActivity((current) => [{ label: 'Backend', value: error.message }, ...current.slice(0, 2)]);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (filename, contents, type = 'text/plain') => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setToast(`${filename} prepared for download`);
  };

  const downloadArtifact = async (artifactType, filename) => {
    if (!design) {
      setToast('Generate an API design first');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/artifact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact_type: artifactType, design })
      });

      if (!response.ok) {
        throw new Error(`Artifact service returned ${response.status}`);
      }

      downloadFile(filename, await response.text());
      setIsBackendOnline(true);
    } catch (error) {
      const fallbackArtifact = {
        openapi: design.openapi_yaml,
        summary: design.endpoint_summary_markdown,
        schemas: JSON.stringify(design.schemas_json || {}, null, 2),
        postman: JSON.stringify(design.postman_collection || {}, null, 2),
        sequence: design.sequence_diagram_mermaid,
        review: design.design_review_markdown
      }[artifactType] || spec;
      downloadFile(filename, fallbackArtifact || spec);
      setIsBackendOnline(false);
      setToast(`Downloaded ${filename} from local generated design`);
    }
  };

  const validateSpec = async () => {
    if (!design) {
      setToast('Generate OpenAPI YAML before validation');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openapi_yaml: spec })
      });

      if (!response.ok) {
        throw new Error(`Validation service returned ${response.status}`);
      }

      const result = await response.json();
      setIsBackendOnline(true);
      setToast(`${result.summary} ${result.errors.length} errors, ${result.warnings.length} warnings`);
      setActivity((current) => [{ label: 'Validation', value: result.valid ? 'Passed' : 'Failed' }, ...current.slice(0, 2)]);
    } catch (error) {
      setIsBackendOnline(false);
      setToast(`Validation backend unavailable: ${error.message}`);
    }
  };

  const runAction = async (name) => {
    if (name === 'Generate / Regenerate') {
      await handleGenerate();
      return;
    }

    if (name === 'Validate OpenAPI Spec') {
      await validateSpec();
      return;
    }

    const messages = {
      'Generate Dev Kit': 'Development kit is ready in Output Artifacts',
      'Generate Tests': 'Testing package is ready in Output Artifacts',
      'Prepare Deployment': 'Deployment package is ready in Output Artifacts',
      'Prepare Gateway': 'Gateway setup is ready in Output Artifacts',
      'Monitoring Readiness': 'Monitoring readiness package is ready in Output Artifacts'
    };
    setToast(messages[name]);
    setActivity((current) => [{ label: 'Action', value: name }, ...current.slice(0, 2)]);
  };

  return (
    <main>
      <header className="top-header">
        <div className="logo-box"><Icon name="logo" size={34} /></div>
        <div className="header-title">
          <h1>API Designer Agent <span>L4 - AUTONOMOUS</span></h1>
          <p>Generates OpenAPI specifications and API design artifacts from functional requirements.</p>
        </div>
        <div className="header-pills">
          <button onClick={() => setToast('AI design assistance is enabled')}><Icon name="spark" />AI Powered</button>
          <button onClick={() => setToast('Connector marketplace opened')}><Icon name="plug" />Plug & Play</button>
          <button onClick={() => setToast('Cloud, on-prem, and hybrid targets supported')}><Icon name="globe" />Cross Platform</button>
        </div>
        <div className={`backend-status ${isBackendOnline === false ? 'offline' : ''}`}>
          {isBackendOnline === false ? 'Backend offline' : isBackendOnline ? 'Backend connected' : 'Agent ready'}
        </div>
      </header>

      <section className="columns-wrapper">
        <article className="card sources-card">
          <SectionHeader number="1" title="Sources" subtitle="Connect or upload requirement sources" />
          <div className="card-body">
            <input
              ref={fileInputRef}
              className="hidden-file-input"
              type="file"
              accept=".xlsx,.xlsm,.csv"
              onChange={uploadRequirements}
            />
            {sources.map((source) => (
              <button className={`source-item ${selectedSourceIds.includes(source.id) ? 'selected' : ''}`} key={source.id} onClick={() => toggleSource(source.id)}>
                <span className="source-icon" style={{ background: source.color }}><Icon name={source.icon} /></span>
                <span><strong>{source.name}</strong><small>{source.desc}</small></span>
                <span className="source-check"><Icon name="check" size={13} /></span>
              </button>
            ))}
            <button className="source-item add-source" onClick={() => setToast('Add connector flow opened')}>
              <span className="source-icon"><Icon name="plus" /></span>
              <span><strong>More Sources</strong><small>Add connectors</small></span>
            </button>
            <div className="connected-bar">
              <Icon name="check" size={16} />
              <span><strong>{isUploading ? 'Uploading requirements...' : 'Source connected successfully'}</strong><small>{selectedSourceIds.length} sources | Last sync: 2 min ago</small></span>
              <button aria-label="Sync sources" onClick={() => setToast('Sources synced just now')}><Icon name="refresh" /></button>
            </div>
          </div>
        </article>

        <div className="arrow-col"><Icon name="arrow" size={24} /></div>

        <article className="card requirements-card">
          <SectionHeader number="2" title="Requirements Input" subtitle="Extracted requirements from sources" tone="purple" />
          <div className="card-body">
            <div className="tabs">
              {['Extracted', 'Raw', 'Summary'].map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}
            </div>
            <label className="search-bar">
              <Icon name="search" size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requirements..." />
              <button type="button" aria-label="Filter requirements" onClick={() => setToast('Filtered high-confidence requirements')}><Icon name="filter" size={15} /></button>
            </label>

            {tab === 'Extracted' && (
              <div className="requirements-list">
                {visibleRequirements.length === 0 && (
                  <div className="empty-state">
                    <strong>No extracted requirements yet</strong>
                    <span>Upload the sample Excel or your own CSV/XLSX source from section 1.</span>
                  </div>
                )}
                {visibleRequirements.map((req) => (
                  <button key={req.id} className={`req-item ${selectedRequirement?.id === req.id ? 'active' : ''}`} onClick={() => { setSelectedRequirement(req); setDesign(null); }}>
                    <strong>{req.id}: {req.title}</strong>
                    <span>{req.desc}</span>
                    <small>{req.source}<em className={(req.priority || 'medium').toLowerCase()}>{req.priority}</em></small>
                  </button>
                ))}
              </div>
            )}

            {tab === 'Raw' && (
              <pre className="raw-source">{rawSourceText || 'Upload a source file to view the raw imported rows here.'}</pre>
            )}

            {tab === 'Summary' && (
              <div className="source-summary">
                {!sourceSummary && <div className="empty-state"><strong>No summary yet</strong><span>Upload a source file to generate a summary.</span></div>}
                {sourceSummary && (
                  <>
                    <strong>{sourceSummary.narrative}</strong>
                    <div className="summary-metrics">
                      <span>{sourceSummary.total_requirements} requirements</span>
                      <span>{Object.keys(sourceSummary.resources || {}).length} resources</span>
                      <span>{Object.keys(sourceSummary.methods || {}).join(', ')} methods</span>
                    </div>
                    <small>Priority mix: {Object.entries(sourceSummary.priorities || {}).map(([key, value]) => `${key} ${value}`).join(', ')}</small>
                  </>
                )}
              </div>
            )}
            <div className="req-footer">
              <span>Showing {visibleRequirements.length} of {requirements.length} requirements</span>
              <button onClick={() => setToast('Requirements refreshed')}><Icon name="refresh" size={14} /></button>
            </div>
            <button className="primary-btn" onClick={handleGenerate} disabled={isGenerating || !selectedRequirement}>
              {isGenerating ? 'Generating...' : 'Generate'} <Icon name="arrow" size={17} />
            </button>
            <p className="hint">Select a requirement and click Generate</p>
          </div>
        </article>

        <div className="arrow-col"><Icon name="arrow" size={24} /></div>

        <article className="card preview-card">
          <SectionHeader number="3" title="Generated OpenAPI Preview" subtitle="Preview of generated OpenAPI specification" />
          <div className="card-body">
            {!design && (
              <div className="openapi-empty">
                <Icon name="doc" size={34} />
                <strong>No OpenAPI generated yet</strong>
                <span>Select an extracted requirement and click Generate.</span>
              </div>
            )}

            {design && (
              <>
                <div className="structured-preview">
                  <div className="endpoint-card">
                    <small>Endpoint</small>
                    <strong>{structuredPreview.endpoint}</strong>
                    <span>{structuredPreview.title}</span>
                  </div>
                  <div className="preview-grid">
                    <div><small>Request</small><strong>{structuredPreview.requestSchema}</strong><span>JSON body schema</span></div>
                    <div><small>Response</small><strong>{structuredPreview.statusCode} {structuredPreview.responseSchema}</strong><span>Success payload</span></div>
                    <div><small>Error</small><strong>400 {structuredPreview.errorSchema}</strong><span>Reusable error model</span></div>
                  </div>
                  <ul>
                    {structuredPreview.notes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                  <div className="lifecycle-strip">
                    {['Swagger Docs', 'Artifacts', 'Dev Kit', 'Tests', 'Deployment', 'Gateway', 'Monitor'].map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>
                <div className="file-toolbar">
                  <button className="active">openapi.yaml</button>
                  <button onClick={() => setToast(design?.agent_status || 'Preview rendered in YAML mode')}><Icon name="eye" size={15} />Preview</button>
                  <button onClick={() => downloadArtifact('openapi', 'openapi.yaml')}><Icon name="download" size={15} />Download</button>
                </div>
                <pre className="code-area">{spec.split('\n').map((line, index) => <code key={`${line}-${index}`}><span>{index + 1}</span>{line}</code>)}</pre>
                <div className="success-row"><Icon name="check" size={16} />{toast}<time>{lastGeneratedAt}</time></div>
              </>
            )}
          </div>
        </article>

        <div className="arrow-col"><Icon name="arrow" size={24} /></div>

        <article className="card artifact-card">
          <SectionHeader number="4" title="Output Artifacts" subtitle="Download and share design artifacts" tone="green" />
          <div className="card-body">
            {artifacts.map(([name, desc, icon, color, artifactType, filename]) => (
              <button className="artifact-item" key={name} onClick={() => downloadArtifact(artifactType, filename)}>
                <span className="artifact-icon" style={{ background: color }}><Icon name={icon} /></span>
                <span><strong>{name}</strong><small>{desc}</small></span>
                <Icon name="download" size={16} />
              </button>
            ))}
            <div className="last-generated">
              <Icon name="bot" size={38} />
              <div>
                <strong>Last Generated</strong>
                <p>Requirement: {selectedRequirement ? `${selectedRequirement.id}: ${selectedRequirement.title}` : 'None selected'}</p>
                <p>Generated on: Apr 28, 2026 {lastGeneratedAt}</p>
                {activity.map((item, index) => <p key={`${item.label}-${index}`}>{item.label}: {item.value}</p>)}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="bottom-grid">
        <article className="card actions-card">
          <SectionHeader number="5" title="Actions" tone="purple" />
          <div className="card-body action-grid">
            {actions.map(([name, desc, icon]) => (
              <button className="action-item" key={name} onClick={() => runAction(name)}>
                <Icon name={icon} size={28} />
                <strong>{name}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="card features-card">
          <SectionHeader number="6" title="What API Designer Agent Does" />
          <div className="card-body feature-grid">
            {features.map(([title, items, icon]) => (
              <div className="feature-col" key={title}>
                <Icon name={icon} size={24} />
                <strong>{title}</strong>
                <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer>
        <Icon name="plug" />
        <strong>Plug & Play</strong>
        <span>Works on any platform (Cloud / On-Prem / Hybrid)</span>
        <span>Integrates with your tools and processes</span>
        <span>Accelerate API design by 70%+</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
