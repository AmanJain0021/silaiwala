export const validatePhone = (phone) => {
    if (!phone) return "Phone number is required";
    const phoneRegex = /^[6-9]\d{9}$/; // Assuming 10 digits starting with 6-9
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) return "Enter a valid 10-digit phone number starting with 6-9";
    return "";
};

export const validateEmail = (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Enter a valid email address";
    return "";
};

export const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    return "";
};

export const validatePincode = (pincode) => {
    if (!pincode) return "Pincode is required";
    const pincodeRegex = /^\d{6}$/; // Assuming 6 digits for pincode/zip
    if (!pincodeRegex.test(pincode)) return "Enter a valid 6-digit pincode";
    return "";
};

export const validateName = (name, fieldName = "Name") => {
    if (!name || name.trim() === "") return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    return "";
};

export const validateFile = (file, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
    if (!file) return "File is required";
    
    if (file.size > maxSizeMB * 1024 * 1024) {
        return `File size must be less than ${maxSizeMB}MB`;
    }
    
    if (!allowedTypes.includes(file.type)) {
        return `File type not supported. Allowed: ${allowedTypes.join(', ')}`;
    }
    
    return "";
};
