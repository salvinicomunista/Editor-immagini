<h1>Image Editor</h1>

This project was created during my internship at Fondazione REI.
It is a web interface that allows the user <b>to upload an image and apply a series of visual transformations through block-based logic, in a "flow editor" style.</b>
The main objectives of this project are:

• Create a local testing platform for computer vision solutions: The requirement is to have an internal company tool for experimenting and evaluating different approaches to image processing and editing in an agile manner.

• Eliminate the need for experimental programming : Often, when tackling a potential computer vision problem (for example, a company with a new visual analytics requirement), it is essential to quickly test different strategies. These may include converting to black and white, adjusting contrast, applying specific filters, or other transformations to determine which solution works best. My goal is to centralize these tests, avoiding the need to write code for each individual experiment, thus saving significant time and resources.

• Facilitate rapid prototyping: The platform allows researchers or developers to upload images and apply different modifications or algorithms in real time, to immediately evaluate the impact and effectiveness of the changes. This accelerates the trial and error cycle.
In short, my goal is to provide the company with a virtual laboratory for computer vision, a versatile platform that accelerates the process of innovation and response to technical challenges.

The main technologies I used were React with TypeScript and React Flow for the front-end (to handle block logic) and FastAPI with OpenCV for the back-end (for image processing).


<h3>How Block Logic Works</h3>
The user experience is straightforward and follows a logical sequence of steps:

1. The user uploads an image to the input node.
2. Drags a function node, connects it, and selects the type of transformation to apply.
3. Adds and connects an output node.
4. By clicking the "RUN" button in the output node:
    <ul>
      <li>o The front-end sends the image and information about the selected function.</li>
      <li>o The back-end (built with Python and Flask) processes the image and returns the processed result.</li>
      <li>o The front-end renders the output image.</li>
    </ul>

<br><br>

<img width="1004" height="503" alt="image" src="https://github.com/user-attachments/assets/dcd6d0b9-5795-4ba5-a96d-64146064a135" />

<br><br>

In this project for now there are 16 functions:
<ul>
    <li>Grayscale</li>
    <li> Blur</li>
    <li> Blue / Red /Green Channel (color filters)</li>
    <li> Rotating</li>
    <li> Canny</li>
    <li> Threshold</li>
    <li> Color Quantization</li>
    <li> Cartoon</li>
    <li> Histogram Equalization</li>
    <li> Sharpen</li>
    <li> Fourier Transform</li>
    <li> Edge Detection</li>
    <li> Stylisation</li>
    <li> Perspective Transform.</li>
</ul>

<br><br>

<h2>Here are some examples</h2>

<br><br>
<h3>Canny</h3>
<img width="1082" height="1025" alt="image" src="https://github.com/user-attachments/assets/eca1177c-ff87-494f-82eb-1543a59313e7" />

<br><br>
<br><br>

<h3>Fourier Transform</h3>
<img width="1282" height="1125" alt="image" src="https://github.com/user-attachments/assets/f08c0e4d-4bef-4fcc-8f4a-b29a176a5fb2" />

<br><br>
<br><br>

<h2>More functions at a time</h2>
<br><br>
In this editor you can also "concatenate" functions, and by concatenate i mean applying more transformations on images.
<br><br>
<b>Here is an example</b>
<br><br>

<img width="1004" height="496" alt="image" src="https://github.com/user-attachments/assets/9475cd27-c2c6-4642-ad34-49bd22e2a18e" />

<br><br>

<h2>Functions Parameters</h2>
<br><br>

There is the possibility to change the parameters of a function, by just clicking the "parametri" button.

<br><br>
<b>Here is an example</b>
<br><br>

<img width="1881" height="870" alt="image" src="https://github.com/user-attachments/assets/4f7652b6-b274-4299-a17c-c587fd9a5d6a" />

<br><br>

Now let's take for example the "Edge Detection" function.

<br><br>
<b>What is Edge Detection?</b>
<br><br>
Edge detection is a core technique in computer vision used to identify points in an image where the intensity changes sharply. These points often correspond to object boundaries, textures, or significant structural information in an image.

Edges are crucial for tasks like:
<ul>
    <li>Object detection</li>
    <li>Image segmentation</li>
    <li>Motion tracking</li>
    <li>Feature extraction for machine learning models</li>
</ul>


The idea is to use a convolution filter (kernel) to approximate the derivative of the image intensity. Large changes in intensity (high gradients) indicate potential edges.

<br><br>

