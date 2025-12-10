// Main application initialization and coordination
lucide.createIcons();

document.addEventListener('DOMContentLoaded', function() {
  const dropdownContainers = document.querySelectorAll('.dropdown-container');
  const dock = document.getElementById('dock');
  const generateBtn = document.getElementById('generateBtn');
  const createTextarea = document.getElementById('createTextarea');
  const resultFrame = document.getElementById('resultFrame');
  const modalOverlay = document.getElementById('modalOverlay');
  const notificationModal = document.getElementById('notificationModal');
  const settingsModal = document.getElementById('settingsModal');
  const helpModal = document.getElementById('helpModal');
  const languageSelectContainer = document.getElementById('language-select-container');
  const languageSelectButton = document.getElementById('language-select-button');
  const languageOptions = document.getElementById('language-options');
  const selectedLanguage = document.getElementById('selected-language');
  const chevronIcon = languageSelectButton.querySelector('.chevron-icon');
  
  // Load stored data
  loadFromStorage();
  
  // Update dropdowns with loaded data
  setTimeout(() => {
    updateAllProjectsDropdowns();
    updateVersionsDropdowns();
    updateViewSourceDropdown();
  }, 100);

  // Initialize UI components
  setupCreateForm();
  setupKeyboardNavigation();

  // Custom language select dropdown logic
  languageSelectButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !languageOptions.classList.contains('invisible');
    if (isOpen) {
      languageOptions.classList.add('opacity-0', 'invisible', 'scale-95', 'pointer-events-none');
      chevronIcon.classList.remove('rotate-180');
    } else {
      languageOptions.classList.remove('opacity-0', 'invisible', 'scale-95', 'pointer-events-none');
      chevronIcon.classList.add('rotate-180');
    }
  });

  languageOptions.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedLanguage.textContent = item.textContent;
      languageOptions.classList.add('opacity-0', 'invisible', 'scale-95', 'pointer-events-none');
      chevronIcon.classList.remove('rotate-180');
    });
  });

  // Modal event listeners
  document.querySelectorAll('.modalClose').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
  
  document.querySelectorAll('[id$="Modal"]').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  });
  
  document.addEventListener('click', function(e) {
    if (!languageSelectContainer.contains(e.target)) {
      languageOptions.classList.add('opacity-0', 'invisible', 'scale-95', 'pointer-events-none');
      chevronIcon.classList.remove('rotate-180');
    }
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (modalOverlay.style.display === 'block') {
        closeModal();
      } else if (createForm.style.display === 'block') {
        const { showDock } = setupCreateForm();
        showDock();
      }
    }
  });
  
  // Image upload functionality
  const imageUploadBtn = document.getElementById('imageUploadBtn');
  const imageInput = document.getElementById('imageInput');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreviewBoxes = document.getElementById('imagePreviewBoxes');
  const visionModelModal = document.getElementById('visionModelModal');
  const imageExpandModal = document.getElementById('imageExpandModal');
  const expandedImage = document.getElementById('expandedImage');
  
  let selectedImages = [];
  
  imageUploadBtn.addEventListener('click', () => {
    imageInput.click();
  });
  
  imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check if current model supports vision
      const selectedModelName = document.getElementById('selectedModelName').textContent;
      const visionModels = ['GPT-4.1 Nano', 'GPT-4.1 Mini', 'GPT-4.1', 'o3', 'Mistral Small 3'];
      
      if (!visionModels.includes(selectedModelName)) {
        openModal(visionModelModal);
        return;
      }
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            data: e.target.result,
            name: file.name,
            size: file.size
          };
          selectedImages.push(imageData);
          updateImagePreviews();
        };
        reader.readAsDataURL(file);
      });
    }
  });
  
  function updateImagePreviews() {
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    if (!imagePreviewContainer) {
      console.warn('imagePreviewContainer not found');
      return;
    }
    
    if (selectedImages.length === 0) {
      imagePreviewContainer.classList.add('hidden');
      return;
    }
    
    imagePreviewContainer.classList.remove('hidden');
    imagePreviewContainer.innerHTML = '';
    
    selectedImages.forEach((image, index) => {
      const imageBox = document.createElement('div');
      imageBox.className = 'relative group cursor-pointer';
      imageBox.innerHTML = `
        <img src="${image.data}" class="w-8 h-8 object-cover rounded transition" />
        <button class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition" onclick="removeImage(${index})">
          <i data-lucide="x" class="w-2 h-2 text-white"></i>
        </button>
      `;
      
      imageBox.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          expandedImage.src = image.data;
          openModal(imageExpandModal);
        }
      });
      
      imagePreviewContainer.appendChild(imageBox);
    });
    
    lucide.createIcons();
  }
  
  window.removeImage = function(index) {
    selectedImages.splice(index, 1);
    updateImagePreviews();
  };
  
  // Handle generate button click
  generateBtn.addEventListener('click', async function() {
    const prompt = createTextarea.value.trim();
    if (!prompt) {
      createTextarea.focus();
      return;
    }

    const originalButtonText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<div class="flex items-center gap-2"><i data-lucide="loader-circle" class="w-4 h-4 animate-spin"></i>Generating...</div>';
    generateBtn.disabled = true;
    
    lucide.createIcons();
    
    try {
      const { content, fullResponse } = await generateContent(prompt, selectedImages.length > 0 ? selectedImages[0].data : null);
      const parsedContent = parseAPIResponse(content);

      const htmlFile = parsedContent.files?.find(f => f.type === 'html' || f.filename.endsWith('.html'));
      
      if (htmlFile && htmlFile.content) {
        conversationHistory.push(
          { role: 'user', content: prompt },
          { role: 'assistant', content: content }
        );

        resultFrame.srcdoc = htmlFile.content;
        resultFrame.style.display = 'block';
        
        // Clear images after successful generation
        selectedImages = [];
        imageInput.value = '';
        updateImagePreviews();
        
        // Create project if none selected and this is the first generation
        if (!currentProject && conversationHistory.length === 2) {
          let projectName = 'Untitled Project';
          
          try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlFile.content;
            const titleElement = tempDiv.querySelector('title');
            if (titleElement && titleElement.textContent.trim()) {
              projectName = titleElement.textContent.trim();
            }
          } catch (e) {
            console.warn('Could not extract title from HTML:', e);
          }
          
          let finalProjectName = projectName;
          let counter = 1;
          while (projectList.includes(finalProjectName)) {
            finalProjectName = `${projectName} (${counter})`;
            counter++;
          }
          
          projectList.push(finalProjectName);
          currentProject = finalProjectName;
          updateAllProjectsDropdowns();
        }
        
        // Save version to current project
        if (currentProject) {
          if (!projectVersions[currentProject]) {
            projectVersions[currentProject] = [];
          }
          
          const versionData = {
            version: `v${projectVersions[currentProject].length + 1}`,
            content: htmlFile.content,
            prompt: prompt,
            fullResponse: fullResponse,
            parsedFiles: parsedContent.files || [htmlFile],
            timestamp: new Date().toISOString()
          };
          
          projectVersions[currentProject].push(versionData);
          currentVersionIndex = projectVersions[currentProject].length - 1;
          
          updateVersionsDropdowns();
          updateViewSourceDropdown();
        }
        
        saveToStorage();
      } else {
        throw new Error('No HTML file found in response');
      }

      createTextarea.value = '';
      
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      generateBtn.innerHTML = originalButtonText;
      generateBtn.disabled = false;
      lucide.createIcons();
    }
  });

  // Close result frame when clicking dock area
  dock.addEventListener('click', function() {
    if (resultFrame.style.display === 'block') {
      resultFrame.style.display = 'none';
    }
  });
  
  dropdownContainers.forEach(container => {
    const button = container.querySelector('button, .w-8');
    
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      
      dropdownContainers.forEach(otherContainer => {
        if (otherContainer !== container) {
          otherContainer.classList.remove('active');
        }
      });
      
      const wasActive = container.classList.contains('active');
      container.classList.toggle('active');
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-container')) {
      dropdownContainers.forEach(container => {
        container.classList.remove('active');
      });
    }
    
    if (languageSelectContainer && !languageSelectContainer.contains(e.target)) {
      languageOptions.classList.add('opacity-0', 'invisible', 'scale-95', 'pointer-events-none');
      chevronIcon.classList.remove('rotate-180');
    }
  });
  
  // Prevent dropdown clicks from closing the dropdown
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
  
  // Handle dropdown item clicks for modals
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function() {
      const text = this.textContent.trim();
      
      // Handle model selection
      if (this.hasAttribute('data-model')) {
        const modelName = this.textContent.trim();
        const modelIcon = this.getAttribute('data-icon');
        const selectedModelName = document.getElementById('selectedModelName');
        const selectedModelIcon = document.getElementById('selectedModelIcon');
        
        if (selectedModelName && selectedModelIcon) {
          selectedModelName.textContent = modelName;
          selectedModelIcon.src = modelIcon;
        }
        
        const container = this.closest('.dropdown-container');
        if (container) {
          container.classList.remove('active');
        }
        return;
      }
      
      // Skip handling for dynamically created project/version items
      if (this.closest('[aria-label="Projects"]') || this.closest('[aria-label="Versions"]')) {
        return;
      }
      
      if (text === 'Notification settings') {
        openModal(notificationModal);
      } else if (text === 'Settings') {
        openModal(settingsModal);
      } else if (text === 'Help & support') {
        openModal(helpModal);
      }
    });
  });
});

