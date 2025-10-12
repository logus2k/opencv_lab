import cv2
import numpy as np


class ImageTransformer:
    """
    A class that provides various image transformations using OpenCV.
    Organized into categories: Geometric, Filters, and Color transformations.
    """
    
    def __init__(self):
        """Initialize the ImageTransformer"""
        pass
    
    # ==================== GEOMETRIC TRANSFORMATIONS ====================
    
    def rotate(self, image, angle=45):
        """
        Rotate the image by a specified angle around its center.
        
        Args:
            image: Input image as numpy array
            angle: Rotation angle in degrees (positive = counter-clockwise)
        
        Returns:
            Rotated image
        
        OpenCV Notes:
            - cv2.getRotationMatrix2D() creates a 2x3 rotation matrix
            - The matrix is calculated for rotation around a specified center point
            - cv2.warpAffine() applies the affine transformation using this matrix
        """
        height, width = image.shape[:2]
        center = (width // 2, height // 2)
        
        # Create rotation matrix: (center, angle, scale)
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        
        # Apply the rotation using warpAffine
        rotated = cv2.warpAffine(image, rotation_matrix, (width, height))
        return rotated
    
    def scale(self, image, scale_x=1.5, scale_y=1.5):
        """
        Scale (resize) the image by specified factors.
        
        Args:
            image: Input image
            scale_x: Horizontal scale factor
            scale_y: Vertical scale factor
        
        Returns:
            Scaled image
        
        OpenCV Notes:
            - cv2.resize() changes image dimensions
            - None as second parameter means we specify scale factors via fx/fy
            - INTER_LINEAR is bilinear interpolation (good balance of speed/quality)
        """
        height, width = image.shape[:2]
        new_width = int(width * scale_x)
        new_height = int(height * scale_y)
        
        # Resize using bilinear interpolation
        scaled = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
        return scaled
    
    def flip_horizontal(self, image):
        """
        Flip the image horizontally (mirror effect).
        
        Args:
            image: Input image
        
        Returns:
            Horizontally flipped image
        
        OpenCV Notes:
            - cv2.flip() flips array along specified axis
            - flipCode=1 means horizontal flip (along y-axis)
        """
        flipped = cv2.flip(image, 1)
        return flipped
    
    def flip_vertical(self, image):
        """
        Flip the image vertically.
        
        Args:
            image: Input image
        
        Returns:
            Vertically flipped image
        
        OpenCV Notes:
            - flipCode=0 means vertical flip (along x-axis)
        """
        flipped = cv2.flip(image, 0)
        return flipped
    
    def translate(self, image, x=50, y=30):
        """
        Translate (shift) the image by x and y pixels.
        
        Args:
            image: Input image
            x: Horizontal shift in pixels (positive = right)
            y: Vertical shift in pixels (positive = down)
        
        Returns:
            Translated image
        
        OpenCV Notes:
            - Translation matrix is [[1, 0, x], [0, 1, y]]
            - This is a simple affine transformation for shifting
        """
        height, width = image.shape[:2]
        
        # Create translation matrix
        translation_matrix = np.float32([[1, 0, x], [0, 1, y]])
        
        # Apply translation
        translated = cv2.warpAffine(image, translation_matrix, (width, height))
        return translated
    
    def shear(self, image, shear_factor=0.3):
        """
        Apply shear transformation (skewing) to the image.
        
        Args:
            image: Input image
            shear_factor: Amount of shear (0.0 = no shear, higher = more shear)
        
        Returns:
            Sheared image
        
        OpenCV Notes:
            - Shear transformation skews the image along an axis
            - Matrix format: [[1, shear_factor, 0], [0, 1, 0]]
            - This creates a parallelogram effect
        """
        height, width = image.shape[:2]
        
        # Create shear matrix
        shear_matrix = np.float32([[1, shear_factor, 0], [0, 1, 0]])
        
        # Calculate new width after shearing
        new_width = int(width + abs(shear_factor * height))
        
        sheared = cv2.warpAffine(image, shear_matrix, (new_width, height))
        return sheared
    
    def resize_fixed(self, image, width=800, height=600):
        """
        Resize image to specific dimensions.
        
        Args:
            image: Input image
            width: Target width in pixels
            height: Target height in pixels
        
        Returns:
            Resized image
        
        OpenCV Notes:
            - INTER_AREA is best for shrinking images
            - INTER_CUBIC is best for enlarging (slower but higher quality)
        """
        # Choose interpolation method based on whether we're shrinking or enlarging
        h, w = image.shape[:2]
        if width < w or height < h:
            interpolation = cv2.INTER_AREA
        else:
            interpolation = cv2.INTER_CUBIC
        
        resized = cv2.resize(image, (width, height), interpolation=interpolation)
        return resized
    
    # ==================== FILTER TRANSFORMATIONS ====================
    
    def gaussian_blur(self, image, kernel_size=15):
        """
        Apply Gaussian blur (smooth blur effect).
        
        Args:
            image: Input image
            kernel_size: Size of the Gaussian kernel (must be odd, larger = more blur)
        
        Returns:
            Blurred image
        
        OpenCV Notes:
            - Gaussian blur uses a Gaussian function for weighting
            - Kernel size determines the neighborhood size for blurring
            - (0, 0) for sigmaX and sigmaY means auto-calculation from kernel size
            - This is the most common blur for noise reduction
        """
        # Ensure kernel size is odd
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        blurred = cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)
        return blurred
    
    def median_blur(self, image, kernel_size=15):
        """
        Apply median blur (good for salt-and-pepper noise removal).
        
        Args:
            image: Input image
            kernel_size: Aperture size (must be odd)
        
        Returns:
            Blurred image
        
        OpenCV Notes:
            - Median filter replaces each pixel with the median of neighboring pixels
            - Very effective at removing salt-and-pepper noise while preserving edges
            - Non-linear filter (unlike Gaussian)
        """
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        blurred = cv2.medianBlur(image, kernel_size)
        return blurred
    
    def bilateral_blur(self, image, diameter=9, sigma_color=75, sigma_space=75):
        """
        Apply bilateral filter (edge-preserving blur).
        
        Args:
            image: Input image
            diameter: Diameter of pixel neighborhood
            sigma_color: Filter sigma in color space (larger = more colors mixed)
            sigma_space: Filter sigma in coordinate space (larger = farther pixels)
        
        Returns:
            Filtered image
        
        OpenCV Notes:
            - Bilateral filter smooths while preserving edges
            - It considers both spatial closeness and color similarity
            - Slower than Gaussian but produces better results for edge preservation
        """
        filtered = cv2.bilateralFilter(image, diameter, sigma_color, sigma_space)
        return filtered
    
    def sharpen(self, image, intensity=1.0):
        """
        Sharpen the image to enhance edges and details.
        
        Args:
            image: Input image
            intensity: Sharpening strength (0.0 to 2.0, where 1.0 is standard)
        
        Returns:
            Sharpened image
        
        OpenCV Notes:
            - Uses a sharpening kernel (convolution filter)
            - The kernel emphasizes the center pixel and subtracts surrounding pixels
            - This enhances edges and fine details
            - cv2.filter2D() applies a custom kernel to the image
        """
        # Sharpening kernel
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]]) * intensity / 1.0
        
        sharpened = cv2.filter2D(image, -1, kernel)
        return sharpened
    
    def edge_canny(self, image, threshold1=100, threshold2=200):
        """
        Detect edges using Canny edge detection.
        
        Args:
            image: Input image
            threshold1: Lower threshold for edge linking
            threshold2: Upper threshold for edge detection
        
        Returns:
            Edge-detected image (binary)
        
        OpenCV Notes:
            - Canny is a multi-stage edge detection algorithm
            - Lower threshold: minimum gradient for edge continuation
            - Upper threshold: minimum gradient for initial edge detection
            - Edges between thresholds are included if connected to strong edges
        """
        # Convert to grayscale if colored
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        edges = cv2.Canny(gray, threshold1, threshold2)
        
        # Convert back to 3-channel for consistency
        if len(image.shape) == 3:
            edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        
        return edges
    
    def edge_sobel(self, image, kernel_size=3):
        """
        Detect edges using Sobel operator.
        
        Args:
            image: Input image
            kernel_size: Size of the Sobel kernel (1, 3, 5, or 7)
        
        Returns:
            Edge-detected image
        
        OpenCV Notes:
            - Sobel calculates the gradient of image intensity
            - Computes derivatives in x and y directions separately
            - cv2.Sobel() applies the Sobel operator
            - cv2.magnitude() combines x and y gradients into edge strength
        """
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Calculate gradients in x and y directions
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=kernel_size)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=kernel_size)
        
        # Combine gradients
        abs_grad_x = cv2.convertScaleAbs(grad_x)
        abs_grad_y = cv2.convertScaleAbs(grad_y)
        edges = cv2.addWeighted(abs_grad_x, 0.5, abs_grad_y, 0.5, 0)
        
        # Convert back to 3-channel
        if len(image.shape) == 3:
            edges = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)
        
        return edges
    
    def emboss(self, image):
        """
        Apply emboss effect to create a 3D-like appearance.
        
        Args:
            image: Input image
        
        Returns:
            Embossed image
        
        OpenCV Notes:
            - Emboss kernel creates a directional 3D effect
            - The kernel emphasizes differences in specific direction
            - Adding 128 centers the values (prevents clipping)
        """
        # Emboss kernel
        kernel = np.array([[-2, -1, 0],
                          [-1,  1, 1],
                          [ 0,  1, 2]])
        
        embossed = cv2.filter2D(image, -1, kernel)
        
        # Add 128 to shift values to visible range
        embossed = cv2.convertScaleAbs(embossed + 128)
        
        return embossed
    
    def motion_blur(self, image, kernel_size=15, angle=45):
        """
        Apply motion blur effect in a specific direction.
        
        Args:
            image: Input image
            kernel_size: Length of motion blur
            angle: Direction of motion in degrees
        
        Returns:
            Motion-blurred image
        
        OpenCV Notes:
            - Creates a directional blur kernel
            - The kernel is a line rotated to the specified angle
            - Simulates camera or object motion
        """
        # Create motion blur kernel
        kernel = np.zeros((kernel_size, kernel_size))
        kernel[int((kernel_size - 1) / 2), :] = np.ones(kernel_size)
        kernel = kernel / kernel_size
        
        # Rotate the kernel based on angle
        center = (kernel_size // 2, kernel_size // 2)
        rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        kernel = cv2.warpAffine(kernel, rotation_matrix, (kernel_size, kernel_size))
        
        # Apply the kernel
        blurred = cv2.filter2D(image, -1, kernel)
        return blurred
    
    def dilate(self, image, kernel_size=5):
        """
        Apply morphological dilation (expands bright regions).
        
        Args:
            image: Input image
            kernel_size: Size of the structuring element
        
        Returns:
            Dilated image
        
        OpenCV Notes:
            - Dilation adds pixels to boundaries of objects
            - Uses a structuring element (kernel) to probe the image
            - Useful for connecting broken parts of an object
            - cv2.getStructuringElement() creates the kernel shape
        """
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        dilated = cv2.dilate(image, kernel, iterations=1)
        return dilated
    
    def erode(self, image, kernel_size=5):
        """
        Apply morphological erosion (shrinks bright regions).
        
        Args:
            image: Input image
            kernel_size: Size of the structuring element
        
        Returns:
            Eroded image
        
        OpenCV Notes:
            - Erosion removes pixels from boundaries of objects
            - Opposite of dilation
            - Useful for removing small noise or separating connected objects
        """
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        eroded = cv2.erode(image, kernel, iterations=1)
        return eroded
    
    # ==================== COLOR TRANSFORMATIONS ====================
    
    def grayscale(self, image):
        """
        Convert image to grayscale.
        
        Args:
            image: Input image (BGR)
        
        Returns:
            Grayscale image
        
        OpenCV Notes:
            - COLOR_BGR2GRAY converts using weighted sum: Y = 0.299*R + 0.587*G + 0.114*B
            - This formula accounts for human eye's sensitivity to different colors
            - Result is single-channel image
        """
        if len(image.shape) == 2:
            return image  # Already grayscale
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Convert back to 3-channel for consistency
        gray_bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        return gray_bgr
    
    def brightness(self, image, value=50):
        """
        Adjust image brightness.
        
        Args:
            image: Input image
            value: Brightness adjustment (-100 to 100, 0 = no change)
        
        Returns:
            Brightness-adjusted image
        
        OpenCV Notes:
            - cv2.convertScaleAbs() scales and shifts pixel values
            - Formula: output = alpha * input + beta
            - Beta (value) shifts all pixels by constant amount
            - convertScaleAbs ensures values stay in 0-255 range
        """
        adjusted = cv2.convertScaleAbs(image, beta=value)
        return adjusted
    
    def contrast(self, image, alpha=1.5):
        """
        Adjust image contrast.
        
        Args:
            image: Input image
            alpha: Contrast factor (1.0 = no change, >1 = more contrast, <1 = less)
        
        Returns:
            Contrast-adjusted image
        
        OpenCV Notes:
            - Alpha multiplies each pixel value
            - Values > 1 increase contrast (expand value range)
            - Values < 1 decrease contrast (compress value range)
        """
        adjusted = cv2.convertScaleAbs(image, alpha=alpha)
        return adjusted
    
    def saturation(self, image, saturation_scale=1.5):
        """
        Adjust color saturation.
        
        Args:
            image: Input image
            saturation_scale: Saturation multiplier (1.0 = no change, >1 = more saturated)
        
        Returns:
            Saturation-adjusted image
        
        OpenCV Notes:
            - Convert to HSV color space (Hue, Saturation, Value)
            - Saturation channel controls color intensity
            - HSV makes it easy to adjust saturation independently
            - np.clip() ensures values stay within valid range [0, 255]
        """
        # Convert to HSV color space
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
        
        # Adjust saturation (channel 1)
        hsv[:, :, 1] = hsv[:, :, 1] * saturation_scale
        hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
        
        # Convert back to BGR
        hsv = hsv.astype(np.uint8)
        adjusted = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        return adjusted
    
    def hue_shift(self, image, hue_shift=30):
        """
        Shift the hue (color tone) of the image.
        
        Args:
            image: Input image
            hue_shift: Hue rotation in degrees (0-180 in OpenCV HSV)
        
        Returns:
            Hue-shifted image
        
        OpenCV Notes:
            - Hue represents the color type (red, green, blue, etc.)
            - In OpenCV HSV, Hue range is 0-180 (half of standard 0-360)
            - Shifting hue rotates colors around the color wheel
        """
        # Convert to HSV
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
        
        # Shift hue (with wraparound)
        hsv[:, :, 0] = (hsv[:, :, 0] + hue_shift) % 180
        
        # Convert back to BGR
        hsv = hsv.astype(np.uint8)
        shifted = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        return shifted
    
    def invert(self, image):
        """
        Invert image colors (negative effect).
        
        Args:
            image: Input image
        
        Returns:
            Inverted image
        
        OpenCV Notes:
            - cv2.bitwise_not() performs bitwise NOT operation
            - For 8-bit images, this subtracts each value from 255
            - Creates a photographic negative effect
        """
        inverted = cv2.bitwise_not(image)
        return inverted
    
    def sepia(self, image):
        """
        Apply sepia tone effect (vintage/old photo look).
        
        Args:
            image: Input image
        
        Returns:
            Sepia-toned image
        
        OpenCV Notes:
            - Sepia uses a transformation matrix to blend RGB channels
            - Creates warm, brownish tones characteristic of old photographs
            - cv2.transform() applies matrix to each pixel
        """
        # Sepia transformation matrix
        sepia_matrix = np.array([[0.272, 0.534, 0.131],
                                [0.349, 0.686, 0.168],
                                [0.393, 0.769, 0.189]])
        
        # Apply transformation
        sepia_img = cv2.transform(image, sepia_matrix)
        
        # Clip values to 0-255 range
        sepia_img = np.clip(sepia_img, 0, 255).astype(np.uint8)
        return sepia_img
    
    def equalize_histogram(self, image):
        """
        Equalize histogram to improve contrast.
        
        Args:
            image: Input image
        
        Returns:
            Histogram-equalized image
        
        OpenCV Notes:
            - Histogram equalization spreads out intensity values
            - Improves contrast in low-contrast images
            - For color images, apply to brightness channel (in YCrCb space)
            - cv2.equalizeHist() redistributes pixel intensities
        """
        # For color images, equalize in YCrCb space (luminance channel)
        if len(image.shape) == 3:
            ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
            ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
            equalized = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
        else:
            equalized = cv2.equalizeHist(image)
        
        return equalized
    
    def posterize(self, image, levels=4):
        """
        Reduce number of colors (posterization effect).
        
        Args:
            image: Input image
            levels: Number of color levels per channel (2-16)
        
        Returns:
            Posterized image
        
        OpenCV Notes:
            - Posterization reduces the color palette
            - Divides the 0-255 range into fewer discrete levels
            - Creates artistic, poster-like appearance
        """
        # Calculate step size
        step = 256 // levels
        
        # Quantize pixel values
        posterized = (image // step) * step
        posterized = posterized.astype(np.uint8)
        
        return posterized
    
    def temperature(self, image, temp=20):
        """
        Adjust color temperature (warm/cool tones).
        
        Args:
            image: Input image
            temp: Temperature adjustment (-100 = cooler/blue, +100 = warmer/orange)
        
        Returns:
            Temperature-adjusted image
        
        OpenCV Notes:
            - Color temperature affects the blue-orange balance
            - Positive values add red/yellow (warmer)
            - Negative values add blue (cooler)
            - Simulates different lighting conditions
        """
        adjusted = image.astype(np.float32)
        
        # Add warmth (increase red, decrease blue)
        if temp > 0:
            adjusted[:, :, 2] = np.clip(adjusted[:, :, 2] + temp, 0, 255)  # Red
            adjusted[:, :, 0] = np.clip(adjusted[:, :, 0] - temp * 0.5, 0, 255)  # Blue
        else:
            # Add coolness (increase blue, decrease red)
            adjusted[:, :, 0] = np.clip(adjusted[:, :, 0] - temp, 0, 255)  # Blue
            adjusted[:, :, 2] = np.clip(adjusted[:, :, 2] + temp * 0.5, 0, 255)  # Red
        
        return adjusted.astype(np.uint8)
    
    # ==================== UTILITY METHOD ====================
    
    def apply_transformation(self, image_data, transformation, params):
        """
        Apply the specified transformation with given parameters.
        
        Args:
            image_data: Image as numpy array or bytes
            transformation: Name of transformation method
            params: Dictionary of parameters for the transformation
        
        Returns:
            Transformed image as numpy array
        """
        # Decode image if it's bytes
        if isinstance(image_data, bytes):
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            image = image_data
        
        # Get the transformation method
        method = getattr(self, transformation, None)
        if method is None:
            raise ValueError(f"Unknown transformation: {transformation}")
        
        # Apply transformation with parameters
        if params:
            result = method(image, **params)
        else:
            result = method(image)
        
        return result
