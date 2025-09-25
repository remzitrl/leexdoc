// Security validation messages
export const ERR_DANGEROUS_PATH = "Unsafe path detected";
export const ERR_MALICIOUS_FILE = "Malicious file blocked";
export const WARN_NON_STRICT = "Non-strict mode. Validation degraded.";

// File validation messages
export const ERR_INVALID_EXTENSION = "File extension not allowed";
export const ERR_INVALID_MIME_TYPE = "MIME type not allowed";
export const ERR_FILE_TOO_LARGE = "File size exceeds maximum limit";
export const ERR_FILE_TOO_SMALL = "File size must be greater than 0";
export const ERR_INVALID_FILENAME = "Filename contains invalid characters";
export const ERR_FILENAME_TOO_LONG = "Filename is too long";
export const ERR_TOO_MANY_FILES = "Too many files in upload";
export const ERR_TOTAL_SIZE_EXCEEDED = "Total file size exceeds limit";

// MIME type warnings
export const WARN_MIME_NOT_WHITELISTED = "MIME type not in the whitelist";

// Path validation messages
export const ERR_PATH_TRAVERSAL = "Path traversal attempt detected";
export const ERR_NULL_BYTE = "Null byte injection detected";
export const ERR_DOUBLE_EXTENSION = "Double extension detected";

// File size messages
export const ERR_SIZE_REQUIRED = "File size is required";
export const ERR_SIZE_INVALID = "Invalid file size value";

// General validation messages
export const ERR_VALIDATION_FAILED = "Validation failed";
export const ERR_REQUIRED_FIELD = "This field is required";
export const ERR_INVALID_FORMAT = "Invalid format";
