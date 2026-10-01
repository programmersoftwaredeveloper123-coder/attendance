const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

require('dotenv').config();

const { pool, testDatabaseConnection } = require('./database');

const app = express();

const PORT = process.env.PORT || 5000;

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

app.use(helmet());

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ======================================================
// BASIC API TEST
// ======================================================

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'OUR LANGUAGE: DAILY GROUP ATTENDANCE API is running.',
        status: 'online'
    });
});


// ======================================================
// PASSWORD VALIDATION
// ======================================================

function validatePassword(password) {

    if (!password || typeof password !== 'string') {
        return 'Password is required.';
    }

    if (password.length < 8) {
        return 'Password must contain at least 8 characters.';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter.';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter.';
    }

    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number.';
    }

    return null;
}


// ======================================================
// REGISTER USER
// ======================================================

app.post('/api/auth/register', async (req, res) => {

    try {

        const {
            fullName,
            cluster,
            countryCode,
            phone,
            username,
            email,
            password,
            confirmPassword
        } = req.body;


        if (
            !fullName ||
            !cluster ||
            !countryCode ||
            !phone ||
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message: 'All registration fields are required.'
            });

        }


        // Full name

        if (!/^[A-Za-zÀ-ÿ\s]+$/.test(fullName.trim())) {

            return res.status(400).json({
                success: false,
                message: 'Full name can contain letters and spaces only.'
            });

        }


        // Phone

        if (!/^[0-9]{6,30}$/.test(phone)) {

            return res.status(400).json({
                success: false,
                message: 'Phone number must contain numbers only.'
            });

        }


        // Username

        if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) {

            return res.status(400).json({
                success: false,
                message:
                    'Username must contain 3-30 characters using letters, numbers or underscore.'
            });

        }


        // Email

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });

        }


        // Password

        const passwordError = validatePassword(password);

        if (passwordError) {

            return res.status(400).json({
                success: false,
                message: passwordError
            });

        }


        // Confirm password

        if (password !== confirmPassword) {

            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });

        }


        // Allowed clusters

        const allowedClusters = [
            'MAINTENANCE',
            'NETWORK',
            'SOFTWARE',
            'DATA SCIENCE'
        ];

        const normalizedCluster = cluster.toUpperCase();

        if (!allowedClusters.includes(normalizedCluster)) {

            return res.status(400).json({
                success: false,
                message: 'Invalid cluster selected.'
            });

        }


        // ==================================================
        // CHECK DUPLICATE USER
        // ==================================================

        const [existingUsers] = await pool.execute(
            `
            SELECT
                id,
                username,
                email,
                phone_number
            FROM users
            WHERE username = ?
               OR email = ?
               OR phone_number = ?
            LIMIT 1
            `,
            [
                username,
                email.toLowerCase(),
                phone
            ]
        );


        if (existingUsers.length > 0) {

            const existing = existingUsers[0];


            if (existing.username === username) {

                return res.status(409).json({
                    success: false,
                    message: 'Username is already registered.'
                });

            }


            if (existing.email === email.toLowerCase()) {

                return res.status(409).json({
                    success: false,
                    message: 'Email is already registered.'
                });

            }


            if (existing.phone_number === phone) {

                return res.status(409).json({
                    success: false,
                    message: 'Phone number is already registered.'
                });

            }

        }


        // ==================================================
        // HASH PASSWORD
        // ==================================================

        const passwordHash = await bcrypt.hash(password, 12);


        // ==================================================
        // CREATE USER
        // ==================================================

        const [result] = await pool.execute(
            `
            INSERT INTO users
            (
                full_name,
                cluster,
                country_code,
                phone_number,
                email,
                username,
                password_hash
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                fullName.trim(),
                normalizedCluster,
                countryCode,
                phone,
                email.toLowerCase(),
                username,
                passwordHash
            ]
        );

        const verificationCode = crypto.randomBytes(32).toString('hex');

const verificationCodeHash = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');

const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

await pool.execute(
    `
    INSERT INTO email_verifications
    (
        account_type,
        account_id,
        verification_code_hash,
        expires_at
    )
    VALUES (?, ?, ?, ?)
    `,
    [
        'USER',
        result.insertId,
        verificationCodeHash,
        expiresAt
    ]
);

const verificationLink =
    `${process.env.FRONTEND_URL}/verify-email.html?token=${verificationCode}`;


    await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email.toLowerCase(),
    subject: 'OUR LANGUAGE - Verify Your Email',
    text: `
Welcome to OUR LANGUAGE: DAILY GROUP ATTENDANCE.

Please verify your email address using this link:

${verificationLink}

This verification link will expire in 15 minutes.
    `,
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>OUR LANGUAGE: DAILY GROUP ATTENDANCE</h2>

            <p>Welcome!</p>

            <p>Please verify your email address by clicking the button below.</p>

            <p>
                <a
                    href="${verificationLink}"
                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#2563eb;
                        color:white;
                        text-decoration:none;
                        border-radius:8px;
                    "
                >
                    Verify Email
                </a>
            </p>

            <p>This verification link will expire in 15 minutes.</p>
        </div>
    `
});


        return res.status(201).json({

            success: true,

            message:
    'Registration successful. A verification email has been sent to your email address.',


            user: {
                id: result.insertId,
                fullName: fullName.trim(),
                cluster: normalizedCluster,
                countryCode,
                phone,
                username,
                email: email.toLowerCase()
            }

        });

    } catch (error) {

        console.error('REGISTER ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error during registration.'
        });

    }

});


