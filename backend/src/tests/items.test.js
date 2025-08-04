const request = require('supertest');
const express = require('express');
const fs = require('fs');
const itemsRouter = require('../routes/items');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  writeFileSync: jest.fn(),
}));

describe('Items API', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/items', itemsRouter);
    jest.clearAllMocks();
  });

  describe('GET /api/items', () => {
    it('should return paginated items', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'A', category: 'C', price: 10 },
        { id: 2, name: 'B', category: 'C', price: 20 },
      ]));
      
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        items: expect.any(Array),
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasMore: false
        }
      });
      expect(res.body.items.length).toBe(2);
    });

    it('should filter items by query', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'Laptop', category: 'Electronics', price: 10 },
        { id: 2, name: 'Chair', category: 'Furniture', price: 20 },
      ]));

      const res = await request(app).get('/api/items?q=lap');
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].name).toBe('Laptop');
      expect(res.body.pagination.total).toBe(1);
    });

    it('should paginate results correctly', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'A', category: 'C', price: 10 },
        { id: 2, name: 'B', category: 'C', price: 20 },
        { id: 3, name: 'C', category: 'C', price: 30 },
      ]));

      const res = await request(app)
        .get('/api/items?page=1&limit=2');
      
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(2);
      expect(res.body.pagination).toEqual({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
        hasMore: true
      });
    });

    it('should handle read errors', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/api/items');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return item by id', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([
        { id: 1, name: 'A', category: 'C', price: 10 },
      ]));
      const res = await request(app).get('/api/items/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        name: 'A',
        category: 'C',
        price: 10
      });
    });

    it('should return 404 if item not found', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([]));
      const res = await request(app).get('/api/items/99');
      expect(res.status).toBe(404);
    });

    it('should handle read errors', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('fail'));
      const res = await request(app).get('/api/items/1');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/items', () => {
    it('should add a new item', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([]));
      const newItem = { name: 'New', category: 'Cat', price: 100 };
      const res = await request(app).post('/api/items').send(newItem);
      
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(Number),
        name: 'New',
        category: 'Cat',
        price: 100
      });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle write errors', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([]));
      fs.writeFileSync.mockImplementation(() => { 
        throw new Error('fail'); 
      });
      const res = await request(app)
        .post('/api/items')
        .send({ name: 'X', category: 'Y', price: 1 });
      expect(res.status).toBe(500);
    });
  });
});