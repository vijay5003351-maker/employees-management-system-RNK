const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
dotenv.config();
const adminRoutes = require('./Routes/adminRoutes');
const projectRoutes = require('./Routes/projectRoutes');
const faceRecognitionRoute = require('./Routes/faceRecognitionRoute');
const addEmployeeRoute = require('./Routes/addEmployeeRoute');

const PORT = process.env.PORT || 4000;
const eventLogger = require('./eventsLogger');

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`DB connected successfully`);
    } catch (error) {
        console.log(`Failed to connect on atlas: ${error}`);
    }
};
connectDb();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use(cors());

app.use((req, res, next) => {
    eventLogger(`${req.method} ${req.url}`);
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    res.setTimeout(20000, () => {
        console.error('Request timed out');
        res.status(408).json({ error: 'Request timeout' });
    });
    next();
});

app.get('/api/ping', (req, res) => {
    res.send('Server OK');
});

app.use('/api/fun', adminRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/face-recognize', faceRecognitionRoute);
app.use('/api/add-employee', addEmployeeRoute);

app.use((req, res) => {
    console.warn(`404: ${req.method} ${req.url}`);
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.url}`,
    });
});

app.use((err, req, res, next) => {
    console.error('SERVER ERROR:');
    console.error(err.stack);

    res.status(500).json({
        error: err.message || 'Internal Server Error',
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