// Function to update view source dropdown based on current content
function updateViewSourceDropdown() {
  const viewSourceDropdown = document.getElementById('viewSourceDropdown');
  if (!viewSourceDropdown) return;
  
  const dropdown = viewSourceDropdown.querySelector('.dropdown');
  if (!dropdown) return;
  
  // Clear existing items
  dropdown.innerHTML = '';
  
  let availableFiles = [];
  
  // Get files from current version
  if (currentProject && projectVersions[currentProject] && currentVersionIndex >= 0) {
    const versionData = projectVersions[currentProject][currentVersionIndex];
    
    if (versionData.parsedFiles && Array.isArray(versionData.parsedFiles)) {
      availableFiles = versionData.parsedFiles;
    } else {
      // Fallback to main content
      availableFiles = [{
        filename: 'index.html',
        type: 'html',
        content: versionData.content
      }];
    }
  } else if (resultFrame.srcdoc) {
    // Fallback for current iframe content
    availableFiles = [{
      filename: 'index.html',
      type: 'html',
      content: resultFrame.srcdoc
    }];
  }
  
  // Add available files to dropdown
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
      
      // Add click handler
      item.addEventListener('click', e => {
        e.stopPropagation();
        const filename = item.getAttribute('data-file');
        const viewSourceModal = document.getElementById('viewSourceModal');
        const viewSourceModalTitle = document.getElementById('viewSourceModalTitle');
        
        viewSourceModalTitle.textContent = 'View Source: ' + filename;
        openModal(viewSourceModal);
        
        // Initialize Monaco Editor after modal is opened
        setTimeout(() => {
          initializeMonacoEditor();
          
          // Load file content after editor is created
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
    
    // Add divider
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    dropdown.appendChild(divider);
  }
  
  // Add download all option
  const downloadItem = document.createElement('div');
  downloadItem.className = 'dropdown-item';
  downloadItem.innerHTML = `
    <i data-lucide="download" class="w-4 h-4 text-blue-400"></i>
    <span>Download all</span>
  `;
  dropdown.appendChild(downloadItem);
  
  // Reinitialize Lucide icons
  lucide.createIcons();
}

// Get file content based on filename
function getFileContent(filename) {
  // Get current version data
  if (currentProject && projectVersions[currentProject] && currentVersionIndex >= 0) {
    const versionData = projectVersions[currentProject][currentVersionIndex];
    
    // Use parsed files if available
    if (versionData.parsedFiles && Array.isArray(versionData.parsedFiles)) {
      const file = versionData.parsedFiles.find(f => f.filename === filename);
      if (file && file.content) {
        return file.content;
      }
    }
    
    // Fallback to main content for index.html
    if (filename === 'index.html' && versionData.content) {
      return versionData.content;
    }
  }
  
  // Fallback for current iframe content
  if (filename === 'index.html' && resultFrame.srcdoc) {
    return resultFrame.srcdoc;
  }
  
  // Generate config.json
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
  
  // Default fallback
  return `// File: ${filename}\n// This file was not found in the AI response`;
}

// Utility to map file extension to Monaco language
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

// Function to update projects dropdown
function updateProjectsDropdown(dropdown) {
  // Clear ALL existing items (including new-project-item and dividers)
  dropdown.innerHTML = '';
  
  // Add existing projects
  projectList.forEach(project => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <i data-lucide="globe" class="w-4 h-4 text-blue-400"></i>
      <span>${project}</span>
    `;
    dropdown.appendChild(item);
    
    // Add click handler
    item.addEventListener('click', function() {
      currentProject = project;
      console.log('Selected project:', currentProject);
      
      // Update versions dropdown if visible
      updateVersionsDropdowns();
      
      // Save current project selection
      saveToStorage();
      
      // Close the dropdown
      const container = this.closest('.dropdown-container');
      if (container) {
        container.classList.remove('active');
      }
    });
  });
  
  // Add divider and "New Project" option only if there are existing projects
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
    // Remove the prompt - just start a new project flow
    currentProject = null; // Clear current project to indicate new project mode
    conversationHistory = []; // Clear conversation history for new project
    currentVersionIndex = -1; // Reset version index
    
    // Clear the result frame
    if (resultFrame.style.display === 'block') {
      resultFrame.style.display = 'none';
    }
    
    // Update versions dropdown to show no versions
    updateVersionsDropdowns();
    saveToStorage();
    
    // Close the dropdown
    const container = this.closest('.dropdown-container');
    if (container) {
      container.classList.remove('active');
    }
  });
  
  // Reinitialize Lucide icons for new content
  lucide.createIcons();
}

// Function to update versions dropdown
function updateVersionsDropdown(dropdown) {
  // Clear existing items
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
      
      // Add click handler
      item.addEventListener('click', function() {
        resultFrame.srcdoc = versionData.content;
        resultFrame.style.display = 'block';
        
        // Update current version index
        currentVersionIndex = index;
        
        // Reset conversation to this version's context
        conversationHistory = [
          { role: 'user', content: versionData.prompt },
          { role: 'assistant', content: versionData.fullResponse || JSON.stringify({
            files: [{ filename: 'index.html', type: 'html', content: versionData.content }]
          }) }
        ];
        
        // Update all version dropdowns to reflect current selection
        updateVersionsDropdowns();
        
        // Update view source dropdown
        updateViewSourceDropdown();
        
        // Save updated conversation
        saveToStorage();
        
        // Close the dropdown
        const container = this.closest('.dropdown-container');
        if (container) {
          container.classList.remove('active');
        }
      });
    });
  } else {
    // Show "No versions" message
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
  
  // Reinitialize Lucide icons for new content
  lucide.createIcons();
}

// Function to update all project dropdowns
function updateAllProjectsDropdowns() {
  document.querySelectorAll('[aria-label="Projects"]').forEach(button => {
    const dropdown = button.parentElement.querySelector('.dropdown');
    if (dropdown) {
      updateProjectsDropdown(dropdown);
    }
  });
}

// Function to update all version dropdowns
function updateVersionsDropdowns() {
  document.querySelectorAll('[aria-label="Versions"]').forEach(button => {
    const dropdown = button.parentElement.querySelector('.dropdown');
    if (dropdown) {
      updateVersionsDropdown(dropdown);
    }
  });
}