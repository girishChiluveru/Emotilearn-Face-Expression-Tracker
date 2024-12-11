const bcrypt = require('bcrypt');

const hashP = (password)=>{
    return new Promise((resolve,reject)=>{
        bcrypt.genSalt(7,(error,salt)=>{
            if(error){
            reject(error)
            }
            bcrypt.hash(password,salt,(error,hash)=>{
                if(error){
                    reject(error)
                }
                resolve(hash)
            })
        })
    })
}

const compareP=(password,hashed)=>{
    return bcrypt.compare(password,hashed)
}

module.exports={
    hashP,
    compareP
}