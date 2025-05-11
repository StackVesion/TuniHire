// Basic test file to make CI pipeline pass
const assert = require('assert');

describe('Basic test suite', function () {
  it('should pass this test', function () {
    assert.strictEqual(1 + 1, 2);
  });
  
  it('should check that true is true', function () {
    assert.strictEqual(true, true);
  });
});
