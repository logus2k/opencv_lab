# OpenCV Lab: Web-Based Image Transformation Project

An experiment with image processing and computer vision techniques using **OpenCV** and **Python**, delivered through a **web interface**.

The project uses a high-performance **aiohttp** backend for heavy lifting (image processing) and a lightweight web stack (HTML, CSS, JavaScript) with **Socket.IO** for real-time user interaction.

## Features

* **Image Upload:** Allow users to upload images through the web interface.
* **Real-Time Processing:** Use WebSockets (via Socket.IO) to communicate image processing requests and updates instantly.
* **Core Transformations:** Implement common OpenCV operations such as:
    * Grayscale conversion
    * Image resizing and rotation
    * Color space conversions (e.g., BGR to HSV)
* **Filtering & Effects:** Apply various filters and effects:
    * Blurring (Gaussian, Median, etc.)
    * Edge Detection (Canny, Sobel)
    * Thresholding (Binary, Otsu)
* **Asynchronous Performance:** Leverage **aiohttp** for efficient, non-blocking I/O operations.

---

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend (Core Logic)** | Python | Main programming language. |
| **Image Processing** | OpenCV | The primary computer vision library. |
| **Web Server** | **aiohttp** | High-performance asynchronous web server framework. |
| **Real-Time Communication** | **python-socketio** | Enables WebSocket-based real-time communication. |
| **Frontend** | HTML, CSS, JavaScript | The user interface for interacting with the lab. |

---

## Installation and Setup

Follow these steps to get the project running on your local machine.

### 1. Clone the repository

```bash
git clone [https://github.com/logus2k/opencv_lab.git](https://github.com/logus2k/opencv_lab.git)
cd opencv_lab
```

### 2\. Set up the Python Environment

It is highly recommended to use a virtual environment.

```bash
# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

### 3\. Install Dependencies

You will need `opencv-python`, `aiohttp`, and `python-socketio` (server side).

```bash
# Install the necessary packages
pip install opencv-python aiohttp python-socketio
# A good practice is to create a requirements.txt file and install from there:
# pip install -r requirements.txt
```

-----

## Usage

Once the environment is set up, you can start the application server.

### 1\. Run the Server

Execute the main server file. Note that `server.py` is likely set up to run the aiohttp application:

```bash
python server.py
```

### 2\. Access the Web Interface

Open your web browser and navigate to the local host address displayed in the terminal (check your `server.py` for the exact port, often `http://127.0.0.1:8080/`).

You can then use the interface in the `web/` directory to upload an image and apply transformations defined in `image_transformer.py`.

-----

## License

This project is licensed under the **Apache License 2.0**.

---