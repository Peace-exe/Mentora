require("dotenv").config();
const mongoose= require("mongoose");
const validator = require("validator");
//const admins = require("../utils/adminId");
const bcrypt = require("bcrypt");

const admins = process.env.admins

const userSchema = mongoose.Schema({
    adminId:{
        type:String,
        trim:true,
        unique:true,
        sparse:true
    },
    photoURL:{
        type:String,
        trim:true
    },
    role:{
        type :String,
        enum:['user','admin'],
        default:'user'
    },
    firstName : {
        type:String,
        required:true,
        trim:true,
        minLength:1,
        maxLength:50
    },
    lastName: {
        type:String,
        required:true,
        trim:true,
        minLength:1,
        maxLength:50
    },
    email: {
        type : String,
        required:true,
        unique : true,
        trim : true,
        lowercase : true,
        minLength:1,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid email format: "+value);
            }
        }
    },
    password : {
        type:String,
        required : true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("Enter a strong password."+
                    "Password must contain minimum 8 characters,1 lowercase ,1 uppercase and 1 special character");
            }
        }
    },
},
{
    timestamps : true
}
);

userSchema.pre('validate', function (next) {
    if (!this.adminId || this.adminId === "") {
        this.role = 'user';
    } else if (typeof this.adminId === 'string' && admins.includes(this.adminId)) {
        this.role = 'admin';
    }
    
    next();
});


userSchema.methods.validatePassword = async function(passwordInputByUser){
    const user= this;
    const passwordHash= user.password;
   const isPasswordValid= await bcrypt.compare(passwordInputByUser, passwordHash);
   return isPasswordValid;
}

const User = mongoose.model("User",userSchema);


module.exports = User;