

# Saga Gym 1804 Web Application

## Project Description

**Saga Gym 1804** is a web-based platform aimed at helping users pursue their fitness and lifestyle objectives. The application offers a comprehensive selection of exercises, serving both as a workout guide and a dynamic exercise library. Users can browse through exercises, view instructional content (images and videos), and engage with the community by rating and commenting on individual exercises.

One of the standout features of the application is the **Workout Generator**, which empowers users to create personalized fitness plans. By inputting parameters such as age, muscle groups, fitness goals, and difficulty level, users receive curated workout suggestions. Once a plan is selected, the user can simulate the workout live. During this session, completed sets can be tracked by marking them as done and logging the weight used for each set.

Another major highlight is the **Statistics Page**, which delivers insightful and individualized analytics. Users can monitor their fitness journey through detailed metrics such as:
- Average workout duration  
- Average weight lifted  
- Total number of exercises and sets completed  
- Most frequently performed exercises  

The application also features an interactive **Leaderboard** that ranks users based on various filters such as weight, age, gender, and muscle group focus. This fosters a sense of competition and motivation. The leaderboard can be exported and shared with friends in JSON or PDF format.

## Web Pages
The `public` folder contains the client side of the application. Key pages are:

- **index.html** – landing page of the site
- **login.html** – login form
- **signup.html** – user registration
- **account.html** – user profile and settings
- **admin.html** – admin dashboard
- **leaderboard.html** – leaderboard of users
- **contact.html** – contact form
- **workout.html** – workout planner interface
- **exercitiu.html** – exercise details
- **stats.html** – statistics and activity tracking


## Project Features

1. **Exercises Page** – Allows users to browse, filter, sort, and search through the complete exercise database. It connects users to all the exercises hosted within the app.

2. **Exercise Detail Page** – Displays comprehensive information for a specific exercise, including image and video instructions to guide proper form and execution.

3. **Admin Dashboard** – A control panel for administrators, enabling them to manage database operations such as creating or deleting user accounts.

4. **Login System** – Enables existing users to authenticate and access their personalized profiles.

5. **Sign-Up System** – Collects relevant data during registration to create a new user profile tailored to individual fitness preferences.

6. **Workout Generator** – A dynamic algorithm that builds personalized workout plans based on user-selected parameters like age, goal, muscle groups, and difficulty level.

7. **Leaderboard** – A public leaderboard showcasing the most active users, with the ability to filter rankings by criteria such as age, gender, weight, and training preferences.

8. **RSS Feed Integration** – Generates an RSS API to feed external applications with real-time updates on stats, leaderboard changes, and user progress.

9. **Statistics Page** – Provides a detailed summary of a user's fitness journey, including average workout time, total sets, most trained muscle groups, and favorite exercises.

10. **Review System** – Allows users to leave feedback and rate exercises, fostering community interaction and trust.

11. **Contact Page** – A direct communication channel between users and the app's development team.

12. **User Account Page** – Displays user profile information and allows editing of personal details, including uploading a custom profile picture.

13. **Logout Functionality** – Securely ends the user's session and clears stored credentials.

14. **Favorites System** – Lets users mark and save preferred exercises for quick access later.

15. **Admin Notifications** – Notifies administrators when a user submits a message through the contact form, ensuring prompt attention.

## Technologies Used
- **HTML/CSS/JavaScript** – front end of the web application
- **Node.js** – back end runtime
- **MongoDB** – persistent storage

## Utilitary Libraries
- **bcryptjs** – hashes user passwords
- **dotenv** – loads environment variables
- **formidable** – parses form submissions and file uploads
- **jsonwebtoken** – generates and verifies JWT tokens for authentication
- **mongoose** – object data modelling for MongoDB
- **nodemailer** – sends email from the contact page
- **qs** – query string parsing used for API routes
- **nodemon** *(dev)* – restarts the server on file changes during development
- **Chart.js** – renders charts on the statistics page
- **jsPDF** – creates PDF files from page content
- **html2canvas** – captures HTML content as canvas for exporting PDF
- **Font Awesome** – icon set used across pages
- **Google Fonts** – custom fonts

## Building and Running
Make sure you have Node.js and npm installed. From the `SagaGym1804` folder:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in a `.env` file (see `SagaGym1804/.env` for examples) with values such as `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRES_IN`.
3. Start the server:
   ```bash
   node backend/index.js
   ```
   For automatic restarts during development you can instead run:
   ```bash
   npx nodemon backend/index.js
   ```

Static pages are served from the `public` directory with no additional build step.

Link Video Prezentare: https://www.youtube.com/watch?v=N-w7DEmXdOs&ab_channel=grozy
