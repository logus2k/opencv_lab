/**
 * ImageTransformerClient - ES6 class for handling image transformations via Socket.IO
 */
class ImageTransformerClient {
    constructor(serverUrl = window.location.origin) {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.selectedFile = null;
        this.originalFile = null; // Current working original
        this.trueOriginalFile = null; // The very first uploaded file, never changes
        this.selectedTransformation = null;
        this.transformationsData = null;
        this.currentParameters = {};
        this.matrixCellSize = 80; // Default cell size for matrix
        this.currentImageMaxDimension = 800; // Track current image max dimension
        
        // Initialize GPU.js
        this.gpu = null;
        this.useGPU = false;
        this.initGPU();
        
        this.init();
    }
    
    /**
     * Initialize GPU.js (must be called after DOM is ready)
     */
    initGPU() {
        if (typeof GPU === 'undefined') {
            console.error('❌ GPU is not defined. gpu-browser.min.js not loaded properly.');
            console.log('📊 Using CPU processing only');
            this.useGPU = false;
            return;
        }
        
        // Try different ways to access the GPU constructor
        let GPUConstructor = null;
        
        if (typeof GPU === 'function') {
            GPUConstructor = GPU;
            console.log('Using GPU directly as constructor');
        } else if (GPU.GPU && typeof GPU.GPU === 'function') {
            GPUConstructor = GPU.GPU;
            console.log('Using GPU.GPU as constructor');
        } else if (GPU.default && typeof GPU.default === 'function') {
            GPUConstructor = GPU.default;
            console.log('Using GPU.default as constructor');
        } else {
            for (let key in GPU) {
                if (typeof GPU[key] === 'function' && GPU[key].name === 'GPU') {
                    GPUConstructor = GPU[key];
                    console.log(`Using GPU.${key} as constructor`);
                    break;
                }
            }
        }
        
        if (GPUConstructor) {
            try {
                this.gpu = new GPUConstructor();
                this.useGPU = true;
                console.log('✅ GPU.js initialized successfully');
                console.log('   Mode: GPU acceleration active');
                console.log('   Mode detected:', this.gpu.mode || 'unknown');
            } catch (error) {
                console.error('❌ Failed to initialize GPU.js:', error);
                console.log('📊 Falling back to CPU processing');
                this.gpu = null;
                this.useGPU = false;
            }
        } else {
            console.error('❌ Could not find GPU constructor');
            console.log('📊 Using CPU processing only');
            this.useGPU = false;
        }
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
        const basePath = window.location.pathname.replace(/\/$/, '');
        this.socket = io(window.location.origin, {
            path: basePath + '/socket.io/',
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

        // Matrix controls
        this.setupMatrixControls();

        // Matrix section collapse/expand
        this.setupMatrixCollapse();        
    }

    /**
     * Setup matrix control event listeners
     */
    setupMatrixControls() {
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
        this.originalFile = file;
        this.trueOriginalFile = file;
        
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
     * Extract downsampled matrix data from an image element using GPU acceleration
     * @param {HTMLImageElement} imgElement - The image element to process
     * @param {number} targetCellSize - Target size for each cell in pixels (default: 80)
     * @returns {Object} Matrix data with grid dimensions and RGB values
     */
    extractMatrixData(imgElement, targetCellSize = 80) {
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
            willReadFrequently: true
        });
        
        // Set canvas size to image size
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        
        // Draw image to canvas - let alpha be handled naturally
        ctx.drawImage(imgElement, 0, 0);
        
        // Calculate grid dimensions based on target cell size
        const cols = Math.max(1, Math.floor(canvas.width / targetCellSize));
        const rows = Math.max(1, Math.floor(canvas.height / targetCellSize));
        
        const cellWidth = canvas.width / cols;
        const cellHeight = canvas.height / rows;
        
        // Check if GPU is available and working
        if (!this.useGPU || !this.gpu) {
            console.log('📊 Using CPU for matrix extraction');
            return this.extractMatrixDataCPU(canvas, cols, rows, cellWidth, cellHeight);
        }
        
        // Try GPU processing
        try {
            return this.extractMatrixDataGPU(canvas, cols, rows, cellWidth, cellHeight);
        } catch (error) {
            console.error('❌ GPU processing failed, falling back to CPU:', error);
            this.useGPU = false; // Disable GPU for future calls
            return this.extractMatrixDataCPU(canvas, cols, rows, cellWidth, cellHeight);
        }
    }
    
    /**
     * GPU-accelerated matrix extraction
     */
    extractMatrixDataGPU(canvas, cols, rows, cellWidth, cellHeight) {
        // Get pixel data
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = Array.from(imageData.data);
        
        // Create GPU kernel for parallel processing
        const computeCellAverage = this.gpu.createKernel(function(pixels, imgWidth, imgHeight, cellWidth, cellHeight, channel) {
            const col = this.thread.x;
            const row = this.thread.y;
            
            const startX = Math.floor(col * cellWidth);
            const startY = Math.floor(row * cellHeight);
            const endX = Math.floor(Math.min((col + 1) * cellWidth, imgWidth));
            const endY = Math.floor(Math.min((row + 1) * cellHeight, imgHeight));
            
            let sum = 0;
            let count = 0;
            
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const idx = (y * imgWidth + x) * 4 + channel;
                    sum += pixels[idx];
                    count++;
                }
            }
            
            return sum / count;
        }).setOutput([cols, rows]);
        
