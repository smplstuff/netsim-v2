// UI interaction handlers and modal management
function openModal(modalElement) {
  if (!modalElement) {
    console.warn('openModal called with null modalElement');
    return;
  }
  
  const modalOverlay = document.getElementById('modalOverlay');
  if (!modalOverlay) {
    console.warn('modalOverlay element not found');
    return;
  }
  
  modalOverlay.style.display = 'block';
  modalElement.style.display = 'flex';
  setTimeout(() => {
    modalOverlay.classList.remove('opacity-0', 'invisible');
    const modalContent = modalElement.querySelector('.frost');
    if (modalContent) {
      modalContent.classList.remove('scale-95');
    }
  }, 10);
  
  document.querySelectorAll('.dropdown-container').forEach(container => {
    container.classList.remove('active');
  });
}

function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.classList.add('opacity-0', 'invisible');
  document.querySelectorAll('[id$="Modal"]').forEach(modal => {
    const modalContent = modal.querySelector('.frost');
    if (modalContent) {
      modalContent.classList.add('scale-95');
    }
  });
  setTimeout(() => {
    modalOverlay.style.display = 'none';
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
      modal.style.display = 'none';
    });
  }, 300);
}

function setupKeyboardNavigation() {
  let currentFocusedDropdown = null;
  let currentFocusedIndex = -1;
  
  function handleKeyboardNavigation(e) {
    if (!currentFocusedDropdown) return;
    
    const items = currentFocusedDropdown.querySelectorAll('.dropdown-item');
    if (items.length === 0) return;
    
    items.forEach(item => item.classList.remove('keyboard-focused'));
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentFocusedIndex = (currentFocusedIndex + 1) % items.length;
        items[currentFocusedIndex].classList.add('keyboard-focused');
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        currentFocusedIndex = currentFocusedIndex <= 0 ? items.length - 1 : currentFocusedIndex - 1;
        items[currentFocusedIndex].classList.add('keyboard-focused');
        break;
        
      case 'Enter':
        e.preventDefault();
        if (currentFocusedIndex >= 0 && items[currentFocusedIndex]) {
          items[currentFocusedIndex].click();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        const container = currentFocusedDropdown.closest('.dropdown-container');
        if (container) {
          container.classList.remove('active');
        }
        currentFocusedDropdown = null;
        currentFocusedIndex = -1;
        break;
    }
  }
  
  document.addEventListener('keydown', handleKeyboardNavigation);
  
  return { currentFocusedDropdown, currentFocusedIndex };
}

function setupCreateForm() {
  const dock = document.getElementById('dock');
  const createForm = document.getElementById('createForm');
  const createBtn = document.getElementById('createBtn');
  const backBtn = document.getElementById('backBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const createTextarea = document.getElementById('createTextarea');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imageInput = document.getElementById('imageInput');

  function showDock() {
    createForm.classList.add('opacity-0', 'invisible', 'scale-95');
    setTimeout(() => {
      createForm.style.display = 'none';
      dock.style.display = '';
      
      // Clear image when hiding form
      if (imagePreviewContainer && !imagePreviewContainer.classList.contains('hidden')) {
        selectedImageData = null;
        imageInput.value = '';
        imagePreviewContainer.classList.add('hidden');
      }
      
      setTimeout(() => {
        dock.classList.remove('opacity-0', 'invisible', 'scale-95');
      }, 10);
    }, 150);
  }

  createBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    dock.classList.add('opacity-0', 'invisible', 'transform', 'scale-95');
    setTimeout(() => {
      dock.style.display = 'none';
      createForm.style.display = 'block';
      setTimeout(() => {
        createForm.classList.remove('opacity-0', 'invisible', 'scale-95');
        createTextarea.focus();
      }, 10);
    }, 150);
  });

  backBtn.addEventListener('click', showDock);
  cancelBtn.addEventListener('click', showDock);
  
  return { showDock };
}