// ======================================================
// LOGIN USER
// ======================================================

app.post('/api/auth/login', async (req, res) => {

    try {

        const {
            login,
            password
        } = req.body;


        if (!login || !password) {

            return res.status(400).json({
                success: false,
                message: 'Username/email and password are required.'
            });

        }


        // ==================================================
        // FIND USER
        // ==================================================

        const [users] = await pool.execute(
            `
            SELECT
                id,
                full_name,
                cluster,
                country_code,
                phone_number,
                username,
                email,
                password_hash,
                email_verified,
                status
            FROM users
            WHERE username = ?
               OR email = ?
            LIMIT 1
            `,
            [
                login,
                login.toLowerCase()
            ]
        );


        if (users.length === 0) {

            return res.status(401).json({
                success: false,
                message: 'Invalid login credentials.'
            });

        }


        const user = users[0];


        // ==================================================
        // ACCOUNT STATUS
        // ==================================================

        if (user.status !== 'ACTIVE') {

            return res.status(403).json({
                success: false,
                message: 'This account is currently inactive.'
            });

        }


        // ==================================================
        // CHECK PASSWORD
        // ==================================================

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );


        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: 'Invalid login credentials.'
            });

        }


        // ==================================================
        // JWT
        // ==================================================

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                type: 'user'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );


        return res.json({

            success: true,

            message: 'Login successful.',

            token,

            user: {
                id: user.id,
                fullName: user.full_name,
                cluster: user.cluster,
                countryCode: user.country_code,
                phone: user.phone_number,
                username: user.username,
                email: user.email,
                isVerified: user.email_verified,
                status: user.status
            }

        });

    } catch (error) {

        console.error('LOGIN ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error during login.'
        });

    }

});


// ======================================================
// JWT AUTHENTICATION MIDDLEWARE
// ======================================================

