# Logger Service Documentation

## Overview

The `logger.service.ts` provides a comprehensive logging system for the AiQA backend application. It uses Winston as the underlying logging library and provides structured logging, request tracking, and custom error handling.

## Features

- **Structured Logging**: JSON format in production, colorized console in development
- **Request Tracking**: Unique request IDs for tracing requests across services
- **Error Classification**: Custom error types for different scenarios
- **Multiple Transport**: Console, file logging, and error-specific logs
- **Context-Aware**: Request context included in all logs

## Usage

### Basic Import

```typescript
import logger from './services/logger.service'
import { createContextLogger } from './services/logger.service'
import { AppError, ValidationError, AuthError, NotFoundError, DatabaseError, ExternalAPIError } from './services/logger.service'
```

### Simple Logging

```typescript
// Basic logging
logger.info('Application started', { version: '1.0.0', env: process.env.NODE_ENV })

logger.error('Failed to connect to database', { 
  error: error.message,
  stack: error.stack
})
```

### Context-Aware Logging

```typescript
// In Express route handlers
router.get('/user', (req, res) => {
  const contextLogger = createContextLogger(req)
  
  contextLogger.info('Fetching user data', { userId: req.user.id })
  
  try {
    const user = await getUser(req.user.id)
    contextLogger.debug('User retrieved', { userId: user.id, email: user.email })
    res.json(user)
  } catch (error) {
    contextLogger.error('Failed to fetch user', { error: error.message })
    next(error)
  }
})
```

### Error Handling

```typescript
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

Automatically assigns and tracks request IDs:

```typescript
import { withRequestId } from './services/logger.service'

app.use(withRequestId)
```

### Request Logger

Logs all incoming requests and responses:

```typescript
import { requestLogger } from './services/logger.service'

app.use(requestLogger)
```

### Error Logger

Logs all unhandled errors:

```typescript
import { errorLogger } from './services/logger.service'

app.use(errorLogger)
```

## Error Types

### AppError

Base error class with status code and operational flag:

```typescript
new AppError('Something went wrong', 500, true, { context: 'Additional info' })
```

### ValidationError

For input validation failures:

```typescript
throw new ValidationError({ 
  email: 'Email is required',
  password: 'Password must be at least 8 characters'
})
```

### AuthError

For authentication and authorization failures:

```typescript
throw new AuthError('Invalid credentials')
```

### NotFoundError

For resource not found scenarios:

```typescript
throw new NotFoundError('User', userId)
```

### DatabaseError

For database operation failures:

```typescript
throw new DatabaseError('Failed to save user', originalError)
```

### ExternalAPIError

For failures when calling external services:

```typescript
throw new ExternalAPIError('Pinecone', 500, apiResponse)
```

## Configuration

### Environment Variables

- `NODE_ENV=production`: Switches to production logging (JSON format, file logging)
- `NODE_ENV=development`: Uses colorized console output with debug level

### Log Levels

```typescript
export const logLevels = {
  error: 0,    // Critical errors
  warn: 1,     // Warning messages
  info: 2,     // General information
  debug: 3,    // Debugging information
  verbose: 4   // Very detailed logging
}
```

## Production Setup

In production, logs are written to files:

- `logs/combined.log`: All logs (info level and above)
- `logs/error.log`: Only error logs
- `logs/exceptions.log`: Uncaught exceptions
- `logs/rejections.log`: Unhandled promise rejections

## Best Practices

1. **Use appropriate log levels**
   - `error`: Critical failures requiring immediate attention
   - `warn`: Potential issues or warnings
   - `info`: Important events and milestones
   - `debug`: Development debugging information

2. **Include context**
   ```typescript
   logger.info('User signed in', { userId, email, ip })
   ```

3. **Use context loggers in routes**
   ```typescript
   const contextLogger = createContextLogger(req)
   ```

4. **Log at strategic points**
   - Before starting operations
   - After completing operations
   - When errors occur

5. **Avoid logging sensitive data**
   - Passwords
   - API keys
   - Personal information

## Integration with Express

```typescript
import express from 'express'
import { withRequestId, requestLogger, errorLogger } from './services/logger.service'

