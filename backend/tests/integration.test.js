/**
 * Integration Tests for Market Dashboard Backend Foundation
 * Tests authentication, database connections, API functionality
 */

import request from 'supertest';
import { expect } from 'chai';
import MarketDashboardServer from '../src/server.js';
import { setupDatabases } from '../scripts/setup-databases.js';
import { checkDatabaseHealth } from '../src/config/database.js';
import User from '../src/models/User.js';
import logger from '../src/utils/logger.js';

describe('Market Dashboard Backend Integration Tests', function() {
  let server;
  let app;
  let testUser;
  let authToken;

  // Increase timeout for database operations
  this.timeout(30000);

  before(async function() {
    console.log('🧪 Starting integration tests...');
    
    try {
      // Set test environment
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
      
      // Initialize server
      server = new MarketDashboardServer();
      await server.initialize();
      app = server.getApp();
      
      // Setup databases (will skip if already exist)
      console.log('📀 Setting up test databases...');
      await setupDatabases();
      
      console.log('✅ Test setup completed');
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      throw error;
    }
  });

  after(async function() {
    if (server) {
      server.stop();
    }
    console.log('🧹 Test cleanup completed');
  });

  describe('Infrastructure Health Checks', function() {
    it('should have healthy database connections', async function() {
      const health = await checkDatabaseHealth();
      
      expect(health).to.be.an('object');
      expect(health.postgres).to.be.true;
      // Redis and InfluxDB might not be available in test environment
      console.log('Database Health:', health);
    });

    it('should respond to health check endpoint', function(done) {
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('status', 'healthy');
          expect(res.body).to.have.property('databases');
          expect(res.body).to.have.property('version');
          expect(res.body.databases.postgres).to.be.true;
          
          done();
        });
    });

    it('should respond to root endpoint with API info', function(done) {
      request(app)
        .get('/')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('name', 'Market Dashboard API');
          expect(res.body).to.have.property('endpoints');
          expect(res.body.endpoints).to.have.property('authentication');
          
          done();
        });
    });
  });

  describe('Authentication System', function() {
    const testUserData = {
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      riskProfile: 'moderate',
      investmentExperience: 'intermediate'
    };

    it('should register a new user', function(done) {
      request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('user');
          expect(res.body).to.have.property('token');
          expect(res.body.user.email).to.equal(testUserData.email);
          expect(res.body.user.username).to.equal(testUserData.username);
          
          // Store for later tests
          testUser = res.body.user;
          authToken = res.body.token;
          
          done();
        });
    });

    it('should not allow duplicate email registration', function(done) {
      request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(409)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          expect(res.body.message).to.include('already exists');
          
          done();
        });
    });

    it('should authenticate user with valid credentials', function(done) {
      request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUserData.email,
          password: testUserData.password
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('token');
          expect(res.body.user.email).to.equal(testUserData.email);
          
          done();
        });
    });

    it('should reject invalid credentials', function(done) {
      request(app)
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUserData.email,
          password: 'wrongpassword'
        })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          expect(res.body.message).to.include('Invalid');
          
          done();
        });
    });

    it('should validate authentication token', function(done) {
      request(app)
        .get('/api/auth/validate-token')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('user');
          expect(res.body.user.id).to.equal(testUser.id);
          
          done();
        });
    });

    it('should reject invalid authentication token', function(done) {
      request(app)
        .get('/api/auth/validate-token')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          expect(res.body.message).to.include('Invalid');
          
          done();
        });
    });

    it('should get user profile with valid token', function(done) {
      request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('user');
          expect(res.body.user.email).to.equal(testUserData.email);
          expect(res.body.user.riskProfile).to.equal(testUserData.riskProfile);
          
          done();
        });
    });

    it('should update user profile', function(done) {
      request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          riskProfile: 'aggressive'
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body.user.firstName).to.equal('Updated');
          expect(res.body.user.riskProfile).to.equal('aggressive');
          
          done();
        });
    });
  });

  describe('Rate Limiting', function() {
    it('should enforce auth rate limiting', function(done) {
      this.timeout(10000);
      
      const requests = [];
      for (let i = 0; i < 12; i++) { // Exceed the limit of 10
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              emailOrUsername: 'nonexistent@example.com',
              password: 'wrongpassword'
            })
        );
      }

      Promise.all(requests)
        .then(responses => {
          // Should get 429 (rate limited) for at least one request
          const rateLimited = responses.some(res => res.status === 429);
          expect(rateLimited).to.be.true;
          done();
        })
        .catch(done);
    });
  });

  describe('Security Middleware', function() {
    it('should include security headers', function(done) {
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          // Check for security headers
          expect(res.headers).to.have.property('x-content-type-options');
          expect(res.headers).to.have.property('x-frame-options');
          expect(res.headers).to.have.property('x-xss-protection');
          
          done();
        });
    });

    it('should handle CORS properly', function(done) {
      request(app)
        .options('/api/auth/profile')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.headers).to.have.property('access-control-allow-methods');
          expect(res.headers).to.have.property('access-control-allow-headers');
          
          done();
        });
    });
  });

  describe('Error Handling', function() {
    it('should handle 404 errors properly', function(done) {
      request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('message');
          expect(res.body.message).to.include('not found');
          
          done();
        });
    });

    it('should handle validation errors', function(done) {
      request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'ab', // Too short
          password: '123' // Too weak
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('errors');
          expect(res.body.errors).to.be.an('array');
          
          done();
        });
    });
  });

  describe('Performance', function() {
    it('should respond to health check quickly', function(done) {
      const start = Date.now();
      
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          
          const responseTime = Date.now() - start;
          expect(responseTime).to.be.below(1000); // Should respond within 1 second
          
          console.log(`Health check response time: ${responseTime}ms`);
          done();
        });
    });

    it('should handle multiple concurrent requests', function(done) {
      this.timeout(10000);
      
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/health')
            .expect(200)
        );
      }

      Promise.all(requests)
        .then(responses => {
          expect(responses).to.have.length(20);
          responses.forEach(res => {
            expect(res.body.status).to.equal('healthy');
          });
          done();
        })
        .catch(done);
    });
  });
});

export default {
  name: 'Backend Foundation Integration Tests',
  description: 'Comprehensive tests for authentication, security, and infrastructure'
};