<h2>Kernel</h2>
<br><br>
A kernel is a small matrix used in convolution to detect patterns in an image.
<ul>
    <li>It slides over the image pixel-by-pixel.</li>
    <li>Each value is multiplied by the corresponding pixel, and the results are summed to produce a new pixel value.</li>
    <li>In edge detection, kernels approximate derivatives:</li>
    <ul>
        <li>First derivative → detects edges and gradient direction.</li>
        <li>Second derivative → detects rapid changes (like corners or points where edges meet).</li>
    </ul>
</ul>

<br><br>

In this Editor there are 3 types of edge detection:
<ul>
    <li>Sobel</li>
    <li>Sharr</li>
    <li>Laplacian</li>
</ul>

<br><br>

## **1. Sobel Operator**

The **Sobel operator** is a widely used method for edge detection that computes the **first derivative** of the image.  
It detects **horizontal and vertical edges** while also applying a slight smoothing effect to reduce noise.

### **Sobel Kernels**

- **Horizontal (\( G_x \))**:
[-1, 0, 1]
[-2, 0, 2]
[-1, 0, 1]


- **Vertical (\( G_y \))**:
[-1, -2, -1]
[ 0, 0, 0]
[ 1, 2, 1]


### **Gradient Magnitude**
The edge strength is calculated as:
\[
G = \sqrt{G_x^2 + G_y^2}
\]

### **Pros**
- Provides some smoothing, reducing noise sensitivity.  
- Simple and efficient for basic edge detection.

### **Cons**
- Might miss very fine edges.  
- Detects mainly horizontal and vertical directions.

<br><br>

## **2. Scharr Operator**

The **Scharr operator** is an improvement over Sobel, designed for **better rotational symmetry** and more accurate detection of diagonal or curved edges.

### **Scharr Kernels**

- **Horizontal (\( G_x \))**:
[-3, 0, 3]
[-10, 0, 10]
[-3, 0, 3]


- **Vertical (\( G_y \))**:
[-3, -10, -3]
[ 0, 0, 0]
[ 3, 10, 3]


### **Gradient Magnitude**
\[
G = \sqrt{G_x^2 + G_y^2}
\]

### **Pros**
- More accurate than Sobel, especially for diagonal edges.  
- Better **rotational invariance**, meaning edge detection quality is consistent regardless of orientation.

### **Cons**
- Slightly more computationally expensive than Sobel.

<br><br>

## **3. Laplacian Operator**

The **Laplacian operator** calculates the **second derivative** of the image, detecting points of **rapid intensity change**.  
Unlike Sobel and Scharr, it **does not detect edge direction**, only edge locations.

Because it's sensitive to noise, it’s often combined with a **Gaussian blur** in a method called **Laplacian of Gaussian (LoG)**.

### **Laplacian Kernels**

- **4-connected kernel** (simpler, less sensitive):
[ 0, -1, 0]
[-1, 4, -1]
[ 0, -1, 0]


- **8-connected kernel** (more sensitive):
[-1, -1, -1]
[-1, 8, -1]
[-1, -1, -1]


### **Mathematical Definition**
\[
\nabla^2 I = \frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}
\]

### **Pros**
- Detects fine details and corners.  
- Single kernel operation, computationally straightforward.

### **Cons**
- Extremely sensitive to noise.  
- Cannot determine edge **direction**.

---
<br><br>

## **Comparison Table**

| Feature        | **Sobel**         | **Scharr**        | **Laplacian**       |
|----------------|-------------------|-------------------|---------------------|
| **Derivative Type** | 1st derivative | 1st derivative (improved) | 2nd derivative |
| **Noise Sensitivity** | Low | Low | High |
| **Edge Direction** | Yes | Yes | No |
| **Accuracy** | Good | Better (diagonals) | High but noisy |
| **Common Use Case** | Basic edge detection | Precise, rotationally invariant detection | Fine details, corners |

<br><br>

## **Summary**

- **Sobel** → Ideal for simple, noise-resistant edge detection.  
- **Scharr** → Improved accuracy, especially for diagonal or curved edges.  
- **Laplacian** → Highlights fine details but requires pre-smoothing to handle noise.


<br><br>
<h3>Some examples</h3>

![Immagine 2025-06-26 160758](https://github.com/user-attachments/assets/235c0d41-d021-4d9e-ace9-0cccfde2ede5)

<br><br>
<img width="1895" height="950" alt="image" src="https://github.com/user-attachments/assets/722b0c76-ca72-4aa9-92fd-683eee702bd0" />