function authenticateToken(req, res, next) {

    const authorization = req.headers.authorization;


    if (!authorization) {

        return res.status(401).json({
            success: false,
            message: 'Authentication token is required.'
        });

    }


    const parts = authorization.split(' ');


    if (parts.length !== 2 || parts[0] !== 'Bearer') {

        return res.status(401).json({
            success: false,
            message: 'Invalid authorization format.'
        });

    }


    const token = parts[1];


    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });

    }

}

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            description,
            taskType,
            priority,
            dueDate
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required.'
            });
        }

        const allowedTaskTypes = [
            'ASSIGNMENT',
            'STUDY',
            'PROJECT',
            'EXAM',
            'OTHER'
        ];

        const allowedPriorities = [
            'LOW',
            'MEDIUM',
            'HIGH',
            'URGENT'
        ];

        const normalizedTaskType =
            taskType ? taskType.toUpperCase() : 'OTHER';

        const normalizedPriority =
            priority ? priority.toUpperCase() : 'MEDIUM';

        if (!allowedTaskTypes.includes(normalizedTaskType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task type.'
            });
        }

        if (!allowedPriorities.includes(normalizedPriority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task priority.'
            });
        }

        const [result] = await pool.execute(
            `
            INSERT INTO tasks
            (
                user_id,
                title,
                description,
                task_type,
                priority,
                due_date
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                req.user.userId,
                title.trim(),
                description || null,
                normalizedTaskType,
                normalizedPriority,
                dueDate || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            taskId: result.insertId
        });

    } catch (error) {
        console.error('CREATE TASK ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error while creating task.'
        });
    }
});


app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const [tasks] = await pool.execute(
            `
            SELECT
                id,
                title,
                description,
                task_type,
                priority,
                status,
                due_date,
                completed_at,
                created_at,
                updated_at
            FROM tasks
            WHERE user_id = ?
            ORDER BY
                CASE priority
                    WHEN 'URGENT' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    WHEN 'LOW' THEN 4
                END,
                due_date ASC,
                created_at DESC
            `,
            [req.user.userId]
        );

        return res.json({
            success: true,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        console.error('GET TASKS ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error while loading tasks.'
        });
    }
});


app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;

        const {
            title,
            description,
            taskType,
            priority,
            status,
            dueDate
        } = req.body;

        const allowedTaskTypes = [
            'ASSIGNMENT',
            'STUDY',
            'PROJECT',
            'EXAM',
            'OTHER'
        ];

        const allowedPriorities = [
            'LOW',
            'MEDIUM',
            'HIGH',
            'URGENT'
        ];

        const allowedStatuses = [
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED'
        ];

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required.'
            });
        }

        const normalizedTaskType =
            taskType ? taskType.toUpperCase() : 'OTHER';

        const normalizedPriority =
            priority ? priority.toUpperCase() : 'MEDIUM';

        const normalizedStatus =
            status ? status.toUpperCase() : 'PENDING';

        if (!allowedTaskTypes.includes(normalizedTaskType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task type.'
            });
        }

        if (!allowedPriorities.includes(normalizedPriority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority.'
            });
        }

        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task status.'
            });
        }

        const completedAt =
            normalizedStatus === 'COMPLETED'
                ? new Date()
                : null;

        const [result] = await pool.execute(
            `
            UPDATE tasks
            SET
                title = ?,
                description = ?,
                task_type = ?,
                priority = ?,
                status = ?,
                due_date = ?,
                completed_at = ?
            WHERE id = ?
              AND user_id = ?
            `,
            [
                title.trim(),
                description || null,
                normalizedTaskType,
                normalizedPriority,
                normalizedStatus,
                dueDate || null,
                completedAt,
                taskId,
                req.user.userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Task updated successfully.'
        });

    } catch (error) {
        console.error('UPDATE TASK ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error while updating task.'
        });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const taskId = req.params.id;

        const [result] = await pool.execute(
            `
            DELETE FROM tasks
            WHERE id = ?
              AND user_id = ?
            `,
            [
                taskId,
                req.user.userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        return res.json({
            success: true,
            message: 'Task deleted successfully.'
        });

    } catch (error) {
        console.error('DELETE TASK ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error while deleting task.'
        });
    }
});


// ======================================================
// VERIFY EMAIL
// ======================================================

app.get('/api/auth/verify-email', async (req, res) => {

    try {

        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required.'
            });
        }

        const verificationCodeHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const [records] = await pool.execute(
            `
            SELECT
                id,
                account_id,
                expires_at,
                used_at
            FROM email_verifications
            WHERE account_type = 'USER'
              AND verification_code_hash = ?
            LIMIT 1
            `,
            [verificationCodeHash]
        );

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token.'
            });
        }

        const verification = records[0];

        if (verification.used_at !== null) {
            return res.status(400).json({
                success: false,
                message: 'This verification link has already been used.'
            });
        }

        if (new Date(verification.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This verification link has expired.'
            });
        }

        await pool.execute(
            `
            UPDATE users
            SET email_verified = 1
            WHERE id = ?
            `,
            [verification.account_id]
        );

        await pool.execute(
            `
            UPDATE email_verifications
            SET used_at = NOW()
            WHERE id = ?
            `,
            [verification.id]
        );

        return res.json({
            success: true,
            message: 'Email verified successfully.'
        });

    } catch (error) {

        console.error('EMAIL VERIFICATION ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error during email verification.'
        });

    }

});


// ======================================================
// GET CURRENT USER
// ======================================================

app.get('/api/auth/me', authenticateToken, async (req, res) => {

    try {

        const [users] = await pool.execute(
            `
            SELECT
                id,
                full_name,
                cluster,
                country_code,
                phone_number,
                username,
                email,
                email_verified,
                status,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.userId]
        );


        if (users.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });

        }


        const user = users[0];


        return res.json({

            success: true,

            user: {
                id: user.id,
                fullName: user.full_name,
                cluster: user.cluster,
                countryCode: user.country_code,
                phone: user.phone_number,
                username: user.username,
                email: user.email,
                isVerified: user.email_verified,
                status: user.status,
                createdAt: user.created_at
            }

        });

    } catch (error) {

        console.error('GET USER ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error.'
        });

    }

});


// ======================================================
// TEST EMAIL
// ======================================================

app.get('/api/test-email', async (req, res) => {

    try {

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER,
            subject: 'OUR LANGUAGE Email Test',
            text: 'Email system is working successfully.',
            html: `
                <h2>OUR LANGUAGE</h2>
                <p>Email system is working successfully.</p>
            `
        });

        return res.json({
            success: true,
            message: 'Test email sent successfully.'
        });

    } catch (error) {

        console.error('TEST EMAIL ERROR:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to send test email.',
            error: error.message
        });

    }

});


// ======================================================
// START SERVER
// ======================================================

async function startServer() {

    try {

        await testDatabaseConnection();

        app.listen(PORT, () => {

            console.log(
                `Server running on http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            'Failed to start server.'
        );

        console.error(
            'Database connection error:',
            error.message
        );

        process.exit(1);

    }

}


startServer();