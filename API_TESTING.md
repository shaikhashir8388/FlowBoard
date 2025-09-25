# API Testing Guide

Base URL: `http://localhost:5000/api`

## 1. Authentication Endpoints

### Register User
**POST** `/auth/register`
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1234567890abcdef12345",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### Login User
**POST** `/auth/login`
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1234567890abcdef12345",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### Get Current User (Protected)
**GET** `/auth/me`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get All Users (Protected)
**GET** `/auth/users`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. Board Endpoints (All Protected)

### Get All Boards
**GET** `/boards`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Create Board
**POST** `/boards`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Body:**
```json
{
  "title": "My First Board",
  "description": "This is a test board for project management",
  "isPublic": false
}
```

### Get Specific Board
**GET** `/boards/{boardId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update Board
**PUT** `/boards/{boardId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Body:**
```json
{
  "title": "Updated Board Title",
  "description": "Updated description",
  "isPublic": true
}
```

### Delete Board
**DELETE** `/boards/{boardId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Add Member to Board
**POST** `/boards/{boardId}/members`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Body:**
```json
{
  "userId": "64f1234567890abcdef12346"
}
```

### Remove Member from Board
**DELETE** `/boards/{boardId}/members/{userId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Task Endpoints (All Protected)

### Get Tasks for Board
**GET** `/tasks/board/{boardId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Query Parameters (optional):**
- `status`: todo, in-progress, done
- `assignedTo`: userId
- `search`: search term

Example: `/tasks/board/64f1234567890abcdef12345?status=todo&search=urgent`

### Create Task
**POST** `/tasks`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Create login and registration functionality with JWT tokens",
  "board": "64f1234567890abcdef12345",
  "status": "todo",
  "priority": "high",
  "assignedTo": "64f1234567890abcdef12346",
  "dueDate": "2024-01-15",
  "tags": ["authentication", "backend", "urgent"]
}
```

### Get Specific Task
**GET** `/tasks/{taskId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update Task
**PUT** `/tasks/{taskId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Body:**
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium",
  "assignedTo": "64f1234567890abcdef12346",
  "dueDate": "2024-01-20",
  "tags": ["updated", "in-progress"]
}
```

### Move Task (Drag & Drop)
**PUT** `/tasks/{taskId}/move`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Body:**
```json
{
  "status": "in-progress",
  "position": 2
}
```

### Delete Task
**DELETE** `/tasks/{taskId}`
**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Testing Sequence

### 1. First, start the backend server:
```bash
cd backend
npm run dev
```

### 2. Test with Postman/Insomnia/curl:

#### Step 1: Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Step 2: Login (or use token from registration)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Step 3: Create a board (use token from login)
```bash
curl -X POST http://localhost:5000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Board",
    "description": "My first test board"
  }'
```

#### Step 4: Create a task (use boardId from previous response)
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Task",
    "description": "My first test task",
    "board": "BOARD_ID_HERE",
    "status": "todo",
    "priority": "medium"
  }'
```

## Common HTTP Status Codes

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (access denied)
- **404**: Not found
- **500**: Server error

## Error Response Format

```json
{
  "message": "Error description",
  "errors": [
    {
      "msg": "Validation error message",
      "param": "field_name",
      "location": "body"
    }
  ]
}
```

## Socket.io Events (for real-time testing)

Connect to: `http://localhost:5000`

**Events to listen for:**
- `task-created`: New task added
- `task-updated`: Task modified
- `task-deleted`: Task removed

**Events to emit:**
- `join-board`: Join a board room for updates
- `leave-board`: Leave a board room
