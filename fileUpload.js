// File Upload and OCR Processing Module

// Create a global FileUploadHandler object first
window.FileUploadHandler = {
    // Storage for extracted text data
    _extractedData: null,
    
    // Method to get the extracted text
    getExtractedText: function() {
        return this._extractedData;
    },
    
    // Method to clear the attachment UI but keep the extracted data
    clearAttachmentUI: function() {
        const fileAttachmentContainer = document.querySelector('.file-attachment-container');
        if (fileAttachmentContainer) {
            fileAttachmentContainer.innerHTML = '';
            fileAttachmentContainer.classList.add('hidden');
            // Don't delete the dataset here, we might still need it
        }
        
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.value = '';
        }
        
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.placeholder = 'Ask me about health conditions, symptoms, general medical advice...';
        }
    },
    
    // Method to clear everything including extracted data
    clearAttachment: function() {
        this.clearAttachmentUI();
        
        // Clear the stored data
        this._extractedData = null;
        
        // Also clear from DOM if it exists
        const fileAttachmentContainer = document.querySelector('.file-attachment-container');
        if (fileAttachmentContainer) {
            delete fileAttachmentContainer.dataset.extractedText;
            delete fileAttachmentContainer.dataset.fileName;
        }
        
        // Clear the chat input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = '';
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },
    
    // Method to set the extracted text data
    setExtractedData: function(data) {
        this._extractedData = data;
        
        // Also store in DOM for backup access method
        const fileAttachmentContainer = document.querySelector('.file-attachment-container');
        if (fileAttachmentContainer) {
            fileAttachmentContainer.dataset.extractedText = data.text;
            fileAttachmentContainer.dataset.fileName = data.fileName;
        }
        
        // Insert the extracted text directly into the chat input
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            // Clear any existing text and insert the extracted text
            chatInput.value = data.text;
            // Trigger input event to update any listeners
            chatInput.dispatchEvent(new Event('input', { bubbles: true }));
            // Focus the input for the user
            chatInput.focus();
        }
        
        // Dispatch an event to notify that text extraction is complete
        document.dispatchEvent(new CustomEvent('textExtractionComplete', { detail: data }));
    }
};

