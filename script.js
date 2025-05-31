// Modern Image Resizer Pro - JavaScript

class ImageResizerPro {
  constructor() {
    this.state = {
      originalImage: null,
      originalFile: null,
      resizedImageDataUrl: null,
      aspectRatio: 1,
      isProcessing: false,
      theme: localStorage.getItem('theme') || 'light'
    };

    this.elements = this.initializeElements();
    this.initializeEventListeners();
    this.initializeTheme();
    this.showWelcomeAnimation();
  }

  initializeElements() {
    return {
      // Theme
      themeToggle: document.getElementById('theme-toggle'),
      
      // Upload
      uploadContainer: document.getElementById('upload-container'),
      fileInput: document.getElementById('file-input'),
      
      // Controls
      controlsSection: document.getElementById('controls-section'),
      widthInput: document.getElementById('width-input'),
      heightInput: document.getElementById('height-input'),
      qualityInput: document.getElementById('quality-input'),
      qualityValue: document.querySelector('.quality-value'),
      formatSelect: document.getElementById('format-select'),
      maintainAspectRatio: document.getElementById('maintain-aspect-ratio'),
      aspectRatioLink: document.getElementById('aspect-ratio-link'),
      presetButtons: document.querySelectorAll('.preset-btn'),
      
      // Actions
      resizeBtn: document.getElementById('resize-btn'),
      resetBtn: document.getElementById('reset-btn'),
      downloadBtn: document.getElementById('download-btn'),
      
      // Preview
      previewSection: document.getElementById('preview-section'),
      originalImageContainer: document.getElementById('original-image-container'),
      resizedImageContainer: document.getElementById('resized-image-container'),
      originalStats: document.getElementById('original-stats'),
      resizedStats: document.getElementById('resized-stats'),
      
      // Feedback
      errorMessage: document.getElementById('error-message'),
      loadingOverlay: document.getElementById('loading-overlay')
    };
  }