        // Compute averages for R, G, B channels in parallel
        const startTime = performance.now();
        
        const rChannel = computeCellAverage(pixels, canvas.width, canvas.height, cellWidth, cellHeight, 0);
        const gChannel = computeCellAverage(pixels, canvas.width, canvas.height, cellWidth, cellHeight, 1);
        const bChannel = computeCellAverage(pixels, canvas.width, canvas.height, cellWidth, cellHeight, 2);
        
        const endTime = performance.now();
        console.log(`⚡ GPU processing: ${(endTime - startTime).toFixed(2)}ms for ${cols}×${rows} cells`);
        
        // Convert GPU result to our matrix format
        const matrixData = [];
        for (let row = 0; row < rows; row++) {
            const rowData = [];
            for (let col = 0; col < cols; col++) {
                rowData.push({
                    r: Math.round(rChannel[row][col]),
                    g: Math.round(gChannel[row][col]),
                    b: Math.round(bChannel[row][col])
                });
            }
            matrixData.push(rowData);
        }
        
        // Clean up GPU kernels
        computeCellAverage.destroy();
        
        return {
            rows,
            cols,
            data: matrixData
        };
    }
    
    /**
     * CPU fallback for matrix data extraction
     * @param {HTMLCanvasElement} canvas - Canvas with drawn image
     * @param {number} cols - Number of columns
     * @param {number} rows - Number of rows
     * @param {number} cellWidth - Width of each cell
     * @param {number} cellHeight - Height of each cell
     * @returns {Object} Matrix data
     */
    extractMatrixDataCPU(canvas, cols, rows, cellWidth, cellHeight) {
        const ctx = canvas.getContext('2d');
        const startTime = performance.now();
        
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
        
        const endTime = performance.now();
        console.log(`🐌 CPU processing: ${(endTime - startTime).toFixed(2)}ms for ${cols}×${rows} cells`);
        
        return {
            rows,
            cols,
            data: matrixData
        };
    }

    displayMatrix(matrixData, containerId, sourceImage) {
        const container = document.getElementById(containerId);
        
        if (!matrixData) {
            container.innerHTML = '<div class="matrix-placeholder">No data available</div>';
            return;
        }
        
        const { rows, cols, data } = matrixData;
        
        // Get the displayed size of the image
        const displayedWidth = sourceImage.offsetWidth;
        const displayedHeight = sourceImage.offsetHeight;
        
        // Clear container and create canvas
        container.innerHTML = '';
        
        // Remove grid display properties from container
        container.style.display = 'block';
        container.style.background = 'transparent';
        container.style.padding = '0';
        container.style.border = 'none';
        container.style.gap = '0';
        
        // Create canvas with exact displayed image dimensions (no scaling artifacts)
        const canvas = document.createElement('canvas');
        canvas.width = displayedWidth;
        canvas.height = displayedHeight;
        canvas.style.width = `${displayedWidth}px`;
        canvas.style.height = `${displayedHeight}px`;
        canvas.style.display = 'block';
        canvas.style.margin = '0';
        canvas.style.padding = '0';
        
        const ctx = canvas.getContext('2d', {
            alpha: false  // Opaque rendering
        });
        
        // Enable smoothing for natural photo rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const startTime = performance.now();
        
        // Calculate cell sizes based on canvas dimensions
        const cellWidth = displayedWidth / cols;
        const cellHeight = displayedHeight / rows;
        
        // Draw each cell as a filled rectangle with integer coordinates to avoid gaps
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = data[row][col];
                
                // Calculate integer pixel coordinates to avoid sub-pixel rendering gaps
                const x = Math.floor(col * cellWidth);
                const y = Math.floor(row * cellHeight);
                const nextX = Math.floor((col + 1) * cellWidth);
                const nextY = Math.floor((row + 1) * cellHeight);
                const width = nextX - x;
                const height = nextY - y;
                
                // Use exact RGB values - no modification
                ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
                ctx.fillRect(x, y, width, height);
            }
        }
        
        const endTime = performance.now();
        console.log(`🎨 Canvas rendering: ${(endTime - startTime).toFixed(2)}ms for ${(cols * rows).toLocaleString()} cells`);
        
        container.appendChild(canvas);
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
    const client = new ImageTransformerClient();
    
    // Make client accessible globally for debugging (optional)
    window.imageTransformer = client;
});
