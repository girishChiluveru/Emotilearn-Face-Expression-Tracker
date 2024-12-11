const express=require('express');
const { handleProcess } = require('../controllers/process');

const router=express.Router();

router.post('/',handleProcess);


module.exports=router;