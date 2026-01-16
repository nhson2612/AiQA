# AiQA Logging System

## Overview

The AiQA backend now includes a comprehensive logging system using Winston. This system provides:

- **Structured logging** with JSON format in production
- **Request tracking** with unique request IDs
- **Error classification** with custom error types
- **Multiple log levels** (error, warn, info, debug, verbose)
- **Log rotation** and file-based logging in production
- **Context-aware logging** with request context

## Log Levels

```
error: 0 - Critical errors that require immediate attention
warn: 1 - Warning messages about potential issues
info: 2 - General information about application flow
debug: 3 - Detailed debugging information
verbose: 4 - Very detailed logging for development
```

## Log Files (Production)

- `logs/combined.log` - All logs (info level and above)
- `logs/error.log` - Only error logs
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## Request Tracking

Each request is assigned a unique `requestId` that appears in:
- Response headers as `X-Request-ID`
- All log entries related to that request
- Error responses as `error.id`

## Custom Error Types

### AppError
Base error class with status code and operational flag.

```typescript
new AppError('Something went wrong', 500, true, { context: 'Additional info' })
```

### ValidationError
For input validation failures.

```typescript
throw new ValidationError({ 
  email: 'Email is required',
  password: 'Password must be at least 8 characters'
})
```

### AuthError
For authentication and authorization failures.

```typescript
throw new AuthError('Invalid credentials')
```

### NotFoundError
For resource not found scenarios.

```typescript
throw new NotFoundError('User', userId)
```

### DatabaseError
For database operation failures.

```typescript
throw new DatabaseError('Failed to save user', originalError)
```

### ExternalAPIError
For failures when calling external services.

```typescript
throw new ExternalAPIError('Pinecone', 500, apiResponse)
```

## Usage Examples

### Basic Logging

```typescript
import logger from './services/logger.service'

// Simple log
logger.info('User signed in', { userId: '123', email: 'user@example.com' })

// Error log
logger.error('Failed to process PDF', { 
  error: error.message,
  pdfId: 'abc123',
  stack: error.stack
})
```

### Context-Aware Logging

```typescript
import { createContextLogger } from './services/logger.service'

// In a route handler
router.get('/user', (req, res) => {
  const contextLogger = createContextLogger(req)
  
  contextLogger.info('Fetching user data', { userId: req.user.id })
  
  try {
    // ... business logic
    contextLogger.debug('User data retrieved', { data: user })
    res.json(user)
  } catch (error) {
    contextLogger.error('Failed to fetch user', { error: error.message })
    next(error)
  }
})
```

### Error Handling

```typescript
import { AppError, ValidationError } from './services/logger.service'

// Validation error
if (!email || !password) {
  throw new ValidationError({ 
    email: 'Email is required',
    password: 'Password is required'
  })
}

// Database error
try {
  await userRepository.save(user)
} catch (error) {
  throw new DatabaseError('Failed to save user', error)
}

// External API error
try {
  const response = await pineconeClient.search(query)
} catch (error) {
  throw new ExternalAPIError('Pinecone', error.status, error.response)
}
```

## Middleware

### Request ID Middleware
Automatically assigns and tracks request IDs.

```typescript
app.use(withRequestId)
```

### Request Logger
Logs all incoming requests and responses.

```typescript
app.use(requestLogger)
```

### Error Logger
Logs all unhandled errors.

```typescript
app.use(errorLogger)
```

## Development vs Production

### Development
- Colorized console output
- Full error stacks
- Debug level logging
- Human-readable format

### Production
- JSON format
- File-based logging
- Info level by default
- Structured logs for analysis

## Best Practices

1. **Use appropriate log levels**
   - `error` for critical failures
   - `warn` for potential issues
   - `info` for important events
   - `debug` for development debugging

2. **Include context**
   ```typescript
   logger.info('User signed in', { userId, email, ip })
   ```

3. **Use context loggers**
   ```typescript
   const contextLogger = createContextLogger(req)
   contextLogger.info('Processing request')
   ```

4. **Log at the right time**
   - Log before operations start
   - Log after operations complete
   - Log errors with full context

5. **Avoid logging sensitive data**
   - Passwords
   - API keys
   - Personal information

## Monitoring and Analysis

In production, you can:

1. **Set up log rotation** to prevent log files from growing too large
2. **Use log analysis tools** like ELK, Splunk, or Datadog
3. **Set up alerts** for critical errors
4. **Monitor request durations** for performance issues
5. **Track error rates** for quality monitoring

## Troubleshooting

### Logs not appearing?
- Check log level configuration
- Verify file permissions for log directory
- Check disk space

### Request IDs missing?
- Ensure `withRequestId` middleware is used
- Check that middleware order is correct

### Errors not being caught?
- Verify error handling middleware is last
- Check that async errors are properly caught
- Ensure custom errors extend AppError

## Configuration

Logging behavior can be configured via environment variables:

```env
NODE_ENV=production  # Switches to production logging
LOG_LEVEL=debug     # Override default log level
```