  initializeEventListeners() {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // File upload
    this.elements.uploadContainer.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    // Drag and drop
    this.setupDragAndDrop();

    // Dimension inputs
    this.elements.widthInput.addEventListener('input', () => this.handleDimensionChange('width'));
    this.elements.heightInput.addEventListener('input', () => this.handleDimensionChange('height'));

    // Quality slider
    this.elements.qualityInput.addEventListener('input', () => this.updateQualityDisplay());

    // Aspect ratio toggle
    this.elements.aspectRatioLink.addEventListener('click', () => this.toggleAspectRatio());

    // Preset buttons
    this.elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => this.applyPreset(btn.dataset.width, btn.dataset.height));
    });

    // Action buttons
    this.elements.resizeBtn.addEventListener('click', () => this.resizeImage());
    this.elements.resetBtn.addEventListener('click', () => this.resetApplication());
    this.elements.downloadBtn.addEventListener('click', () => this.downloadImage());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Window events
    window.addEventListener('beforeunload', (e) => {
      if (this.state.isProcessing) {
        e.preventDefault();
        e.returnValue = 'Image processing in progress. Are you sure you want to leave?';
      }
    });
  }

  setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.elements.uploadContainer.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      this.elements.uploadContainer.addEventListener(eventName, () => {
        this.elements.uploadContainer.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.elements.uploadContainer.addEventListener(eventName, () => {
        this.elements.uploadContainer.classList.remove('drag-over');
      }, false);
    });

    this.elements.uploadContainer.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.handleFileSelect(files);
    }, false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  initializeTheme() {
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }

  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    localStorage.setItem('theme', this.state.theme);
    
    // Add a subtle animation to the theme toggle
    this.elements.themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
      this.elements.themeToggle.style.transform = '';
    }, 150);
  }

  showWelcomeAnimation() {
    // Add staggered animations to elements
    const elements = document.querySelectorAll('.upload-container, .app-title, .app-subtitle');
    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = 'all 0.6s ease-out';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 200);
    });
  }

  async handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!this.validateFile(file)) return;

    this.showLoading(true);
    
    try {
      await this.processFile(file);
      this.showSuccess('Image loaded successfully!');
    } catch (error) {
      this.showError(`Failed to load image: ${error.message}`);
    } finally {
      this.showLoading(false);
    }
  }

  validateFile(file) {
    // Check file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
      this.showError('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      return false;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showError('File size too large. Please select an image smaller than 50MB.');
      return false;
    }

    return true;
  }

  async processFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          this.state.originalImage = img;
          this.state.originalFile = file;
          this.state.aspectRatio = img.width / img.height;
          
          this.displayOriginalImage(img, file);
          this.setDefaultDimensions(img);
          this.showControls();
          this.showPreview();
          
          resolve();
        };
        
        img.onerror = () => reject(new Error('Invalid image format'));
        img.src = e.target.result;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  displayOriginalImage(img, file) {
    const imgElement = img.cloneNode();
    imgElement.style.maxWidth = '100%';
    imgElement.style.maxHeight = '300px';
    imgElement.style.borderRadius = '8px';
    
    this.elements.originalImageContainer.innerHTML = '';
    this.elements.originalImageContainer.appendChild(imgElement);
    
    // Update stats
    const stats = `${img.width} × ${img.height}px • ${this.formatFileSize(file.size)}`;
    this.elements.originalStats.textContent = stats;
  }

  setDefaultDimensions(img) {
    this.elements.widthInput.value = img.width;
    this.elements.heightInput.value = img.height;
    this.updateResizeButtonState();
  }

  showControls() {
    this.elements.controlsSection.classList.add('visible');
    this.elements.controlsSection.scrollIntoView({ behavior: 'smooth' });
  }

  showPreview() {
    this.elements.previewSection.classList.add('visible');
  }

  handleDimensionChange(dimension) {
    if (!this.state.originalImage) return;

    const maintainRatio = this.elements.maintainAspectRatio.checked;
    
    if (maintainRatio) {
      if (dimension === 'width') {
        const newWidth = parseInt(this.elements.widthInput.value) || 0;
        const newHeight = Math.round(newWidth / this.state.aspectRatio);
        this.elements.heightInput.value = newHeight;
      } else {
        const newHeight = parseInt(this.elements.heightInput.value) || 0;
        const newWidth = Math.round(newHeight * this.state.aspectRatio);
        this.elements.widthInput.value = newWidth;
      }
    }

    this.updateResizeButtonState();
  }

  updateQualityDisplay() {
    const quality = this.elements.qualityInput.value;
    this.elements.qualityValue.textContent = `${quality}%`;
  }

  toggleAspectRatio() {
    const checkbox = this.elements.maintainAspectRatio;
    checkbox.checked = !checkbox.checked;
    
    this.elements.aspectRatioLink.classList.toggle('linked', checkbox.checked);
    
    // Add visual feedback
    this.elements.aspectRatioLink.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.elements.aspectRatioLink.style.transform = '';
    }, 200);
  }

  applyPreset(width, height) {
    if (!this.state.originalImage) return;

    this.elements.widthInput.value = width;
    this.elements.heightInput.value = height;
    
    // Temporarily disable aspect ratio to apply preset
    const wasChecked = this.elements.maintainAspectRatio.checked;
    this.elements.maintainAspectRatio.checked = false;
    
    this.updateResizeButtonState();
    
    // Restore aspect ratio setting
    setTimeout(() => {
      this.elements.maintainAspectRatio.checked = wasChecked;
    }, 100);
  }

  updateResizeButtonState() {
    const width = parseInt(this.elements.widthInput.value) || 0;
    const height = parseInt(this.elements.heightInput.value) || 0;
    const hasImage = this.state.originalImage !== null;
    
    this.elements.resizeBtn.disabled = !(hasImage && width > 0 && height > 0);
  }

  async resizeImage() {
    if (!this.state.originalImage || this.state.isProcessing) return;

    this.state.isProcessing = true;
    this.showLoading(true);

    try {
      const width = parseInt(this.elements.widthInput.value);
      const height = parseInt(this.elements.heightInput.value);
      const quality = parseInt(this.elements.qualityInput.value) / 100;
      const format = this.elements.formatSelect.value;

      // Use requestAnimationFrame for smooth processing
      await new Promise(resolve => requestAnimationFrame(resolve));

      const resizedDataUrl = await this.performResize(width, height, quality, format);
      
      this.state.resizedImageDataUrl = resizedDataUrl;
      this.displayResizedImage(resizedDataUrl, width, height);
      this.showSuccess('Image resized successfully!');
      
    } catch (error) {
      this.showError(`Failed to resize image: ${error.message}`);
    } finally {
      this.state.isProcessing = false;
      this.showLoading(false);
    }
  }

  performResize(width, height, quality, format) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Apply different smoothing for different scenarios
        if (width > this.state.originalImage.width || height > this.state.originalImage.height) {
          // Upscaling - use different technique
          ctx.imageSmoothingQuality = 'medium';
        }
        
        ctx.drawImage(this.state.originalImage, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  displayResizedImage(dataUrl, width, height) {
    const img = new Image();
    
    img.onload = () => {
      this.elements.resizedImageContainer.innerHTML = '';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '300px';
      img.style.borderRadius = '8px';
      this.elements.resizedImageContainer.appendChild(img);
      
      // Calculate estimated file size
      const base64Data = dataUrl.split(',')[1];
      const estimatedSize = Math.round(base64Data.length * 0.75);
      
      // Update stats
      const stats = `${width} × ${height}px • ~${this.formatFileSize(estimatedSize)}`;
      this.elements.resizedStats.textContent = stats;
      
      // Show download button
      this.elements.downloadBtn.classList.add('visible');
    };
    
    img.src = dataUrl;
  }

  downloadImage() {
    if (!this.state.resizedImageDataUrl) return;

    const format = this.elements.formatSelect.value.split('/')[1];
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `resized-image-${timestamp}.${format}`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.state.resizedImageDataUrl;
    
    // Add a subtle animation
    link.style.opacity = '0';
    document.body.appendChild(link);
    
    requestAnimationFrame(() => {
      link.click();
      document.body.removeChild(link);
    });
    
    this.showSuccess(`Image downloaded as ${filename}`);
  }

  resetApplication() {
    // Confirm reset if image is loaded
    if (this.state.originalImage && !confirm('Are you sure you want to reset? This will clear the current image.')) {
      return;
    }

    // Reset state
    this.state.originalImage = null;
    this.state.originalFile = null;
    this.state.resizedImageDataUrl = null;
    this.state.aspectRatio = 1;

    // Reset UI
    this.elements.controlsSection.classList.remove('visible');
    this.elements.previewSection.classList.remove('visible');
    this.elements.downloadBtn.classList.remove('visible');
    
    this.elements.originalImageContainer.innerHTML = '<div class="image-placeholder"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg></div>';
    this.elements.resizedImageContainer.innerHTML = '<div class="image-placeholder"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg></div>';
    
    this.elements.originalStats.textContent = '';
    this.elements.resizedStats.textContent = '';
    
    this.elements.widthInput.value = '';
    this.elements.heightInput.value = '';
    this.elements.qualityInput.value = 90;
    this.updateQualityDisplay();
    
    this.elements.fileInput.value = '';
    this.hideError();
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    this.showSuccess('Application reset successfully');
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + O: Open file
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      this.elements.fileInput.click();
    }
    
    // Ctrl/Cmd + R: Resize image
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      if (!this.elements.resizeBtn.disabled) {
        this.resizeImage();
      }
    }
    
    // Ctrl/Cmd + D: Download image
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      if (this.state.resizedImageDataUrl) {
        this.downloadImage();
      }
    }
    
    // Escape: Reset application
    if (e.key === 'Escape') {
      this.resetApplication();
    }
    
    // Ctrl/Cmd + T: Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      this.toggleTheme();
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.add('visible');
    
    // Auto-hide after 5 seconds
    setTimeout(() => this.hideError(), 5000);
    
    // Scroll to error if not visible
    this.elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideError() {
    this.elements.errorMessage.classList.remove('visible');
  }

  showSuccess(message) {
    // Create a temporary success message
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    successElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-success);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(successElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      successElement.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(successElement)) {
          document.body.removeChild(successElement);
        }
      }, 300);
    }, 3000);
  }

  showLoading(show) {
    if (show) {
      this.elements.loadingOverlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    } else {
      this.elements.loadingOverlay.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }
}

// Additional CSS for success messages
const additionalStyles = `
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.imageResizerPro = new ImageResizerPro();
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`Page load time: ${pageLoadTime}ms`);
    }, 0);
  });
}

// Memory cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.imageResizerPro) {
    // Clean up any remaining object URLs
    if (window.imageResizerPro.state.resizedImageDataUrl) {
      try {
        URL.revokeObjectURL(window.imageResizerPro.state.resizedImageDataUrl);
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }
});