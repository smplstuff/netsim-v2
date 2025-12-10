// Project and version management
function updateProjectsDropdown(dropdown) {
  dropdown.innerHTML = '';
  
  projectList.forEach(project => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <i data-lucide="globe" class="w-4 h-4 text-blue-400"></i>
      <span>${project}</span>
    `;
    dropdown.appendChild(item);
    
    item.addEventListener('click', function() {
      currentProject = project;
      console.log('Selected project:', currentProject);
      
      updateVersionsDropdowns();
      saveToStorage();
      
      const container = this.closest('.dropdown-container');
      if (container) {
        container.classList.remove('active');
      }
    });
  });
  
  if (projectList.length > 0) {
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    dropdown.appendChild(divider);
  }
  
  const newProjectItem = document.createElement('div');
  newProjectItem.className = 'dropdown-item new-project-item';
  newProjectItem.innerHTML = `
    <i data-lucide="plus" class="w-4 h-4 text-green-400"></i>
    <span>New Project</span>
  `;
  dropdown.appendChild(newProjectItem);
  
  newProjectItem.addEventListener('click', function() {
    currentProject = null;
    conversationHistory = [];
    currentVersionIndex = -1;
    
    const resultFrame = document.getElementById('resultFrame');
    if (resultFrame.style.display === 'block') {
      resultFrame.style.display = 'none';
    }
    
    updateVersionsDropdowns();
    saveToStorage();
    
    const container = this.closest('.dropdown-container');
    if (container) {
      container.classList.remove('active');
    }
  });
  
  lucide.createIcons();
}

function updateVersionsDropdown(dropdown) {
  dropdown.innerHTML = '';
  
  if (currentProject && projectVersions[currentProject]) {
    const versions = projectVersions[currentProject];
    versions.forEach((versionData, index) => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      const isLatest = index === versions.length - 1;
      const isCurrent = index === currentVersionIndex;
      item.innerHTML = `
        <i data-lucide="git-commit" class="w-4 h-4 ${isCurrent ? 'text-green-400' : (isLatest ? 'text-blue-400' : 'text-gray-400')}"></i>
        <span>${versionData.version}</span>
      `;
      dropdown.appendChild(item);
      
      item.addEventListener('click', function() {
        const resultFrame = document.getElementById('resultFrame');
        resultFrame.srcdoc = versionData.content;
        resultFrame.style.display = 'block';
        
        currentVersionIndex = index;
        
        conversationHistory = [
          { role: 'user', content: versionData.prompt },
          { role: 'assistant', content: versionData.fullResponse || JSON.stringify({
            files: [{ filename: 'index.html', type: 'html', content: versionData.content }]
          }) }
        ];
        
        updateVersionsDropdowns();
        updateViewSourceDropdown();
        saveToStorage();
        
        const container = this.closest('.dropdown-container');
        if (container) {
          container.classList.remove('active');
        }
      });
    });
  } else {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <i data-lucide="info" class="w-4 h-4 text-gray-400"></i>
      <span>No versions yet</span>
    `;
    item.style.opacity = '0.6';
    item.style.cursor = 'default';
    dropdown.appendChild(item);
  }
  
  lucide.createIcons();
}

function updateAllProjectsDropdowns() {
  document.querySelectorAll('[aria-label="Projects"]').forEach(button => {
    const dropdown = button.parentElement.querySelector('.dropdown');
    if (dropdown) {
      updateProjectsDropdown(dropdown);
    }
  });
}

function updateVersionsDropdowns() {
  document.querySelectorAll('[aria-label="Versions"]').forEach(button => {
    const dropdown = button.parentElement.querySelector('.dropdown');
    if (dropdown) {
      updateVersionsDropdown(dropdown);
    }
  });
}

function updateViewSourceDropdown() {
  const viewSourceDropdown = document.getElementById('viewSourceDropdown');
  if (!viewSourceDropdown) return;
  
  const dropdown = viewSourceDropdown.querySelector('.dropdown');
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  
  let availableFiles = [];
  
  if (currentProject && projectVersions[currentProject] && currentVersionIndex >= 0) {
    const versionData = projectVersions[currentProject][currentVersionIndex];
    
    if (versionData.parsedFiles && Array.isArray(versionData.parsedFiles)) {
      availableFiles = versionData.parsedFiles;
    } else {
      availableFiles = [{
        filename: 'index.html',
        type: 'html',
        content: versionData.content
      }];
    }
  } else {
    const resultFrame = document.getElementById('resultFrame');
    if (resultFrame.srcdoc) {
      availableFiles = [{
        filename: 'index.html',
        type: 'html',
        content: resultFrame.srcdoc
      }];
    }
  }
  
  if (availableFiles.length > 0) {
    availableFiles.forEach(file => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.setAttribute('data-file', file.filename);
      item.innerHTML = `
        <i data-lucide="file-text" class="w-4 h-4 text-blue-400"></i>
        <span>${file.filename}</span>
      `;
      dropdown.appendChild(item);
      
      item.addEventListener('click', e => {
        e.stopPropagation();
        const filename = item.getAttribute('data-file');
        const viewSourceModal = document.getElementById('viewSourceModal');
        const viewSourceModalTitle = document.getElementById('viewSourceModalTitle');
        
        viewSourceModalTitle.textContent = 'View Source: ' + filename;
        openModal(viewSourceModal);
        
        setTimeout(() => {
          initializeMonacoEditor();
          
          setTimeout(() => {
            const fileContent = getFileContent(filename);
            if (monacoEditor) {
              const lang = getLanguageFromFile(filename);
              const model = monaco.editor.createModel(fileContent, lang);
              monacoEditor.setModel(model);
              monacoEditor.layout();
            }
          }, 200);
        }, 300);
        
        viewSourceDropdown.classList.remove('active');
      });
    });
    
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    dropdown.appendChild(divider);
  }
  
  const downloadItem = document.createElement('div');
  downloadItem.className = 'dropdown-item';
  downloadItem.innerHTML = `
    <i data-lucide="download" class="w-4 h-4 text-blue-400"></i>
    <span>Download all</span>
  `;
  dropdown.appendChild(downloadItem);
  
  lucide.createIcons();
}

function getFileContent(filename) {
  if (currentProject && projectVersions[currentProject] && currentVersionIndex >= 0) {
    const versionData = projectVersions[currentProject][currentVersionIndex];
    
    if (versionData.parsedFiles && Array.isArray(versionData.parsedFiles)) {
      const file = versionData.parsedFiles.find(f => f.filename === filename);
      if (file && file.content) {
        return file.content;
      }
    } else {
      if (filename === 'index.html' && versionData.content) {
        return versionData.content;
      }
    }
  } else {
    if (filename === 'index.html' && document.getElementById('resultFrame').srcdoc) {
      return document.getElementById('resultFrame').srcdoc;
    }
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