// Storage management functions
let conversationHistory = [];
let currentProject = null;
let projectVersions = {};
let projectList = [];
let currentVersionIndex = -1;

function saveToStorage() {
  localStorage.setItem('netsim_projects', JSON.stringify(projectList));
  localStorage.setItem('netsim_versions', JSON.stringify(projectVersions));
  localStorage.setItem('netsim_current_project', currentProject);
  localStorage.setItem('netsim_conversation', JSON.stringify(conversationHistory));
}

function loadFromStorage() {
  const storedProjects = localStorage.getItem('netsim_projects');
  const storedVersions = localStorage.getItem('netsim_versions');
  const storedCurrentProject = localStorage.getItem('netsim_current_project');
  const storedConversation = localStorage.getItem('netsim_conversation');
  
  if (storedProjects) {
    try {
      projectList = JSON.parse(storedProjects);
    } catch (e) {
      console.warn('Failed to load projects from storage:', e);
      projectList = [];
    }
  }
  
  if (storedVersions) {
    try {
      projectVersions = JSON.parse(storedVersions);
    } catch (e) {
      console.warn('Failed to load versions from storage:', e);
      projectVersions = {};
    }
  }
  
  if (storedCurrentProject) {
    currentProject = storedCurrentProject;
  }
  
  if (storedConversation) {
    try {
      conversationHistory = JSON.parse(storedConversation);
    } catch (e) {
      console.warn('Failed to load conversation from storage:', e);
      conversationHistory = [];
    }
  }
}