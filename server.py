import socketio
import cv2
import numpy as np
from aiohttp import web
from image_transformer import ImageTransformer

# Create a Socket.IO server
sio = socketio.AsyncServer(
    async_mode='aiohttp',
    cors_allowed_origins='*'  # Allow all origins for development
)

# Create aiohttp web app
app = web.Application()
sio.attach(app)

# Initialize image transformer
transformer = ImageTransformer()

@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")

@sio.event
async def transform_image(sid, data):
    """
    Handle image transformation requests.
    
    Expected data format:
    {
        'image': binary image data,
        'transformation': transformation name (string),
        'params': dictionary of parameters (optional)
    }
    """
    try:
        print(f"Received transformation request from {sid}")
        
        # Extract data
        image_bytes = data.get('image')
        transformation = data.get('transformation')
        params = data.get('params', {})
        
        if not image_bytes or not transformation:
            await sio.emit('error', {
                'message': 'Missing image or transformation type'
            }, room=sid)
            return
        
        print(f"Transformation: {transformation}, Params: {params}")
        
        # Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            await sio.emit('error', {
                'message': 'Failed to decode image'
            }, room=sid)
            return
        
        # Apply transformation
        result_image = transformer.apply_transformation(image, transformation, params)
        
        # Encode result back to bytes (PNG format)
        success, encoded_image = cv2.imencode('.png', result_image)
        
        if not success:
            await sio.emit('error', {
                'message': 'Failed to encode result image'
            }, room=sid)
            return
        
        # Convert to bytes
        result_bytes = encoded_image.tobytes()
        
        # Send result back to client
        await sio.emit('transformation_result', {
            'image': result_bytes,
            'transformation': transformation
        }, room=sid)
        
        print(f"Transformation complete for {sid}")
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        await sio.emit('error', {
            'message': f'Server error: {str(e)}'
        }, room=sid)

