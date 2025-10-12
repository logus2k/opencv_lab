# Image Transformations Using OpenCV

The **`ImageTransformer`** class is a Python utility designed to simplify and standardize image transformations using **OpenCV**. It encapsulates a wide range of **geometric**, **filter**, and **color** transformations into reusable methods, making it easy to apply complex image processing operations with minimal code.

## Features

- **Geometric Transformations**: Rotate, scale, flip, translate, shear, and resize.
- **Filter Transformations**: Blur, sharpen, edge detection, emboss, and motion blur.
- **Color Transformations**: Grayscale, brightness/contrast, saturation, hue shift, invert, sepia, histogram equalization, and color temperature.
- **Utility Method**: Apply any transformation dynamically using `apply_transformation`.



## Usage

```python
import cv2
import numpy as np

# Create an instance of ImageTransformer
transformer = ImageTransformer()

# Load an image
image = cv2.imread("example.jpg")

# Apply transformations
rotated = transformer.rotate(image, angle=45)
blurred = transformer.gaussian_blur(image, kernel_size=15)
gray = transformer.grayscale(image)

# Display or save results
cv2.imshow("Rotated", rotated)
cv2.imshow("Blurred", blurred)
cv2.imshow("Grayscale", gray)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

---

## Geometric Transformations

### 1. Rotate

Rotates an image by a specified angle around its center.

**Parameters**

- `image`: Input image as a NumPy array.
- `angle`: Rotation angle in degrees (positive = counter-clockwise).

**Functions**

`cv2.getRotationMatrix2D()`, `cv2.warpAffine()`

**Example**

```python
rotated = transformer.rotate(image, angle=45)
```

---

### 2. Scale

Resizes an image by specified scale factors.

**Parameters**

- `image`: Input image.
- `scale_x`: Horizontal scale factor.
- `scale_y`: Vertical scale factor.

**Functions**

`cv2.resize()`

**Example**

```python
scaled = transformer.scale(image, scale_x=1.5, scale_y=1.5)
```

---

### 3. Flip (Horizontal/Vertical)

Mirrors the image horizontally or vertically.

**Parameters**

- `image`: Input image.

**Functions**

`cv2.flip()`

**Example**

```python
flipped_h = transformer.flip_horizontal(image)
flipped_v = transformer.flip_vertical(image)
```

---

### 4. Translate

Shifts the image by specified x and y pixels.

**Parameters**

- `image`: Input image.
- `x`: Horizontal shift in pixels (positive = right).
- `y`: Vertical shift in pixels (positive = down).

**Functions**

`cv2.warpAffine()`

**Example**

```python
translated = transformer.translate(image, x=50, y=30)
```

---

### 5. Shear

Skews the image along an axis.

**Parameters**

- `image`: Input image.
- `shear_factor`: Amount of shear (0.0 = no shear, higher = more shear).

**Functions**

`cv2.warpAffine()`

**Example**

```python
sheared = transformer.shear(image, shear_factor=0.3)
```

---

### 6. Resize (Fixed Dimensions)

Resizes the image to specific dimensions.

**Parameters**

- `image`: Input image.
- `width`: Target width in pixels.
- `height`: Target height in pixels.

**Functions**

`cv2.resize()`

**Example**

```python
resized = transformer.resize_fixed(image, width=800, height=600)
```

---

## Filter Transformations

### 1. Gaussian Blur

Applies a smooth blur effect.

**Parameters**

- `image`: Input image.
- `kernel_size`: Size of the Gaussian kernel (must be odd, larger = more blur).

**Functions**

`cv2.GaussianBlur()`

**Example**

```python
blurred = transformer.gaussian_blur(image, kernel_size=15)
```

---

### 2. Median Blur

Removes salt-and-pepper noise.

**Parameters**

- `image`: Input image.
- `kernel_size`: Aperture size (must be odd).

**Functions**

`cv2.medianBlur()`

**Example**

```python
blurred = transformer.median_blur(image, kernel_size=15)
```

---

### 3. Bilateral Blur

Applies an edge-preserving blur.

**Parameters**

- `image`: Input image.
- `diameter`: Diameter of pixel neighborhood.
- `sigma_color`: Filter sigma in color space.
- `sigma_space`: Filter sigma in coordinate space.

**Functions**

`cv2.bilateralFilter()`

**Example**

```python
filtered = transformer.bilateral_blur(image, diameter=9, sigma_color=75, sigma_space=75)
```

---

### 4. Sharpen

Enhances edges and details.

**Parameters**

- `image`: Input image.
- `intensity`: Sharpening strength (0.0 to 2.0, where 1.0 is standard).

**Functions**

`cv2.filter2D()`

**Example**

```python
sharpened = transformer.sharpen(image, intensity=1.0)
```

---

### 5. Edge Detection (Canny)

Detects edges using the Canny algorithm.

**Parameters**

- `image`: Input image.
- `threshold1`: Lower threshold for edge linking.
- `threshold2`: Upper threshold for edge detection.

**Functions**

`cv2.Canny()`

**Example**

```python
edges = transformer.edge_canny(image, threshold1=100, threshold2=200)
```

---

### 6. Edge Detection (Sobel)

Detects edges using the Sobel operator.

**Parameters**

- `image`: Input image.
- `kernel_size`: Size of the Sobel kernel (1, 3, 5, or 7).

**Functions**

`cv2.Sobel()`

**Example**

```python
edges = transformer.edge_sobel(image, kernel_size=3)
```

---

### 7. Emboss

Creates a 3D-like emboss effect.

**Functions**

`cv2.filter2D()`

**Example**

```python
embossed = transformer.emboss(image)
```

---

### 8. Motion Blur

Simulates motion blur in a specific direction.

**Parameters**

- `image`: Input image.
- `kernel_size`: Length of motion blur.
- `angle`: Direction of motion in degrees.

**Functions**

`cv2.filter2D()`

**Example**

```python
blurred = transformer.motion_blur(image, kernel_size=15, angle=45)
```

---

### 9. Dilate

Expands bright regions in the image.

**Parameters**

- `image`: Input image.
- `kernel_size`: Size of the structuring element.

**Functions**

`cv2.dilate()`

**Example**

```python
dilated = transformer.dilate(image, kernel_size=5)
```

---

### 10. Erode

Shrinks bright regions in the image.

**Parameters**

- `image`: Input image.
- `kernel_size`: Size of the structuring element.

**Functions**

`cv2.erode()`

**Example**

```python
eroded = transformer.erode(image, kernel_size=5)
```

---

## Color Transformations

### 1. Grayscale

Converts an image to grayscale.

**Functions**

`cv2.cvtColor()`

**Example**

```python
gray = transformer.grayscale(image)
```

---

### 2. Brightness

Adjusts the brightness of the image.

**Parameters**

- `image`: Input image.
- `value`: Brightness adjustment (-100 to 100, 0 = no change).

**Functions**

`cv2.convertScaleAbs()`

**Example**

```python
brightened = transformer.brightness(image, value=50)
```

---

### 3. Contrast

Adjusts the contrast of the image.

**Parameters**

- `image`: Input image.
- `alpha`: Contrast factor (1.0 = no change, >1 = more contrast, <1 = less).

**Functions**

`cv2.convertScaleAbs()`

**Example**

```python
contrasted = transformer.contrast(image, alpha=1.5)
```

---

### 4. Saturation

Adjusts the color saturation of the image.

**Parameters**

- `image`: Input image.
- `saturation_scale`: Saturation multiplier (1.0 = no change, >1 = more saturated).

**Functions**

`cv2.cvtColor()`

**Example**

```python
saturated = transformer.saturation(image, saturation_scale=1.5)
```

---

### 5. Hue Shift

Shifts the hue of the image.

**Parameters**

- `image`: Input image.
- `hue_shift`: Hue rotation in degrees (0-180 in OpenCV HSV).

**Functions**

`cv2.cvtColor()`

**Example**

```python
shifted = transformer.hue_shift(image, hue_shift=30)
```

---

### 6. Invert

Inverts the colors of the image.

**Functions**

`cv2.bitwise_not()`

**Example**

```python
inverted = transformer.invert(image)
```

---

### 7. Sepia

Applies a sepia tone effect.

**Functions**

`cv2.transform()`

**Example**

```python
sepia_img = transformer.sepia(image)
```

---

### 8. Equalize Histogram

Improves contrast using histogram equalization.

**Functions**

`cv2.equalizeHist()`

**Example**

```python
equalized = transformer.equalize_histogram(image)
```

---

### 9. Posterize

Reduces the number of colors in the image.

**Parameters**

- `image`: Input image.
- `levels`: Number of color levels per channel (2-16).

**Functions**

Numpy operations

**Example**

```python
posterized = transformer.posterize(image, levels=4)
```

---

### 10. Color Temperature

Adjusts the color temperature of the image.

**Parameters**

- `image`: Input image.
- `temp`: Temperature adjustment (-100 = cooler/blue, +100 = warmer/orange).

**Functions**

Numpy operations

**Example**

```python
adjusted = transformer.temperature(image, temp=20)
```

---

## Utility Method

### Apply Transformation

Applies a specified transformation with given parameters.

**Parameters**

- `image_data`: Image as a NumPy array or bytes.
- `transformation`: Name of transformation method.
- `params`: Dictionary of parameters for the transformation.

**Functions**

`cv2.imdecode()`, `getattr()`

**Example**

```python
result = transformer.apply_transformation(image_data, "rotate", {"angle": 45})
```
