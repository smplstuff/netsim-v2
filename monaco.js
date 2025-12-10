// Monaco editor functionality
let monacoEditor;
let monacoLoaded = false;

// Configure Monaco
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.34.1/min/vs' }});

function initializeMonacoEditor() {
  if (!monacoLoaded) {
    require(['vs/editor/editor.main'], function () {
      monacoLoaded = true;
      createMonacoEditor();
    });
  } else {
    createMonacoEditor();
  }
}

function createMonacoEditor() {
  if (monacoEditor) {
    monacoEditor.dispose();
  }
  
  const container = document.getElementById('monaco-container');
  if (container) {
    monacoEditor = monaco.editor.create(container, {
      value: 'Loading...',
      language: 'html',
      theme: 'vs-dark',
      automaticLayout: true,
      readOnly: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on'
    });
  }
}

function getLanguageFromFile(file) {
  const ext = file.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':   return 'javascript';
    case 'css':  return 'css';
    case 'json': return 'json';
    case 'html': return 'html';
    default:     return 'plaintext';
  }
}

function getFileContent(filename) {
  if (currentProject && projectVersions[currentProject] && currentVersionIndex >= 0) {
    const versionData = projectVersions[currentProject][currentVersionIndex];
    
    if (versionData.parsedFiles && Array.isArray(versionData.parsedFiles)) {
      const file = versionData.parsedFiles.find(f => f.filename === filename);
      if (file && file.content) {
        return file.content;
      }
    }
    
    if (filename === 'index.html' && versionData.content) {
      return versionData.content;
    }
  }
  
  const resultFrame = document.getElementById('resultFrame');
  if (filename === 'index.html' && resultFrame.srcdoc) {
    return resultFrame.srcdoc;
  }
  
  if (filename === 'config.json') {
    let title = 'Untitled Project';
    if (currentProject && projectVersions[currentProject] && currentVersionIndex >= 0) {
      const versionData = projectVersions[currentProject][currentVersionIndex];
      if (versionData.parsedFiles) {
        const htmlFile = versionData.parsedFiles.find(f => f.type === 'html' || f.filename.endsWith('.html'));
        if (htmlFile) {
          const titleMatch = htmlFile.content.match(/<title[^>]*>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        }
      }
    }
    
    return JSON.stringify({
      name: title,
      version: currentProject && projectVersions[currentProject] ? `v${currentVersionIndex + 1}` : "1.0.0",
      description: "AI-generated project",
      type: "web-application",
      files: currentProject && projectVersions[currentProject] && currentVersionIndex >= 0 
        ? projectVersions[currentProject][currentVersionIndex].parsedFiles?.map(f => f.filename) || ['index.html']
        : ['index.html'],
      generated: currentProject && projectVersions[currentProject] && currentVersionIndex >= 0
        ? projectVersions[currentProject][currentVersionIndex].timestamp 
        : new Date().toISOString()
    }, null, 2);
  }
  
  return `// File: ${filename}\n// This file was not found in the AI response`;
}