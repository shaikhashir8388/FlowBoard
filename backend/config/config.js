module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://shaikh:shaikh0987@cluster0.ajtz4ba.mongodb.net/kanban-board?retryWrites=true&w=majority&appName=Cluster0',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-change-in-production',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
