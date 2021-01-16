# Overview
Peggy J. is a simple image management platform that supports on the fly resizing of images. Rather than working with a hulking platform like Cloudinary, Peggy J. allows developers to request any web hosted image at a specified width with zero setup. Images are hosted on AWS S3 and image data is stored on MongoDB. Peggy J. supports JPG, PNG, BMP, TIFF, and thankfully... GIF.

# How Peggy J. Works
When Peggy receives a request, Peggy will check the DB to see if it has a stored version of the requested image at the requested size. If so, then Peggy will simply return that image. Otherwise Peggy will resize the image, store it in S3 for next time, and return the resized image. Periodically, Peggy will delete images which haven't been accessed in more than 7 days.

# Try a Live Demo
Peggy J. is currently live at [http://peggy-j.ap-southeast-2.elasticbeanstalk.com/](http://peggy-j.ap-southeast-2.elasticbeanstalk.com/). Give it a shot using the instructions below!

# Using Peggy J.
Consider the following HTML snippet:
```html
<img src="https://www.w3schools.com/w3css/img_snowtops.jpg">
```
Now let's say you wanted to display that image at a width of 400px. You would simply edit the url like so:
```html
<img src="http://peggy-j.ap-southeast-2.elasticbeanstalk.com/?w=400&url=https://www.w3schools.com/w3css/img_snowtops.jpg">
```
That's it. Now Peggy will send back a resized version of that image. Peggy J. only supports two query parameters: `url` and `w`.

# Running Peggy J.
Run `npm install` to install dependencies. 

You will need to include the following env variables to run Peggy J...
```
PORT=<Port to run server on>
NODE_ENV=<development/production>
MONGO_URI=<Full connection string for MongoDB>
S3_KEY_ID=<For S3 access - see AWS S3 docs for more details>
S3_SECRET=<For S3 access - see AWS S3 docs for more details>
S3_BUCKET=<The S3 bucket to use for images>
```

To build for production, use `npm run build`. Then use `npm start` to run the server.

To run the development server with hot reloading, use `npm run start-dev`.
