# RecipeBook-40

### Introduction
Dish Diaries is a recipe storing and sharing app designed for collaborative cooking and recipe sharing among couples and small groups. Users can create accounts, store personal recipes, and share them with friends, family, or the broader community.

Motivation: Inspired by Sneha's love for cooking with her boyfriend, Dish Diaries offers a centralized and seamless platform for recipe sharing, unlike other apps that lack a collaborative focus.

### Technical Architecture
The application is built using the following components:

- Frontend:
  - Role: Provides a user-friendly interface for recipe creation, organization, and sharing.
  - Technologies: React.js, Axios.
  - Key Features: Login, password reset, account creation, recipe browsing.
  - Contributors: Sneha Singh (Advanced), Shreyes Bharat (Basic).
- Backend:
  - Role: Manages user authentication, recipe data storage, and core application logic.
  - Technologies: Python Flask, Flask-SQLAlchemy, Flask-JWT-Extended.
  - Contributors: Sneha Singh.
- Database:
  - Role: Stores user accounts and recipe data.
  - Technologies: PostgreSQL, SQLAlchemy ORM.
  - Contributors: Sneha Singh.
- Backend Infrastructure (Intended):
  - Role: Connects components via a reverse proxy for seamless data handling.
  - Technologies: Nginx, Docker/Docker-compose.
  - Contributors: Michael Karpov, Shreyes Bharat.
- Unit Testing (Intended):
  - Role: Validates API endpoints and ensures system stability during development.
  - Technologies: Python Requests library.
  - Contributors: Zyun Lam.
 
### Installation Instructions

#### Backend
```bash
pip install Flask Flask-SQLAlchemy Flask-CORS Flask-JWT-Extended Flask-Mail bcrypt jwt google-auth google-auth-oauthlib google-api-python-client requests
```

#### Frontend
```bash
npm install
npm install react react-dom react-router-dom axios
```
### How To Run

#### Backend
First navigate to backend/flaskr
```bash
python3 app.py
```

#### Frontend
First navigate to Front-End/login-signup
```bash
npm start
```

### Group Members and their Roles
- Sneha Singh: Frontend (Advanced), Backend, Database.
- Michael Karpov: Backend Infrastructure (Intended).
- Shreyes Bharat: Frontend (Basic), Backend Infrastructure (Intended).
- Zyun Lam: Unit Testing (Intended).
