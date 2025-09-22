<h1>Image Editor</h1>

This project was created during my internship at Fondazione REI.
It is a web interface that allows the user <b>to upload an image and apply a series of visual transformations through block-based logic, in a "flow editor" style.</b>
The main objectives of this project are:

• Create a local testing platform for computer vision solutions: The requirement is to have an internal company tool for experimenting and evaluating different approaches to image processing and editing in an agile manner.

• Eliminate the need for experimental programming : Often, when tackling a potential computer vision problem (for example, a company with a new visual analytics requirement), it is essential to quickly test different strategies. These may include converting to black and white, adjusting contrast, applying specific filters, or other transformations to determine which solution works best. My goal is to centralize these tests, avoiding the need to write code for each individual experiment, thus saving significant time and resources.

• Facilitate rapid prototyping: The platform allows researchers or developers to upload images and apply different modifications or algorithms in real time, to immediately evaluate the impact and effectiveness of the changes. This accelerates the trial and error cycle.
In short, my goal is to provide the company with a virtual laboratory for computer vision, a versatile platform that accelerates the process of innovation and response to technical challenges.

The main technologies I used were React with TypeScript and React Flow for the front-end (to handle block logic) and FastAPI with OpenCV for the back-end (for image processing).


<h2>How Block Logic Works</h2>
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

<img width="1004" height="503" alt="image" src="https://github.com/user-attachments/assets/dcd6d0b9-5795-4ba5-a96d-64146064a135" />

