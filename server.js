const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json()); // Middleware to parse JSON

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/productsdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Product Schema and Model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
});

const Product = mongoose.model('Product', productSchema);

// Create a Product
app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).send({ message: 'Product created', product: newProduct });
  } catch (error) {
    res.status(500).send({ error: 'Failed to create product' });
  }
});

// Read All Products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).send(products);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch products' });
  }
});

// Update a Product by ID
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (updatedProduct) {
      res.status(200).send({ message: 'Product updated', product: updatedProduct });
    } else {
      res.status(404).send({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).send({ error: 'Failed to update product' });
  }
});

// Delete a Product by ID
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (deletedProduct) {
      res.status(200).send({ message: 'Product deleted', product: deletedProduct });
    } else {
      res.status(404).send({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete product' });
  }
});

// Start the Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} `);
});