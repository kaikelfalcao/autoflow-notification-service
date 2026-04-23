import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/notification')
  .then(() => console.log('Connected'))
  .catch(err => console.error(err));