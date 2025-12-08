const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn('Validation errors for', req.path, ':', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidation = [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
    handleValidationErrors
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required'),
    handleValidationErrors
];

const teacherProfileValidation = [
    // subjects: accept either an array with at least one item or a non-empty string
    body('subjects').custom(value => {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return false;
    }).withMessage('At least one subject is required'),
    // classes: accept either an array with at least one item or a non-empty string
    body('classes').custom(value => {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return false;
    }).withMessage('At least one class is required'),
    body('experience').notEmpty().withMessage('Experience can be 0'),
    body('qualifications').notEmpty().withMessage('Qualifications are required'),
    body('mode').isIn(['online', 'offline', 'both']).withMessage('Invalid mode'),
    handleValidationErrors
];
//  can update later 

const meetingRequestValidation = [
    body('teacherId').isMongoId().withMessage('Valid teacher ID is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('class').notEmpty().withMessage('Class is required'),
    body('mode').isIn(['online', 'offline']).withMessage('Mode must be online or offline'),
    body('message').isLength({ min: 10, max: 500 }).withMessage('Message must be 10-500 characters'),
    handleValidationErrors
];

module.exports = {
    registerValidation,
    loginValidation,
    teacherProfileValidation,
    meetingRequestValidation
};
