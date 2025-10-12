# Image Transformer with OpenCV and Socket.IO

A modern web application for applying real-time image transformations using OpenCV. Features 27 different transformations across three categories: Geometric, Filters, and Color adjustments.

## Features

### Transformation Categories

**Geometric Transformations (7 operations)**
- Rotate, Scale, Flip (Horizontal/Vertical), Translate, Shear, Resize

**Filters (10 operations)**
- Gaussian Blur, Median Blur, Bilateral Blur, Sharpen, Canny Edge Detection, Sobel Edge Detection, Emboss, Motion Blur, Dilate, Erode

**Color Transformations (10 operations)**
- Grayscale, Brightness, Contrast, Saturation, Hue Shift, Invert Colors, Sepia Tone, Histogram Equalization, Posterize, Color Temperature

### Advanced Features

- **Real-time Transformations**: Apply transformations instantly as you adjust parameters
- **Collapsible Categories**: Organize transformations into expandable sections
- **Matrix Data Visualization**: View downsampled RGB matrix data for both original and transformed images
  - Grid size automatically scales to match image proportions
  - Color-coded cells with pastel backgrounds showing RGB values
  - Compare numerical changes side-by-side
- **Image Chaining**: Apply multiple transformations sequentially using "Update Original"
- **Reset to Original**: Revert to the initially uploaded image at any time

## Project Structure

```
image-transformer/
├── image_transformer.py    # OpenCV transformation class
├── server.py              # Socket.IO server
├── index.html            # Frontend HTML
├── style.css             # Styling
├── app.js                # ES6 JavaScript client class
└── README.md             # This file
```

## Requirements

### Backend (Python)
```bash
pip install opencv-python python-socketio aiohttp numpy
```

### Frontend
- Modern web browser with JavaScript ES6 support
- Socket.IO client (loaded via CDN in HTML)

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install opencv-python python-socketio aiohttp numpy
   ```

2. **Download all project files** to the same directory

3. **File structure should be:**
   ```
   your-project-folder/
   ├── image_transformer.py
   ├── server.py
   ├── index.html
   ├── style.css
   └── app.js
   ```

## Running the Application

### 1. Start the Server

```bash
python server.py
```

You should see:
```
Starting Image Transformation Server...
Server running on http://localhost:8080
```

### 2. Open the Frontend

Simply open `index.html` in your web browser:
- **Option A:** Double-click `index.html`
- **Option B:** Right-click and select "Open with" → Your Browser
- **Option C:** Use a local server (recommended for development):
  ```bash
  # Using Python's built-in server
  python -m http.server 8000
  # Then visit: http://localhost:8000
  ```

**Note:** If using `file://` protocol directly, you may need to update the server URL in `app.js` if you encounter CORS issues.

## Usage

1. **Upload an Image**
   - Click the upload box or drag and drop an image file
   - Supported formats: JPG, PNG, GIF, BMP
   - Maximum file size: 10MB

2. **Select a Transformation**
   - Browse through three categories
   - Click on any transformation card
   - Each card shows a description of what the transformation does

3. **Adjust Parameters**
   - If the transformation has parameters, they'll appear below
   - Use sliders to adjust values
   - Hover over parameters to see descriptions

4. **Apply Transformation**
   - Click "Apply Transformation" button
   - Wait for processing (loading spinner will show)
   - View the result on the right side

5. **Download or Reset**
   - Download the transformed image
   - Upload a new image to start over

6. **View Matrix Data** (Optional)
   - Click "Matrix Data" to expand the numerical view
   - See downsampled RGB values for both images
   - Color-coded cells show visual correlation with numerical data
   - Compare how transformations affect pixel values

## Technical Details

### Communication Protocol

- **Transport:** Socket.IO over WebSocket/Polling
- **Image Format:** Binary data (ArrayBuffer/bytes)
- **Messages:** JSON for transformation requests
- **Response:** Binary PNG image

### Socket.IO Events

**Client → Server:**
- `get_transformations` - Request list of available transformations
- `transform_image` - Send image + transformation request

**Server → Client:**
- `transformations_list` - Send transformation metadata
- `transformation_result` - Send transformed image
- `error` - Send error message

### Parameters System

Each transformation can have custom parameters with:
- Name, label, and description
- Type (number/range)
- Min/max values and step size
- Default value
- Real-time value display

## Customization

### Adding New Transformations

1. **Add method to `ImageTransformer` class** in `image_transformer.py`:
   ```python
   def my_new_transform(self, image, param1=default_value):
       """
       Description with OpenCV notes
       """
       # Your transformation code
       return transformed_image
   ```

2. **Add to transformations list** in `server.py` under appropriate category:
   ```python
   {
       'name': 'my_new_transform',
       'label': 'My Transform',
       'description': 'What it does',
       'params': [
           {
               'name': 'param1',
               'label': 'Parameter Label',
               'type': 'number',
               'default': 1.0,
               'min': 0.0,
               'max': 2.0,
               'step': 0.1,
               'description': 'What this parameter controls'
           }
       ]
   }
   ```

3. The frontend will automatically display the new transformation!

### Styling

Modify `style.css` to customize:
- Colors (CSS variables in `:root`)
- Layout and spacing
- Animations and transitions
- Responsive breakpoints

## Troubleshooting

### Server won't start
- Check if port 8080 is already in use
- Verify all Python dependencies are installed
- Check Python version (3.7+ recommended)

### Cannot connect to server
- Verify server is running
- Check server URL in `app.js` (line 212)
- Look for CORS errors in browser console
- Try using `http://` instead of `https://`

### Image won't transform
- Check browser console for errors
- Verify image file is valid and under 10MB
- Check server terminal for error messages
- Ensure OpenCV is properly installed

### Transformations not appearing
- Wait for "Connected to server" message
- Check if `get_transformations` event is firing
- Verify server is sending transformation list

## Performance Tips

- Smaller images process faster
- Some transformations (bilateral blur, edge detection) are computationally intensive
- Consider resizing very large images before processing
- The server processes one image at a time per client

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Supported (with responsive design)

## Security Notes

For production deployment:
- Change `cors_allowed_origins='*'` in `server.py` to specific domains
- Add authentication if needed
- Implement rate limiting
- Add input validation for file sizes and types
- Use HTTPS in production

## Learning Resources

The code includes extensive comments explaining:
- How each OpenCV transformation works
- What parameters control
- Best practices for image processing

Study `image_transformer.py` to learn about:
- Geometric transformations
- Image filtering techniques
- Color space manipulations
- Morphological operations

## License

This project is provided as-is for educational purposes.

## Credits

- **OpenCV** - Image processing library
- **Socket.IO** - Real-time communication
- **Python** - Backend processing
- **Modern CSS** - Beautiful, responsive UI
