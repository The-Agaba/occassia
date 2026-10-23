package com.occassia.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private Map<String, Object> buildErrorResponse(String error, String message, int status, String path) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("message", message);
        body.put("status", status);
        body.put("path", path);
        body.put("timestamp", Instant.now().toString());
        return body;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> handleApiException(ApiException ex, HttpServletRequest request) {
        log.warn("API Exception [{}] {} {}: {}", ex.getErrorCode(), request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse(ex.getErrorCode(), ex.getMessage(), ex.getStatus().value(), request.getRequestURI());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation failed for {} {}: {} field errors", request.getMethod(), request.getRequestURI(), ex.getBindingResult().getErrorCount());
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            log.warn(" -> Field '{}': {}", fieldError.getField(), fieldError.getDefaultMessage());
        }
        Map<String, Object> body = buildErrorResponse("VALIDATION_ERROR", "Validation failed for one or more fields.", HttpStatus.BAD_REQUEST.value(), request.getRequestURI());
        body.put("fields", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed JSON request body on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse("MALFORMED_REQUEST", "The request body contains invalid or malformed data.", HttpStatus.BAD_REQUEST.value(), request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        log.warn("Type mismatch on parameter '{}' for {} {}: value='{}'", ex.getName(), request.getMethod(), request.getRequestURI(), ex.getValue());
        Map<String, Object> body = buildErrorResponse("INVALID_PARAMETER", "Invalid format for parameter: " + ex.getName(), HttpStatus.BAD_REQUEST.value(), request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
        log.warn("Constraint violation on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse("CONSTRAINT_VIOLATION", ex.getMessage(), HttpStatus.BAD_REQUEST.value(), request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUpload(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("Uploaded file exceeds size limit on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse("FILE_TOO_LARGE", "The uploaded file exceeds the maximum permitted size limit.", HttpStatus.PAYLOAD_TOO_LARGE.value(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        log.warn("HTTP method not supported {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse("METHOD_NOT_ALLOWED", "HTTP method " + request.getMethod() + " is not supported for this endpoint.", HttpStatus.METHOD_NOT_ALLOWED.value(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Authentication failed for {} {}", request.getMethod(), request.getRequestURI());
        Map<String, Object> body = buildErrorResponse("INVALID_CREDENTIALS", "Invalid email or password provided.", HttpStatus.UNAUTHORIZED.value(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied for {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse("FORBIDDEN", "You do not have permission to perform this action.", HttpStatus.FORBIDDEN.value(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage());
        Map<String, Object> body = buildErrorResponse("INVALID_ARGUMENT", ex.getMessage(), HttpStatus.BAD_REQUEST.value(), request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Map<String, Object>> handleDatabase(DataAccessException ex, HttpServletRequest request) {
        log.error("Database error on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        Map<String, Object> body = buildErrorResponse("DATABASE_ERROR", "The database encountered an error or is temporarily unavailable. Please try again.", HttpStatus.SERVICE_UNAVAILABLE.value(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled server exception on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.getMessage(), ex);
        Map<String, Object> body = buildErrorResponse("INTERNAL_ERROR", "The server encountered an unexpected error. Please try again shortly.", HttpStatus.INTERNAL_SERVER_ERROR.value(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
