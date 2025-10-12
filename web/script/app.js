/**
 * ImageTransformerClient - ES6 class for handling image transformations via Socket.IO
 */
class ImageTransformerClient {
    constructor(serverUrl = 'http://localhost:8080') {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.selectedFile = null;
        this.originalFile = null; // Current working original
        this.trueOriginalFile = null; // The very first uploaded file, never changes
        this.selectedTransformation = null;
        this.transformationsData = null;
        this.currentParameters = {};
        this.matrixCellSize = 80; // Default cell size for matrix
        this.showMatrixNumbers = false; // Show/hide RGB numbers (off by default)
        this.currentImageMaxDimension = 800; // Track current image max dimension
        
        this.init();
    }

    /**
     * Initialize the client - setup socket connection and event listeners
     */
    init() {
        this.connectSocket();
        this.setupEventListeners();
    }

    /**
     * Establish Socket.IO connection with the server
     */
    connectSocket() {
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.showStatus('Connected to transformation server', 'success');
            this.requestTransformationsList();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showStatus('Disconnected from server', 'error');
        });

        this.socket.on('error', (data) => {
            console.error('Server error:', data.message);
            this.showStatus(`Error: ${data.message}`, 'error');
            this.hideLoading();
        });

        this.socket.on('transformations_list', (data) => {
            console.log('Received transformations list');
            this.transformationsData = data;
            this.populateTransformations();
        });

        this.socket.on('transformation_result', (data) => {
            console.log('Received transformation result');
            this.displayTransformedImage(data.image);
            this.hideLoading();
            this.showStatus('Transformation completed successfully!', 'success');
        });
    }

    /**
     * Request the list of available transformations from server
     */
    requestTransformationsList() {
        this.socket.emit('get_transformations');
    }

    /**
     * Setup all DOM event listeners
     */
    setupEventListeners() {
        // Upload box click
        const uploadBox = document.getElementById('uploadBox');
        const imageInput = document.getElementById('imageInput');
        
        uploadBox.addEventListener('click', () => {
            imageInput.click();
        });

        // File input change
        imageInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Drag and drop
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.classList.add('drag-over');
        });

        uploadBox.addEventListener('dragleave', () => {
            uploadBox.classList.remove('drag-over');
        });

        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => {
            this.downloadResult();
        });

        // Reset Image button
        const resetImageBtn = document.getElementById('resetImageBtn');
        resetImageBtn.addEventListener('click', () => {
            this.resetImage();
        });

        // Update Original button
        const updateOriginalBtn = document.getElementById('updateOriginalBtn');
        updateOriginalBtn.addEventListener('click', () => {
            this.updateOriginal();
        });

        // Reset button (Upload New Image)
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => {
            this.showUploadSection();
        });

        // Category collapse/expand handlers
        this.setupCategoryCollapse();

        // Matrix section collapse/expand
        this.setupMatrixCollapse();

        // Matrix controls
        this.setupMatrixControls();
    }

    /**
     * Setup matrix control event listeners
     */
    setupMatrixControls() {
        // Show/hide numbers toggle
        const showNumbersToggle = document.getElementById('showNumbersToggle');
        showNumbersToggle.addEventListener('change', (e) => {
            this.showMatrixNumbers = e.target.checked;
            this.toggleMatrixNumbers();
        });

        // Cell size slider - update value display during drag
        const cellSizeSlider = document.getElementById('cellSizeSlider');
        cellSizeSlider.addEventListener('input', (e) => {
            this.matrixCellSize = parseInt(e.target.value);
            document.getElementById('cellSizeValue').textContent = `${this.matrixCellSize}px`;
        });
        
        // Update matrix only when slider is released
        cellSizeSlider.addEventListener('change', (e) => {
            this.matrixCellSize = parseInt(e.target.value);
            document.getElementById('cellSizeValue').textContent = `${this.matrixCellSize}px`;
            this.updateMatrixDisplays();
        });
    }

    /**
     * Update cell size slider max value based on image dimensions
     * @param {HTMLImageElement} imgElement - The image element
     */
    updateCellSizeSliderRange(imgElement) {
        const width = imgElement.naturalWidth || imgElement.width;
        const height = imgElement.naturalHeight || imgElement.height;
        const maxDimension = Math.max(width, height);
        
        this.currentImageMaxDimension = maxDimension;
        
        const slider = document.getElementById('cellSizeSlider');
        slider.max = maxDimension;
        
        // Adjust current value if it exceeds new max
        if (this.matrixCellSize > maxDimension) {
            this.matrixCellSize = Math.floor(maxDimension / 2);
            slider.value = this.matrixCellSize;
            document.getElementById('cellSizeValue').textContent = `${this.matrixCellSize}px`;
        }
    }

    /**
     * Toggle visibility of RGB numbers in matrix cells
     */
    toggleMatrixNumbers() {
        const cells = document.querySelectorAll('.matrix-cell');
        cells.forEach(cell => {
            if (this.showMatrixNumbers) {
                cell.classList.remove('hide-numbers');
            } else {
                cell.classList.add('hide-numbers');
            }
        });
    }

    /**
     * Setup collapse/expand functionality for matrix section
     */
    setupMatrixCollapse() {
        const matrixHeader = document.getElementById('matrixHeader');
        
        matrixHeader.addEventListener('click', () => {
            const content = document.getElementById('matrixContent');
            const indicator = matrixHeader.querySelector('.collapse-indicator');
            
            // Toggle collapsed state
            content.classList.toggle('collapsed');
            
            // Update indicator
            if (content.classList.contains('collapsed')) {
                indicator.textContent = '+';
            } else {
                indicator.textContent = '−';
            }
        });
    }

    /**
     * Setup collapse/expand functionality for categories
     */
    setupCategoryCollapse() {
        const categoryHeaders = document.querySelectorAll('.category-header');
        
        categoryHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const category = header.dataset.category;
                const content = header.nextElementSibling;
                const indicator = header.querySelector('.collapse-indicator');
                
                // Toggle collapsed state
                content.classList.toggle('collapsed');
                
                // Update indicator
                if (content.classList.contains('collapsed')) {
                    indicator.textContent = '+';
                } else {
                    indicator.textContent = '−';
                }
            });
        });
    }

    /**
     * Handle file selection (upload or drag-drop)
     */
    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            this.showStatus('Please select a valid image file (JPG, PNG, GIF, BMP)', 'error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showStatus('File size must be less than 10MB', 'error');
            return;
        }

        this.selectedFile = file;
        this.originalFile = file; // Current working original
        this.trueOriginalFile = file; // Store the very first upload
        
        // Display original image
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalImg = document.getElementById('originalImage');
            originalImg.src = e.target.result;
            
            // Update matrix when image loads
            originalImg.onload = () => {
                this.updateCellSizeSliderRange(originalImg);
                this.updateMatrixDisplays();
            };
            
            // Show transformation section and ensure placeholder is visible
            const placeholder = document.getElementById('transformedPlaceholder');
            placeholder.style.display = 'flex';
            
            // Hide upload section, show transformation and results
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('transformationSection').style.display = 'block';
            document.getElementById('resultsSection').style.display = 'block';
            
            this.showStatus('Image loaded successfully! Select a transformation.', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Show the upload section (called when "Upload New Image" is clicked)
     */
    showUploadSection() {
        // Reset everything first
        this.selectedFile = null;
        this.originalFile = null;
        this.trueOriginalFile = null;
        this.selectedTransformation = null;
        this.currentParameters = {};
        this.resultBlob = null;

        // Reset UI
        document.getElementById('imageInput').value = '';
        document.getElementById('originalImage').src = '';
        const transformedImg = document.getElementById('transformedImage');
        const placeholder = document.getElementById('transformedPlaceholder');
        transformedImg.src = '';
        transformedImg.style.display = 'none';
        placeholder.style.display = 'flex';
        
        // Hide transformation and results sections
        document.getElementById('transformationSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('parametersPanel').style.display = 'none';
        
        // Show upload section
        document.getElementById('uploadSection').style.display = 'block';
        
        // Clear matrix displays
        document.getElementById('originalMatrix').innerHTML = '<div class="matrix-placeholder">No data available</div>';
        document.getElementById('targetMatrix').innerHTML = '<div class="matrix-placeholder">Apply a transformation to see matrix data</div>';
        
        // Remove all selections
        document.querySelectorAll('.transform-card').forEach(card => {
            card.classList.remove('selected');
        });

        this.showStatus('Ready for new image', 'info');
    }

    /**
     * Populate transformation cards from server data
     */
    populateTransformations() {
        if (!this.transformationsData) return;

        const categories = {
            'geometric': document.getElementById('geometricTransforms'),
            'filters': document.getElementById('filterTransforms'),
            'color': document.getElementById('colorTransforms')
        };

        for (const [category, container] of Object.entries(categories)) {
            container.innerHTML = '';
            
            const transforms = this.transformationsData[category];
            transforms.forEach(transform => {
                const card = this.createTransformCard(transform);
                container.appendChild(card);
            });
        }
    }

    /**
     * Create a transformation card element
     */
    createTransformCard(transform) {
        const card = document.createElement('div');
        card.className = 'transform-card';
        card.dataset.transform = transform.name;
        
        card.innerHTML = `
            <h4>${transform.label}</h4>
            <p>${transform.description}</p>
        `;

        card.addEventListener('click', () => {
            this.selectTransformation(transform, card);
        });

        return card;
    }

    /**
     * Handle transformation selection
     */
    selectTransformation(transform, cardElement) {
        // Remove previous selection
        document.querySelectorAll('.transform-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        cardElement.classList.add('selected');

        this.selectedTransformation = transform;
        
        // Show parameters panel if transformation has parameters
        if (transform.params && transform.params.length > 0) {
            this.showParametersPanel(transform.params);
        } else {
            // No parameters needed, hide panel
            document.getElementById('parametersPanel').style.display = 'none';
            this.currentParameters = {};
        }

        // Apply transformation immediately
        this.applyTransformation();
    }

    /**
     * Display parameters panel for selected transformation
     */
    showParametersPanel(params) {
        const panel = document.getElementById('parametersPanel');
        const container = document.getElementById('parametersContainer');
        
        container.innerHTML = '';
        this.currentParameters = {};

        params.forEach(param => {
            const paramGroup = document.createElement('div');
            paramGroup.className = 'parameter-group';
            
            // Initialize with default value
            this.currentParameters[param.name] = param.default;
            
            paramGroup.innerHTML = `
                <label>
                    <span>${param.label}</span>
                    <span class="parameter-value" id="value-${param.name}">${param.default}</span>
                </label>
                <input 
                    type="range" 
                    id="param-${param.name}"
                    min="${param.min}" 
                    max="${param.max}" 
                    step="${param.step}" 
                    value="${param.default}"
                    data-param="${param.name}"
                >
                <p class="parameter-description">${param.description}</p>
            `;

            // Add event listener to range input for real-time updates
            const input = paramGroup.querySelector('input[type="range"]');
            input.addEventListener('input', (e) => {
                const paramName = e.target.dataset.param;
                const value = parseFloat(e.target.value);
                
                // Update displayed value
                document.getElementById(`value-${paramName}`).textContent = value;
                
                // Update current parameters
                this.currentParameters[paramName] = value;
                
                // Apply transformation immediately
                this.applyTransformation();
            });

            container.appendChild(paramGroup);
        });

        panel.style.display = 'block';
    }

    /**
     * Apply selected transformation to the image
     */
    async applyTransformation() {
        if (!this.selectedFile) {
            this.showStatus('Please select an image first', 'error');
            return;
        }

        if (!this.selectedTransformation) {
            this.showStatus('Please select a transformation', 'error');
            return;
        }

        this.showLoading();
        this.showStatus('Processing image...', 'info');

        try {
            // Read file as ArrayBuffer
            const arrayBuffer = await this.selectedFile.arrayBuffer();
            
            // Emit transformation request with binary image data
            this.socket.emit('transform_image', {
                image: arrayBuffer,
                transformation: this.selectedTransformation.name,
                params: this.currentParameters
            });

        } catch (error) {
            console.error('Error applying transformation:', error);
            this.showStatus('Failed to process image', 'error');
            this.hideLoading();
        }
    }

    /**
     * Extract downsampled matrix data from an image element
     * @param {HTMLImageElement} imgElement - The image element to process
     * @param {number} targetCellSize - Target size for each cell in pixels (default: 80)
     * @returns {Object} Matrix data with grid dimensions and RGB values
     */
    extractMatrixData(imgElement, targetCellSize = 80) {
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to image size
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        
        // Draw image to canvas
        ctx.drawImage(imgElement, 0, 0);
        
        // Calculate grid dimensions based on target cell size
        const cols = Math.max(1, Math.floor(canvas.width / targetCellSize));
        const rows = Math.max(1, Math.floor(canvas.height / targetCellSize));
        
        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;
        
        // Extract and average pixel data for each cell
        const matrixData = [];
        
        for (let row = 0; row < rows; row++) {
            const rowData = [];
            for (let col = 0; col < cols; col++) {
                // Calculate region boundaries
                const x = Math.floor(col * cellWidth);
                const y = Math.floor(row * cellHeight);
                const w = Math.floor(cellWidth);
                const h = Math.floor(cellHeight);
                
                // Get pixel data for this region
                const imageData = ctx.getImageData(x, y, w, h);
                const pixels = imageData.data;
                
                // Calculate average RGB
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let i = 0; i < pixels.length; i += 4) {
                    r += pixels[i];
                    g += pixels[i + 1];
                    b += pixels[i + 2];
                    count++;
                }
                
                rowData.push({
                    r: Math.round(r / count),
                    g: Math.round(g / count),
                    b: Math.round(b / count)
                });
            }
            matrixData.push(rowData);
        }
        
        return {
            rows,
            cols,
            data: matrixData
        };
    }

    /**
     * Display matrix data in the UI
     * @param {Object} matrixData - Matrix data object
     * @param {string} containerId - ID of the container element
     * @param {HTMLImageElement} sourceImage - The source image element for sizing reference
     */
    displayMatrix(matrixData, containerId, sourceImage) {
        const container = document.getElementById(containerId);
        
        if (!matrixData) {
            container.innerHTML = '<div class="matrix-placeholder">No data available</div>';
            return;
        }
        
        const { rows, cols, data } = matrixData;
        
        // Get the displayed size of the image (not natural size)
        const displayedWidth = sourceImage.offsetWidth;
        const displayedHeight = sourceImage.offsetHeight;
        
        // Calculate cell display size to match the displayed image size
        const cellDisplayWidth = displayedWidth / cols;
        const cellDisplayHeight = displayedHeight / rows;
        
        // Use square cells with the average dimension
        const cellDisplaySize = (cellDisplayWidth + cellDisplayHeight) / 2;
        
        // Calculate appropriate font size based on cell display size
        // Hide text if cells are too small
        let fontSize = 0;
        if (cellDisplaySize >= 8) {
            fontSize = Math.max(6, Math.min(12, cellDisplaySize / 2.5));
        }
        
        // Adjust gap based on cell size
        const gap = cellDisplaySize < 3 ? 0 : (cellDisplaySize < 10 ? 0.5 : 1);
        container.style.gap = `${gap}px`;
        
        // Set grid template with explicit sizes
        container.style.gridTemplateColumns = `repeat(${cols}, ${cellDisplaySize}px)`;
        container.style.gridTemplateRows = `repeat(${rows}, ${cellDisplaySize}px)`;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = data[row][col];
                const cellDiv = document.createElement('div');
                cellDiv.className = 'matrix-cell';
                
                // Apply hide-numbers class if needed
                if (!this.showMatrixNumbers) {
                    cellDiv.classList.add('hide-numbers');
                }
                
                // Create pastel background color
                // Use a lighter version of the RGB values for better readability
                const pastelR = Math.round(cell.r * 0.6 + 255 * 0.4);
                const pastelG = Math.round(cell.g * 0.6 + 255 * 0.4);
                const pastelB = Math.round(cell.b * 0.6 + 255 * 0.4);
                
                cellDiv.style.backgroundColor = `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
                
                // Set explicit cell size (square cells)
                cellDiv.style.width = `${cellDisplaySize}px`;
                cellDiv.style.height = `${cellDisplaySize}px`;
                cellDiv.style.minHeight = `${cellDisplaySize}px`;
                cellDiv.style.fontSize = `${fontSize}px`;
                
                // Adjust padding based on cell size
                const padding = cellDisplaySize < 5 ? 0 : (cellDisplaySize < 15 ? 1 : 2);
                cellDiv.style.padding = `${padding}px`;
                
                // Format with spaces after commas to allow wrapping
                cellDiv.textContent = `${cell.r}, ${cell.g}, ${cell.b}`;
                
                container.appendChild(cellDiv);
            }
        }
    }

    /**
     * Update matrix displays for both original and target images
     */
    updateMatrixDisplays() {
        const originalImg = document.getElementById('originalImage');
        const transformedImg = document.getElementById('transformedImage');
        
        // Update original matrix using current cell size
        if (originalImg && originalImg.src && originalImg.complete) {
            const originalMatrixData = this.extractMatrixData(originalImg, this.matrixCellSize);
            this.displayMatrix(originalMatrixData, 'originalMatrix', originalImg);
        }
        
        // Update target matrix
        if (transformedImg && transformedImg.src && transformedImg.complete && transformedImg.style.display !== 'none') {
            const targetMatrixData = this.extractMatrixData(transformedImg, this.matrixCellSize);
            this.displayMatrix(targetMatrixData, 'targetMatrix', transformedImg);
        } else {
            // Show placeholder for target
            document.getElementById('targetMatrix').innerHTML = '<div class="matrix-placeholder">Apply a transformation to see matrix data</div>';
        }
    }

    /**
     * Display the transformed image result
     */
    displayTransformedImage(imageData) {
        // Convert ArrayBuffer/Buffer to Blob
        const blob = new Blob([imageData], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        const transformedImg = document.getElementById('transformedImage');
        const placeholder = document.getElementById('transformedPlaceholder');
        
        transformedImg.src = url;
        transformedImg.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Store the blob for download
        this.resultBlob = blob;
        
        // Update matrix displays after image loads
        transformedImg.onload = () => {
            this.updateMatrixDisplays();
        };
    }

    /**
     * Download the transformed image
     */
    downloadResult() {
        if (!this.resultBlob) {
            this.showStatus('No result image to download', 'error');
            return;
        }

        const url = URL.createObjectURL(this.resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transformed_${this.selectedTransformation.name}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showStatus('Image downloaded successfully!', 'success');
    }

    /**
     * Reset the left pane to the original uploaded image
     */
    resetImage() {
        if (!this.trueOriginalFile) {
            this.showStatus('No original image to reset to', 'error');
            return;
        }

        // Reset selectedFile to the true original
        this.selectedFile = this.trueOriginalFile;
        this.originalFile = this.trueOriginalFile;

        // Re-display the original image in the left pane
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalImg = document.getElementById('originalImage');
            originalImg.src = e.target.result;
            
            // Update matrix when image loads
            originalImg.onload = () => {
                this.updateCellSizeSliderRange(originalImg);
                this.updateMatrixDisplays();
            };
            
            this.showStatus('Image reset to original', 'success');
        };
        reader.readAsDataURL(this.trueOriginalFile);
    }

    /**
     * Update the original image with the current transformed result
     */
    async updateOriginal() {
        if (!this.resultBlob) {
            this.showStatus('No transformed image to update from', 'error');
            return;
        }

        // Convert the result blob to a File object
        const file = new File([this.resultBlob], 'transformed.png', { type: 'image/png' });
        
        // Update selectedFile and originalFile (but keep trueOriginalFile intact)
        this.selectedFile = file;
        this.originalFile = file;

        // Update the left pane display
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalImg = document.getElementById('originalImage');
            originalImg.src = e.target.result;
            
            // Update matrix when image loads
            originalImg.onload = () => {
                this.updateCellSizeSliderRange(originalImg);
                this.updateMatrixDisplays();
            };
            
            // Clear the right pane and show placeholder
            const transformedImg = document.getElementById('transformedImage');
            const placeholder = document.getElementById('transformedPlaceholder');
            transformedImg.src = '';
            transformedImg.style.display = 'none';
            placeholder.style.display = 'flex';
            
            // Clear result blob since it's now the original
            this.resultBlob = null;
            
            this.showStatus('Original image updated with transformation result', 'success');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Show loading spinner
     */
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    /**
     * Hide loading spinner
     */
    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    /**
     * Show status message
     * @param {string} message - Message to display
     * @param {string} type - Type of message: 'success', 'error', 'info'
     */
    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type} show`;

        // Auto-hide after 4 seconds
        setTimeout(() => {
            statusEl.classList.remove('show');
        }, 4000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create instance of the client
    // Change 'http://localhost:8080' to your server URL if different
    const client = new ImageTransformerClient('http://localhost:8080');
    
    // Make client accessible globally for debugging (optional)
    window.imageTransformer = client;
});