@sio.event
async def get_transformations(sid):
    """
    Send list of available transformations to client.
    Returns transformation categories and their descriptions.
    """
    transformations_info = {
        'geometric': [
            {
                'name': 'rotate',
                'label': 'Rotate',
                'description': 'Rotate the image around its center',
                'params': [
                    {
                        'name': 'angle',
                        'label': 'Angle (degrees)',
                        'type': 'number',
                        'default': 45,
                        'min': -360,
                        'max': 360,
                        'step': 15,
                        'description': 'Rotation angle in degrees. Positive values rotate counter-clockwise.'
                    }
                ]
            },
            {
                'name': 'scale',
                'label': 'Scale',
                'description': 'Resize the image by scale factors',
                'params': [
                    {
                        'name': 'scale_x',
                        'label': 'Horizontal Scale',
                        'type': 'number',
                        'default': 1.5,
                        'min': 0.1,
                        'max': 3.0,
                        'step': 0.1,
                        'description': 'Horizontal scaling factor. Values > 1 enlarge, < 1 shrink.'
                    },
                    {
                        'name': 'scale_y',
                        'label': 'Vertical Scale',
                        'type': 'number',
                        'default': 1.5,
                        'min': 0.1,
                        'max': 3.0,
                        'step': 0.1,
                        'description': 'Vertical scaling factor. Values > 1 enlarge, < 1 shrink.'
                    }
                ]
            },
            {
                'name': 'flip_horizontal',
                'label': 'Flip Horizontal',
                'description': 'Mirror the image horizontally (left-right)',
                'params': []
            },
            {
                'name': 'flip_vertical',
                'label': 'Flip Vertical',
                'description': 'Mirror the image vertically (top-bottom)',
                'params': []
            },
            {
                'name': 'translate',
                'label': 'Translate',
                'description': 'Shift the image position',
                'params': [
                    {
                        'name': 'x',
                        'label': 'Horizontal Shift (px)',
                        'type': 'number',
                        'default': 50,
                        'min': -500,
                        'max': 500,
                        'step': 10,
                        'description': 'Horizontal translation in pixels. Positive moves right, negative moves left.'
                    },
                    {
                        'name': 'y',
                        'label': 'Vertical Shift (px)',
                        'type': 'number',
                        'default': 30,
                        'min': -500,
                        'max': 500,
                        'step': 10,
                        'description': 'Vertical translation in pixels. Positive moves down, negative moves up.'
                    }
                ]
            },
            {
                'name': 'shear',
                'label': 'Shear',
                'description': 'Apply shear/skew transformation',
                'params': [
                    {
                        'name': 'shear_factor',
                        'label': 'Shear Factor',
                        'type': 'number',
                        'default': 0.3,
                        'min': -1.0,
                        'max': 1.0,
                        'step': 0.1,
                        'description': 'Amount of shearing. Creates a parallelogram effect.'
                    }
                ]
            },
            {
                'name': 'resize_fixed',
                'label': 'Resize to Dimensions',
                'description': 'Resize to specific width and height',
                'params': [
                    {
                        'name': 'width',
                        'label': 'Width (px)',
                        'type': 'number',
                        'default': 800,
                        'min': 100,
                        'max': 2000,
                        'step': 50,
                        'description': 'Target width in pixels.'
                    },
                    {
                        'name': 'height',
                        'label': 'Height (px)',
                        'type': 'number',
                        'default': 600,
                        'min': 100,
                        'max': 2000,
                        'step': 50,
                        'description': 'Target height in pixels.'
                    }
                ]
            }
        ],
        'filters': [
            {
                'name': 'gaussian_blur',
                'label': 'Gaussian Blur',
                'description': 'Smooth blur effect, good for noise reduction',
                'params': [
                    {
                        'name': 'kernel_size',
                        'label': 'Blur Strength',
                        'type': 'number',
                        'default': 15,
                        'min': 3,
                        'max': 51,
                        'step': 2,
                        'description': 'Blur intensity. Higher values create stronger blur. Must be odd number.'
                    }
                ]
            },
            {
                'name': 'median_blur',
                'label': 'Median Blur',
                'description': 'Reduces salt-and-pepper noise while preserving edges',
                'params': [
                    {
                        'name': 'kernel_size',
                        'label': 'Blur Strength',
                        'type': 'number',
                        'default': 15,
                        'min': 3,
                        'max': 51,
                        'step': 2,
                        'description': 'Filter aperture size. Higher values create stronger blur.'
                    }
                ]
            },
            {
                'name': 'bilateral_blur',
                'label': 'Bilateral Blur',
                'description': 'Edge-preserving smoothing filter',
                'params': [
                    {
                        'name': 'diameter',
                        'label': 'Diameter',
                        'type': 'number',
                        'default': 9,
                        'min': 3,
                        'max': 25,
                        'step': 2,
                        'description': 'Diameter of pixel neighborhood used for filtering.'
                    },
                    {
                        'name': 'sigma_color',
                        'label': 'Color Sigma',
                        'type': 'number',
                        'default': 75,
                        'min': 10,
                        'max': 150,
                        'step': 10,
                        'description': 'Filter strength in color space. Higher values mix more colors.'
                    },
                    {
                        'name': 'sigma_space',
                        'label': 'Space Sigma',
                        'type': 'number',
                        'default': 75,
                        'min': 10,
                        'max': 150,
                        'step': 10,
                        'description': 'Filter strength in coordinate space. Higher values consider farther pixels.'
                    }
                ]
            },
            {
                'name': 'sharpen',
                'label': 'Sharpen',
                'description': 'Enhance edges and fine details',
                'params': [
                    {
                        'name': 'intensity',
                        'label': 'Intensity',
                        'type': 'number',
                        'default': 1.0,
                        'min': 0.0,
                        'max': 3.0,
                        'step': 0.1,
                        'description': 'Sharpening strength. Values > 1 create stronger sharpening effect.'
                    }
                ]
            },
            {
                'name': 'edge_canny',
                'label': 'Canny Edge Detection',
                'description': 'Multi-stage edge detection algorithm',
                'params': [
                    {
                        'name': 'threshold1',
                        'label': 'Lower Threshold',
                        'type': 'number',
                        'default': 100,
                        'min': 0,
                        'max': 255,
                        'step': 10,
                        'description': 'Minimum gradient value for edge linking.'
                    },
                    {
                        'name': 'threshold2',
                        'label': 'Upper Threshold',
                        'type': 'number',
                        'default': 200,
                        'min': 0,
                        'max': 255,
                        'step': 10,
                        'description': 'Minimum gradient value for initial edge detection.'
                    }
                ]
            },
            {
                'name': 'edge_sobel',
                'label': 'Sobel Edge Detection',
                'description': 'Gradient-based edge detection',
                'params': [
                    {
                        'name': 'kernel_size',
                        'label': 'Kernel Size',
                        'type': 'number',
                        'default': 3,
                        'min': 1,
                        'max': 7,
                        'step': 2,
                        'description': 'Size of the Sobel kernel. Larger values detect broader edges.'
                    }
                ]
            },
            {
                'name': 'emboss',
                'label': 'Emboss',
                'description': 'Create 3D-like raised appearance',
                'params': []
            },
            {
                'name': 'motion_blur',
                'label': 'Motion Blur',
                'description': 'Directional blur simulating motion',
                'params': [
                    {
                        'name': 'kernel_size',
                        'label': 'Blur Length',
                        'type': 'number',
                        'default': 15,
                        'min': 5,
                        'max': 51,
                        'step': 2,
                        'description': 'Length of motion blur trail.'
                    },
                    {
                        'name': 'angle',
                        'label': 'Angle (degrees)',
                        'type': 'number',
                        'default': 45,
                        'min': 0,
                        'max': 360,
                        'step': 15,
                        'description': 'Direction of motion blur.'
                    }
                ]
            },
            {
                'name': 'dilate',
                'label': 'Dilate',
                'description': 'Expand bright regions (morphological operation)',
                'params': [
                    {
                        'name': 'kernel_size',
                        'label': 'Kernel Size',
                        'type': 'number',
                        'default': 5,
                        'min': 3,
                        'max': 21,
                        'step': 2,
                        'description': 'Size of structuring element. Larger values expand more.'
                    }
                ]
            },
            {
                'name': 'erode',
                'label': 'Erode',
                'description': 'Shrink bright regions (morphological operation)',
                'params': [
                    {
                        'name': 'kernel_size',
                        'label': 'Kernel Size',
                        'type': 'number',
                        'default': 5,
                        'min': 3,
                        'max': 21,
                        'step': 2,
                        'description': 'Size of structuring element. Larger values shrink more.'
                    }
                ]
            }
        ],
        'color': [
            {
                'name': 'grayscale',
                'label': 'Grayscale',
                'description': 'Convert to black and white',
                'params': []
            },
            {
                'name': 'brightness',
                'label': 'Brightness',
                'description': 'Adjust image brightness',
                'params': [
                    {
                        'name': 'value',
                        'label': 'Brightness',
                        'type': 'number',
                        'default': 50,
                        'min': -100,
                        'max': 100,
                        'step': 5,
                        'description': 'Brightness adjustment. Positive values brighten, negative values darken.'
                    }
                ]
            },
            {
                'name': 'contrast',
                'label': 'Contrast',
                'description': 'Adjust image contrast',
                'params': [
                    {
                        'name': 'alpha',
                        'label': 'Contrast',
                        'type': 'number',
                        'default': 1.5,
                        'min': 0.5,
                        'max': 3.0,
                        'step': 0.1,
                        'description': 'Contrast multiplier. Values > 1 increase contrast, < 1 decrease.'
                    }
                ]
            },
            {
                'name': 'saturation',
                'label': 'Saturation',
                'description': 'Adjust color intensity',
                'params': [
                    {
                        'name': 'saturation_scale',
                        'label': 'Saturation',
                        'type': 'number',
                        'default': 1.5,
                        'min': 0.0,
                        'max': 3.0,
                        'step': 0.1,
                        'description': 'Saturation multiplier. Values > 1 make colors more vivid, < 1 make them dull.'
                    }
                ]
            },
            {
                'name': 'hue_shift',
                'label': 'Hue Shift',
                'description': 'Rotate colors around color wheel',
                'params': [
                    {
                        'name': 'hue_shift',
                        'label': 'Hue Shift',
                        'type': 'number',
                        'default': 30,
                        'min': 0,
                        'max': 180,
                        'step': 10,
                        'description': 'Hue rotation amount. Changes the overall color tone of the image.'
                    }
                ]
            },
            {
                'name': 'invert',
                'label': 'Invert Colors',
                'description': 'Create photographic negative effect',
                'params': []
            },
            {
                'name': 'sepia',
                'label': 'Sepia Tone',
                'description': 'Apply vintage brown tone effect',
                'params': []
            },
            {
                'name': 'equalize_histogram',
                'label': 'Histogram Equalization',
                'description': 'Automatically improve contrast',
                'params': []
            },
            {
                'name': 'posterize',
                'label': 'Posterize',
                'description': 'Reduce number of colors for artistic effect',
                'params': [
                    {
                        'name': 'levels',
                        'label': 'Color Levels',
                        'type': 'number',
                        'default': 4,
                        'min': 2,
                        'max': 16,
                        'step': 1,
                        'description': 'Number of color levels per channel. Lower values create more dramatic posterization.'
                    }
                ]
            },
            {
                'name': 'temperature',
                'label': 'Color Temperature',
                'description': 'Adjust warm/cool color balance',
                'params': [
                    {
                        'name': 'temp',
                        'label': 'Temperature',
                        'type': 'number',
                        'default': 20,
                        'min': -100,
                        'max': 100,
                        'step': 5,
                        'description': 'Temperature shift. Positive values add warmth (orange), negative add coolness (blue).'
                    }
                ]
            }
        ]
    }
    
    await sio.emit('transformations_list', transformations_info, room=sid)

# Serve static files from /web directory
import os

web_dir = os.path.join(os.path.dirname(__file__), 'web')

# Serve index.html at root
async def index(request):
    index_path = os.path.join(web_dir, 'index.html')
    return web.FileResponse(index_path)

# Setup routes
app.router.add_get('/', index)
app.router.add_static('/styles/', path=os.path.join(web_dir, 'styles'), name='styles')
app.router.add_static('/script/', path=os.path.join(web_dir, 'script'), name='script')
app.router.add_static('/library/', path=os.path.join(web_dir, 'library'), name='library')

# Optional: Add favicon handler to prevent 404
async def favicon(request):
    return web.Response(status=204)  # No content
app.router.add_get('/favicon.ico', favicon)

if __name__ == '__main__':
    print("Starting Image Transformation Server...")
    print("Server running on http://localhost:8080")
    web.run_app(app, host='0.0.0.0', port=8080)