const app = express()

// Add logging middleware
app.use(withRequestId)
app.use(requestLogger)

// Add routes
app.use('/api', routes)

// Add error handling
app.use(errorLogger)
app.use((err, req, res, next) => {
  // Custom error handler
})
```

## Monitoring and Analysis

In production, consider:

1. **Log rotation**: Prevent log files from growing too large
2. **Log analysis tools**: ELK, Splunk, Datadog
3. **Alerts**: Set up alerts for critical errors
4. **Performance monitoring**: Track request durations
5. **Error rate tracking**: Monitor application quality

## Troubleshooting

### Logs not appearing?
- Check log level configuration
- Verify file permissions for log directory
- Check disk space

### Request IDs missing?
- Ensure `withRequestId` middleware is used
- Check middleware order

### Errors not being caught?
- Verify error handling middleware is last
- Ensure async errors are properly caught
- Check that custom errors extend AppError

## Examples

### Route Handler with Full Logging

```typescript
router.post('/signup', async (req, res, next) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('Signup attempt')

  try {
    const { email, password } = req.body

    if (!email || !password) {
      contextLogger.warn('Signup validation failed')
      throw new ValidationError({ email: 'Required', password: 'Required' })
    }

    const user = await createUser(email, password)
    contextLogger.info('Signup successful', { userId: user.id })

    res.json(user)
  } catch (error) {
    contextLogger.error('Signup failed', { error: error.message })
    next(error)
  }
})
```

### Service with Error Handling

```typescript
async function processDocument(pdfId: string, filePath: string) {
  logger.info('Starting document processing', { pdfId })

  try {
    const data = await parsePdf(filePath)
    logger.debug('PDF parsed successfully', { pageCount: data.pages.length })

    const embeddings = await createEmbeddings(data)
    logger.info('Embeddings created', { chunkCount: embeddings.length })

    await storeInPinecone(pdfId, embeddings)
    logger.info('Document processing completed', { pdfId })

    return { success: true }
  } catch (error) {
    logger.error('Document processing failed', { pdfId, error: error.message })
    
    if (error instanceof DatabaseError) {
      throw error
    }
    
    throw new ExternalAPIError('Document Processing', 500, error)
  }
}
```

## Migration Guide

### From console.log to logger

```typescript
// Before
console.log('User signed in', user)

// After
logger.info('User signed in', { userId: user.id, email: user.email })
```

### From try/catch to error classes

```typescript
// Before
try {
  // ...
} catch (error) {
  console.error('Failed:', error)
  res.status(500).json({ message: 'Error' })
}

// After
try {
  // ...
} catch (error) {
  logger.error('Operation failed', { error: error.message })
  next(error)
}
```

### From manual error handling to custom errors

```typescript
// Before
if (!user) {
  return res.status(404).json({ message: 'User not found' })
}

// After
if (!user) {
  throw new NotFoundError('User', userId)
}
```

## Performance Considerations

1. **Avoid excessive logging in hot paths**
2. **Use appropriate log levels**
3. **Batch logs when possible**
4. **Avoid synchronous logging in production**
5. **Consider async logging for high-throughput applications**

## Security Considerations

1. **Never log sensitive data**
2. **Sanitize user input before logging**
3. **Use appropriate file permissions for log files**
4. **Rotate and archive logs regularly**
5. **Monitor log files for suspicious activity**

## Testing

The logger service can be tested using:

```typescript
// Test logging
logger.info('Test message', { test: true })

// Test error handling
try {
  throw new ValidationError({ field: 'required' })
} catch (error) {
  logger.error('Test error', { error })
}
```

## Future Enhancements

1. **Log rotation**: Automatic log file rotation
2. **Remote logging**: Send logs to centralized logging services
3. **Performance metrics**: Track and log performance metrics
4. **Request tracing**: Distributed tracing across microservices
5. **Log analysis**: Built-in log analysis and reporting

## Conclusion

The logger service provides a robust foundation for application logging, error handling, and monitoring. By following the best practices and patterns described in this documentation, you can build reliable, maintainable, and observable applications.