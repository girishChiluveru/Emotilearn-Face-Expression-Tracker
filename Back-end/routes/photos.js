const express=require('express');
const { handleUploading } = require('../controllers/upload');

const router=express.Router();

router.post('/',handleUploading);


module.exports=router;