// Implementation of the file processing functionality
(function() {
    // File types and icons mapping
    const FILE_TYPES = {
        'application/pdf': {
            icon: 'fa-file-pdf',
            processor: processPdf
        },
        'image/png': {
            icon: 'fa-file-image',
            processor: processImage
        },
        'image/jpeg': {
            icon: 'fa-file-image',
            processor: processImage
        },
        'image/jpg': {
            icon: 'fa-file-image',
            processor: processImage
        }
    };
    // Process PDF files using PDF.js and Tesseract
    async function processPdf(file) {
        try {
            // Load the PDF document
            const pdfData = await readFileAsArrayBuffer(file);
            
            // Ensure PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library is not loaded. Please try again.');
            }
            
            // Load the PDF document
            const pdf = await pdfjsLib.getDocument({data: pdfData}).promise;
            
            let fullText = '';
            
            // Process each page (limit to first 3 pages for performance)
            const maxPages = Math.min(pdf.numPages, 3);
            
            for (let i = 1; i <= maxPages; i++) {
                // Get the page
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({scale: 1.5});
                
                // Create a canvas to render the PDF page
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render the PDF page to the canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                // Convert canvas to image data URL
                const imageDataUrl = canvas.toDataURL('image/png');
                
                // Extract text using Tesseract OCR (direct method without worker)
                const text = await recognizeText(imageDataUrl);
                
                fullText += text + ' ';
            }
            
            return fullText.trim();
        } catch (error) {
            // console.error('Error processing PDF:', error); // Preserving as a comment in case it's useful for future debugging, but functionally removed
            throw new Error('Failed to process PDF file. Please try again.');
        }
    }
    
    // Process image files using Tesseract OCR
    async function processImage(file) {
        try {
            // Convert file to image data URL
            const imageDataUrl = await readFileAsDataURL(file);
            
            // Perform OCR on the image
            const text = await recognizeText(imageDataUrl);
            
            return text;
        } catch (error) {
            throw new Error('Failed to process image file. Please try again.');
        }
    }
    
    // Recognize text from an image using Tesseract.js
    async function recognizeText(imageSource) {
        try {
            // Create a worker with proper initialization for Tesseract.js v4.1.1
            const worker = await Tesseract.createWorker({
                logger: progress => {
                    if (progress.status === 'recognizing text') {
                        // console.log(`OCR Progress: ${(progress.progress * 100).toFixed(2)}%`);
                    } else {
                        // console.log(`OCR Status: ${progress.status}`);
                    }
                }
            });
            
            // Load language - this step is required in v4.x
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            
            // Recognize text from image
            const result = await worker.recognize(imageSource);
            
            // Clean up worker
            await worker.terminate();
            
            return result.data.text;
        } catch (error) {
            throw new Error('OCR process failed. Please try again.');
        }
    }
    
    // Helper function to read file as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Helper function to read file as Data URL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Create file attachment UI element
    function createFileAttachment(file) {
        const fileType = file.type;
        const fileIcon = FILE_TYPES[fileType]?.icon || 'fa-file';
        
        const attachmentElement = document.createElement('div');
        attachmentElement.className = 'file-attachment';
        
        attachmentElement.innerHTML = `
            <div class="file-icon">
                <i class="fas ${fileIcon}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="remove-file-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener to remove button
        const removeButton = attachmentElement.querySelector('.remove-file-btn');
        removeButton.addEventListener('click', () => {
            attachmentElement.remove();
            // Reset the file input
            const fileInput = document.getElementById('file-upload');
            if (fileInput) {
                fileInput.value = '';
            }
        });
        
        return attachmentElement;
    }
    
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // Process the uploaded file and extract text
    async function processFile(file) {
        const fileType = file.type;
        
        if (!FILE_TYPES[fileType]) {
            throw new Error('Unsupported file type. Please upload a PDF or image file (PNG/JPG).');
        }
        
        // Show loading indicator
        const loadingElement = document.getElementById('chat-loading');
        if (loadingElement) {
            loadingElement.classList.remove('hidden');
        }
        
        try {
            // Process the file using the appropriate processor
            const extractedText = await FILE_TYPES[fileType].processor(file);
            
            // Create a summary of the extracted text (first 200 characters)
            const textSummary = extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '');
            
            // Create result object
            const result = {
                fileName: file.name,
                fileType: fileType,
                extractedText: extractedText,
                textSummary: textSummary
            };
            
            // Store the extracted text in the global FileUploadHandler
            window.FileUploadHandler.setExtractedData({
                text: extractedText,
                fileName: file.name
            });
            
            return result;
        } catch (error) {
            throw error;
        } finally {
            // Hide loading indicator
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
        }
    }
    
    // Initialize the file upload functionality
    function init() {
        const chatContainer = document.querySelector('.chat-input-container');
        if (!chatContainer) return;
        
        // Create file upload button and input
        const fileUploadContainer = document.createElement('div');
        fileUploadContainer.className = 'file-upload-container';
        
        fileUploadContainer.innerHTML = `
            <button id="file-upload-btn" class="btn-secondary">
                <i class="fas fa-paperclip"></i>
            </button>
            <input type="file" id="file-upload" accept=".pdf,.png,.jpg,.jpeg" style="display: none;">
        `;
        
        // Insert the file upload container before the send button
        const sendButton = document.getElementById('send-message-btn');
        if (sendButton) {
            chatContainer.insertBefore(fileUploadContainer, sendButton);
        }
        
        // Create file attachment container
        const fileAttachmentContainer = document.createElement('div');
        fileAttachmentContainer.className = 'file-attachment-container hidden';
        chatContainer.parentNode.insertBefore(fileAttachmentContainer, chatContainer);
        
        // Add event listeners
        const fileUploadBtn = document.getElementById('file-upload-btn');
        const fileInput = document.getElementById('file-upload');
        
        if (fileUploadBtn && fileInput) {
            fileUploadBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                // Check if file type is supported
                if (!FILE_TYPES[file.type]) {
                    alert('Unsupported file type. Please upload a PDF or image file (PNG/JPG).');
                    fileInput.value = '';
                    return;
                }
                
                // Clear previous attachments
                fileAttachmentContainer.innerHTML = '';
                fileAttachmentContainer.classList.remove('hidden');
                
                // Add file attachment UI
                const attachmentElement = createFileAttachment(file);
                fileAttachmentContainer.appendChild(attachmentElement);
                
                try {
                    // Process the file
                    const result = await processFile(file);
                    
                    // Update the chat input placeholder to indicate a file is attached
                    const chatInput = document.getElementById('chat-input');
                    if (chatInput) {
                        chatInput.placeholder = `File attached: ${result.fileName}. Add your message or press Enter to send.`;
                    }
                    
                } catch (error) {
                    alert(error.message || 'Failed to process file. Please try again.');
                    fileAttachmentContainer.innerHTML = '';
                    fileAttachmentContainer.classList.add('hidden');
                    fileInput.value = '';
                }
            });
        }
        
        // Configure PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
        } else {
        }
    }
    
    // Expose the init function to the global FileUploadHandler
    window.FileUploadHandler.init = init;
    
    // Add event listener for text extraction complete
    document.addEventListener('textExtractionComplete', function(event) {
        // Text extraction complete event received, event.detail contains the data
    });
    
})(); // End of IIFE

// Initialize the file upload handler when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the handler
    window.FileUploadHandler.init();
});
