// Simple test file to verify error handling functionality
import i18n from './frontend-admin/src/i18n.js';
import { getErrorMessage } from './frontend-admin/src/utils/errorHandler.js';

// Test function
const testErrorHandling = async () => {
  console.log('Testing error handler...');
  
  // Wait for i18n to be initialized
  await i18n.init();
  
  // Test error scenarios
  const testErrors = [
    {
      name: 'Username already exists',
      error: {
        response: {
          status: 400,
          data: { message: 'USERNAME_ALREADY_EXISTS' }
        }
      }
    },
    {
      name: 'Group name already exists', 
      error: {
        response: {
          status: 400,
          data: { message: 'GROUP_NAME_ALREADY_EXISTS' }
        }
      }
    },
    {
      name: 'Server error',
      error: {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      }
    },
    {
      name: 'Network error',
      error: {
        request: {},
        response: undefined
      }
    }
  ];
  
  // Test Russian language
  i18n.changeLanguage('ru');
  console.log('\n--- Russian Language Tests ---');
  
  for (const test of testErrors) {
    const message = getErrorMessage(test.error);
    console.log(`${test.name}: "${message}"`);
  }
  
  // Test Uzbek language
  i18n.changeLanguage('uz');
  console.log('\n--- Uzbek Language Tests ---');
  
  for (const test of testErrors) {
    const message = getErrorMessage(test.error);
    console.log(`${test.name}: "${message}"`);
  }
};

// Run test
testErrorHandling().catch(console.error);